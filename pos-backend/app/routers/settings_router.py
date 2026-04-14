from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models.pos_models import StoreSetting
from app.core.dependencies import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter(tags=["Settings"])

class SettingsUpdateRequest(BaseModel):
    upiId: Optional[str] = None
    payeeName: Optional[str] = None
    kitchenCapacity: Optional[int] = None

@router.get("/")
async def get_settings(
    db: AsyncSession = Depends(get_db), 
    current_user=Depends(get_current_user)
):
    try:
        result = await db.execute(
            select(StoreSetting).where(StoreSetting.restaurant_id == current_user.restaurant_id)
        )
        settings_list = result.scalars().all()
        
        settings_dict = {s.key_name: s.value for s in settings_list}
        
        return {
            "upi_id": settings_dict.get("upi_id", ""),
            "payee_name": settings_dict.get("payee_name", ""),
            "kitchen_capacity": int(settings_dict.get("kitchen_capacity", 20))
        }
    except Exception as e:
        print(f"Error fetching settings: {e}")
        return {
            "upi_id": "",
            "payee_name": "",
            "kitchen_capacity": 20
        }

@router.put("/")
async def update_settings(
    payload: SettingsUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    try:
        updates = []
        if payload.upiId is not None:
            updates.append(("upi_id", payload.upiId))
        if payload.payeeName is not None:
            updates.append(("payee_name", payload.payeeName))
        if payload.kitchenCapacity is not None:
            updates.append(("kitchen_capacity", str(payload.kitchenCapacity)))

        for key, val in updates:
            # First, check if record exists
            result = await db.execute(
                select(StoreSetting).where(
                    StoreSetting.key_name == key,
                    StoreSetting.restaurant_id == current_user.restaurant_id
                )
            )
            setting = result.scalars().first()
            
            if setting:
                # UPDATE existing record
                setting.value = val
                print(f"Updated {key} to {val} for restaurant {current_user.restaurant_id}")
            else:
                # INSERT new record only if doesn't exist
                new_setting = StoreSetting(
                    key_name=key, 
                    value=val,
                    restaurant_id=current_user.restaurant_id
                )
                db.add(new_setting)
                print(f"Created new setting {key}={val} for restaurant {current_user.restaurant_id}")
        
        await db.commit()
        return {"message": "Settings updated successfully"}
        
    except Exception as e:
        await db.rollback()
        print(f"Error updating settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))