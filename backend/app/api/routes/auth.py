from datetime import timedelta, datetime, timezone
import uuid
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.rate_limit import rate_limiter
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


def _get_client_ip(request: Request) -> str:
    """Extract client IP from request"""
    if request.client:
        return request.client.host
    return "unknown"


async def _check_account_lockout(user: User) -> None:
    """Check if account is locked and raise exception if locked"""
    if user.locked_until:
        now = datetime.now(timezone.utc)
        if user.locked_until > now:
            remaining_minutes = int((user.locked_until - now).total_seconds() / 60)
            logger.warning(f"Login attempt for locked account: {user.username} (locked until {user.locked_until})")
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"حساب کاربری قفل شده است. لطفا {remaining_minutes} دقیقه دیگر تلاش کنید."
            )


async def _handle_failed_login(db: DbSession, user: Optional[User], username: str, client_ip: str) -> None:
    """Handle failed login attempt"""
    now = datetime.now(timezone.utc)
    
    if user:
        user.failed_login_count += 1
        user.last_login_attempt = now
        
        # Lock account if max attempts reached
        if user.failed_login_count >= settings.MAX_LOGIN_ATTEMPTS:
            lockout_until = now + timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
            user.locked_until = lockout_until
            logger.warning(
                f"Account locked: {username} after {user.failed_login_count} failed attempts. "
                f"Locked until {lockout_until}"
            )
        else:
            remaining_attempts = settings.MAX_LOGIN_ATTEMPTS - user.failed_login_count
            logger.warning(
                f"Failed login attempt for {username} from {client_ip}. "
                f"{remaining_attempts} attempts remaining before lockout."
            )
        
        await db.commit()
    else:
        # User doesn't exist - log but don't reveal this
        logger.warning(f"Failed login attempt for non-existent user: {username} from {client_ip}")


async def _handle_successful_login(db: DbSession, user: User, client_ip: str) -> None:
    """Handle successful login - reset failed attempts"""
    if user.failed_login_count > 0 or user.locked_until:
        user.failed_login_count = 0
        user.locked_until = None
        user.last_login_attempt = datetime.now(timezone.utc)
        await db.commit()
        logger.info(f"Successful login for {user.username} from {client_ip}. Failed attempts reset.")


async def _authenticate_user(
    db: DbSession,
    username: str,
    password: str,
    client_ip: str,
    request: Request
) -> User:
    """Authenticate user with rate limiting and account lockout checks"""
    
    # Rate limiting by IP
    rate_limit_key = f"login_ip:{client_ip}"
    is_allowed, remaining = await rate_limiter.check_rate_limit(
        rate_limit_key,
        settings.RATE_LIMIT_LOGIN_PER_MINUTE,
        1
    )
    
    if not is_allowed:
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"تعداد تلاش‌های لاگین بیش از حد مجاز است. لطفا یک دقیقه دیگر تلاش کنید."
        )
    
    # Get user from database
    result = await db.execute(select(User).where(User.username == username, User.is_active == True))
    user = result.scalar_one_or_none()
    
    # Check account lockout
    if user:
        await _check_account_lockout(user)
    
    # Verify password
    if not user or not verify_password(password, user.password_hash):
        await _handle_failed_login(db, user, username, client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="نام کاربری یا رمز عبور اشتباه است"
        )
    
    # Successful login
    await _handle_successful_login(db, user, client_ip)
    logger.info(f"Successful login for user: {user.username} from {client_ip}")
    
    return user


@router.post("/token", response_model=Token)
async def login(
    request: Request,
    db: DbSession,
    form_data: OAuth2PasswordRequestForm = Depends()
):
    # Ensure admin exists (fallback bootstrap if migration hasn't run)
    result = await db.execute(select(User).where(User.username == "admin"))
    admin_user = result.scalar_one_or_none()
    if not admin_user:
        logger.warning("Admin user not found. Creating fallback admin. Please run migrations to create admin properly.")
        now = datetime.now(timezone.utc)
        admin_user = User(
            id=str(uuid.uuid4()),
            username="admin",
            user_code="USR-ADMIN",
            password_hash=get_password_hash(_get_admin_password()),
            roles="SUPER_ADMIN",
            is_active=True,
            failed_login_count=0,
            personal_info={
                "fullName": "مدیر سیستم",
                "nationality": "ایرانی",
                "gender": "نامشخص",
            },
            contact_info={"email": "admin@example.com"},
            professional_info={"status": "نظامی", "details": {}},
            system_info={
                "role": "مدیر سیستم",
                "accessLevel": "سطح 1 - دسترسی کامل",
                "permissions": ["مدیریت کاربران", "مدیریت سیستم"],
                "loginCount": 0,
                "passwordLastChanged": now.isoformat(),
            },
            created_at=now,
            updated_at=now,
        )
        db.add(admin_user)
        await db.commit()

    # Authenticate with security checks
    client_ip = _get_client_ip(request)
    user = await _authenticate_user(db, form_data.username, form_data.password, client_ip, request)

    # Generate token
    roles = [r.strip() for r in (user.roles or "").split(",") if r.strip()]
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "roles": roles, "uid": user.id}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token)


@router.post("/token_json", response_model=Token)
async def login_json(payload: LoginRequest, db: DbSession, request: Request):
    # Ensure admin exists (fallback bootstrap if migration hasn't run)
    result = await db.execute(select(User).where(User.username == "admin"))
    admin_user = result.scalar_one_or_none()
    if not admin_user:
        logger.warning("Admin user not found. Creating fallback admin. Please run migrations to create admin properly.")
        now = datetime.now(timezone.utc)
        admin_user = User(
            id=str(uuid.uuid4()),
            username="admin",
            user_code="USR-ADMIN",
            password_hash=get_password_hash(_get_admin_password()),
            roles="SUPER_ADMIN",
            is_active=True,
            failed_login_count=0,
            personal_info={
                "fullName": "مدیر سیستم",
                "nationality": "ایرانی",
                "gender": "نامشخص",
            },
            contact_info={"email": "admin@example.com"},
            professional_info={"status": "نظامی", "details": {}},
            system_info={
                "role": "مدیر سیستم",
                "accessLevel": "سطح 1 - دسترسی کامل",
                "permissions": ["مدیریت کاربران", "مدیریت سیستم"],
                "loginCount": 0,
                "passwordLastChanged": now.isoformat(),
            },
            created_at=now,
            updated_at=now,
        )
        db.add(admin_user)
        await db.commit()

    # Authenticate with security checks
    client_ip = _get_client_ip(request)
    user = await _authenticate_user(db, payload.username, payload.password, client_ip, request)

    # Generate token
    roles = [r.strip() for r in (user.roles or "").split(",") if r.strip()]
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "roles": roles, "uid": user.id}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token)
