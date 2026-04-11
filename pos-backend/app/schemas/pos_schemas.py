from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from decimal import Decimal
from datetime import datetime

# --- AUTH SCHEMAS ---
class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    password: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserBase

# --- PRODUCT SCHEMAS ---
class ProductBase(BaseModel):
    name: str
    price: float = Field(..., ge=0)
    stock: int = Field(default=0, ge=0)
    category: str
    image_url: Optional[str] = None

class ProductCreate(BaseModel):
    name: str
    price: float
    category: str
    stock: int
    image_url: Optional[str] = None

class ProductResponse(BaseModel):
    id: int
    name: str
    price: float
    category: str
    stock: int
    image_url: Optional[str] = None
    
    class Config:
        from_attributes = True

# --- ORDER SCHEMAS ---
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    subtotal: Decimal

class OrderCreate(BaseModel):
    total_amount: Decimal
    payment_method: str  # upi, cash, card
    token: int
    items: List[OrderItemCreate]
    override_missing_ingredients: bool = False  # ✅ ADD THIS FIELD

class OrderResponse(BaseModel):
    id: int
    total_amount: Decimal
    payment_method: str
    payment_status: str
    status: str
    created_at: datetime
    token: Optional[str]
    missing_ingredients: Optional[List[int]] = None  # ✅ ADD THIS FIELD

    class Config:
        from_attributes = True

# ✅ NEW SCHEMA: For missing ingredients check response
class MissingIngredientCheck(BaseModel):
    product_id: int
    product_name: str
    ingredient_id: int
    ingredient_name: str
    required_quantity: float
    available_stock: int
    shortfall: float
    unit: str

class InventoryCheckResponse(BaseModel):
    can_fulfill: bool
    missing_items: List[MissingIngredientCheck]

# --- SETTINGS & INVENTORY SCHEMAS ---
class SettingUpdate(BaseModel):
    key_name: str
    value: str

class IngredientCreate(BaseModel):
    name: str
    unit: str
    current_stock: int = Field(default=0, ge=0)
    min_stock: int = Field(default=0, ge=0)

class IngredientResponse(BaseModel):
    id: int
    name: str
    unit: str
    current_stock: int
    min_stock: int

    class Config:
        from_attributes = True

class RecipeCreate(BaseModel):
    product_id: int
    ingredient_id: int
    quantity_required: float = Field(..., gt=0)

class RecipeResponse(BaseModel):
    id: int
    product_id: int
    ingredient_id: int
    quantity_required: float

    class Config:
        from_attributes = True