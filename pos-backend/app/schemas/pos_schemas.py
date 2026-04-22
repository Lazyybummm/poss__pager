from pydantic import BaseModel, EmailStr, Field, validator
from typing import List, Optional
from decimal import Decimal
from datetime import datetime

# ✅ Unit constants
DECIMAL_UNITS = ['kg', 'g', 'gm', 'ml', 'l', 'litre', 'liter', 'mg', 'lb', 'oz', 'cup', 'tbsp', 'tsp']
INTEGER_UNITS = ['pcs', 'piece', 'pieces', 'packet', 'packets', 'bottle', 'bottles', 'box', 'boxes', 'unit', 'units', 'dozen']


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


class StaffResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    restaurant_id: int


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


class ProductCreate(ProductBase):
    pass


class ProductResponse(ProductBase):
    id: int
    
    class Config:
        from_attributes = True


class ProductWithRecipeResponse(ProductResponse):
    has_recipe: bool = False
    ingredients_below_threshold: bool = False
    
    class Config:
        from_attributes = True


# --- ORDER SCHEMAS ---
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    subtotal: Decimal


class OrderCreate(BaseModel):
    total_amount: Decimal
    payment_method: str
    token: int
    items: List[OrderItemCreate]
    override_missing_ingredients: bool = False


class OrderResponse(BaseModel):
    id: int
    total_amount: Decimal
    payment_method: str
    payment_status: str
    status: str
    created_at: datetime
    token: Optional[str]
    missing_ingredients: Optional[List[int]] = None

    class Config:
        from_attributes = True


class MissingIngredientCheck(BaseModel):
    product_id: int
    product_name: str
    ingredient_id: int
    ingredient_name: str
    required_quantity: float
    available_stock: float
    shortfall: float
    unit: str


class InventoryCheckResponse(BaseModel):
    can_fulfill: bool
    missing_items: List[MissingIngredientCheck]


# --- SETTINGS & INVENTORY SCHEMAS ---
class SettingUpdate(BaseModel):
    value: str


class SettingsUpdateRequest(BaseModel):
    upiId: Optional[str] = None
    payeeName: Optional[str] = None
    kitchenCapacity: Optional[int] = None
    restaurantId: Optional[int] = None


# ✅ UPDATED Ingredient schemas
class IngredientCreate(BaseModel):
    name: str
    unit: str
    current_stock: float = Field(default=0, ge=0)
    min_stock: float = Field(default=0, ge=0)
    
    @validator('unit')
    def validate_unit(cls, v):
        v_lower = v.lower()
        all_units = DECIMAL_UNITS + INTEGER_UNITS
        if v_lower not in all_units:
            raise ValueError(f'Unit must be one of: {", ".join(all_units)}')
        return v_lower
    
    @validator('current_stock', 'min_stock')
    def validate_stock_by_unit(cls, v, values):
        if 'unit' in values:
            unit = values['unit'].lower()
            if unit in INTEGER_UNITS and v is not None:
                if v != int(v):
                    raise ValueError(f'For unit "{unit}", stock must be a whole number (no decimals)')
        return v


class IngredientResponse(BaseModel):
    id: int
    name: str
    unit: str
    current_stock: float
    min_stock: float
    allows_decimal: Optional[bool] = None
    requires_integer: Optional[bool] = None

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


# --- FEEDBACK SCHEMAS ---
class FeedbackCreate(BaseModel):
    orderId: Optional[int] = None
    token: Optional[int] = None
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
    customerName: str = "Guest"
    phone: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: int
    restaurant_id: int
    order_id: Optional[int]
    token: Optional[int]
    rating: int
    comment: Optional[str]
    customer_name: str
    phone: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class FeedbackStatsResponse(BaseModel):
    average_rating: float
    total_reviews: int
    rating_distribution: dict
    recent_feedbacks: List[FeedbackResponse]