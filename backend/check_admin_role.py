"""
اسکریپت بررسی نقش کاربر admin در دیتابیس
"""

import asyncio
import sys
import io
from pathlib import Path

# Fix encoding for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

backend_root = Path(__file__).parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User


async def check_admin():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.username == "admin"))
        admin_user = result.scalar_one_or_none()
        
        if not admin_user:
            print("❌ کاربر admin در دیتابیس یافت نشد!")
            return
        
        print("=" * 60)
        print("اطلاعات کاربر admin:")
        print("=" * 60)
        print(f"Username: {admin_user.username}")
        print(f"User Code: {admin_user.user_code}")
        print(f"Roles (raw): '{admin_user.roles}'")
        print(f"Roles (type): {type(admin_user.roles)}")
        print(f"Is Active: {admin_user.is_active}")
        
        # Parse roles
        roles_str = admin_user.roles or ""
        roles_list = [r.strip() for r in roles_str.split(",") if r.strip()] if roles_str else []
        print(f"Roles (parsed): {roles_list}")
        
        # Check if SUPER_ADMIN is present
        has_super_admin = "SUPER_ADMIN" in roles_list or roles_str.strip() == "SUPER_ADMIN"
        print(f"\nHas SUPER_ADMIN role: {has_super_admin}")
        
        if has_super_admin:
            print("✅ کاربر admin نقش SUPER_ADMIN دارد.")
        else:
            print("❌ کاربر admin نقش SUPER_ADMIN ندارد!")
            print(f"   نقش فعلی: '{admin_user.roles}'")
            print("\nبرای اصلاح، اسکریپت create_demo_users.py را اجرا کنید.")


if __name__ == "__main__":
    try:
        asyncio.run(check_admin())
    except Exception as e:
        print(f"خطا: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
