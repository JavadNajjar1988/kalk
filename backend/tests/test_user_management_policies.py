import os

import pytest
from fastapi import HTTPException

os.environ.setdefault("ADMIN_BOOTSTRAP_PASSWORD", "Test-only-admin-password-2026")

from app.api.routes.users import (  # noqa: E402
    _canonical_role,
    _derive_internal_roles,
    _normalize_system_access,
    _validate_avatar,
)


def test_role_alias_is_normalized_to_canonical_role():
    assert _canonical_role("مهمان") == "ناظر مهمان"
    assert _canonical_role("سوپر ادمین") == "مدیر سیستم"


def test_unknown_role_uses_least_privileged_profile():
    assert _canonical_role("نقش ناشناخته") == "ناظر مهمان"
    assert _derive_internal_roles("نقش ناشناخته") == "VIEWER"


def test_access_level_and_permissions_are_derived_from_role():
    normalized = _normalize_system_access(
        {
            "role": "فرمانده",
            "accessLevel": "سطح 4 - دسترسی مهمان",
            "permissions": ["مدیریت کاربران"],
        }
    )

    assert normalized["role"] == "فرمانده"
    assert normalized["accessLevel"] == "سطح 2 - دسترسی عملیاتی"
    assert "مشاهده کاربران" in normalized["permissions"]
    assert "مدیریت کاربران" not in normalized["permissions"]


def test_operator_maps_to_internal_operator_role():
    assert _derive_internal_roles("اپراتور") == "OPERATOR"


def test_avatar_allowlist_rejects_unknown_assets():
    _validate_avatar({"avatar": "avatar-1"})
    _validate_avatar({})

    with pytest.raises(HTTPException) as exc_info:
        _validate_avatar({"avatar": "uploaded-script.svg"})

    assert exc_info.value.status_code == 400
