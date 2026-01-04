"""Password policy validation"""
import re
from typing import Tuple

from app.core.config import settings


def validate_password(password: str) -> Tuple[bool, str]:
    """
    Validate password against policy.
    Returns (is_valid, error_message)
    """
    if len(password) < settings.MIN_PASSWORD_LENGTH:
        return False, f"رمز عبور باید حداقل {settings.MIN_PASSWORD_LENGTH} کاراکتر باشد"
    
    if not settings.REQUIRE_PASSWORD_COMPLEXITY:
        return True, ""
    
    # Check complexity requirements
    has_upper = bool(re.search(r'[A-Z]', password))
    has_lower = bool(re.search(r'[a-z]', password))
    has_digit = bool(re.search(r'\d', password))
    
    missing = []
    if not has_upper:
        missing.append("حرف بزرگ")
    if not has_lower:
        missing.append("حرف کوچک")
    if not has_digit:
        missing.append("عدد")
    
    if missing:
        return False, f"رمز عبور باید شامل {', '.join(missing)} باشد"
    
    return True, ""

