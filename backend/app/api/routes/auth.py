from datetime import timedelta, datetime, timezone
import uuid
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.security import create_access_token, verify_password, get_password_hash
from app.deps import DbSession
from sqlalchemy import select
from app.models.user import User
from app.schemas.auth import Token, LoginRequest


router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)
_default_admin_warning_emitted = False


def _get_admin_password() -> str:
    global _default_admin_warning_emitted
    password = settings.ADMIN_BOOTSTRAP_PASSWORD
    if password == "admin123" and not _default_admin_warning_emitted:
        logger.warning("ADMIN_BOOTSTRAP_PASSWORD is using the default value; change it via environment variables.")
        _default_admin_warning_emitted = True
    if not password:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Admin bootstrap password not configured")
    return password


@router.post("/token", response_model=Token)
async def login(db: DbSession, form_data: OAuth2PasswordRequestForm = Depends()):
    # Ensure admin exists (bootstrap if not)
    result = await db.execute(select(User).where(User.username == "admin"))
    admin_user = result.scalar_one_or_none()
    if not admin_user:
        now = datetime.now(timezone.utc)
        admin_user = User(
            id=str(uuid.uuid4()),
            username="admin",
            password_hash=get_password_hash(_get_admin_password()),
            roles="ADMIN,OPERATOR",
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        db.add(admin_user)
        await db.commit()

    # DB lookup
    result = await db.execute(select(User).where(User.username == form_data.username, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    roles = [r.strip() for r in (user.roles or "").split(",") if r.strip()]
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "roles": roles, "uid": user.id}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token)


@router.post("/token_json", response_model=Token)
async def login_json(payload: LoginRequest, db: DbSession):
    # Ensure admin exists (bootstrap if not)
    result = await db.execute(select(User).where(User.username == "admin"))
    admin_user = result.scalar_one_or_none()
    if not admin_user:
        now = datetime.now(timezone.utc)
        admin_user = User(
            id=str(uuid.uuid4()),
            username="admin",
            password_hash=get_password_hash(_get_admin_password()),
            roles="ADMIN,OPERATOR",
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        db.add(admin_user)
        await db.commit()

    # DB lookup
    result = await db.execute(select(User).where(User.username == payload.username, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    roles = [r.strip() for r in (user.roles or "").split(",") if r.strip()]
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "roles": roles, "uid": user.id}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token)

