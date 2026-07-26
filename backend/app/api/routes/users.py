from __future__ import annotations

import re
import secrets
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError

from app.core.response import success
from app.core.security import get_password_hash, require_roles
from app.core.password_policy import validate_password
from app.core.user_policy import (
    DEFAULT_ACCESS_LEVELS,
    DEFAULT_SYSTEM_ROLES,
    ROLE_PROFILES,
    canonical_role,
    derive_internal_role,
    normalize_system_access,
    role_lookup_items,
)
from app.deps import DbSession
from app.models.user import User
from app.models.user_audit_log import UserAuditLog
from app.schemas.user import (
    QuickActionPayload,
    UserCreate,
    UserOut,
    UserUpdate,
)


# دسترسی: لیست و مشاهده برای SUPER_ADMIN و COMMANDER؛ ایجاد/ویرایش/حذف فقط SUPER_ADMIN
router = APIRouter(prefix="/users", tags=["users"])

ALLOWED_AVATARS = {f"avatar-{index}" for index in range(1, 13)}


_canonical_role = canonical_role
_normalize_system_access = normalize_system_access
_derive_internal_roles = derive_internal_role


def _validate_avatar(personal_info: Dict[str, Any]) -> None:
    avatar = personal_info.get("avatar")
    if avatar is not None and avatar not in ALLOWED_AVATARS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="آواتار انتخاب‌شده معتبر نیست")


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
    _validate_avatar(personal_info)
    contact_info = payload.contactInfo.model_dump(exclude_none=True)
    professional_info = payload.professionalInfo.model_dump(exclude_none=True)
    system_info = payload.systemInfo.model_dump(exclude_none=True, exclude={"password"})

    system_info.setdefault("loginCount", 0)
    system_info.setdefault("passwordLastChanged", datetime.now(timezone.utc).isoformat())
    system_info = _normalize_system_access(system_info)

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
    
    personal_info = dict(user.personal_info or {})
    personal_info.setdefault("fullName", "نامشخص")
    personal_info.setdefault("nationality", "نامشخص")
    
    contact_info = dict(user.contact_info or {})
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
        "version": user.version,
        "deletedAt": user.deleted_at.isoformat() if user.deleted_at else None,
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


async def _active_admin_count(db: DbSession, exclude_user_id: Optional[str] = None) -> int:
    stmt = select(func.count()).select_from(User).where(
        User.is_active.is_(True),
        User.deleted_at.is_(None),
        User.roles.like("%SUPER_ADMIN%"),
    )
    if exclude_user_id:
        stmt = stmt.where(User.id != exclude_user_id)
    return int((await db.execute(stmt)).scalar_one())


async def _protect_admin_continuity(
    db: DbSession,
    user: User,
    *,
    actor_id: Optional[str],
    next_active: Optional[bool] = None,
    next_role: Optional[str] = None,
    deleting: bool = False,
) -> None:
    if actor_id and user.id == actor_id:
        if deleting:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="حساب جاری قابل حذف نیست")
        if next_active is False:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="حساب جاری قابل غیرفعال‌سازی نیست")
        if next_role and _derive_internal_roles(next_role) != "SUPER_ADMIN":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="نقش حساب جاری قابل تنزل نیست")

    removes_admin = (
        "SUPER_ADMIN" in (user.roles or "")
        and (
            deleting
            or next_active is False
            or (next_role is not None and _derive_internal_roles(next_role) != "SUPER_ADMIN")
        )
    )
    if removes_admin and await _active_admin_count(db, exclude_user_id=user.id) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="حداقل یک مدیر سیستم فعال باید در سامانه باقی بماند",
        )


def _assert_version(user: User, expected_version: int) -> None:
    if user.version != expected_version:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="اطلاعات کاربر توسط عملیات دیگری تغییر کرده است؛ صفحه را تازه‌سازی کنید",
        )


def _request_ip(request: Request) -> Optional[str]:
    return request.client.host if request.client else None


def _add_audit_log(
    db: DbSession,
    request: Request,
    actor: dict[str, Any],
    user: User,
    action: str,
    *,
    before: Optional[Dict[str, Any]],
    after: Optional[Dict[str, Any]],
) -> None:
    db.add(
        UserAuditLog(
            target_user_id=user.id,
            actor_user_id=actor.get("user_id"),
            actor_username=actor.get("username"),
            action=action,
            before_state=before,
            after_state=after,
            client_ip=_request_ip(request),
            request_id=getattr(request.state, "request_id", None),
        )
    )


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


