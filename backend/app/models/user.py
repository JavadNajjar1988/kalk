from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _json_default() -> Dict[str, Any]:
    return {}


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    username: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    user_code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    roles: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # comma-separated roles
    personal_info: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False, default=_json_default)
    contact_info: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False, default=_json_default)
    professional_info: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False, default=_json_default)
    system_info: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False, default=_json_default)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    failed_login_count: Mapped[int] = mapped_column(default=0, nullable=False)
    locked_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_login_attempt: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=func.now(),
    )

    def touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)

