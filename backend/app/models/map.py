from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from app.db.base import Base


class OfflineMap(Base):
    __tablename__ = "offline_maps"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=False)
    file_size = Column(Integer, nullable=True)  # اندازه فایل به بایت
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<OfflineMap(id={self.id}, name='{self.name}', active={self.is_active})>"
