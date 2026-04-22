from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.future import select
from typing import List, Optional
from datetime import datetime

from app.db.session import get_db
from app.models.pos_models import User, Restaurant
from app.schemas.pos_schemas import UserCreate, UserLogin, Token, UserBase
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.dependencies import get_current_user

router = APIRouter(tags=["Authentication"])


# --- 1. PUBLIC: RESTAURANT ONBOARDING ---
@router.post("/restaurant-signup", response_model=Token)
async def restaurant_signup(
    user_in: UserCreate, 
    restaurant_name: str, 
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new Restaurant and its primary Admin user in one transaction.
    This is the entry point for a new business owner.
    """
    # Check if email exists
    existing_user = await db.execute(select(User).where(User.email == user_in.email))
    if existing_user.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        # ✅ Create Restaurant using SQLAlchemy ORM (not raw SQL with LAST_INSERT_ID)
        new_restaurant = Restaurant(
            name=restaurant_name,
            email=user_in.email
        )
        db.add(new_restaurant)
        await db.flush()  # This assigns an ID to new_restaurant without committing
        new_restaurant_id = new_restaurant.id

        # Create Admin User
        hashed_pw = get_password_hash(user_in.password)
        new_admin = User(
            username=user_in.username,
            email=user_in.email,
            password=hashed_pw,
            role="admin",
            restaurant_id=new_restaurant_id
        )
        
        db.add(new_admin)
        await db.commit()
        await db.refresh(new_admin)

        # Generate Access Token
        access_token = create_access_token(subject=new_admin.email)
        
        user_response = UserBase(
            username=new_admin.username,
            email=new_admin.email,
            role=new_admin.role
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_response
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")


# --- 2. PUBLIC: LOGIN ---
@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: AsyncSession = Depends(get_db)
):
    print("LOGIN ATTEMPT:", form_data.username)
    
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()

    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(subject=user.email)
    
    user_response = UserBase(
        username=user.username,
        email=user.email,
        role=user.role
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }


# --- 3. PROTECTED: GET CURRENT USER INFO WITH RESTAURANT ---
@router.get("/me")
async def get_current_user_info(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the currently authenticated user's information including their restaurant details.
    This endpoint is useful for dashboards to display restaurant name.
    """
    # Fetch restaurant details
    restaurant_result = await db.execute(
        select(Restaurant).where(Restaurant.id == current_user.restaurant_id)
    )
    restaurant = restaurant_result.scalars().first()
    
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "restaurant_id": current_user.restaurant_id,
        "restaurant": {
            "id": restaurant.id if restaurant else None,
            "name": restaurant.name if restaurant else None,
            "email": restaurant.email if restaurant else None,
            "phone": restaurant.phone if restaurant else None,
            "created_at": restaurant.created_at if restaurant else None
        } if restaurant else None,
        "created_at": current_user.created_at
    }


# --- 4. PROTECTED: ADMIN ONLY STAFF CREATION ---
@router.post("/create-user", response_model=UserBase)
async def admin_create_user(
    user_in: UserCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Allows an Admin to create Managers or Cashiers for their own restaurant.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Forbidden: Only admins can create staff accounts"
        )

    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if user_in.role not in ["manager", "cashier"]:
        raise HTTPException(
            status_code=400, 
            detail="Invalid role. Can only create 'manager' or 'cashier' accounts"
        )
    
    hashed_pw = get_password_hash(user_in.password)
    
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        password=hashed_pw,
        role=user_in.role,
        restaurant_id=current_user.restaurant_id 
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return UserBase(
        username=new_user.username,
        email=new_user.email,
        role=new_user.role
    )


# --- 5. PROTECTED: GET ALL USERS FOR CURRENT RESTAURANT (Admin/Manager only) ---
@router.get("/users", response_model=List[UserBase])
async def get_restaurant_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all users belonging to the current user's restaurant (Admin/Manager only)
    """
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and managers can view all users"
        )
    
    result = await db.execute(
        select(User).where(User.restaurant_id == current_user.restaurant_id)
    )
    users = result.scalars().all()
    
    return [
        UserBase(
            username=user.username,
            email=user.email,
            role=user.role
        )
        for user in users
    ]