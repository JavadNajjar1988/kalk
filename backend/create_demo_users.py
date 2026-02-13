"""
اسکریپت ساخت کاربران دمو برای تست سطوح دسترسی

سه کاربر زیر را ایجاد/به‌روزرسانی می‌کند:
1) admin      → SUPER_ADMIN (اگر قبلاً وجود داشته باشد فقط رمز را در صورت نیاز به‌روزرسانی می‌کند)
2) commander1 → COMMANDER
3) viewer1    → VIEWER

نحوه اجرا (از روت backend):
    python create_demo_users.py
"""

import asyncio
import sys
from pathlib import Path

# اضافه کردن مسیر backend به sys.path
backend_root = Path(__file__).parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from datetime import datetime, timezone
from typing import Any, Dict

from sqlalchemy import select

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import AsyncSessionLocal
from app.models.user import User


async def _upsert_user(
    username: str,
    user_code: str,
    plain_password: str,
    roles: str,
    personal_info: Dict[str, Any],
    contact_info: Dict[str, Any],
    professional_info: Dict[str, Any],
    system_info: Dict[str, Any],
) -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.username == username))
        user = result.scalar_one_or_none()
        now = datetime.now(timezone.utc)

        password_hash = get_password_hash(plain_password)

        if user:
            # به‌روزرسانی کاربر موجود
            print(f"[UPDATE] Updating existing user '{username}'...")
            user.user_code = user_code
            user.password_hash = password_hash
            user.roles = roles
            user.personal_info = personal_info
            user.contact_info = contact_info
            user.professional_info = professional_info
            user.system_info = {
                **(user.system_info or {}),
                **system_info,
                "passwordLastChanged": now.isoformat(),
            }
            user.is_active = True
            user.updated_at = now
        else:
            print(f"[CREATE] Creating new user '{username}'...")
            user = User(
                username=username,
                user_code=user_code,
                password_hash=password_hash,
                roles=roles,
                personal_info=personal_info,
                contact_info=contact_info,
                professional_info=professional_info,
                system_info={
                    **system_info,
                    "passwordLastChanged": now.isoformat(),
                },
                is_active=True,
            )
            db.add(user)

        await db.commit()
        print(f"[OK] User '{username}' with roles '{roles}' is ready.")


async def main() -> None:
    print("=" * 60)
    print("Creating demo users for testing...")
    print("=" * 60)
    
    # 1) Admin (SUPER_ADMIN) - از رمز پیکربندی‌شده استفاده می‌کنیم
    admin_password = settings.ADMIN_BOOTSTRAP_PASSWORD
    print(f"\n1. Admin user (SUPER_ADMIN)")
    print(f"   Username: admin")
    print(f"   Password: {admin_password}")
    await _upsert_user(
        username="admin",
        user_code="USR-ADMIN",
        plain_password=admin_password,
        roles="SUPER_ADMIN",
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
        },
    )

    # 2) فرمانده (COMMANDER)
    print(f"\n2. Commander user (COMMANDER)")
    print(f"   Username: commander1")
    print(f"   Password: Commander@1234")
    await _upsert_user(
        username="commander1",
        user_code="USR-COMMANDER-1",
        plain_password="Commander@1234",
        roles="COMMANDER",
        personal_info={
            "fullName": "کاربر فرمانده",
            "nationality": "ایرانی",
            "gender": "نامشخص",
        },
        contact_info={"email": "commander1@example.com"},
        professional_info={"status": "نظامی", "details": {}},
        system_info={
            "role": "فرمانده",
            "accessLevel": "سطح 2 - دسترسی عملیاتی",
            "permissions": ["مشاهده کاربران", "مشاهده داده‌ها", "اجرای سناریوها"],
            "loginCount": 0,
        },
    )

    # 3) ناظر مهمان (VIEWER)
    print(f"\n3. Viewer user (VIEWER)")
    print(f"   Username: viewer1")
    print(f"   Password: Viewer@1234")
    await _upsert_user(
        username="viewer1",
        user_code="USR-VIEWER-1",
        plain_password="Viewer@1234",
        roles="VIEWER",
        personal_info={
            "fullName": "ناظر مهمان",
            "nationality": "ایرانی",
            "gender": "نامشخص",
        },
        contact_info={"email": "viewer1@example.com"},
        professional_info={"status": "غیرنظامی", "details": {}},
        system_info={
            "role": "ناظر مهمان",
            "accessLevel": "سطح 4 - دسترسی مهمان",
            "permissions": ["مشاهده داشبورد", "مشاهده داده‌ها"],
            "loginCount": 0,
        },
    )
    
    print("\n" + "=" * 60)
    print("All demo users created successfully!")
    print("=" * 60)
    print("\nYou can now login with:")
    print("  - admin / <ADMIN_BOOTSTRAP_PASSWORD>")
    print("  - commander1 / Commander@1234")
    print("  - viewer1 / Viewer@1234")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"\n[ERROR] Failed to create users: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
