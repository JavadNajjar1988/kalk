"""update user roles to three levels

Revision ID: 0009_roles_three_levels
Revises: 0008_add_security_fields
Create Date: 2026-01-05 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
import json


# revision identifiers, used by Alembic.
revision = "0009_roles_three_levels"
down_revision = "0008_add_security_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Update existing user roles to the new three-level system:
    - SUPER_ADMIN (مدیر سیستم)
    - COMMANDER (فرمانده)
    - VIEWER (ناظر مهمان)
    
    Mapping:
    - Old roles "ADMIN" or "ADMIN,OPERATOR" → "SUPER_ADMIN"
    - Old roles "OPERATOR" → "COMMANDER"
    - Old roles "USER" or empty → "VIEWER"
    
    Also updates system_info.role:
    - "مدیر سیستم" → "مدیر سیستم" (stays the same)
    - "سرپرست", "اپراتور", "فرمانده" → "فرمانده"
    - "مهمان" → "ناظر مهمان"
    """
    connection = op.get_bind()
    
    # Get all users
    result = connection.execute(
        text("SELECT id, roles, system_info FROM users")
    )
    users = result.fetchall()
    
    updated_count = 0
    
    for user_id, old_roles, system_info in users:
        new_roles = None
        new_system_info = None
        needs_update = False
        
        # Update roles field
        if old_roles:
            # Normalize roles to avoid case-sensitivity bugs and preserve existing SUPER_ADMIN
            roles_list = [r.strip().upper() for r in old_roles.split(",") if r.strip()]

            # Map old/new roles to new roles
            if "SUPER_ADMIN" in roles_list or "ADMIN" in roles_list:
                new_roles = "SUPER_ADMIN"
                needs_update = True
            elif "COMMANDER" in roles_list or "OPERATOR" in roles_list:
                new_roles = "COMMANDER"
                needs_update = True
            elif "VIEWER" in roles_list or "USER" in roles_list:
                new_roles = "VIEWER"
                needs_update = True
            else:
                new_roles = "VIEWER"
                needs_update = True
        else:
            # Empty roles → VIEWER
            new_roles = "VIEWER"
            needs_update = True
        
        # Update system_info.role if it exists
        if system_info:
            try:
                system_info_dict = system_info if isinstance(system_info, dict) else json.loads(system_info)
                old_role = system_info_dict.get("role", "")
                
                role_mapping = {
                    "مدیر سیستم": "مدیر سیستم",  # Stays the same
                    "سرپرست": "فرمانده",
                    "اپراتور": "فرمانده",
                    "فرمانده": "فرمانده",  # Stays the same
                    "مهمان": "ناظر مهمان",
                    "تحلیلگر": "ناظر مهمان",  # Analyst → Viewer
                }
                
                if old_role in role_mapping:
                    new_role = role_mapping[old_role]
                    if new_role != old_role:
                        system_info_dict["role"] = new_role
                        new_system_info = json.dumps(system_info_dict, ensure_ascii=False)
                        needs_update = True
                    else:
                        new_system_info = json.dumps(system_info_dict, ensure_ascii=False) if not isinstance(system_info, dict) else None
                elif old_role:
                    # Unknown role → default to "ناظر مهمان"
                    system_info_dict["role"] = "ناظر مهمان"
                    new_system_info = json.dumps(system_info_dict, ensure_ascii=False)
                    needs_update = True
                else:
                    # No role set → set to "ناظر مهمان"
                    system_info_dict["role"] = "ناظر مهمان"
                    new_system_info = json.dumps(system_info_dict, ensure_ascii=False)
                    needs_update = True
            except (json.JSONDecodeError, TypeError):
                # Invalid JSON, create new system_info
                new_system_info = json.dumps({"role": "ناظر مهمان"}, ensure_ascii=False)
                needs_update = True
        else:
            # No system_info → create with default role
            new_system_info = json.dumps({"role": "ناظر مهمان"}, ensure_ascii=False)
            needs_update = True
        
        # Update user if needed
        if needs_update:
            if new_system_info:
                connection.execute(
                    text("""
                        UPDATE users 
                        SET roles = :new_roles,
                            system_info = :new_system_info::jsonb
                        WHERE id = :user_id
                    """),
                    {
                        "new_roles": new_roles,
                        "new_system_info": new_system_info,
                        "user_id": user_id
                    }
                )
            else:
                connection.execute(
                    text("""
                        UPDATE users 
                        SET roles = :new_roles
                        WHERE id = :user_id
                    """),
                    {
                        "new_roles": new_roles,
                        "user_id": user_id
                    }
                )
            updated_count += 1
    
    print(f"✅ Updated {updated_count} user(s) to new three-level role system:")
    print("   - SUPER_ADMIN (مدیر سیستم)")
    print("   - COMMANDER (فرمانده)")
    print("   - VIEWER (ناظر مهمان)")


def downgrade() -> None:
    """
    Revert role changes back to old system.
    Note: This is a best-effort revert and may not be 100% accurate.
    """
    connection = op.get_bind()
    
    # Get all users
    result = connection.execute(
        text("SELECT id, roles, system_info FROM users")
    )
    users = result.fetchall()
    
    updated_count = 0
    
    for user_id, current_roles, system_info in users:
        old_roles = None
        new_system_info = None
        needs_update = False
        
        # Revert roles field
        if current_roles == "SUPER_ADMIN":
            old_roles = "ADMIN,OPERATOR"
            needs_update = True
        elif current_roles == "COMMANDER":
            old_roles = "OPERATOR"
            needs_update = True
        elif current_roles == "VIEWER":
            old_roles = "USER"
            needs_update = True
        
        # Revert system_info.role
        if system_info:
            try:
                system_info_dict = system_info if isinstance(system_info, dict) else json.loads(system_info)
                current_role = system_info_dict.get("role", "")
                
                reverse_mapping = {
                    "مدیر سیستم": "مدیر سیستم",  # Stays the same
                    "فرمانده": "اپراتور",  # Default to اپراتور
                    "ناظر مهمان": "مهمان",
                }
                
                if current_role in reverse_mapping:
                    old_role = reverse_mapping[current_role]
                    if old_role != current_role:
                        system_info_dict["role"] = old_role
                        new_system_info = json.dumps(system_info_dict, ensure_ascii=False)
                        needs_update = True
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Update user if needed
        if needs_update:
            if new_system_info:
                connection.execute(
                    text("""
                        UPDATE users 
                        SET roles = :old_roles,
                            system_info = :new_system_info::jsonb
                        WHERE id = :user_id
                    """),
                    {
                        "old_roles": old_roles,
                        "new_system_info": new_system_info,
                        "user_id": user_id
                    }
                )
            else:
                connection.execute(
                    text("""
                        UPDATE users 
                        SET roles = :old_roles
                        WHERE id = :user_id
                    """),
                    {
                        "old_roles": old_roles,
                        "user_id": user_id
                    }
                )
            updated_count += 1
    
    print(f"Reverted {updated_count} user(s) to old role system.")

