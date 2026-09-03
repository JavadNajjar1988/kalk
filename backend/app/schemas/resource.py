from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


# انواع منبع پشتیبانی‌شده مطابق تب‌های مدیریت منابع داشبورد
RESOURCE_TYPES = (
    "personnel",
    "equipment",
    "units",
    "ammunition",
    "logistics",
    "ranks",
    "maps",
)


class ResourceMediaResponse(BaseModel):
    id: str
    resource_id: Optional[str] = None
    filename: str
    content_type: Optional[str] = None
    file_size: Optional[int] = None
    caption: Optional[str] = None
    credits: Optional[str] = None
    credits_url: Optional[str] = None
    url: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResourceMediaUpdate(BaseModel):
    caption: Optional[str] = None
    credits: Optional[str] = None
    credits_url: Optional[str] = None
    resource_id: Optional[str] = None


class ResourceBase(BaseModel):
    type: str
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    metadata: Optional[dict[str, Any]] = Field(default=None)


class ResourceCreate(ResourceBase):
    id: Optional[str] = None


class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None


class ResourceResponse(ResourceBase):
    id: str
    created_at: datetime
    updated_at: datetime
    media_files: list[ResourceMediaResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ResourceListResponse(BaseModel):
    items: list[ResourceResponse]
    total: int


class ResourceSearchResult(BaseModel):
    id: str
    type: str
    name: str
    code: Optional[str] = None
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ResourceBulkImportItem(BaseModel):
    """ساختار ردیف برگشتی از parse_resources_workbook (فاز ایمپورت اکسل)."""

    type: str
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None


class ResourceBulkImportRequest(BaseModel):
    items: list[ResourceBulkImportItem]


class ResourceBulkImportResponse(BaseModel):
    created: int
    updated: int
    skipped: int


class UnitResourceLinkAssignment(BaseModel):
    scenario_id: str
    unit_id: str
    resource_id: str


class UnitResourceLinkRequest(BaseModel):
    assignments: list[UnitResourceLinkAssignment]


class LegacyResourceLinkAssignment(BaseModel):
    scenario_id: str
    occurrence_key: str
    resource_id: str


class LegacyResourceLinkRequest(BaseModel):
    assignments: list[LegacyResourceLinkAssignment]