@router.get("", response_model=dict, dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))])
async def list_users(
    db: DbSession,
    search: Optional[str] = Query(default=None, description="جستجو بر اساس نام، کد کاربری یا ایمیل"),
    role: Optional[str] = Query(default=None),
    accessLevel: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    isActive: Optional[bool] = Query(default=None),
    nationality: Optional[str] = Query(default=None),
    gender: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=10, ge=1, le=100),
) -> dict[str, Any]:
    conditions = [
        User.deleted_at.is_(None),
        *_filters(search, role, accessLevel, status, isActive, nationality, gender),
    ]
    stmt = (
        select(User)
        .where(*conditions)
        .order_by(User.created_at.desc())
        .offset((page - 1) * pageSize)
        .limit(pageSize)
    )
    result = await db.execute(stmt)
    users = result.scalars().all()

    count_stmt = select(func.count()).select_from(User).where(*conditions)
    total = (await db.execute(count_stmt)).scalar_one()

    access_stmt = select(func.distinct(User.system_info["accessLevel"].astext)).where(User.deleted_at.is_(None))

    access_values = (await db.execute(access_stmt)).scalars().all()
    access_values = [*DEFAULT_ACCESS_LEVELS, *[v for v in access_values if v and v not in DEFAULT_ACCESS_LEVELS]]

    payload = {
        "items": [_serialize_user(user) for user in users],
        "total": total,
        "roles": role_lookup_items(),
        "accessLevels": _build_lookup(access_values),
    }
    return success(payload)


@router.get("/policy", response_model=dict, dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))])
async def get_user_policy() -> dict[str, Any]:
    return success({"roles": role_lookup_items(), "accessLevels": DEFAULT_ACCESS_LEVELS})


@router.get("/archived", response_model=dict)
async def list_archived_users(
    db: DbSession,
    actor: dict = Depends(require_roles("SUPER_ADMIN")),
) -> dict[str, Any]:
    result = await db.execute(
        select(User).where(User.deleted_at.is_not(None)).order_by(User.deleted_at.desc())
    )
    return success([_serialize_user(user) for user in result.scalars().all()])


@router.get("/audit-logs", response_model=dict)
async def list_user_audit_logs(
    db: DbSession,
    targetUserId: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    actor: dict = Depends(require_roles("SUPER_ADMIN")),
) -> dict[str, Any]:
    stmt = select(UserAuditLog)
    if targetUserId:
        stmt = stmt.where(UserAuditLog.target_user_id == targetUserId)
    logs = (await db.execute(stmt.order_by(UserAuditLog.created_at.desc()).limit(limit))).scalars().all()
    return success([
        {
            "id": item.id,
            "targetUserId": item.target_user_id,
            "actorUserId": item.actor_user_id,
            "actorUsername": item.actor_username,
            "action": item.action,
            "before": item.before_state,
            "after": item.after_state,
            "clientIp": item.client_ip,
            "requestId": item.request_id,
            "createdAt": item.created_at.isoformat(),
        }
        for item in logs
    ])


@router.get("/{user_id}", response_model=dict, dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))])
async def get_user(user_id: str, db: DbSession) -> dict[str, Any]:
    user = (
        await db.execute(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    ).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="کاربر یافت نشد")
    return success(_serialize_user(user))


@router.post("", status_code=status.HTTP_201_CREATED, response_model=dict)
async def create_user(
    payload: UserCreate,
    db: DbSession,
    request: Request,
    actor: dict = Depends(require_roles("SUPER_ADMIN")),
) -> dict[str, Any]:
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
        token_version=0,
        version=1,
    )

    db.add(user)
    try:
        await db.flush()
        _add_audit_log(
            db,
            request,
            actor,
            user,
            "user_created",
            before=None,
            after=_serialize_user(user),
        )
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ثبت کاربران با شکست مواجه شد") from exc

    await db.refresh(user)
    # plain_password فقط در این پاسخ برگردانده می‌شود تا مدیر بتواند یک‌بار آن را به کاربر منتقل کند.
    # در دیتابیس فقط هش رمز ذخیره شده است.
    return success(
        {
            "user": _serialize_user(user),
            "temporaryPassword": plain_password,
        }
    )


@router.patch("/{user_id}", response_model=dict)
async def update_user(
    user_id: str,
    payload: UserUpdate,
    db: DbSession,
    request: Request,
    actor: dict = Depends(require_roles("SUPER_ADMIN")),
) -> dict[str, Any]:
    user = (
        await db.execute(
            select(User)
            .where(User.id == user_id, User.deleted_at.is_(None))
            .with_for_update()
        )
    ).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="کاربر یافت نشد")

    data = payload.model_dump(exclude_unset=True)
    expected_version = int(data.pop("expectedVersion"))
    _assert_version(user, expected_version)
    before = _serialize_user(user)
    system_updates = dict(data.get("systemInfo") or {})
    await _protect_admin_continuity(
        db,
        user,
        actor_id=actor.get("user_id"),
        next_active=data.get("isActive"),
        next_role=system_updates.get("role"),
    )

    if "userCode" in data:
        user_code = data["userCode"]
        await _ensure_unique(db, user.username, user_code, exclude_user_id=user.id)
        user.user_code = user_code

    if "personalInfo" in data and data["personalInfo"]:
        _validate_avatar(data["personalInfo"])
        user.personal_info = {**(user.personal_info or {}), **data["personalInfo"]}

    if "contactInfo" in data and data["contactInfo"]:
        user.contact_info = {**(user.contact_info or {}), **data["contactInfo"]}

    if "professionalInfo" in data and data["professionalInfo"]:
        user.professional_info = {**(user.professional_info or {}), **data["professionalInfo"]}

    revoke_sessions = data.get("isActive") is False
    if system_updates:
        new_password = system_updates.pop("password", None)
        if new_password:
            is_valid, error_msg = validate_password(new_password)
            if not is_valid:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)
            user.password_hash = get_password_hash(new_password)
            system_updates["passwordLastChanged"] = datetime.now(timezone.utc).isoformat()
            revoke_sessions = True
        previous_role = (user.system_info or {}).get("role")
        user.system_info = _normalize_system_access({**(user.system_info or {}), **system_updates})
        user.roles = _derive_internal_roles(user.system_info.get("role"))
        revoke_sessions = revoke_sessions or user.system_info.get("role") != previous_role

    if data.get("isActive") is not None:
        revoke_sessions = revoke_sessions or user.is_active != data["isActive"]
        user.is_active = data["isActive"]

    if revoke_sessions:
        user.token_version += 1
    user.version += 1
    user.updated_at = datetime.now(timezone.utc)
    _add_audit_log(
        db,
        request,
        actor,
        user,
        "user_updated",
        before=before,
        after=_serialize_user(user),
    )
    await db.commit()
    await db.refresh(user)
    return success(_serialize_user(user))


