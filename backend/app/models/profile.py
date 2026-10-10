import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, SmallInteger, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base
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


def _enum_column(enum_cls, **kwargs):
    """
    A VARCHAR-backed enum column (native_enum=False) rather than a native
    Postgres ENUM type. This keeps adding/renaming options a simple data
    migration instead of an ALTER TYPE, and keeps the schema portable to
    SQLite for tests.
    """
    return SAEnum(
        enum_cls,
        native_enum=False,
        values_callable=lambda cls: [member.value for member in cls],
        validate_strings=True,
        **kwargs,
    )


class UserProfile(Base):
    """
    A person's self-reported profile, built up progressively across the
    onboarding flow. All personal-detail fields are nullable because the
    profile is saved incrementally as the person completes each step —
    validation of individual field values (when present) happens in the
    Pydantic schemas and is reinforced here with DB-level constraints.

    No eligibility logic lives on this model. Eligibility rules will be
    a separate system that reads from a profile like this one.
    """

    __tablename__ = "user_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # The account that owns this profile. Nullable only so profiles
    # created before accounts existed remain valid rows; every profile
    # created through the API now belongs to a user. Unique: one
    # profile per user.
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        unique=True,
        index=True,
    )
    user: Mapped["User | None"] = relationship(back_populates="profile")  # noqa: F821

    name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    age: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)

    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)
    area_type: Mapped[str | None] = mapped_column(_enum_column(AreaType), nullable=True)

    gender: Mapped[str | None] = mapped_column(_enum_column(Gender), nullable=True)

    education_level: Mapped[str | None] = mapped_column(_enum_column(EducationLevel), nullable=True)
    course: Mapped[str | None] = mapped_column(String(200), nullable=True)
    year_of_study: Mapped[str | None] = mapped_column(_enum_column(YearOfStudy), nullable=True)
    institution_type: Mapped[str | None] = mapped_column(_enum_column(InstitutionType), nullable=True)

    annual_family_income: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    employment_status: Mapped[str | None] = mapped_column(_enum_column(EmploymentStatus), nullable=True)
    occupation: Mapped[str | None] = mapped_column(String(200), nullable=True)

    social_category: Mapped[str | None] = mapped_column(_enum_column(SocialCategory), nullable=True)
    bpl_status: Mapped[str | None] = mapped_column(_enum_column(BplStatus), nullable=True)
    disability_status: Mapped[str | None] = mapped_column(_enum_column(DisabilityStatus), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint("age IS NULL OR age >= 0", name="ck_user_profiles_age_non_negative"),
        CheckConstraint("age IS NULL OR age <= 120", name="ck_user_profiles_age_reasonable"),
        CheckConstraint(
            "annual_family_income IS NULL OR annual_family_income >= 0",
            name="ck_user_profiles_income_non_negative",
        ),
        CheckConstraint(
            "state IS NULL OR trim(state) <> ''", name="ck_user_profiles_state_not_blank"
        ),
        CheckConstraint(
            "district IS NULL OR trim(district) <> ''", name="ck_user_profiles_district_not_blank"
        ),
        CheckConstraint(
            "name IS NULL OR trim(name) <> ''", name="ck_user_profiles_name_not_blank"
        ),
        CheckConstraint(
            "occupation IS NULL OR trim(occupation) <> ''", name="ck_user_profiles_occupation_not_blank"
        ),
    )