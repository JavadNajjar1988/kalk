from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import uuid4

from sqlalchemy import JSON, DateTime, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

JSONType = JSONB().with_variant(JSON(), "sqlite")


class UserAuditLog(Base):
    __tablename__ = "user_audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    target_user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    actor_user_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    actor_username: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    action: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    before_state: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONType, nullable=True)
    after_state: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONType, nullable=True)
    client_ip: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    request_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
