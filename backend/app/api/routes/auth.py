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

# Import Keycloak if enabled
if settings.USE_KEYCLOAK:
    from app.core.keycloak import get_keycloak_client


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
            roles="ADMIN,OPERATOR",
            is_active=True,
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
            roles="ADMIN,OPERATOR",
            is_active=True,
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


# Keycloak SSO endpoints
if settings.USE_KEYCLOAK:
    @router.get("/keycloak/login-url")
    async def get_keycloak_login_url():
        """Get Keycloak login URL for frontend redirect"""
        keycloak = get_keycloak_client()
        config = await keycloak.get_well_known_config()
        auth_url = config.get("authorization_endpoint")
        if not auth_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Keycloak authorization endpoint not found"
            )
        
        # Build authorization URL with parameters
        from urllib.parse import urlencode
        params = {
            "client_id": settings.KEYCLOAK_CLIENT_ID,
            "response_type": "code",
            "scope": "openid profile email",
            "redirect_uri": "http://localhost:5173/auth/callback",  # Should be configurable
        }
        login_url = f"{auth_url}?{urlencode(params)}"
        
        return {"login_url": login_url}
    
    @router.post("/keycloak/callback")
    async def keycloak_callback(code: str, db: DbSession):
        """Handle Keycloak OAuth callback"""
        keycloak = get_keycloak_client()
        config = await keycloak.get_well_known_config()
        token_url = config.get("token_endpoint")
        
        if not token_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Keycloak token endpoint not found"
            )
        
        # Exchange authorization code for tokens
        import httpx
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    token_url,
                    data={
                        "grant_type": "authorization_code",
                        "code": code,
                        "client_id": settings.KEYCLOAK_CLIENT_ID,
                        "client_secret": settings.KEYCLOAK_CLIENT_SECRET,
                        "redirect_uri": "http://localhost:5173/auth/callback",
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    timeout=10.0
                )
                response.raise_for_status()
                token_data = response.json()
                
                # Verify and extract user info from token
                access_token = token_data.get("access_token")
                if not access_token:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="No access token in response"
                    )
                
                # Get user info
                user_info = await keycloak.get_user_info(access_token)
                payload = await keycloak.verify_token(access_token)
                roles = keycloak.extract_roles_from_token(payload)
                
                return {
                    "access_token": access_token,
                    "refresh_token": token_data.get("refresh_token"),
                    "token_type": token_data.get("token_type", "Bearer"),
                    "expires_in": token_data.get("expires_in"),
                    "user": {
                        "username": user_info.get("preferred_username") or user_info.get("sub"),
                        "email": user_info.get("email"),
                        "roles": roles,
                    }
                }
            except httpx.HTTPError as e:
                logger.error(f"Keycloak token exchange failed: {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to exchange authorization code"
                )

