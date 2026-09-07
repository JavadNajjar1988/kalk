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
    ADMIN_BOOTSTRAP_PASSWORD: str = Field(default="", repr=False)

    # Security settings
    MAX_LOGIN_ATTEMPTS: int = 5  # Maximum failed login attempts before lockout
    LOCKOUT_DURATION_MINUTES: int = 30  # Account lockout duration in minutes
    RATE_LIMIT_LOGIN_PER_MINUTE: int = 10  # Maximum login attempts per minute per IP
    MIN_PASSWORD_LENGTH: int = 8  # Minimum password length
    REQUIRE_PASSWORD_COMPLEXITY: bool = True  # Require password complexity (uppercase, lowercase, number)

    # وقتی True باشد، تمام بررسی‌های احراز هویت در backend نادیده گرفته می‌شود.
    DISABLE_AUTH: bool = False
    # In production/offline bundle, TileServer is exposed via nginx under /tiles (same origin).
    # You can override via env TILESERVER_URL if needed (e.g. "http://tileserver:8080" for internal network).
    TILESERVER_URL: str = "/tiles"
    FILESYSTEM_TILE_ROOT: str = "sat"
    # Comma-separated extra root paths for tile folders (e.g. mounted NAS, external drives).
    # Example: "D:/maps/tiles,/mnt/nas/tiles"
    FILESYSTEM_TILE_EXTRA_ROOTS: str = ""
    SCENARIO_IMAGE_DIR: str = "backend/static/scenarios/images"
    SCENARIO_INTRO_VIDEO_DIR: str = "backend/static/scenarios/intro-videos"
    # SDI catalog
    CATALOG_PATH: str = "backend/static/maps/layers.json"
    CATALOG_TMP_PATH: str = "backend/static/maps/layers.tmp.json"
    CATALOG_BACKUP_PATH: str = "backend/static/maps/layers.bak.json"
    DEFAULT_ROLES: list[str] = ["user"]

    # اختیاری: API سازگار با OpenAI برای نگاشت ستون‌ها (فاز AI)
    INTERNAL_LLM_BASE_URL: str = ""
    INTERNAL_LLM_API_KEY: str = ""
    INTERNAL_LLM_MODEL: str = "gpt-4o-mini"
    DOCUMENT_LLM_MODEL: str = "qwen/qwen3.5-9b"
    DOCUMENT_LLM_BASE_URL: str = ""
    DOCUMENT_OCR_MODEL: str = "paddlepaddle/paddleocr-vl-1.5-gguf/paddleocr-vl-1.5.gguf"
    DOCUMENT_OCR_BASE_URL: str = ""
    DOCUMENT_OCR_PIPELINE_URL: str = ""
    DOCUMENT_JOB_DIR: str = "backend/static/document-imports"

    @field_validator("DISABLE_AUTH", mode="before")
    def _coerce_bool(cls, v):  # type: ignore[no-redef]
        if isinstance(v, str):
            s = v.strip().strip('"').strip("'").lower()
            if s in {"true", "1", "yes", "y", "on"}:
                return True
            if s in {"false", "0", "no", "n", "off"}:
                return False
        return v

    @field_validator("JWT_SECRET")
    @classmethod
    def _validate_jwt_secret(cls, value: str) -> str:
        if len(value.encode("utf-8")) < 32:
            raise ValueError("JWT_SECRET must contain at least 32 bytes")
        return value


settings = Settings()
