from typing import Optional

from pydantic import BaseModel, Field


class DashboardHeaderEntryCreate(BaseModel):
    quoteText: str = Field(min_length=1, max_length=4000)
    personName: str = Field(min_length=1, max_length=255)
    personPosition: str = Field(min_length=1, max_length=255)
    personImage: Optional[str] = Field(default=None, max_length=500)
    enabled: Optional[bool] = None


class DashboardHeaderEntryUpdate(BaseModel):
    quoteText: Optional[str] = Field(default=None, min_length=1, max_length=4000)
    personName: Optional[str] = Field(default=None, min_length=1, max_length=255)
    personPosition: Optional[str] = Field(default=None, min_length=1, max_length=255)
    personImage: Optional[str] = Field(default=None, max_length=500)
    enabled: Optional[bool] = None


class DashboardHeaderSettingsUpdate(BaseModel):
    enabled: Optional[bool] = None
    activeEntryId: Optional[int] = None
