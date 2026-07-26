from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class SocialNetwork(BaseModel):
    platform: str = Field(..., min_length=1, max_length=100)
    username: str = Field(..., min_length=1, max_length=150)


class PersonalInfo(BaseModel):
    fullName: str = Field(..., min_length=1, max_length=200)
    avatar: Optional[str] = Field(default=None, max_length=32)
    fullNameEn: Optional[str] = Field(default=None, max_length=200)
    fatherName: Optional[str] = Field(default=None, max_length=200)
    nationalId: Optional[str] = Field(default=None, max_length=50)
    nationality: Optional[str] = Field(default=None, max_length=100)
    birthDate: Optional[str] = None
    gender: Optional[str] = Field(default=None, max_length=20)
    birthPlace: Optional[str] = Field(default=None, max_length=200)
    maritalStatus: Optional[str] = Field(default=None, max_length=50)


class ContactInfo(BaseModel):
    landline: Optional[str] = Field(default=None, max_length=30)
    mobile: list[str] = Field(default_factory=list)
    addresses: Optional[str] = Field(default=None, max_length=500)
    email: Optional[str] = Field(default=None, max_length=200)
    postalCode: Optional[str] = Field(default=None, max_length=20)
    socialNetworks: list[SocialNetwork] = Field(default_factory=list)


class ProfessionalInfo(BaseModel):
    status: Literal["آزاد", "نظامی", "غیرنظامی"] = "آزاد"
    details: dict[str, Any] = Field(default_factory=dict)


class SystemInfo(BaseModel):
    role: str = Field(..., min_length=1, max_length=100)
    accessLevel: str = Field(..., min_length=1, max_length=100)
    permissions: list[str] = Field(default_factory=list)
    lastLogin: Optional[str] = None
    loginCount: int = 0
    password: Optional[str] = Field(default=None, min_length=4)
    passwordLastChanged: Optional[str] = None


class UserBase(BaseModel):
    userCode: str = Field(..., min_length=3, max_length=64)
    personalInfo: PersonalInfo
    contactInfo: ContactInfo
    professionalInfo: ProfessionalInfo
    systemInfo: SystemInfo
    isActive: bool = True


class UserCreate(UserBase):
    username: Optional[str] = Field(default=None, min_length=3, max_length=150)


class UserUpdate(BaseModel):
    expectedVersion: int = Field(..., ge=1)
    userCode: Optional[str] = Field(default=None, min_length=3, max_length=64)
    personalInfo: Optional[dict[str, Any]] = None
    contactInfo: Optional[dict[str, Any]] = None
    professionalInfo: Optional[dict[str, Any]] = None
    systemInfo: Optional[dict[str, Any]] = None
    isActive: Optional[bool] = None


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    version: int
    deletedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime


class LookupItem(BaseModel):
    id: str
    name: str


class UserListResponse(BaseModel):
    items: list[UserOut]
    total: int
    roles: list[LookupItem] = Field(default_factory=list)
    accessLevels: list[LookupItem] = Field(default_factory=list)


class QuickActionPayload(BaseModel):
    userId: str
    expectedVersion: int = Field(..., ge=1)
    action: Literal["toggleActive", "changePassword", "updateAccessLevel"]
    data: dict[str, Any] | None = None
