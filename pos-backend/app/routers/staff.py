from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from pydantic import BaseModel, EmailStr

from app.db.session import get_db
from app.models.pos_models import User
from app.schemas.pos_schemas import UserCreate, UserBase, UserUpdate
from app.core.dependencies import get_current_user
from app.core.security import get_password_hash as hash_password

router = APIRouter(prefix="/staff", tags=["Staff"])

# -------------------------------------------------------
# NEW SCHEMA FOR STAFF RESPONSE WITH ID
# -------------------------------------------------------
class StaffResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    restaurant_id: int
    
    class Config:
        from_attributes = True


# -------------------------------------------------------
# CREATE STAFF (ADMIN/MANAGER ONLY)
# -------------------------------------------------------
@router.post("/", response_model=StaffResponse)
async def create_staff(
    staff: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Admin or Manager can create staff (manager can only create cashier)
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or manager can create staff"
        )
    
    # Manager can only create cashier
    if current_user.role == "manager" and staff.role != "cashier":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Managers can only create cashier accounts"
        )

    # Check if email already exists
    result = await db.execute(select(User).where(User.email == staff.email))
    existing_user = result.scalars().first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    new_staff = User(
        username=staff.username,
        email=staff.email,
        password=hash_password(staff.password),
        role=staff.role,
        restaurant_id=current_user.restaurant_id
    )

    db.add(new_staff)
    await db.commit()
    await db.refresh(new_staff)

    # Return with id
    return StaffResponse(
        id=new_staff.id,
        username=new_staff.username,
        email=new_staff.email,
        role=new_staff.role,
        restaurant_id=new_staff.restaurant_id
    )


# -------------------------------------------------------
# LIST ALL STAFF (ADMIN / MANAGER) - WITH ID INCLUDED
# -------------------------------------------------------
@router.get("/", response_model=List[StaffResponse])
async def list_staff(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or manager can view staff"
        )

    result = await db.execute(
        select(User).where(User.restaurant_id == current_user.restaurant_id)
    )

    staff_list = result.scalars().all()

    # Convert to response objects with id
    return [
        StaffResponse(
            id=staff.id,
            username=staff.username,
            email=staff.email,
            role=staff.role,
            restaurant_id=staff.restaurant_id
        )
        for staff in staff_list
    ]


# -------------------------------------------------------
# UPDATE STAFF (ADMIN ONLY)
# -------------------------------------------------------
@router.put("/{staff_id}", response_model=StaffResponse)
async def update_staff(
    staff_id: int,
    staff_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Security: Only admins can edit staff
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Only admin can edit staff"
        )

    # Fetch the staff member
    result = await db.execute(
        select(User).where(
            User.id == staff_id,
            User.restaurant_id == current_user.restaurant_id
        )
    )
    staff = result.scalars().first()

    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    # Prevent editing own admin account (optional but recommended)
    if staff.id == current_user.id and staff.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot edit your own admin account through this endpoint"
        )

    # Update fields dynamically
    update_data = staff_in.dict(exclude_unset=True)
    
    if "password" in update_data and update_data["password"]:
        update_data["password"] = hash_password(update_data["password"])

    for field, value in update_data.items():
        if value is not None:  # Only update if value is provided
            setattr(staff, field, value)

    await db.commit()
    await db.refresh(staff)
    
    # Return updated staff with id
    return StaffResponse(
        id=staff.id,
        username=staff.username,
        email=staff.email,
        role=staff.role,
        restaurant_id=staff.restaurant_id
    )


# -------------------------------------------------------
# DELETE STAFF (ADMIN ONLY)
# -------------------------------------------------------
@router.delete("/{staff_id}")
async def delete_staff(
    staff_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can delete staff"
        )

    result = await db.execute(
        select(User).where(
            User.id == staff_id,
            User.restaurant_id == current_user.restaurant_id
        )
    )
    staff = result.scalars().first()

    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    if staff.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")

    await db.delete(staff)
    await db.commit()

    return {"detail": "Staff deleted successfully"}