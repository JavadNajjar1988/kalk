from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")

    APP_NAME: str = "Kalk API"
    VERSION: str = "0.1.0"
    API_PREFIX: str = "/api"

    # Comma-separated in env, parsed to list automatically by pydantic v2 when provided as list[str]
    CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
        ]
    )

    DB_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/kalk"
    JWT_SECRET: str = "change_me"
    JWT_ALG: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60


settings = Settings()


