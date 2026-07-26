from __future__ import annotations

from typing import Any, Dict, Optional


ROLE_PROFILES: Dict[str, Dict[str, Any]] = {
    "مدیر سیستم": {
        "internalRole": "SUPER_ADMIN",
        "accessLevel": "سطح 1 - دسترسی کامل",
        "permissions": ["مدیریت کاربران", "مدیریت سناریوها", "مدیریت منابع", "تنظیمات سامانه"],
    },
    "فرمانده": {
        "internalRole": "COMMANDER",
        "accessLevel": "سطح 2 - دسترسی عملیاتی",
        "permissions": ["مشاهده کاربران", "مدیریت سناریوها", "مدیریت منابع", "مدیریت داده"],
    },
    "اپراتور": {
        "internalRole": "OPERATOR",
        "accessLevel": "سطح 3 - دسترسی محدود",
        "permissions": ["مشاهده داشبورد", "مشاهده سناریوها", "مدیریت منابع"],
    },
    "ناظر مهمان": {
        "internalRole": "VIEWER",
        "accessLevel": "سطح 4 - دسترسی مهمان",
        "permissions": ["مشاهده داشبورد", "مشاهده سناریوها", "مشاهده منابع"],
    },
}

ROLE_ALIASES = {
    "سوپر ادمین": "مدیر سیستم",
    "مهمان": "ناظر مهمان",
}

DEFAULT_SYSTEM_ROLES = list(ROLE_PROFILES)
DEFAULT_ACCESS_LEVELS = [str(profile["accessLevel"]) for profile in ROLE_PROFILES.values()]


def canonical_role(role: Optional[str]) -> str:
    canonical = ROLE_ALIASES.get((role or "").strip(), (role or "").strip())
    return canonical if canonical in ROLE_PROFILES else "ناظر مهمان"


def normalize_system_access(system_info: Dict[str, Any]) -> Dict[str, Any]:
    normalized = dict(system_info)
    role = canonical_role(normalized.get("role"))
    profile = ROLE_PROFILES[role]
    normalized["role"] = role
    normalized["accessLevel"] = profile["accessLevel"]
    normalized["permissions"] = list(profile["permissions"])
    return normalized


def derive_internal_role(system_role: Optional[str]) -> str:
    return str(ROLE_PROFILES[canonical_role(system_role)]["internalRole"])


def role_lookup_items() -> list[dict[str, Any]]:
    return [
        {
            "id": role,
            "name": role,
            "accessLevel": profile["accessLevel"],
            "permissions": list(profile["permissions"]),
            "internalRole": profile["internalRole"],
        }
        for role, profile in ROLE_PROFILES.items()
    ]
