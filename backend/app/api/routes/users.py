from __future__ import annotations

import re
import secrets
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError

from app.core.response import success
from app.core.security import get_password_hash, require_roles
from app.core.password_policy import validate_password
from app.deps import DbSession
from app.models.user import User
from app.schemas.user import (
    QuickActionPayload,
    UserCreate,
    UserOut,
    UserUpdate,
)


router = APIRouter(prefix="/users", tags=["users"], dependencies=[Depends(require_roles("ADMIN"))])


def _slugify(value: str) -> str:
    normalized = value.strip().lower()
    normalized = re.sub(r"[^a-z0-9\u0600-\u06FF]+", "-", normalized)
    normalized = re.sub(r"-{2,}", "-", normalized)
    return normalized.strip("-") or "value"


def _generate_user_code() -> str:
    return f"USR-{secrets.token_hex(3).upper()}"


def _generate_username(personal_info: Dict[str, Any], fallback: str = "") -> str:
    base = (
        personal_info.get("fullNameEn")
        or personal_info.get("fullName")
        or fallback
        or f"user-{secrets.token_hex(3)}"
    )
    slug = re.sub(r"[^a-zA-Z0-9]+", ".", base).strip(".").lower()
    slug = re.sub(r"\.{2,}", ".", slug)
    return slug or f"user.{secrets.token_hex(3)}"


def _prepare_nested_payload(payload: UserCreate) -> Dict[str, Any]:
    personal_info = payload.personalInfo.model_dump(exclude_none=True)
    contact_info = payload.contactInfo.model_dump(exclude_none=True)
    professional_info = payload.professionalInfo.model_dump(exclude_none=True)
    system_info = payload.systemInfo.model_dump(exclude_none=True, exclude={"password"})

    system_info.setdefault("loginCount", 0)
    system_info.setdefault("permissions", [])
    system_info.setdefault("passwordLastChanged", datetime.now(timezone.utc).isoformat())

    return {
        "personal_info": personal_info,
        "contact_info": contact_info,
        "professional_info": professional_info,
        "system_info": system_info,
    }


def _serialize_user(user: User) -> Dict[str, Any]:
    system_info = dict(user.system_info or {})
    system_info.pop("password", None)
    
    # Ensure required fields have defaults
    system_info.setdefault("role", "مهمان")
    system_info.setdefault("accessLevel", "سطح 4 - دسترسی مهمان")
    system_info.setdefault("permissions", [])
    system_info.setdefault("loginCount", 0)
    
    personal_info = user.personal_info or {}
    personal_info.setdefault("fullName", "نامشخص")
    personal_info.setdefault("nationality", "نامشخص")
    
    contact_info = user.contact_info or {}
    contact_info.setdefault("mobile", [])

    return {
        "id": user.id,
        "username": user.username,
        "userCode": user.user_code,
        "personalInfo": personal_info,
        "contactInfo": contact_info,
        "professionalInfo": user.professional_info or {},
        "systemInfo": system_info,
        "isActive": user.is_active,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
        "updatedAt": user.updated_at.isoformat() if user.updated_at else None,
    }


async def _ensure_unique(db: DbSession, username: str, user_code: str, exclude_user_id: Optional[str] = None) -> None:
    stmt = select(User).where(
        or_(
            User.username == username,
            User.user_code == user_code,
        )
    )
    if exclude_user_id:
        stmt = stmt.where(User.id != exclude_user_id)

    result = await db.execute(stmt.limit(1))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="نام کاربری یا کد کاربری تکراری است")


def _derive_internal_roles(system_role: Optional[str]) -> str:
    if not system_role:
        return "USER"
    mapping = {
        "مدیر سیستم": "ADMIN",
        "سرپرست": "OPERATOR",
        "اپراتور": "OPERATOR",
        "فرمانده": "OPERATOR",
    }
    return mapping.get(system_role, "USER")


def _filters(
    search: Optional[str],
    role: Optional[str],
    access_level: Optional[str],
    status_filter: Optional[str],
    is_active: Optional[bool],
    nationality: Optional[str],
    gender: Optional[str],
) -> List[Any]:
    conditions: List[Any] = []

    if search:
        like_pattern = f"%{search.lower()}%"
        conditions.append(
            or_(
                func.lower(User.username).like(like_pattern),
                func.lower(User.user_code).like(like_pattern),
                func.lower(User.personal_info["fullName"].astext).like(like_pattern),
                func.lower(User.contact_info["email"].astext).like(like_pattern),
            )
        )

    if role:
        conditions.append(User.system_info["role"].astext == role)

    if access_level:
        conditions.append(User.system_info["accessLevel"].astext == access_level)

    if status_filter:
        conditions.append(User.professional_info["status"].astext == status_filter)

    if is_active is not None:
        conditions.append(User.is_active == is_active)

    if nationality:
        conditions.append(User.personal_info["nationality"].astext == nationality)

    if gender:
        conditions.append(User.personal_info["gender"].astext == gender)

    return conditions


def _build_lookup(values: Iterable[str]) -> List[Dict[str, str]]:
    unique = []
    seen = set()
    for value in values:
        if not value or value in seen:
            continue
        seen.add(value)
        unique.append({"id": value, "name": value})
    return unique


