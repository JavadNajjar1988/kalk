import os

import pytest
from fastapi import HTTPException

os.environ.setdefault("ADMIN_BOOTSTRAP_PASSWORD", "Test-only-admin-password-2026")

from app.api.routes.users import _validate_avatar  # noqa: E402
from app.core.user_policy import (  # noqa: E402
    canonical_role,
    derive_internal_role,
    normalize_system_access,
)


def test_role_alias_is_normalized_to_canonical_role():
    assert canonical_role("مهمان") == "ناظر مهمان"
    assert canonical_role("سوپر ادمین") == "مدیر سیستم"


def test_unknown_role_uses_least_privileged_profile():
    assert canonical_role("نقش ناشناخته") == "ناظر مهمان"
    assert derive_internal_role("نقش ناشناخته") == "VIEWER"


def test_access_level_and_permissions_are_derived_from_role():
    normalized = normalize_system_access(
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
    assert derive_internal_role("اپراتور") == "OPERATOR"


def test_avatar_allowlist_rejects_unknown_assets():
    _validate_avatar({"avatar": "avatar-1"})
    _validate_avatar({})

    with pytest.raises(HTTPException) as exc_info:
        _validate_avatar({"avatar": "uploaded-script.svg"})

    assert exc_info.value.status_code == 400
