from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import select as sa_select
from typing import List, Dict, Tuple
from datetime import datetime, time, date
from sqlalchemy import func
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
# ✅ NEW: CHECK INVENTORY BEFORE ORDER (for modal)
# ---------------------------------------------------------
@router.post("/check-inventory", response_model=InventoryCheckResponse)
async def check_inventory(
    order_in: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check if all ingredients are available for this order.
    Returns missing items if any, otherwise confirms can_fulfill = True.
    """
    missing_items = []
    
    try:
        product_ids = [item.product_id for item in order_in.items]
        
        # Fetch products
        product_result = await db.execute(
            select(Product).where(
                Product.id.in_(product_ids),
                Product.restaurant_id == current_user.restaurant_id
            )
        )
        products = {p.id: p for p in product_result.scalars().all()}
        
        if len(products) != len(product_ids):
            raise HTTPException(status_code=404, detail="One or more products not found")
        
        # Check each product's recipe
        for item in order_in.items:
            product = products[item.product_id]
            
            # Fetch recipe for this product
            recipe_result = await db.execute(
                select(Recipe).where(Recipe.product_id == item.product_id)
            )
            recipes = recipe_result.scalars().all()
            
            if not recipes:
                raise HTTPException(
                    status_code=400,
                    detail=f"No recipe defined for {product.name}"
                )
            
            # Fetch ingredients
            ingredient_ids = [r.ingredient_id for r in recipes]
            ingredient_result = await db.execute(
                select(Ingredient).where(
                    Ingredient.id.in_(ingredient_ids),
                    Ingredient.restaurant_id == current_user.restaurant_id
                )
            )
            ingredients = {ing.id: ing for ing in ingredient_result.scalars().all()}
            
            # Check each ingredient
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
# ✅ UPDATED: CREATE ORDER WITH INVENTORY OVERRIDE
# ---------------------------------------------------------
@router.post("/", response_model=OrderResponse)
async def create_order(
    order_in: OrderCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    missing_ingredient_ids = []  # Track missing ingredients for this order
    
    try:
        # -------------------------------------------------
        # VALIDATE PRODUCTS IN BULK
        # -------------------------------------------------
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
        
        # -------------------------------------------------
        # FIRST: CHECK ALL INGREDIENTS AND COLLECT MISSING IDs
        # -------------------------------------------------
        for item in order_in.items:
            product = products[item.product_id]
            
            # Check product stock
            if product.stock < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Not enough stock for {product.name}"
                )
            
            # Fetch recipe
            recipe_result = await db.execute(
                select(Recipe).where(Recipe.product_id == item.product_id)
            )
            recipes = recipe_result.scalars().all()
            
            if not recipes:
                raise HTTPException(
                    status_code=400,
                    detail=f"No recipe defined for {product.name}"
                )
            
            # Fetch ingredients
            ingredient_ids = [r.ingredient_id for r in recipes]
            ingredient_result = await db.execute(
                select(Ingredient).where(
                    Ingredient.id.in_(ingredient_ids),
                    Ingredient.restaurant_id == current_user.restaurant_id
                )
            )
            ingredients = {ing.id: ing for ing in ingredient_result.scalars().all()}
            
            # Check each ingredient
            for recipe in recipes:
                ingredient = ingredients.get(recipe.ingredient_id)
                
                if not ingredient:
                    missing_ingredient_ids.append(recipe.ingredient_id)
                    continue
                
                required_qty = recipe.quantity_required * item.quantity
                
                if ingredient.current_stock < required_qty:
                    missing_ingredient_ids.append(ingredient.id)
                    
                    # If NOT overriding, raise error BEFORE creating order
                    if not order_in.override_missing_ingredients:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Not enough {ingredient.name} in stock. Required: {required_qty} {ingredient.unit}, Available: {ingredient.current_stock} {ingredient.unit}"
                        )
        
        # Remove duplicates from missing IDs
        unique_missing_ids = list(set(missing_ingredient_ids))
        
        # -------------------------------------------------
        # CREATE ORDER WITH CORRECT missing_ingredients FROM THE START
        # -------------------------------------------------
        new_order = Order(
            total_amount=order_in.total_amount,
            payment_method=order_in.payment_method,
            token=str(order_in.token),
            status="active",
            restaurant_id=current_user.restaurant_id,
            missing_ingredients=unique_missing_ids  # ✅ Set correctly at creation time
        )
        
        db.add(new_order)
        await db.flush()  # get order.id
        
        # -------------------------------------------------
        # NOW DEDUCT STOCKS (only after order is created)
        # -------------------------------------------------
        for item in order_in.items:
            product = products[item.product_id]
            
            # Deduct product stock
            product.stock -= item.quantity
            
            # Create order item
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                subtotal=item.subtotal
            )
            db.add(order_item)
            
            # Fetch recipe again (or reuse from above - store in a dict)
            recipe_result = await db.execute(
                select(Recipe).where(Recipe.product_id == item.product_id)
            )
            recipes = recipe_result.scalars().all()
            
            ingredient_ids = [r.ingredient_id for r in recipes]
            ingredient_result = await db.execute(
                select(Ingredient).where(Ingredient.id.in_(ingredient_ids))
            )
            ingredients = {ing.id: ing for ing in ingredient_result.scalars().all()}
            
            # Deduct ingredient stocks (only if sufficient)
            for recipe in recipes:
                ingredient = ingredients.get(recipe.ingredient_id)
                if ingredient:
                    required_qty = recipe.quantity_required * item.quantity
                    if ingredient.current_stock >= required_qty:
                        ingredient.current_stock -= required_qty
                    # If insufficient and override is true, we skip deduction (already tracked)
        
        # -------------------------------------------------
        # COMMIT EVERYTHING
        # -------------------------------------------------
        await db.commit()
        await db.refresh(new_order)
        
        print(f"✅ Order {new_order.id} created with missing_ingredients: {new_order.missing_ingredients}")
        
        # -------------------------------------------------
        # TRIGGER HARDWARE (non-blocking)
        # -------------------------------------------------
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