@router.get("", response_model=dict)
async def list_users(
    db: DbSession,
    search: Optional[str] = Query(default=None, description="جستجو بر اساس نام، کد کاربری یا ایمیل"),
    role: Optional[str] = Query(default=None),
    accessLevel: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    isActive: Optional[bool] = Query(default=None),
    nationality: Optional[str] = Query(default=None),
    gender: Optional[str] = Query(default=None),
) -> dict[str, Any]:
    conditions = _filters(search, role, accessLevel, status, isActive, nationality, gender)
    stmt = select(User).where(*conditions).order_by(User.created_at.desc())
    result = await db.execute(stmt)
    users = result.scalars().all()

    count_stmt = select(func.count()).select_from(User).where(*conditions)
    total = (await db.execute(count_stmt)).scalar_one()

    roles_stmt = select(func.distinct(User.system_info["role"].astext))
    access_stmt = select(func.distinct(User.system_info["accessLevel"].astext))

    role_values = (await db.execute(roles_stmt)).scalars().all()
    access_values = (await db.execute(access_stmt)).scalars().all()

    payload = {
        "items": [_serialize_user(user) for user in users],
        "total": total,
        "roles": _build_lookup(role_values),
        "accessLevels": _build_lookup(access_values),
    }
    return success(payload)


@router.get("/{user_id}", response_model=dict)
async def get_user(user_id: str, db: DbSession) -> dict[str, Any]:
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="کاربر یافت نشد")
    return success(_serialize_user(user))


@router.post("", status_code=status.HTTP_201_CREATED, response_model=dict)
async def create_user(payload: UserCreate, db: DbSession) -> dict[str, Any]:
    nested = _prepare_nested_payload(payload)
    username = payload.username or _generate_username(nested["personal_info"], payload.userCode)
    user_code = payload.userCode or _generate_user_code()

    await _ensure_unique(db, username, user_code)

    plain_password = payload.systemInfo.password or secrets.token_urlsafe(8)
    is_valid, error_msg = validate_password(plain_password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)
    hashed_password = get_password_hash(plain_password)

    user = User(
        id=str(uuid4()),
        username=username,
        user_code=user_code,
        password_hash=hashed_password,
        roles=_derive_internal_roles(nested["system_info"].get("role")),
        personal_info=nested["personal_info"],
        contact_info=nested["contact_info"],
        professional_info=nested["professional_info"],
        system_info=nested["system_info"],
        is_active=payload.isActive,
    )

    db.add(user)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ثبت کاربران با شکست مواجه شد") from exc

    await db.refresh(user)
    return success(_serialize_user(user))


@router.patch("/{user_id}", response_model=dict)
async def update_user(user_id: str, payload: UserUpdate, db: DbSession) -> dict[str, Any]:
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="کاربر یافت نشد")

    data = payload.model_dump(exclude_unset=True)

    if "userCode" in data:
        user_code = data["userCode"]
        await _ensure_unique(db, user.username, user_code, exclude_user_id=user.id)
        user.user_code = user_code

    if "personalInfo" in data and data["personalInfo"]:
        user.personal_info = {**(user.personal_info or {}), **data["personalInfo"]}

    if "contactInfo" in data and data["contactInfo"]:
        user.contact_info = {**(user.contact_info or {}), **data["contactInfo"]}

    if "professionalInfo" in data and data["professionalInfo"]:
        user.professional_info = {**(user.professional_info or {}), **data["professionalInfo"]}

    if "systemInfo" in data and data["systemInfo"]:
        system_updates = data["systemInfo"].copy()
        new_password = system_updates.pop("password", None)
        if new_password:
            is_valid, error_msg = validate_password(new_password)
            if not is_valid:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)
            user.password_hash = get_password_hash(new_password)
            system_updates["passwordLastChanged"] = datetime.now(timezone.utc).isoformat()
        user.system_info = {**(user.system_info or {}), **system_updates}
        if system_updates.get("role"):
            user.roles = _derive_internal_roles(system_updates["role"])

    if data.get("isActive") is not None:
        user.is_active = data["isActive"]

    user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)
    return success(_serialize_user(user))


@router.delete("/{user_id}", response_model=dict)
async def delete_user(user_id: str, db: DbSession) -> dict[str, Any]:
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="کاربر یافت نشد")
    await db.delete(user)
    await db.commit()
    return success({"id": user_id}, message="کاربر حذف شد")


@router.post("/{user_id}/actions", response_model=dict)
async def perform_quick_action(user_id: str, payload: QuickActionPayload, db: DbSession) -> dict[str, Any]:
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="کاربر یافت نشد")

    action = payload.action
    data = payload.data or {}

    if action == "toggleActive":
        target_state = data.get("isActive")
        if target_state is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="وضعیت جدید مشخص نشده است")
        user.is_active = bool(target_state)

    elif action == "changePassword":
        new_password = data.get("newPassword")
        if not new_password:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="رمز عبور جدید ارسال نشده است")
        is_valid, error_msg = validate_password(new_password)
        if not is_valid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)
        user.password_hash = get_password_hash(new_password)
        system_info = user.system_info or {}
        system_info["passwordLastChanged"] = datetime.now(timezone.utc).isoformat()
        user.system_info = system_info

    elif action == "updateAccessLevel":
        new_role = data.get("newRole")
        new_access = data.get("newAccessLevel")
        new_permissions = data.get("newPermissions")
        system_info = user.system_info or {}

        if new_role:
            system_info["role"] = new_role
            user.roles = _derive_internal_roles(new_role)
        if new_access:
            system_info["accessLevel"] = new_access
        if new_permissions is not None:
            system_info["permissions"] = new_permissions
        user.system_info = system_info

    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="نوع عملیات پشتیبانی نمی‌شود")

    user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)
    return success(_serialize_user(user))


