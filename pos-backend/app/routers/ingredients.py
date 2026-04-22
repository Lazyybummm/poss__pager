from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.db.session import get_db
from app.models.pos_models import Ingredient, User, DECIMAL_UNITS, INTEGER_UNITS
from app.schemas.pos_schemas import IngredientCreate, IngredientResponse
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/ingredients", tags=["Ingredients"])


def validate_stock_by_unit(unit: str, stock: float, field_name: str = "stock"):
    unit_lower = unit.lower()
    if unit_lower in INTEGER_UNITS:
        if stock != int(stock):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'For unit "{unit}", {field_name} must be a whole number (no decimals)'
            )
    return True


def add_unit_flags(ingredient: Ingredient) -> dict:
    unit_lower = ingredient.unit.lower()
    return {
        "id": ingredient.id,
        "name": ingredient.name,
        "unit": ingredient.unit,
        "current_stock": ingredient.current_stock,
        "min_stock": ingredient.min_stock,
        "allows_decimal": unit_lower in DECIMAL_UNITS,
        "requires_integer": unit_lower in INTEGER_UNITS
    }


# -------------------------------------------------------
# GET ALL INGREDIENTS
# -------------------------------------------------------
@router.get("/", response_model=List[IngredientResponse])
async def get_all_ingredients(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Ingredient).where(
            Ingredient.restaurant_id == current_user.restaurant_id
        ).order_by(Ingredient.name)
    )
    ingredients = result.scalars().all()
    return [add_unit_flags(ing) for ing in ingredients]


# -------------------------------------------------------
# GET INGREDIENT BY ID
# -------------------------------------------------------
@router.get("/{ingredient_id}", response_model=IngredientResponse)
async def get_ingredient_by_id(
    ingredient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Ingredient).where(
            Ingredient.id == ingredient_id,
            Ingredient.restaurant_id == current_user.restaurant_id
        )
    )
    ingredient = result.scalars().first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return add_unit_flags(ingredient)


# -------------------------------------------------------
# CREATE INGREDIENT
# -------------------------------------------------------
@router.post("/", response_model=IngredientResponse, status_code=status.HTTP_201_CREATED)
async def create_ingredient(
    ingredient: IngredientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or manager can manage inventory"
        )
    
    validate_stock_by_unit(ingredient.unit, ingredient.current_stock, "current_stock")
    validate_stock_by_unit(ingredient.unit, ingredient.min_stock, "min_stock")

    existing = await db.execute(
        select(Ingredient).where(
            Ingredient.name == ingredient.name,
            Ingredient.restaurant_id == current_user.restaurant_id
        )
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ingredient already exists"
        )
    
    new_ingredient = Ingredient(
        name=ingredient.name,
        unit=ingredient.unit,
        current_stock=ingredient.current_stock or 0,
        min_stock=ingredient.min_stock or 0,
        restaurant_id=current_user.restaurant_id
    )

    db.add(new_ingredient)
    await db.commit()
    await db.refresh(new_ingredient)
    return add_unit_flags(new_ingredient)


# -------------------------------------------------------
# UPDATE INGREDIENT
# -------------------------------------------------------
@router.put("/{ingredient_id}", response_model=IngredientResponse)
async def update_ingredient(
    ingredient_id: int,
    ingredient_data: IngredientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    result = await db.execute(
        select(Ingredient).where(
            Ingredient.id == ingredient_id,
            Ingredient.restaurant_id == current_user.restaurant_id
        )
    )
    ingredient = result.scalars().first()

    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    validate_stock_by_unit(ingredient_data.unit, ingredient_data.current_stock, "current_stock")
    validate_stock_by_unit(ingredient_data.unit, ingredient_data.min_stock, "min_stock")

    ingredient.name = ingredient_data.name
    ingredient.unit = ingredient_data.unit
    ingredient.current_stock = ingredient_data.current_stock
    ingredient.min_stock = ingredient_data.min_stock

    await db.commit()
    await db.refresh(ingredient)
    return add_unit_flags(ingredient)


# -------------------------------------------------------
# RESTOCK INGREDIENT
# -------------------------------------------------------
@router.post("/{ingredient_id}/restock", response_model=IngredientResponse)
async def restock_ingredient(
    ingredient_id: int,
    amount: float,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Restock amount must be positive")

    result = await db.execute(
        select(Ingredient).where(
            Ingredient.id == ingredient_id,
            Ingredient.restaurant_id == current_user.restaurant_id
        )
    )
    ingredient = result.scalars().first()

    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    unit_lower = ingredient.unit.lower()
    if unit_lower in INTEGER_UNITS:
        if amount != int(amount):
            raise HTTPException(
                status_code=400,
                detail=f'For unit "{ingredient.unit}", restock amount must be a whole number'
            )

    ingredient.current_stock += amount
    await db.commit()
    await db.refresh(ingredient)
    return add_unit_flags(ingredient)


# -------------------------------------------------------
# DELETE INGREDIENT
# -------------------------------------------------------
@router.delete("/{ingredient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ingredient(
    ingredient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or manager can delete ingredients"
        )

    result = await db.execute(
        select(Ingredient).where(
            Ingredient.id == ingredient_id,
            Ingredient.restaurant_id == current_user.restaurant_id
        )
    )
    ingredient = result.scalars().first()

    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    await db.delete(ingredient)
    await db.commit()
    return None