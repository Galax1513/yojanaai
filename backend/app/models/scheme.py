import uuid
from datetime import date, datetime

from sqlalchemy import (
    JSON,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Index,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.enums import (
    DataStatus,
    DeadlineUrgency,
    RuleOperator,
    RuleScope,
    RuleType,
    SchemeCategory,
    SchemeLevel,
    SchemeStatus,
    SchemeType,
    SyncRunStatus,
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


class DataSourceRegistry(Base):
    """
    A named data source YojanaAI's catalog was populated or synced from.

    This exists so provider/license/attribution text is stored ONCE per
    source and referenced by every scheme that came from it, rather than
    repeated (and risking drift) across thousands of scheme rows. It is
    also the explicit place to record that a bootstrap dataset is a
    third-party collection, NOT an official Government of India dataset
    — no scheme, page, or API response should claim otherwise; any such
    claim must trace back to what's recorded here.
    """

    __tablename__ = "data_source_registry"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # A short, stable machine identifier used by SchemeSyncRun and in
    # config (e.g. "bootstrap-dataset-v1"). Distinct from the
    # human-readable provider_name.
    key: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    provider_name: Mapped[str] = mapped_column(String(200), nullable=False)
    dataset_name: Mapped[str] = mapped_column(String(200), nullable=False)
    license: Mapped[str | None] = mapped_column(String(200), nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    collected_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    attribution: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Explicit, visible disclaimer — e.g. "Unofficial third-party
    # dataset; not published or endorsed by the Government of India.
    # Verify against the official source before relying on any single
    # record." Surfaced wherever this source's schemes are attributed.
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_official_government_source: Mapped[bool] = mapped_column(default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    schemes: Mapped[list["Scheme"]] = relationship(back_populates="data_source")
    sync_runs: Mapped[list["SchemeSyncRun"]] = relationship(back_populates="data_source")


class Scheme(Base):
    """
    A government scheme or scholarship record.

    IMPORTANT: this model describes a scheme's *published* information
    only. It never stores eligibility logic — whether a given person
    qualifies is the job of the separate eligibility rules engine
    (see EligibilityRule below), which is not implemented yet. Every
    record is tagged with `data_status`; only "verified" records should
    ever be presented to a real user as authoritative government
    information, and `data_source` records exactly which third-party or
    official collection a record came from.
    """

    __tablename__ = "schemes"

    # Internal surrogate key. Decoupled from the source's own identifier
    # (source_id) and from the human-readable slug, since a bulk import
    # of thousands of records from a third-party source shouldn't have
    # our primary key depend on that source's own ID scheme.
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # The source dataset's own identifier for this record, if it has
    # one. Combined with data_source_id, this is the de-duplication key
    # during import — see UniqueConstraint below.
    source_id: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Stable, readable, URL-safe identifier — what routes and links use.
    slug: Mapped[str] = mapped_column(String(160), nullable=False, unique=True)

    name: Mapped[str] = mapped_column(String(400), nullable=False)
    short_title: Mapped[str | None] = mapped_column(String(150), nullable=True)

    level: Mapped[str | None] = mapped_column(_enum_column(SchemeLevel), nullable=True)
    ministry: Mapped[str | None] = mapped_column(String(200), nullable=True)
    department: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # `state`: NULL/None means central/all-India in scope. A specific
    # state name means the scheme is scoped to that state.
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Primary category, kept as a constrained enum for the filters the
    # UI already relies on. `categories`/`tags` hold the source's own,
    # less constrained classification without forcing everything into
    # one enum value.
    category: Mapped[str] = mapped_column(_enum_column(SchemeCategory), nullable=False)
    categories: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    tags: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    scheme_type: Mapped[str] = mapped_column(_enum_column(SchemeType), nullable=False)

    summary: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # `benefit`: short display string for cards (e.g. "₹50,000/year").
    # `benefits`: longer free-text benefits description from the source.
    benefit: Mapped[str] = mapped_column(String(300), nullable=False)
    benefits: Mapped[str | None] = mapped_column(Text, nullable=True)

    eligibility_summary: Mapped[str] = mapped_column(Text, nullable=False)
    who_can_apply: Mapped[str] = mapped_column(Text, nullable=False)

    # Structured documents live in RequiredDocument (below). When the
    # source's document list can't be cleanly split into individual
    # entries, the original text is kept here rather than lost or
    # force-fit into fake structured rows.
    documents_required_raw: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Ordered list of step strings. JSON (not a native Postgres ARRAY)
    # so the same column type works against Postgres in production and
    # SQLite in tests.
    application_process: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)

    official_source_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    official_source_label: Mapped[str | None] = mapped_column(String(200), nullable=True)
    # Where the user actually applies — may differ from official_source_url,
    # and may be unknown even when official_source_url is known. Never
    # invented: only ever populated from source data.
    official_application_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # When the SOURCE says the record was last updated (may be absent).
    source_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # When OUR importer last processed this record, changed or not.
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # When a human/process last verified this record against its source.
    last_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Lifecycle status (active/inactive/deprecated) — separate concern
    # from data_status (development/verified). A scheme can be "active"
    # (still present in its source) but "development" data_status (not
    # yet verified), or "inactive" (no longer seen in the source) while
    # still "verified" from when it was current.
    status: Mapped[str] = mapped_column(
        _enum_column(SchemeStatus), nullable=False, default=SchemeStatus.ACTIVE.value
    )
    data_status: Mapped[str] = mapped_column(
        _enum_column(DataStatus), nullable=False, default=DataStatus.DEVELOPMENT.value
    )

    # Deterministic hash of meaningful content fields (see
    # app/services/content_hash.py) — used to detect real changes
    # between sync runs without relying on source timestamps.
    content_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)

    education_levels: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    max_annual_income: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

    # Deadline is modelled as columns directly on the scheme (1:1) rather
    # than a separate table — a scheme has at most one active
    # application window in this phase of the product.
    deadline_label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    deadline_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    deadline_urgency: Mapped[str | None] = mapped_column(_enum_column(DeadlineUrgency), nullable=True)

    data_source_id: Mapped[int | None] = mapped_column(
        ForeignKey("data_source_registry.id", ondelete="SET NULL"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # No onupdate=func.now() here deliberately: SQLAlchemy's onupdate
    # fires on ANY update to the row, including a sync that only
    # touches last_synced_at. updated_at must only change when the
    # importer determines the CONTENT actually changed (see
    # app/services/scheme_import.py) — so it's set explicitly there,
    # not left to fire automatically.
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    data_source: Mapped["DataSourceRegistry | None"] = relationship(back_populates="schemes")
    required_documents: Mapped[list["RequiredDocument"]] = relationship(
        back_populates="scheme", cascade="all, delete-orphan", order_by="RequiredDocument.sort_order"
    )
    eligibility_rules: Mapped[list["EligibilityRule"]] = relationship(
        back_populates="scheme", cascade="all, delete-orphan"
    )
    versions: Mapped[list["SchemeVersion"]] = relationship(
        back_populates="scheme", cascade="all, delete-orphan", order_by="SchemeVersion.version_number"
    )

    __table_args__ = (
        CheckConstraint(
            "max_annual_income IS NULL OR max_annual_income >= 0",
            name="ck_schemes_income_non_negative",
        ),
        CheckConstraint("trim(name) <> ''", name="ck_schemes_name_not_blank"),
        # De-duplication key during import: the same source record,
        # re-imported, must resolve to the same row. NULLs in a unique
        # constraint don't conflict with each other in Postgres/SQLite,
        # so hand-entered schemes with no source_id are unaffected.
        UniqueConstraint("data_source_id", "source_id", name="uq_schemes_source_identity"),
        Index("ix_schemes_status", "status"),
        Index("ix_schemes_level", "level"),
        Index("ix_schemes_state", "state"),
        Index("ix_schemes_category", "category"),
        Index("ix_schemes_ministry", "ministry"),
        Index("ix_schemes_content_hash", "content_hash"),
        Index("ix_schemes_name", "name"),
    )


class RequiredDocument(Base):
    """
    A document generally required to apply for a scheme. This describes
    the scheme's own requirements, not any individual applicant's
    document status — per-applicant document tracking is a future,
    profile-linked feature.
    """

    __tablename__ = "required_documents"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    scheme_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    reason: Mapped[str] = mapped_column(String(300), nullable=False)
    sort_order: Mapped[int] = mapped_column(default=0)

    scheme: Mapped["Scheme"] = relationship(back_populates="required_documents")


class EligibilityRule(Base):
    """
    A single, deterministic eligibility condition for a scheme — or, when
    the source only gave natural-language eligibility text that can't be
    safely converted, a flagged record preserving that text instead of an
    invented rule. Evaluating these rules is the job of a future,
    separate eligibility engine; this table only stores the conditions.

    scope/scope_value let a single scheme carry rules that differ by
    region (e.g. a stricter income cap in one state, or a rule limited to
    specific districts) without duplicating the scheme record itself.
    scope="national" applies everywhere the scheme is offered;
    scope="state" applies only within scope_value (a state name);
    scope="district" applies only within scope_value (a "State/District"
    pair). A rules engine resolves the most specific applicable rules
    for a given profile — district overrides state overrides national.
    No district-specific (or state-specific) eligibility logic is
    evaluated anywhere yet; this phase only stores the rules.
    """

    __tablename__ = "eligibility_rules"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    scheme_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False
    )

    rule_type: Mapped[str] = mapped_column(_enum_column(RuleType), nullable=False)

    # Populated only for rule_type = "structured".
    field: Mapped[str | None] = mapped_column(String(100), nullable=True)
    operator: Mapped[str | None] = mapped_column(_enum_column(RuleOperator), nullable=True)
    value: Mapped[dict | list | str | float | bool | None] = mapped_column(JSON, nullable=True)

    # Populated only for rule_type = "text_review" — the original
    # natural-language eligibility text, preserved rather than guessed at.
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    scope: Mapped[str] = mapped_column(
        _enum_column(RuleScope), nullable=False, default=RuleScope.NATIONAL.value
    )
    scope_value: Mapped[str | None] = mapped_column(String(150), nullable=True)

    # Traceability back to the source — e.g. which source column or
    # clause this rule was derived from. Not the rule's own content.
    source_reference: Mapped[str | None] = mapped_column(String(300), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    scheme: Mapped["Scheme"] = relationship(back_populates="eligibility_rules")

    __table_args__ = (
        CheckConstraint(
            "(rule_type = 'structured' AND field IS NOT NULL AND operator IS NOT NULL "
            "AND value IS NOT NULL) OR "
            "(rule_type = 'text_review' AND raw_text IS NOT NULL)",
            name="ck_eligibility_rules_shape_matches_type",
        ),
        Index("ix_eligibility_rules_scheme_id", "scheme_id"),
        Index("ix_eligibility_rules_field", "field"),
    )


class SchemeVersion(Base):
    """
    An immutable historical snapshot of a scheme's content, captured
    whenever the content actually changes (not on every sync — see
    app/services/content_hash.py). Lets YojanaAI reconstruct what it
    knew about a scheme at a particular point in time. Versions are
    never edited or deleted.
    """

    __tablename__ = "scheme_versions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    scheme_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)

    # Full content snapshot at this version — an opaque JSON blob rather
    # than mirrored columns, since this is written once and read as a
    # whole, never queried field-by-field.
    snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)

    source_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)

    scheme: Mapped["Scheme"] = relationship(back_populates="versions")

    __table_args__ = (
        UniqueConstraint("scheme_id", "version_number", name="uq_scheme_versions_scheme_version"),
    )


class SchemeSyncRun(Base):
    """
    One execution of a provider sync/import — bootstrap or (in future) a
    live authorized provider. Gives an auditable record of what a given
    import actually did, for an eventual data-health/admin view. Never
    written to by API routes; only by the importer itself.
    """

    __tablename__ = "scheme_sync_runs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # The source this run pulled from. Named data_source_id (an FK into
    # the normalized registry) rather than a free-text "provider" string,
    # consistent with how Scheme.data_source_id is modelled.
    data_source_id: Mapped[int] = mapped_column(
        ForeignKey("data_source_registry.id", ondelete="RESTRICT"), nullable=False
    )

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    status: Mapped[str] = mapped_column(
        _enum_column(SyncRunStatus), nullable=False, default=SyncRunStatus.RUNNING.value
    )

    records_seen: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    records_created: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    records_updated: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    records_unchanged: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    records_deactivated: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    records_failed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    error_summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    data_source: Mapped["DataSourceRegistry"] = relationship(back_populates="sync_runs")
