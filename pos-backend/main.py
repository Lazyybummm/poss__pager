import uvicorn
from dotenv import load_dotenv
import os

load_dotenv()
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routers import auth, products, orders, settings_router
from app.core.config import settings
from app.routers import staff
from app.routers import ingredients
from app.routers import recipes
from app.routers import dashboard
from app.routers import feedbacks  # ✅ ADD THIS
from app.routers import restaurants  # ✅ ADD THIS
from app.db.base import Base
from app.db.session import engine

app = FastAPI(title="POS Backend - FastAPI")

# ✅ Fix: Define ALLOWED_ORIGINS properly
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Register Routers
app.include_router(auth.router, prefix="/auth")
app.include_router(products.router, prefix="/products")
app.include_router(orders.router, prefix="/orders")
app.include_router(settings_router.router, prefix="/settings")
app.include_router(staff.router)
app.include_router(ingredients.router)
app.include_router(recipes.router)
app.include_router(dashboard.router)
app.include_router(feedbacks.router)   # ✅ ADD THIS
app.include_router(restaurants.router)  # ✅ ADD THIS

@app.on_event("startup")
async def create_tables():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("Database tables created successfully!")
    except Exception as e:
        print(f"Error creating tables: {e}")

@app.get("/")
async def root():
    return {"message": "POS Backend Online"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)