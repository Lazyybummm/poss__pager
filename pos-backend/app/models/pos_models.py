from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, TIMESTAMP, func, Text, JSON, CheckConstraint, Float
from sqlalchemy.orm import relationship
from app.db.base import Base

# Unit constants
DECIMAL_UNITS = ['kg', 'g', 'gm', 'ml', 'l', 'litre', 'liter', 'mg', 'lb', 'oz', 'cup', 'tbsp', 'tsp']
INTEGER_UNITS = ['pcs', 'piece', 'pieces', 'packet', 'packets', 'bottle', 'bottles', 'box', 'boxes', 'unit', 'units', 'dozen']


class Restaurant(Base):
    __tablename__ = "restaurants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(150), nullable=False, unique=True)
    phone = Column(String(20), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    # ✅ Use String instead of Enum for PostgreSQL
    role = Column(String(20), nullable=False, default='cashier')
    created_at = Column(TIMESTAMP, server_default=func.now())
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=True)

    __table_args__ = (
        CheckConstraint("role IN ('admin', 'manager', 'cashier')", name="check_role"),
    )


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    stock = Column(Integer, nullable=False, default=0)
    category = Column(String(50), nullable=False)
    image_url = Column(Text, nullable=True) 
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=True)
    recipes = relationship("Recipe", back_populates="product", cascade="all, delete-orphan")


class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    total_amount = Column(Numeric(10, 2), nullable=False)
    # ✅ Use String instead of Enum
    payment_method = Column(String(10), nullable=False)
    payment_status = Column(String(10), nullable=False, default='pending')
    status = Column(String(10), nullable=False, default='created')
    created_at = Column(TIMESTAMP, server_default=func.now())
    token = Column(String(255)) 
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    missing_ingredients = Column(JSON, default=list)
    items = relationship("OrderItem", back_populates="order")

    __table_args__ = (
        CheckConstraint("payment_method IN ('upi', 'cash', 'card')", name="check_payment_method"),
        CheckConstraint("payment_status IN ('pending', 'paid')", name="check_payment_status"),
        CheckConstraint("status IN ('created', 'active', 'ready', 'completed')", name="check_status"),
    )


class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)
    order = relationship("Order", back_populates="items")


class StoreSetting(Base):
    __tablename__ = "store_settings"
    id = Column(Integer, primary_key=True, index=True)
    key_name = Column(String(100), unique=True, nullable=False)
    value = Column(String(255), nullable=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class Ingredient(Base):
    __tablename__ = "ingredients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    unit = Column(String(50), nullable=False)
    current_stock = Column(Float, default=0)
    min_stock = Column(Float, default=0)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    recipes = relationship("Recipe", back_populates="ingredient", cascade="all, delete-orphan")
    
    @property
    def allows_decimal(self):
        unit_lower = self.unit.lower()
        return unit_lower in DECIMAL_UNITS
    
    @property
    def requires_integer(self):
        unit_lower = self.unit.lower()
        return unit_lower in INTEGER_UNITS


class Recipe(Base):
    __tablename__ = "recipes"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False)
    quantity_required = Column(Float, nullable=False)
    product = relationship("Product", back_populates="recipes")
    ingredient = relationship("Ingredient", back_populates="recipes")
    __table_args__ = (
        CheckConstraint('quantity_required > 0', name='check_quantity_positive'),
    )


class Feedback(Base):
    __tablename__ = "feedbacks"
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    order_id = Column(Integer, nullable=True)
    token = Column(Integer, nullable=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    customer_name = Column(String(100), default="Guest")
    phone = Column(String(20), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    restaurant = relationship("Restaurant", backref="feedbacks")