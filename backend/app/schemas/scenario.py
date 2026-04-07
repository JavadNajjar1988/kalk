from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ScenarioBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    image: Optional[str] = Field(default=None, max_length=500)
    intro_video_url: Optional[str] = Field(default=None, max_length=2000)
    intro_title: Optional[str] = Field(default=None, max_length=300)
    intro_summary: Optional[str] = Field(default=None, max_length=8000)
    content: Optional[dict] = None


class ScenarioCreate(ScenarioBase):
    pass


class ScenarioUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    image: Optional[str] = Field(default=None, max_length=500)
    intro_video_url: Optional[str] = Field(default=None, max_length=2000)
    intro_title: Optional[str] = Field(default=None, max_length=300)
    intro_summary: Optional[str] = Field(default=None, max_length=8000)
    content: Optional[dict] = None


class ScenarioOut(ScenarioBase):
    id: str
    archived_at: Optional[datetime] = None
    created: datetime
    modified: datetime

    class Config:
        from_attributes = True


