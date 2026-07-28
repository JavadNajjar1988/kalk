from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class ScenarioBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    image: Optional[str] = Field(default=None, max_length=500)
    intro_video_url: Optional[str] = Field(default=None, max_length=2000)
    intro_title: Optional[str] = Field(default=None, max_length=300)
    intro_summary: Optional[str] = Field(default=None, max_length=8000)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    content: Optional[dict] = None

    @field_validator("start_time", "end_time")
    @classmethod
    def normalize_schedule_to_utc(cls, value: Optional[datetime]) -> Optional[datetime]:
        if value is None:
            return None
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Scenario dates must include a timezone offset")
        return value.astimezone(timezone.utc)


class ScenarioCreate(ScenarioBase):
    pass


class ScenarioUpdate(BaseModel):
    expected_modified: Optional[datetime] = None
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    image: Optional[str] = Field(default=None, max_length=500)
    intro_video_url: Optional[str] = Field(default=None, max_length=2000)
    intro_title: Optional[str] = Field(default=None, max_length=300)
    intro_summary: Optional[str] = Field(default=None, max_length=8000)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    content: Optional[dict] = None

    @field_validator("expected_modified", "start_time", "end_time")
    @classmethod
    def normalize_schedule_to_utc(cls, value: Optional[datetime]) -> Optional[datetime]:
        if value is None:
            return None
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Scenario dates must include a timezone offset")
        return value.astimezone(timezone.utc)


class ScenarioOut(ScenarioBase):
    id: str
    archived_at: Optional[datetime] = None
    created: datetime
    modified: datetime

    class Config:
        from_attributes = True


