import datetime as dt
from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr


class Status(str, Enum):
    lead = "lead"
    applied = "applied"
    interviewing = "interviewing"
    offer = "offer"
    rejected = "rejected"
    withdrawn = "withdrawn"
    declined = "declined"


# --- Auth ---


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    created_at: dt.datetime


# --- API tokens ---


class ApiTokenCreateRequest(BaseModel):
    name: str


class ApiTokenCreateResponse(BaseModel):
    id: int
    name: str
    token: str
    created_at: dt.datetime


class ApiTokenResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    created_at: dt.datetime
    last_used_at: dt.datetime | None


# --- Applications ---


class ApplicationBase(BaseModel):
    company: str
    role: str
    source: str | None = None
    recruiter: str | None = None
    location: str | None = None
    salary: str | None = None
    cv_variant: str | None = None
    url: str | None = None
    status: Status = Status.lead
    date_applied: dt.date | None = None
    next_action: str | None = None
    next_followup: dt.date | None = None
    notes: str | None = None


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(BaseModel):
    company: str | None = None
    role: str | None = None
    source: str | None = None
    recruiter: str | None = None
    location: str | None = None
    salary: str | None = None
    cv_variant: str | None = None
    url: str | None = None
    status: Status | None = None
    date_applied: dt.date | None = None
    next_action: str | None = None
    next_followup: dt.date | None = None
    notes: str | None = None


class ApplicationResponse(ApplicationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: dt.datetime
    updated_at: dt.datetime


class StatusHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    application_id: int
    status: Status
    changed_at: dt.datetime


# --- Import ---


class ImportExtracted(BaseModel):
    company: str | None = None
    role: str | None = None
    location: str | None = None
    salary: str | None = None
    description: str | None = None


class ImportLinkRequest(BaseModel):
    url: str
    extracted: ImportExtracted | None = None


class ImportLinkResponse(BaseModel):
    company: str | None = None
    role: str | None = None
    location: str | None = None
    salary: str | None = None
    description: str | None = None
    source: str | None = None
    url: str


# --- Analytics ---


class SummaryResponse(BaseModel):
    total: int
    active: int
    by_status: dict[str, int]


class FunnelStage(BaseModel):
    stage: str
    count: int


class SourceStat(BaseModel):
    source: str
    total: int
    interviews_or_better: int
    conversion_rate: float


class TimelinePoint(BaseModel):
    week_start: dt.date
    count: int


class ResponseTimeStat(BaseModel):
    transition: str
    avg_days: float


class CvVariantStat(BaseModel):
    cv_variant: str
    total: int
    interviews_or_better: int
    conversion_rate: float
