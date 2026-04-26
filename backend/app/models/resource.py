from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


JSONType = JSONB().with_variant(JSON(), "sqlite")


class Resource(Base):
    """منبع عمومی مدیریت منابع (پرسنل/تجهیزات/مهمات/پشتیبانی/درجات/نقشه).

    metadata_ ستون JSONB است که فیلدهای اختصاصی هر نوع منبع را نگه می‌دارد
    (مانند فیلدهای PersonnelItem، EquipmentItem و … در داشبورد).
    """

    __tablename__ = "resources"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    code: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    metadata_: Mapped[Optional[dict]] = mapped_column(
        "metadata", JSONType, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    media_files: Mapped[list["ResourceMedia"]] = relationship(
        "ResourceMedia",
        back_populates="resource",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ResourceMedia(Base):
    """فایل‌های مدیا (تصویر/سند) منتسب به یک منبع."""

    __tablename__ = "resource_media"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    resource_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        ForeignKey("resources.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    content_type: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    caption: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    credits: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    credits_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    resource: Mapped[Optional[Resource]] = relationship(
        "Resource", back_populates="media_files"
    )
