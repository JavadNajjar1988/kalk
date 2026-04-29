from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class OfflineMapBase(BaseModel):
    name: str
    description: Optional[str] = None


class OfflineMapCreate(OfflineMapBase):
    pass


class OfflineMapUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class OfflineMapResponse(OfflineMapBase):
    id: int
    filename: str
    file_path: str
    storage_type: str
    is_active: bool
    file_size: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    url_template: str
    minzoom: Optional[int] = None
    maxzoom: Optional[int] = None

    class Config:
        from_attributes = True


class OfflineMapListResponse(BaseModel):
    maps: list[OfflineMapResponse]
    total: int


class OfflineMapFolderRegister(BaseModel):
    name: str
    folder: str
    description: Optional[str] = None


class FilesystemFolderInfo(BaseModel):
    label: str
    folder: str
    relative_path: str
    approx_tile_count: Optional[int] = None


class FilesystemFolderListResponse(BaseModel):
    root: str
    entries: list[FilesystemFolderInfo]


# ---- Tile Roots (admin-managed) ---------------------------------------------

class TileRootCreate(BaseModel):
    label: str
    path: str

class TileRootResponse(BaseModel):
    id: int
    label: str
    path: str
    is_active: bool
    valid: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TileRootListResponse(BaseModel):
    items: list[TileRootResponse]
