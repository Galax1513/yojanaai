from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import String, cast, or_
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.models.enums import SchemeCategory, SchemeLevel, SchemeStatus, SchemeType
from app.models.scheme import EligibilityRule, Scheme
from app.schemas.scheme import SchemeListResponse, SchemeRead
from app.schemas.support import SupportCategoryRead, SupportSubcategoryRead
from app.services.support_taxonomy import (
    SUPPORT_CATEGORIES,
    SchemeSupportProfile,
    UnknownSupportFilter,
    compute_facets,
    is_disability_requirement,
    matches_filter,
    resolve_filter,
)

router = APIRouter(prefix="/schemes", tags=["schemes"])


def _disability_scheme_ids(db: Session) -> set:
    """Ids of schemes with a structured rule requiring a disability —
    the support taxonomy's evidence for "Disability support"."""
    rows = (
        db.query(
            EligibilityRule.scheme_id,
            EligibilityRule.rule_type,
            EligibilityRule.field,
            EligibilityRule.operator,
            EligibilityRule.value,
        )
        .filter(EligibilityRule.field == "disability_status")
        .all()
    )
    return {
        scheme_id
        for scheme_id, rule_type, field_name, operator, value in rows
        if is_disability_requirement(rule_type, field_name, operator, value)
    }


@router.get("/support-categories", response_model=list[SupportCategoryRead])
def list_support_categories() -> list[SupportCategoryRead]:
    """
    The controlled "what kind of support are you looking for?" taxonomy
    (see app/services/support_taxonomy.py for exactly which scheme
    fields each entry maps to). Counts are not included here — they
    come back as support_facets on the list endpoints, computed over
    the list actually being shown.
    """
    return [
        SupportCategoryRead(
            key=c.key,
            label=c.label,
            description=c.description,
            subcategories=[SupportSubcategoryRead(key=s.key, label=s.label) for s in c.subcategories],
        )
        for c in SUPPORT_CATEGORIES
    ]


@router.get("", response_model=SchemeListResponse)
def list_schemes(
    category: SchemeCategory | None = None,
    state: str | None = None,
    scheme_type: SchemeType | None = None,
    education_level: str | None = None,
    level: SchemeLevel | None = None,
    ministry: str | None = None,
    max_income: float | None = Query(
        default=None,
        alias="income",
        ge=0,
        description="Only schemes whose income cap is at or below this value (schemes with no stated cap are excluded).",
    ),
    status_filter: SchemeStatus | None = Query(default=SchemeStatus.ACTIVE, alias="status"),
    search: str | None = Query(
        default=None,
        description="Matches against name, short_title, summary, description, ministry, department, categories, tags",
    ),
    support_category: str | None = Query(
        default=None,
        description="A key from GET /api/schemes/support-categories.",
    ),
    support_subcategory: str | None = Query(
        default=None,
        description="A subcategory key belonging to support_category.",
    ),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> SchemeListResponse:
    """
    Browse schemes. This endpoint never evaluates eligibility — it only
    filters the catalog by attributes a scheme itself has (category,
    state, type, education level, ministry, income cap, a text search).
    Whether a given person qualifies is a separate concern, handled by
    a future eligibility engine reading a submitted profile.

    Defaults to status="active" so inactive/deactivated records (no
    longer seen in their source) don't show up in normal browsing; pass
    status explicitly (or omit it with status=null) to see others.

    support_category / support_subcategory narrow by the kind of support
    a scheme offers (see app/services/support_taxonomy.py). The response
    also carries unfiltered_total and support_facets — counts with every
    other filter applied but not the support filter — so the UI can show
    real per-option numbers.
    """
    try:
        support_filter = resolve_filter(support_category, support_subcategory)
    except UnknownSupportFilter as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from None

    query = db.query(Scheme)

    if category is not None:
        query = query.filter(Scheme.category == category.value)
    if scheme_type is not None:
        query = query.filter(Scheme.scheme_type == scheme_type.value)
    if level is not None:
        query = query.filter(Scheme.level == level.value)
    if ministry is not None:
        query = query.filter(Scheme.ministry.ilike(f"%{ministry}%"))
    if status_filter is not None:
        query = query.filter(Scheme.status == status_filter.value)
    if state is not None:
        query = query.filter(or_(Scheme.state == state, Scheme.state.is_(None)))
    if max_income is not None:
        # Schemes with no stated income cap are excluded here — this
        # filter answers "schemes targeted at this income band", not
        # "schemes this income would qualify for" (that's the future
        # eligibility engine's job, not a browsing filter).
        query = query.filter(Scheme.max_annual_income <= max_income)
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                Scheme.name.ilike(term),
                Scheme.short_title.ilike(term),
                Scheme.summary.ilike(term),
                Scheme.description.ilike(term),
                Scheme.ministry.ilike(term),
                Scheme.department.ilike(term),
                # categories/tags are JSON columns; cast-to-text search
                # is a pragmatic, cross-database (Postgres + SQLite in
                # tests) way to match within them without a JSON
                # containment operator that isn't portable across both.
                cast(Scheme.categories, String).ilike(term),
                cast(Scheme.tags, String).ilike(term),
            )
        )

    all_matching = query.order_by(Scheme.name).all()

    # education_levels is a JSON list column; filtered here rather than
    # in the query since JSON containment isn't portable across
    # Postgres and the SQLite database used in tests.
    if education_level is not None:
        all_matching = [
            s for s in all_matching if s.education_levels and education_level in s.education_levels
        ]

    # Like education_level above, the support taxonomy is applied in
    # Python: it reads the categories JSON list, which has no portable
    # containment operator across Postgres and SQLite.
    disability_ids = _disability_scheme_ids(db)
    support_profiles = [
        (s, SchemeSupportProfile.build(s.categories, s.scheme_type, s.id in disability_ids))
        for s in all_matching
    ]
    facets = compute_facets(p for _, p in support_profiles)
    unfiltered_total = len(all_matching)
    filtered = [s for s, p in support_profiles if matches_filter(p, support_filter)]

    total = len(filtered)
    page = filtered[offset : offset + limit]

    return SchemeListResponse(
        items=page,  # type: ignore[arg-type]
        total=total,
        limit=limit,
        offset=offset,
        unfiltered_total=unfiltered_total,
        support_facets=facets,  # type: ignore[arg-type]
    )


@router.get("/{scheme_id}", response_model=SchemeRead)
def get_scheme(scheme_id: str, db: Session = Depends(get_db)) -> SchemeRead:
    """
    Looked up by slug (the stable, human-readable identifier — e.g.
    "merit-cum-means-scholarship-a1b2c3d4"), not the internal UUID
    primary key. The path parameter is still named scheme_id since
    that's the external contract every scheme link uses.
    """
    scheme = (
        db.query(Scheme)
        .options(selectinload(Scheme.required_documents), selectinload(Scheme.data_source))
        .filter(Scheme.slug == scheme_id)
        .first()
    )
    if scheme is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme not found")
    return scheme  # type: ignore[return-value]
