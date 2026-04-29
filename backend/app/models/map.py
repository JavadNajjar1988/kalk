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
    storage_type = Column(String(32), nullable=False, default="mbtiles")
    is_active = Column(Boolean, default=False)
    file_size = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<OfflineMap(id={self.id}, name='{self.name}', active={self.is_active})>"


class TileRoot(Base):
    """Admin-managed allowed root paths for filesystem tile folders."""
    __tablename__ = "tile_roots"

    id = Column(Integer, primary_key=True, index=True)
    label = Column(String(255), nullable=False)
    path = Column(String(1000), nullable=False, unique=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<TileRoot(id={self.id}, label='{self.label}', path='{self.path}')>"
