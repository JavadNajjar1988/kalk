from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DashboardHeaderEntry(Base):
    __tablename__ = "dashboard_header_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    quote_text: Mapped[str] = mapped_column(Text, nullable=False)
    person_name: Mapped[str] = mapped_column(String(255), nullable=False)
    person_position: Mapped[str] = mapped_column(String(255), nullable=False)
    person_image: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
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


class DashboardHeaderConfig(Base):
    __tablename__ = "dashboard_header_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    active_entry_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("dashboard_header_entries.id", ondelete="SET NULL"),
        nullable=True,
    )
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
