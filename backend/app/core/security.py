from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt import InvalidTokenError
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_session
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_PREFIX}/auth/token")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALG)


def decode_access_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    # در حالت غیرفعال بودن احراز هویت، کاربر فرضی admin با تمام نقش‌ها برمی‌گردد.
    if settings.DISABLE_AUTH:
        return {
            "username": "dev",
            "roles": ["SUPER_ADMIN", "COMMANDER", "VIEWER"],
            "user_id": None,
        }
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Local JWT authentication
    try:
        payload = decode_access_token(token)
        username: str | None = payload.get("sub")
        user_id = payload.get("uid")
        token_version = payload.get("ver")
        if username is None or user_id is None or token_version is None:
            raise credentials_exception

        result = await db.execute(
            select(User).where(
                User.id == str(user_id),
                User.username == username,
                User.is_active.is_(True),
                User.deleted_at.is_(None),
            )
        )
        db_user = result.scalar_one_or_none()
        if not db_user or int(token_version) != db_user.token_version:
            raise credentials_exception

        roles = [role.strip() for role in (db_user.roles or "").split(",") if role.strip()]
        logger.info("Authenticated user %s with current database roles %s", username, roles)
        return {
            "username": db_user.username,
            "roles": roles,
            "user_id": db_user.id,
            "token_version": db_user.token_version,
        }
    except InvalidTokenError:
        raise credentials_exception


def require_roles(*required_roles: str):
    async def _inner(user: dict[str, Any] = Depends(get_current_user)):
        if settings.DISABLE_AUTH:
            return user
        raw_roles = user.get("roles", []) or []
        # نرمال‌سازی نقش‌ها برای پشتیبانی از اسامی معادل (مثلاً ADMIN ~ SUPER_ADMIN)
        def _normalize_role(value: Any) -> str | None:
            if not value:
                return None
            r = str(value).strip().upper()
            # Canonicalize admin roles so require_roles("ADMIN") matches tokens containing SUPER_ADMIN (and vice versa)
            if r in {"ADMIN", "SUPER_ADMIN"}:
                return "SUPER_ADMIN"
            return r

        normalized_user_roles = {nr for nr in (_normalize_role(role) for role in raw_roles) if nr}
        normalized_required = {nr for nr in (_normalize_role(r) for r in required_roles) if nr}

        # Logging برای بررسی نقش‌ها (INFO level برای debugging)
        logger.info(
            "Permission check - User: %s, Raw roles: %s, Normalized: %s",
            user.get("username"),
            raw_roles,
            normalized_user_roles,
        )
        logger.info(
            "Permission check - Required (ANY of): %s, Normalized: %s",
            required_roles,
            normalized_required,
        )

        # منطق مجوزها: داشتن «حداقل یکی» از نقش‌های موردنیاز کافی است (OR)
        if not (normalized_required & normalized_user_roles):
            logger.error(
                "ACCESS DENIED - User: %s, Has roles: %s, Needs ANY of: %s",
                user.get("username"),
                normalized_user_roles,
                normalized_required,
            )
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return _inner


