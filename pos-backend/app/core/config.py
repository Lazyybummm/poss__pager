from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Database fields
    DB_USER: str
    DB_PASSWORD: str 
    DB_HOST: str
    DB_PORT: int
    DB_NAME: str
    
    # Auth & URL
    JWT_SECRET: str 
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    DATABASE_URL: Optional[str] = None 

    # Hardware/Serial fields
    PREFERRED_PORT: str = "/dev/cu.usbserial-0001"
    PORT: int = 8000
    BAUD_RATE: int = 115200

    # Pydantic V2 Configuration Style
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding='utf-8',
        case_sensitive=False,
        extra="ignore"
    )

settings = Settings()

# Construct DATABASE_URL after settings are loaded
if not settings.DATABASE_URL:
    settings.DATABASE_URL = f"mysql+aiomysql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"