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
