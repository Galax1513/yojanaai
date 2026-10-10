import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models.enums import (
    AreaType,
    BplStatus,
    DisabilityStatus,
    EducationLevel,
    EmploymentStatus,
    Gender,
    InstitutionType,
    SocialCategory,
    YearOfStudy,
)


def _reject_blank(value: str | None) -> str | None:
    if value is not None and value.strip() == "":
        raise ValueError("must not be blank")
    return value


class ProfileBase(BaseModel):
    """
    Fields shared by create and update. Everything is optional because
    the profile is built up progressively across onboarding steps — but
    any field that IS supplied is validated.
    """

    name: str | None = Field(default=None, max_length=200)
    age: int | None = Field(default=None, ge=0, le=120)

    state: str | None = Field(default=None, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    area_type: AreaType | None = None

    gender: Gender | None = None

    education_level: EducationLevel | None = None
    course: str | None = Field(default=None, max_length=200)
    year_of_study: YearOfStudy | None = None
    institution_type: InstitutionType | None = None

    annual_family_income: float | None = Field(default=None, ge=0)
    employment_status: EmploymentStatus | None = None
    occupation: str | None = Field(default=None, max_length=200)

    social_category: SocialCategory | None = None
    bpl_status: BplStatus | None = None
    disability_status: DisabilityStatus | None = None

    _validate_name = field_validator("name")(_reject_blank)
    _validate_state = field_validator("state")(_reject_blank)
    _validate_district = field_validator("district")(_reject_blank)
    _validate_occupation = field_validator("occupation")(_reject_blank)


class ProfileCreate(ProfileBase):
    """Body for POST /api/profiles. All fields optional — the person may
    still be on step one when the profile row is first created."""


class ProfileUpdate(ProfileBase):
    """Body for PUT /api/profiles/{id}. Same shape as create — every
    field is optional so a single step's answers can be saved without
    resending the whole profile."""


class ProfileRead(ProfileBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProfileWithCompleteness(BaseModel):
    """
    The response shape for every profile endpoint. profile_completeness
    is always computed server-side (see app/services/profile_completeness.py)
    — the frontend never invents this number.
    """

    profile: ProfileRead
    profile_completeness: int