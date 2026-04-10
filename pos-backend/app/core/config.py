from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    # Database fields
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_HOST: str = "127.0.0.1"
    DB_PORT: int = 3306
    DB_NAME: str = "poss_pager"
    
    # Auth & URL
    JWT_SECRET: str = "supersecretkey"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    DATABASE_URL: str = ""

    # Hardware/Serial fields - ADD THIS!
    PREFERRED_PORT: str = "/dev/cu.usbserial-0001" # Default for Mac
    PORT: int = 8000 # Adding this since main.py uses settings.PORT
    BAUD_RATE: int = 115200
    model_config = ConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()