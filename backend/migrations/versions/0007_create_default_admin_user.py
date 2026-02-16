"""create default admin user

Revision ID: 0007_create_default_admin_user
Revises: 0006_extend_users_table
Create Date: 2025-11-25 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from datetime import datetime, timezone
import uuid
import os
import sys

# Add backend root to path to import app modules
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.abspath(os.path.join(current_dir, os.pardir, os.pardir))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from app.core.security import get_password_hash
from app.core.config import settings


# revision identifiers, used by Alembic.
revision = "0007_create_default_admin_user"
down_revision = "0006_extend_users_table"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Create default admin user if it doesn't exist.
    Default password is from ADMIN_BOOTSTRAP_PASSWORD env var or 'admin123'.
    """
    # Check if admin user already exists
    connection = op.get_bind()
    result = connection.execute(
        text("SELECT id FROM users WHERE username = 'admin' LIMIT 1")
    )
    existing_admin = result.fetchone()
    
    if existing_admin:
        # Admin already exists, skip creation
        print("Admin user already exists, skipping creation.")
        return
    
    # Get admin password from settings (reads from env or defaults to 'admin123')
    admin_password = settings.ADMIN_BOOTSTRAP_PASSWORD
    
    # Hash the password using the same method as the app
    password_hash = get_password_hash(admin_password)
    
    # Generate UUID for admin user
    admin_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    # Prepare JSON data for profile fields
    personal_info = '{"fullName": "مدیر سیستم", "nationality": "ایرانی", "gender": "نامشخص"}'
    contact_info = '{"email": "admin@example.com"}'
    professional_info = '{"status": "نظامی", "details": {}}'
    system_info = f'{{"role": "مدیر سیستم", "accessLevel": "سطح 1 - دسترسی کامل", "permissions": ["مدیریت کاربران", "مدیریت سیستم"], "loginCount": 0, "passwordLastChanged": "{now.isoformat()}"}}'
    
    # Create admin user with complete profile data
    connection.execute(
        text("""
            INSERT INTO users (
                id, username, user_code, password_hash, roles, is_active,
                personal_info, contact_info, professional_info, system_info,
                created_at, updated_at
            ) VALUES (
                :id, :username, :user_code, :password_hash, :roles, :is_active,
                CAST(:personal_info AS jsonb), CAST(:contact_info AS jsonb), CAST(:professional_info AS jsonb), CAST(:system_info AS jsonb),
                :created_at, :updated_at
            )
        """),
        {
            "id": admin_id,
            "username": "admin",
            "user_code": "USR-ADMIN",
            "password_hash": password_hash,
            "roles": "SUPER_ADMIN",
            "is_active": True,
            "personal_info": personal_info,
            "contact_info": contact_info,
            "professional_info": professional_info,
            "system_info": system_info,
            "created_at": now,
            "updated_at": now,
        }
    )
    print("Default admin user created successfully.")
    print(f"Username: admin")
    print(f"Password: {admin_password}")
    print("⚠️  Please change the password after first login!")


def downgrade() -> None:
    """
    Remove default admin user (only if it's the default one).
    Be careful: this will delete the admin user!
    """
    connection = op.get_bind()
    result = connection.execute(
        text("DELETE FROM users WHERE username = 'admin' AND user_code = 'USR-ADMIN'")
    )
    print(f"Deleted {result.rowcount} admin user(s).")

