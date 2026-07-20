"""Rate limiting utilities for login endpoints"""
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Dict, Tuple
import asyncio

from app.core.config import settings

logger = None
try:
    import logging
    logger = logging.getLogger(__name__)
except:
    pass


class RateLimiter:
    """Simple in-memory rate limiter for login attempts"""
    
    def __init__(self):
        self._attempts: Dict[str, list[datetime]] = {}
        self._lock = asyncio.Lock()
    
    async def check_rate_limit(self, identifier: str, max_attempts: int, window_minutes: int) -> Tuple[bool, int]:
        """
        Check if identifier has exceeded rate limit.
        Returns (is_allowed, remaining_attempts)
        """
        async with self._lock:
            now = datetime.now(timezone.utc)
            window_start = now - timedelta(minutes=window_minutes)
            
            # Clean old attempts
            if identifier in self._attempts:
                self._attempts[identifier] = [
                    attempt for attempt in self._attempts[identifier]
                    if attempt > window_start
                ]
            
            # Count attempts in window
            attempts = self._attempts.get(identifier, [])
            count = len(attempts)
            
            if count >= max_attempts:
                return False, 0
            
            # Record this attempt
            if identifier not in self._attempts:
                self._attempts[identifier] = []
            self._attempts[identifier].append(now)
            
            remaining = max_attempts - (count + 1)
            return True, remaining
    
    async def reset(self, identifier: str):
        """Reset rate limit for an identifier"""
        async with self._lock:
            if identifier in self._attempts:
                del self._attempts[identifier]


# Global rate limiter instance
rate_limiter = RateLimiter()

