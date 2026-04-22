from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.pos_models import Restaurant

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])


@router.get("/{restaurant_id}")
async def get_restaurant(
    restaurant_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    )
    restaurant = result.scalars().first()
    
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    return {
        "id": restaurant.id,
        "name": restaurant.name,
        "email": restaurant.email,
        "created_at": restaurant.created_at
    }