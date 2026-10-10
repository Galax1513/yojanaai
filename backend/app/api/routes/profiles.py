import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.profile import UserProfile
from app.models.scheme import Scheme
from app.models.user import User
from app.schemas.eligibility import EligibilityMatchesResponse
from app.schemas.profile import ProfileCreate, ProfileUpdate, ProfileWithCompleteness
from app.services.eligibility_engine import evaluate_schemes
from app.services.profile_completeness import calculate_profile_completeness
from app.services.support_taxonomy import (
    SchemeSupportProfile,
    UnknownSupportFilter,
    compute_facets,
    matches_filter,
    requires_disability_from_rules,
    resolve_filter,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profiles", tags=["profiles"])


def _to_response(profile: UserProfile) -> ProfileWithCompleteness:
    return ProfileWithCompleteness(
        profile=profile,  # type: ignore[arg-type]  # validated via from_attributes
        profile_completeness=calculate_profile_completeness(profile),
    )


def _get_profile_or_404(db: Session, profile_id: uuid.UUID, user: User) -> UserProfile:
    profile = db.get(UserProfile, profile_id)
    # Someone else's profile is reported as not found rather than
    # forbidden, so profile ids can't be probed for existence.
    if profile is None or profile.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


@router.post("", response_model=ProfileWithCompleteness, status_code=status.HTTP_201_CREATED)
def create_profile(
    payload: ProfileCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ProfileWithCompleteness:
    if user.profile is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a saved profile. Update it instead.",
        )
    profile = UserProfile(**payload.model_dump(exclude_unset=True), user_id=user.id)
    db.add(profile)
    try:
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to create profile")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Could not save profile"
        ) from None
    db.refresh(profile)
    return _to_response(profile)


@router.get("/me", response_model=ProfileWithCompleteness)
def get_my_profile(user: User = Depends(get_current_user)) -> ProfileWithCompleteness:
    """The signed-in user's own profile, or 404 if they haven't saved one yet."""
    if user.profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return _to_response(user.profile)


@router.get("/{profile_id}", response_model=ProfileWithCompleteness)
def get_profile(
    profile_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ProfileWithCompleteness:
    profile = _get_profile_or_404(db, profile_id, user)
    return _to_response(profile)


@router.put("/{profile_id}", response_model=ProfileWithCompleteness)
def update_profile(
    profile_id: uuid.UUID,
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ProfileWithCompleteness:
    profile = _get_profile_or_404(db, profile_id, user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    try:
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to update profile %s", profile_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Could not save profile"
        ) from None
    db.refresh(profile)
    return _to_response(profile)


@router.get("/{profile_id}/matches", response_model=EligibilityMatchesResponse)
def get_profile_matches(
    profile_id: uuid.UUID,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    support_category: str | None = Query(
        default=None,
        description="A key from GET /api/schemes/support-categories.",
    ),
    support_subcategory: str | None = Query(
        default=None,
        description="A subcategory key belonging to support_category.",
    ),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> EligibilityMatchesResponse:
    """
    Evaluates this profile against every active scheme's structured
    eligibility rules and returns POTENTIAL matches — deterministic
    rule evaluation, never an official eligibility determination, never
    an LLM decision. See app/services/eligibility_engine.py.

    Only MATCH and NEEDS_INFORMATION results are returned; NOT_MATCHED
    schemes are not shown here — deliberately, so a profile isn't
    confronted with thousands of schemes it doesn't fit. MATCH results
    sort before NEEDS_INFORMATION.

    support_category / support_subcategory narrow the potential matches
    by the kind of support a scheme offers. This filter is applied only
    AFTER eligibility evaluation — it never changes any scheme's status,
    only which already-evaluated results are listed.
    """
    try:
        support_filter = resolve_filter(support_category, support_subcategory)
    except UnknownSupportFilter as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from None

    profile = _get_profile_or_404(db, profile_id, user)

    schemes = (
        db.query(Scheme)
        .options(selectinload(Scheme.eligibility_rules))
        .filter(Scheme.status == "active")
        .all()
    )

    results = evaluate_schemes(schemes, profile)
    potential = [r for r in results if r.status in ("MATCH", "NEEDS_INFORMATION")]
    potential.sort(key=lambda r: 0 if r.status == "MATCH" else 1)

    support_by_scheme_id = {
        str(s.id): SchemeSupportProfile.build(
            s.categories, s.scheme_type, requires_disability_from_rules(s.eligibility_rules)
        )
        for s in schemes
    }
    facets = compute_facets(support_by_scheme_id[r.scheme_id] for r in potential)
    unfiltered_total = len(potential)
    filtered = [r for r in potential if matches_filter(support_by_scheme_id[r.scheme_id], support_filter)]

    total = len(filtered)
    page = filtered[offset : offset + limit]

    return EligibilityMatchesResponse(
        items=page,
        total=total,
        limit=limit,
        offset=offset,
        unfiltered_total=unfiltered_total,
        support_facets=facets,  # type: ignore[arg-type]
    )