@router.delete("/{user_id}", response_model=dict)
async def delete_user(
    user_id: str,
    db: DbSession,
    request: Request,
    expectedVersion: int = Query(..., ge=1),
    actor: dict = Depends(require_roles("SUPER_ADMIN")),
) -> dict[str, Any]:
    user = (
        await db.execute(
            select(User)
            .where(User.id == user_id, User.deleted_at.is_(None))
            .with_for_update()
        )
    ).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="کاربر یافت نشد")
    _assert_version(user, expectedVersion)
    before = _serialize_user(user)
    await _protect_admin_continuity(
        db,
        user,
        actor_id=actor.get("user_id"),
        deleting=True,
    )
    user.deleted_at = datetime.now(timezone.utc)
    user.is_active = False
    user.token_version += 1
    user.version += 1
    user.updated_at = datetime.now(timezone.utc)
    _add_audit_log(
        db,
        request,
        actor,
        user,
        "user_archived",
        before=before,
        after=_serialize_user(user),
    )
    await db.commit()
    return success({"id": user_id, "version": user.version}, message="کاربر به آرشیو منتقل شد")


@router.post("/{user_id}/restore", response_model=dict)
async def restore_user(
    user_id: str,
    db: DbSession,
    request: Request,
    expectedVersion: int = Query(..., ge=1),
    actor: dict = Depends(require_roles("SUPER_ADMIN")),
) -> dict[str, Any]:
    user = (
        await db.execute(
            select(User)
            .where(User.id == user_id, User.deleted_at.is_not(None))
            .with_for_update()
        )
    ).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="کاربر آرشیوشده یافت نشد")
    _assert_version(user, expectedVersion)
    before = _serialize_user(user)
    user.deleted_at = None
    user.is_active = True
    user.token_version += 1
    user.version += 1
    user.updated_at = datetime.now(timezone.utc)
    _add_audit_log(
        db,
        request,
        actor,
        user,
        "user_restored",
        before=before,
        after=_serialize_user(user),
    )
    await db.commit()
    await db.refresh(user)
    return success(_serialize_user(user), message="کاربر از آرشیو بازیابی شد")


@router.post("/{user_id}/actions", response_model=dict)
async def perform_quick_action(
    user_id: str,
    payload: QuickActionPayload,
    db: DbSession,
    request: Request,
    actor: dict = Depends(require_roles("SUPER_ADMIN")),
) -> dict[str, Any]:
    user = (
        await db.execute(
            select(User)
            .where(User.id == user_id, User.deleted_at.is_(None))
            .with_for_update()
        )
    ).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="کاربر یافت نشد")
    if payload.userId != user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="شناسه کاربر در درخواست ناسازگار است")
    _assert_version(user, payload.expectedVersion)
    before = _serialize_user(user)

    action = payload.action
    data = payload.data or {}

    if action == "toggleActive":
        target_state = data.get("isActive")
        if target_state is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="وضعیت جدید مشخص نشده است")
        await _protect_admin_continuity(
            db,
            user,
            actor_id=actor.get("user_id"),
            next_active=bool(target_state),
        )
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
        if not new_role:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="نقش جدید مشخص نشده است")
        await _protect_admin_continuity(
            db,
            user,
            actor_id=actor.get("user_id"),
            next_role=new_role,
        )
        system_info = dict(user.system_info or {})

        system_info["role"] = new_role
        user.system_info = _normalize_system_access(system_info)
        user.roles = _derive_internal_roles(user.system_info["role"])

    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="نوع عملیات پشتیبانی نمی‌شود")

    user.token_version += 1
    user.version += 1
    user.updated_at = datetime.now(timezone.utc)
    _add_audit_log(
        db,
        request,
        actor,
        user,
        f"quick_action_{action}",
        before=before,
        after=_serialize_user(user),
    )
    await db.commit()
    await db.refresh(user)
    return success(_serialize_user(user))


