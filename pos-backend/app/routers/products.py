from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.future import select
from typing import List, Dict, Any
from app.db.session import get_db
from app.models.pos_models import Product, User, Recipe, Ingredient
from app.schemas.pos_schemas import ProductCreate, ProductResponse, ProductWithRecipeResponse
from app.core.dependencies import get_current_user

router = APIRouter(tags=["Products"])


@router.get("/", response_model=List[ProductWithRecipeResponse])
async def get_products(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Fetch all products for the restaurant
    result = await db.execute(
        select(Product).where(Product.restaurant_id == current_user.restaurant_id)
    )
    products = result.scalars().all()
    
    # Get all product IDs
    product_ids = [p.id for p in products]
    
    if not product_ids:
        return []
    
    # Batch fetch recipes for all products at once
    recipe_result = await db.execute(
        select(Recipe).where(Recipe.product_id.in_(product_ids))
    )
    recipes = recipe_result.scalars().all()
    
    # Create a map of product_id -> has_recipe (bool)
    recipe_map: Dict[int, bool] = {}
    # Create a map of product_id -> list of ingredient IDs
    product_ingredients_map: Dict[int, List[int]] = {}
    
    for product_id in product_ids:
        recipe_map[product_id] = False
        product_ingredients_map[product_id] = []
    
    for recipe in recipes:
        recipe_map[recipe.product_id] = True
        product_ingredients_map[recipe.product_id].append(recipe.ingredient_id)
    
    # Get all ingredient IDs across all products
    all_ingredient_ids = []
    for ing_list in product_ingredients_map.values():
        all_ingredient_ids.extend(ing_list)
    
    # Remove duplicates
    unique_ingredient_ids = list(set(all_ingredient_ids))
    
    # Fetch all ingredients with their current_stock and min_stock
    ingredient_map: Dict[int, Any] = {}
    if unique_ingredient_ids:
        ingredient_result = await db.execute(
            select(Ingredient).where(
                Ingredient.id.in_(unique_ingredient_ids),
                Ingredient.restaurant_id == current_user.restaurant_id
            )
        )
        ingredients = ingredient_result.scalars().all()
        for ing in ingredients:
            ingredient_map[ing.id] = ing
    
    # Check which products have ingredients below threshold
    ingredients_below_threshold_map: Dict[int, bool] = {}
    for product_id, ing_ids in product_ingredients_map.items():
        below_threshold = False
        for ing_id in ing_ids:
            ingredient = ingredient_map.get(ing_id)
            if ingredient and ingredient.current_stock < ingredient.min_stock:
                below_threshold = True
                break
        ingredients_below_threshold_map[product_id] = below_threshold
    
    # Build response with has_recipe and ingredients_below_threshold flags
    response = []
    for product in products:
        response.append({
            "id": product.id,
            "name": product.name,
            "price": product.price,
            "category": product.category,
            "stock": product.stock,
            "image_url": product.image_url,
            "has_recipe": recipe_map.get(product.id, False),
            "ingredients_below_threshold": ingredients_below_threshold_map.get(product.id, False)
        })
    
    return response


@router.post("/", response_model=ProductWithRecipeResponse)
async def create_product(
    product_in: ProductCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_product = Product(
        name=product_in.name,
        price=product_in.price,
        category=product_in.category,
        stock=product_in.stock,
        image_url=product_in.image_url,
        restaurant_id=current_user.restaurant_id 
    )
    
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    
    # New product has no recipe initially and no ingredients below threshold
    return {
        "id": new_product.id,
        "name": new_product.name,
        "price": new_product.price,
        "category": new_product.category,
        "stock": new_product.stock,
        "image_url": new_product.image_url,
        "has_recipe": False,
        "ingredients_below_threshold": False
    }


@router.put("/{product_id}", response_model=ProductWithRecipeResponse)
async def update_product(
    product_id: int, 
    product_in: ProductCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Only admin or manager can edit products")

    result = await db.execute(select(Product).where(
        Product.id == product_id, 
        Product.restaurant_id == current_user.restaurant_id
    ))
    product = result.scalars().first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_in.dict(exclude_unset=True)
    for var, value in update_data.items():
        setattr(product, var, value)
    
    await db.commit()
    await db.refresh(product)
    
    # Check if product has recipe
    recipe_result = await db.execute(
        select(Recipe).where(Recipe.product_id == product_id)
    )
    recipes = recipe_result.scalars().all()
    has_recipe = len(recipes) > 0
    
    # Check if any ingredient is below threshold
    ingredients_below_threshold = False
    if has_recipe:
        ingredient_ids = [r.ingredient_id for r in recipes]
        if ingredient_ids:
            ingredient_result = await db.execute(
                select(Ingredient).where(
                    Ingredient.id.in_(ingredient_ids),
                    Ingredient.restaurant_id == current_user.restaurant_id
                )
            )
            ingredients = ingredient_result.scalars().all()
            for ing in ingredients:
                if ing.current_stock < ing.min_stock:
                    ingredients_below_threshold = True
                    break
    
    return {
        "id": product.id,
        "name": product.name,
        "price": product.price,
        "category": product.category,
        "stock": product.stock,
        "image_url": product.image_url,
        "has_recipe": has_recipe,
        "ingredients_below_threshold": ingredients_below_threshold
    }


@router.delete("/{product_id}")
async def delete_product(
    product_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin","manager"]:
        raise HTTPException(status_code=403, detail="Only admins can delete products")

    result = await db.execute(select(Product).where(
        Product.id == product_id, 
        Product.restaurant_id == current_user.restaurant_id
    ))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.delete(product)
    await db.commit()
    return {"message": "Product deleted successfully"}


@router.get("/{product_id}/recipe-status")
async def get_product_recipe_status(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Quick endpoint to check if a product has a recipe"""
    result = await db.execute(
        select(Product).where(
            Product.id == product_id,
            Product.restaurant_id == current_user.restaurant_id
        )
    )
    product = result.scalars().first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    recipe_result = await db.execute(
        select(Recipe).where(Recipe.product_id == product_id)
    )
    recipes = recipe_result.scalars().all()
    
    return {"has_recipe": len(recipes) > 0}


@router.get("/low-stock-status")
async def get_products_low_stock_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get products that have low-stock ingredients"""
    
    # 1. Get all low-stock ingredients (current_stock < min_stock)
    ingredient_result = await db.execute(
        select(Ingredient).where(
            Ingredient.restaurant_id == current_user.restaurant_id,
            Ingredient.current_stock < Ingredient.min_stock
        )
    )
    low_stock_ingredients = ingredient_result.scalars().all()
    low_stock_ingredient_ids = [ing.id for ing in low_stock_ingredients]
    
    if not low_stock_ingredient_ids:
        return {"low_stock_product_ids": []}
    
    # 2. Find all recipes that use these low-stock ingredients
    recipe_result = await db.execute(
        select(Recipe).where(Recipe.ingredient_id.in_(low_stock_ingredient_ids))
    )
    recipes = recipe_result.scalars().all()
    
    # 3. Get unique product IDs that have low-stock ingredients
    low_stock_product_ids = list(set([r.product_id for r in recipes]))
    
    return {"low_stock_product_ids": low_stock_product_ids}