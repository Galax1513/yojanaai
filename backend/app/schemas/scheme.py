import uuid
from datetime import date, datetime

from pydantic import BaseModel

from app.models.enums import (
    DataStatus,
    DeadlineUrgency,
    SchemeCategory,
    SchemeLevel,
    SchemeStatus,
    SchemeType,
)
from app.schemas.support import SupportFacet


class RequiredDocumentRead(BaseModel):
    id: int
    name: str
    reason: str

    model_config = {"from_attributes": True}


class DataSourceRead(BaseModel):
    """
    Attribution info for where a scheme's data came from. Exposed so the
    frontend can show it honestly instead of implying every record is
    official — see is_official_government_source.
    """

    provider_name: str
    dataset_name: str
    license: str | None
    source_url: str | None
    is_official_government_source: bool

    model_config = {"from_attributes": True}


class SchemeListItem(BaseModel):
    """The shape used for GET /api/schemes — enough to render a scheme
    card without pulling the full detail payload."""

    id: uuid.UUID
    slug: str
    name: str
    short_title: str | None
    level: SchemeLevel | None
    ministry: str | None
    state: str | None
    category: SchemeCategory
    scheme_type: SchemeType
    summary: str
    benefit: str
    eligibility_summary: str
    deadline_label: str | None
    deadline_urgency: DeadlineUrgency | None
    status: SchemeStatus
    data_status: DataStatus

    model_config = {"from_attributes": True}


class SchemeRead(BaseModel):
    """The full record returned by GET /api/schemes/{id}."""

    id: uuid.UUID
    source_id: str | None
    slug: str
    name: str
    short_title: str | None

    level: SchemeLevel | None
    ministry: str | None
    department: str | None
    state: str | None

    category: SchemeCategory
    categories: list[str] | None
    tags: list[str] | None
    scheme_type: SchemeType

    summary: str
    description: str | None
    benefit: str
    benefits: str | None
    eligibility_summary: str
    who_can_apply: str

    documents_required_raw: str | None
    application_process: list[str]
    required_documents: list[RequiredDocumentRead]

    # Distinct URLs — see app/models/scheme.py. Never both assumed equal.
    official_source_url: str | None
    official_source_label: str | None
    official_application_url: str | None

    source_updated_at: datetime | None
    last_synced_at: datetime | None
    last_verified_at: datetime | None

    status: SchemeStatus
    data_status: DataStatus

    education_levels: list[str] | None
    max_annual_income: float | None

    deadline_label: str | None
    deadline_date: date | None
    deadline_urgency: DeadlineUrgency | None

    data_source: DataSourceRead | None

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SchemeListResponse(BaseModel):
    items: list[SchemeListItem]
    # Count after every filter, including the support category filter.
    total: int
    limit: int
    offset: int
    # Count after every filter EXCEPT the support category filter — what
    # "All support" would show. Equal to total when no support filter is set.
    unfiltered_total: int
    # Per-category counts over that same unfiltered set, so the UI can
    # show real numbers next to each option.
    support_facets: list[SupportFacet]
