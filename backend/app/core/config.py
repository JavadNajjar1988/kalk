from typing import List
import secrets

from pydantic import Field
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")

    APP_NAME: str = "Kalk API"
    VERSION: str = "0.1.0"
    API_PREFIX: str = "/api"

    # Comma-separated in env, parsed to list automatically by pydantic v2 when provided as list[str]
    CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: [
             "http://127.0.0.1:5173",
             "http://127.0.0.1:3000",
       
        ]
    )

    DB_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/kalk"
    JWT_SECRET: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    JWT_ALG: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ADMIN_BOOTSTRAP_PASSWORD: str = Field(default="admin123", repr=False)

    # وقتی True باشد، تمام بررسی‌های احراز هویت در backend نادیده گرفته می‌شود.
    DISABLE_AUTH: bool = False

    @field_validator("DISABLE_AUTH", mode="before")
    def _coerce_bool(cls, v):  # type: ignore[no-redef]
        if isinstance(v, str):
            s = v.strip().strip('"').strip("'").lower()
            if s in {"true", "1", "yes", "y", "on"}:
                return True
            if s in {"false", "0", "no", "n", "off"}:
                return False
        return v


settings = Settings()


