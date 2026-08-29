from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Text,
    ForeignKey,
    JSON,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class SDIServer(Base):
    __tablename__ = "sdi_servers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    base_url = Column(String(512), nullable=False)
    service_types = Column(JSON, nullable=False, default=list)
    auth_type = Column(String(32), nullable=False, default="none")
    auth_config = Column(JSON, nullable=True)
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(32), nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    maps = relationship("SDIMap", back_populates="server")


class SDIMap(Base):
    __tablename__ = "sdi_maps"

    id = Column(Integer, primary_key=True, index=True)
    server_id = Column(Integer, ForeignKey("sdi_servers.id"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    source_type = Column(String(64), nullable=False)
    url_or_path = Column(String(1024), nullable=False)
    layer_name = Column(String(512), nullable=True)
    format = Column(String(32), nullable=True)
    srs = Column(String(64), nullable=True, default="EPSG:3857")
    minzoom = Column(Integer, nullable=True)
    maxzoom = Column(Integer, nullable=True)
    bbox = Column(JSON, nullable=True)
    version = Column(String(64), nullable=True)
    hash = Column(String(128), nullable=True)
    status = Column(String(32), nullable=False, default="draft")
    roles = Column(JSON, nullable=True)
    scenario_ids = Column(JSON, nullable=False, default=list)
    category = Column(String(128), nullable=True)
    extra_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    server = relationship("SDIServer", back_populates="maps")


class SDIJob(Base):
    __tablename__ = "sdi_jobs"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(32), nullable=False)
    server_id = Column(Integer, ForeignKey("sdi_servers.id"), nullable=True)
    map_ids = Column(JSON, nullable=True)
    status = Column(String(32), nullable=False, default="running")
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    logs = Column(JSON, nullable=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

