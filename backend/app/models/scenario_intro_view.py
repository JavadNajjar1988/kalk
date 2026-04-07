from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ScenarioIntroView(Base):
    """Tracks per-user intro video completion for a scenario."""

    __tablename__ = "scenario_intro_views"
    __table_args__ = (UniqueConstraint("user_id", "scenario_id", name="uq_scenario_intro_user_scenario"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    scenario_id: Mapped[str] = mapped_column(
        String(128), ForeignKey("scenarios.id", ondelete="CASCADE"), nullable=False, index=True
    )
    seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    never_show_again: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
