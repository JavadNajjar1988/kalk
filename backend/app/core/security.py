from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
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


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict[str, Any]:
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
        roles_raw = payload.get("roles", [])
        
        # Handle both list and string formats
        if isinstance(roles_raw, str):
            # If roles is a string, split by comma
            roles = [r.strip() for r in roles_raw.split(",") if r.strip()]
        elif isinstance(roles_raw, list):
            roles = [str(r).strip() for r in roles_raw if r]
        else:
            roles = []
            
        if username is None:
            raise credentials_exception
        # Logging برای debugging
        logger.info(f"JWT decoded - User: {username}, Roles from token (raw): {roles_raw}, Parsed: {roles}")
        user_id = payload.get("uid")
        return {"username": username, "roles": roles, "user_id": user_id}
    except JWTError:
        raise credentials_exception


def require_roles(*required_roles: str):
    async def _inner(user: dict[str, Any] = Depends(get_current_user)):
        if settings.DISABLE_AUTH:
            return user
        raw_roles = user.get("roles", []) or []
        # نرمال‌سازی نقش‌ها برای پشتیبانی از اسامی معادل (مثلاً ADMIN ~ SUPER_ADMIN)
        normalized_user_roles = set()
        for role in raw_roles:
            if not role:
                continue
            r = str(role).strip().upper()
            if r == "ADMIN":
                r = "SUPER_ADMIN"
            normalized_user_roles.add(r)

        normalized_required = {str(r).strip().upper() for r in required_roles}

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


