from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Scenario(Base):
    __tablename__ = "scenarios"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)
    image: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    modified: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    content: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)


