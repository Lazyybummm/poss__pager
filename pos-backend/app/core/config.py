from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):

    model_config = ConfigDict(
        env_file=".env"
    )

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

    # Hardware/Serial fields - ADD THIS!
    PREFERRED_PORT: str = "/dev/cu.usbserial-0001" # Default for Mac
    PORT: int = 8000 # Adding this since main.py uses settings.PORT
    BAUD_RATE: int = 115200

    
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str


    # Server Config
    PORT: int = 3000
    

    # Pydantic V2 Configuration Style
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding='utf-8',
        case_sensitive=False,
        extra="ignore"
    )

# This will now correctly load your .env file from the root folder
settings = Settings()