from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from datetime import datetime

from app.db.session import get_db
from app.models.pos_models import Feedback, Restaurant, Order
from app.schemas.pos_schemas import FeedbackCreate, FeedbackResponse, FeedbackStatsResponse
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/feedbacks", tags=["Feedbacks"])


@router.post("/{restaurant_id}", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    restaurant_id: int,
    feedback: FeedbackCreate,
    db: AsyncSession = Depends(get_db)
):
    restaurant_result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    )
    restaurant = restaurant_result.scalars().first()
    
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    if feedback.orderId:
        order_result = await db.execute(
            select(Order).where(
                Order.id == feedback.orderId,
                Order.restaurant_id == restaurant_id
            )
        )
        if not order_result.scalars().first():
            print(f"⚠️ Order {feedback.orderId} not found for restaurant {restaurant_id}")
    
    new_feedback = Feedback(
        restaurant_id=restaurant_id,
        order_id=feedback.orderId,
        token=feedback.token,
        rating=feedback.rating,
        comment=feedback.comment,
        customer_name=feedback.customerName or "Guest",
        phone=feedback.phone,
        created_at=datetime.now()
    )
    
    db.add(new_feedback)
    await db.commit()
    await db.refresh(new_feedback)
    return new_feedback


@router.get("/{restaurant_id}", response_model=List[FeedbackResponse])
async def get_restaurant_feedbacks(
    restaurant_id: int,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.restaurant_id != restaurant_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await db.execute(
        select(Feedback)
        .where(Feedback.restaurant_id == restaurant_id)
        .order_by(Feedback.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/{restaurant_id}/stats", response_model=FeedbackStatsResponse)
async def get_feedback_stats(
    restaurant_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.restaurant_id != restaurant_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await db.execute(
        select(Feedback).where(Feedback.restaurant_id == restaurant_id)
    )
    feedbacks = result.scalars().all()
    
    if not feedbacks:
        return FeedbackStatsResponse(
            average_rating=0.0,
            total_reviews=0,
            rating_distribution={1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            recent_feedbacks=[]
        )
    
    total_reviews = len(feedbacks)
    total_rating = sum(f.rating for f in feedbacks)
    average_rating = round(total_rating / total_reviews, 1)
    
    distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for f in feedbacks:
        distribution[f.rating] += 1
    
    recent = sorted(feedbacks, key=lambda x: x.created_at, reverse=True)[:10]
    
    return FeedbackStatsResponse(
        average_rating=average_rating,
        total_reviews=total_reviews,
        rating_distribution=distribution,
        recent_feedbacks=recent
    )


@router.delete("/{feedback_id}")
async def delete_feedback(
    feedback_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete feedback")
    
    result = await db.execute(select(Feedback).where(Feedback.id == feedback_id))
    feedback = result.scalars().first()
    
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    if feedback.restaurant_id != current_user.restaurant_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.delete(feedback)
    await db.commit()
    return {"message": "Feedback deleted successfully"}