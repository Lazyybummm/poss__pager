from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.db.session import get_db
from app.models.pos_models import Recipe, Product, Ingredient, User, INTEGER_UNITS
from app.schemas.pos_schemas import RecipeCreate, RecipeResponse
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/recipes", tags=["Recipes"])


@router.post("/", response_model=RecipeResponse)
async def create_recipe(
    recipe: RecipeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or manager can manage recipes"
        )

    product_result = await db.execute(
        select(Product).where(
            Product.id == recipe.product_id,
            Product.restaurant_id == current_user.restaurant_id
        )
    )
    product = product_result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    ingredient_result = await db.execute(
        select(Ingredient).where(
            Ingredient.id == recipe.ingredient_id,
            Ingredient.restaurant_id == current_user.restaurant_id
        )
    )
    ingredient = ingredient_result.scalars().first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    # ✅ Validate quantity based on ingredient unit
    unit_lower = ingredient.unit.lower()
    if unit_lower in INTEGER_UNITS:
        if recipe.quantity_required != int(recipe.quantity_required):
            raise HTTPException(
                status_code=400,
                detail=f'For ingredient "{ingredient.name}" with unit "{ingredient.unit}", quantity must be a whole number'
            )

    existing = await db.execute(
        select(Recipe).where(
            Recipe.product_id == recipe.product_id,
            Recipe.ingredient_id == recipe.ingredient_id
        )
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="Ingredient already added to this product recipe"
        )

    new_recipe = Recipe(
        product_id=recipe.product_id,
        ingredient_id=recipe.ingredient_id,
        quantity_required=recipe.quantity_required
    )

    db.add(new_recipe)
    await db.commit()
    await db.refresh(new_recipe)
    return new_recipe


@router.get("/product/{product_id}", response_model=List[RecipeResponse])
async def get_product_recipe(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product_result = await db.execute(
        select(Product).where(
            Product.id == product_id,
            Product.restaurant_id == current_user.restaurant_id
        )
    )
    if not product_result.scalars().first():
        raise HTTPException(status_code=404, detail="Product not found")

    result = await db.execute(
        select(Recipe).where(Recipe.product_id == product_id)
    )
    return result.scalars().all()


@router.delete("/{recipe_id}")
async def delete_recipe(
    recipe_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    result = await db.execute(
        select(Recipe).where(Recipe.id == recipe_id)
    )
    recipe = result.scalars().first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe entry not found")

    await db.delete(recipe)
    await db.commit()
    return {"message": "Recipe entry deleted successfully"}


@router.put("/{recipe_id}", response_model=RecipeResponse)
async def update_recipe(
    recipe_id: int,
    recipe_data: RecipeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or manager can update recipes"
        )

    result = await db.execute(
        select(Recipe).where(Recipe.id == recipe_id)
    )
    recipe = result.scalars().first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe entry not found")

    product_result = await db.execute(
        select(Product).where(
            Product.id == recipe_data.product_id,
            Product.restaurant_id == current_user.restaurant_id
        )
    )
    if not product_result.scalars().first():
        raise HTTPException(status_code=404, detail="Product not found")

    ingredient_result = await db.execute(
        select(Ingredient).where(
            Ingredient.id == recipe_data.ingredient_id,
            Ingredient.restaurant_id == current_user.restaurant_id
        )
    )
    ingredient = ingredient_result.scalars().first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    # ✅ Validate quantity based on ingredient unit
    unit_lower = ingredient.unit.lower()
    if unit_lower in INTEGER_UNITS:
        if recipe_data.quantity_required != int(recipe_data.quantity_required):
            raise HTTPException(
                status_code=400,
                detail=f'For ingredient "{ingredient.name}" with unit "{ingredient.unit}", quantity must be a whole number'
            )

    duplicate_check = await db.execute(
        select(Recipe).where(
            Recipe.product_id == recipe_data.product_id,
            Recipe.ingredient_id == recipe_data.ingredient_id,
            Recipe.id != recipe_id
        )
    )
    if duplicate_check.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="Ingredient already exists in this recipe"
        )

    recipe.product_id = recipe_data.product_id
    recipe.ingredient_id = recipe_data.ingredient_id
    recipe.quantity_required = recipe_data.quantity_required

    await db.commit()
    await db.refresh(recipe)
    return recipe