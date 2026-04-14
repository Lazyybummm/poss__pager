from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from datetime import datetime, time
from app.db.session import get_db
from app.models.pos_models import (
    Order,
    OrderItem,
    Product,
    Ingredient,
    Recipe,
    User
)
from app.schemas.pos_schemas import (
    OrderCreate, 
    OrderResponse, 
    InventoryCheckResponse, 
    MissingIngredientCheck
)
from app.core.dependencies import get_current_user
from app.services.serial_service import serial_bus

router = APIRouter(tags=["Orders"])


# ---------------------------------------------------------
# GET ORDERS
# ---------------------------------------------------------
@router.get("/", response_model=List[OrderResponse])
async def get_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Order)
        .where(Order.restaurant_id == current_user.restaurant_id)
        .order_by(Order.created_at.desc())
    )
    return result.scalars().all()


# ---------------------------------------------------------
# CHECK INVENTORY BEFORE ORDER
# ---------------------------------------------------------
@router.post("/check-inventory", response_model=InventoryCheckResponse)
async def check_inventory(
    order_in: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    missing_items = []
    
    try:
        product_ids = [item.product_id for item in order_in.items]
        
        product_result = await db.execute(
            select(Product).where(
                Product.id.in_(product_ids),
                Product.restaurant_id == current_user.restaurant_id
            )
        )
        products = {p.id: p for p in product_result.scalars().all()}
        
        if len(products) != len(product_ids):
            raise HTTPException(status_code=404, detail="One or more products not found")
        
        for item in order_in.items:
            product = products.get(item.product_id)
            
            if not product:
                missing_items.append(MissingIngredientCheck(
                    product_id=item.product_id,
                    product_name=f"Product ID {item.product_id}",
                    ingredient_id=0,
                    ingredient_name="Unknown",
                    required_quantity=0,
                    available_stock=0,
                    shortfall=0,
                    unit=""
                ))
                continue
            
            if product.stock is not None and product.stock < item.quantity:
                missing_items.append(MissingIngredientCheck(
                    product_id=product.id,
                    product_name=product.name,
                    ingredient_id=0,
                    ingredient_name="Product Stock",
                    required_quantity=item.quantity,
                    available_stock=product.stock,
                    shortfall=item.quantity - product.stock,
                    unit="units"
                ))
            
            recipe_result = await db.execute(
                select(Recipe).where(Recipe.product_id == item.product_id)
            )
            recipes = recipe_result.scalars().all()
            
            if recipes:
                ingredient_ids = [r.ingredient_id for r in recipes]
                ingredient_result = await db.execute(
                    select(Ingredient).where(
                        Ingredient.id.in_(ingredient_ids),
                        Ingredient.restaurant_id == current_user.restaurant_id
                    )
                )
                ingredients = {ing.id: ing for ing in ingredient_result.scalars().all()}
                
                for recipe in recipes:
                    ingredient = ingredients.get(recipe.ingredient_id)
                    
                    if not ingredient:
                        missing_items.append(MissingIngredientCheck(
                            product_id=product.id,
                            product_name=product.name,
                            ingredient_id=recipe.ingredient_id,
                            ingredient_name=f"Ingredient ID {recipe.ingredient_id}",
                            required_quantity=recipe.quantity_required * item.quantity,
                            available_stock=0,
                            shortfall=recipe.quantity_required * item.quantity,
                            unit="units"
                        ))
                        continue
                    
                    required_qty = recipe.quantity_required * item.quantity
                    
                    if ingredient.current_stock < required_qty:
                        missing_items.append(MissingIngredientCheck(
                            product_id=product.id,
                            product_name=product.name,
                            ingredient_id=ingredient.id,
                            ingredient_name=ingredient.name,
                            required_quantity=required_qty,
                            available_stock=ingredient.current_stock,
                            shortfall=required_qty - ingredient.current_stock,
                            unit=ingredient.unit
                        ))
        
        return InventoryCheckResponse(
            can_fulfill=len(missing_items) == 0,
            missing_items=missing_items
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ---------------------------------------------------------
# CREATE ORDER WITH INVENTORY OVERRIDE - FIXED
# ---------------------------------------------------------
@router.post("/", response_model=OrderResponse)
async def create_order(
    order_in: OrderCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    missing_ingredient_ids = []
    
    try:
        product_ids = [item.product_id for item in order_in.items]
        product_result = await db.execute(
            select(Product).where(
                Product.id.in_(product_ids),
                Product.restaurant_id == current_user.restaurant_id
            )
        )
        products = {p.id: p for p in product_result.scalars().all()}
        
        if len(products) != len(product_ids):
            raise HTTPException(status_code=404, detail="One or more products not found")
        
        for item in order_in.items:
            product = products[item.product_id]
            
            # ✅ FIX: Store product.id as integer, NOT string
            if product.stock < item.quantity:
                if not order_in.override_missing_ingredients:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Not enough stock for {product.name}. Available: {product.stock}, Required: {item.quantity}"
                    )
                missing_ingredient_ids.append(product.id)  # ✅ Integer, not string
            
            recipe_result = await db.execute(
                select(Recipe).where(Recipe.product_id == item.product_id)
            )
            recipes = recipe_result.scalars().all()
            
            if not recipes and not order_in.override_missing_ingredients:
                raise HTTPException(
                    status_code=400,
                    detail=f"No recipe defined for {product.name}"
                )
            
            if recipes:
                ingredient_ids = [r.ingredient_id for r in recipes]
                ingredient_result = await db.execute(
                    select(Ingredient).where(
                        Ingredient.id.in_(ingredient_ids),
                        Ingredient.restaurant_id == current_user.restaurant_id
                    )
                )
                ingredients = {ing.id: ing for ing in ingredient_result.scalars().all()}
                
                for recipe in recipes:
                    ingredient = ingredients.get(recipe.ingredient_id)
                    
                    if not ingredient:
                        missing_ingredient_ids.append(recipe.ingredient_id)
                        continue
                    
                    required_qty = recipe.quantity_required * item.quantity
                    
                    if ingredient.current_stock < required_qty:
                        missing_ingredient_ids.append(ingredient.id)
                        
                        if not order_in.override_missing_ingredients:
                            raise HTTPException(
                                status_code=400,
                                detail=f"Not enough {ingredient.name} in stock. Required: {required_qty} {ingredient.unit}, Available: {ingredient.current_stock} {ingredient.unit}"
                            )
        
        unique_missing_ids = list(set(missing_ingredient_ids))
        
        new_order = Order(
            total_amount=order_in.total_amount,
            payment_method=order_in.payment_method,
            token=str(order_in.token),
            status="active",
            restaurant_id=current_user.restaurant_id,
            missing_ingredients=unique_missing_ids  # ✅ Now only integers
        )
        
        db.add(new_order)
        await db.flush()
        
        for item in order_in.items:
            product = products[item.product_id]
            
            if product.stock >= item.quantity:
                product.stock -= item.quantity
            else:
                product.stock = 0
            
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                subtotal=item.subtotal
            )
            db.add(order_item)
            
            recipe_result = await db.execute(
                select(Recipe).where(Recipe.product_id == item.product_id)
            )
            recipes = recipe_result.scalars().all()
            
            if recipes:
                ingredient_ids = [r.ingredient_id for r in recipes]
                ingredient_result = await db.execute(
                    select(Ingredient).where(Ingredient.id.in_(ingredient_ids))
                )
                ingredients = {ing.id: ing for ing in ingredient_result.scalars().all()}
                
                for recipe in recipes:
                    ingredient = ingredients.get(recipe.ingredient_id)
                    if ingredient:
                        required_qty = recipe.quantity_required * item.quantity
                        if ingredient.current_stock >= required_qty:
                            ingredient.current_stock -= required_qty
                        else:
                            ingredient.current_stock = 0
        
        await db.commit()
        await db.refresh(new_order)
        
        print(f"✅ Order {new_order.id} created. Override: {order_in.override_missing_ingredients}, Missing: {new_order.missing_ingredients}")
        
        background_tasks.add_task(
            serial_bus.send_token,
            str(order_in.token)
        )
        
        return new_order
        
    except Exception as e:
        await db.rollback()
        print(f"❌ Order creation failed: {str(e)}")
        
        if isinstance(e, HTTPException):
            raise e
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ---------------------------------------------------------
# COMPLETE ORDER
# ---------------------------------------------------------
@router.put("/{order_id}/complete")
async def complete_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.restaurant_id == current_user.restaurant_id
        )
    )
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = "completed"
    await db.commit()
    
    return {"message": "Order marked as completed"}


# ---------------------------------------------------------
# ORDER HISTORY
# ---------------------------------------------------------
@router.get("/history")
async def get_order_history(
    date: str, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        query_date = datetime.strptime(date, "%Y-%m-%d").date()
        start_dt = datetime.combine(query_date, time.min)
        end_dt = datetime.combine(query_date, time.max)
        
        result = await db.execute(
            select(Order).where(
                Order.restaurant_id == current_user.restaurant_id,
                Order.created_at.between(start_dt, end_dt)
            ).order_by(Order.created_at.asc())
        )
        
        orders = result.scalars().all()
        return {"orders": orders}
    except Exception as e:
        print(f"Error fetching history: {e}")
        return {"orders": []}