from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class SDIServerBase(BaseModel):
    name: str
    base_url: str
    service_types: List[str] = []
    auth_type: str = "none"
    auth_config: Optional[dict] = None


class SDIServerCreate(SDIServerBase):
    pass


class SDIServerUpdate(BaseModel):
    name: Optional[str] = None
    base_url: Optional[str] = None
    service_types: Optional[List[str]] = None
    auth_type: Optional[str] = None
    auth_config: Optional[dict] = None
    status: Optional[str] = None


class SDIServerResponse(SDIServerBase):
    id: int
    last_sync_at: Optional[datetime] = None
    status: str = "active"
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SDIServerListResponse(BaseModel):
    servers: list[SDIServerResponse]


class SDIMapBase(BaseModel):
    title: str
    description: Optional[str] = None
    source_type: str
    url_or_path: str
    layer_name: Optional[str] = None
    format: Optional[str] = None
    srs: Optional[str] = "EPSG:3857"
    minzoom: Optional[int] = None
    maxzoom: Optional[int] = None
    bbox: Optional[list[float]] = None
    version: Optional[str] = None
    roles: Optional[list[str]] = None
    category: Optional[str] = None
    extra_metadata: Optional[dict[str, Any]] = None


class SDIMapCreate(SDIMapBase):
    server_id: Optional[int] = None
    status: str = "draft"


class SDIMapUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    source_type: Optional[str] = None
    url_or_path: Optional[str] = None
    layer_name: Optional[str] = None
    format: Optional[str] = None
    srs: Optional[str] = None
    minzoom: Optional[int] = None
    maxzoom: Optional[int] = None
    bbox: Optional[list[float]] = None
    version: Optional[str] = None
    hash: Optional[str] = None
    status: Optional[str] = None
    roles: Optional[list[str]] = None
    category: Optional[str] = None
    extra_metadata: Optional[dict[str, Any]] = None


class SDIMapResponse(SDIMapBase):
    id: int
    server_id: Optional[int] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SDIMapListResponse(BaseModel):
    maps: list[SDIMapResponse]
    total: int


class SDIJobResponse(BaseModel):
    id: int
    type: str
    server_id: Optional[int] = None
    map_ids: Optional[list[int]] = None
    status: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    logs: Optional[list[str]] = None
    error: Optional[str] = None
    created_at: datetime
