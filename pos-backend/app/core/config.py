from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Database Config
    DB_HOST: str
    DB_PORT: int = 3306
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str

    # Security
    JWT_SECRET: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Server Config
    PORT: int = 3000
    
    # Hardware Config (Updated for Mac compatibility)
    # On Mac, this is usually /dev/cu.usbserial-10 or /dev/tty.usbmodem
    PREFERRED_PORT: str = "/dev/cu.usbserial-10" 
    BAUD_RATE: int = 115200

    # Pydantic V2 Configuration Style
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding='utf-8',
        case_sensitive=False,
        extra="ignore"
    )

# This will now correctly load your .env file from the root folder
settings = Settings()