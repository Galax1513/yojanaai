"""
Deterministic profile-completeness calculation.

The frontend must never invent this number — it always comes from here.
The calculation is intentionally simple and explicit: a fixed list of
fields that matter for eligibility matching, and the percentage of them
that are filled in. As the profile model grows, update FIELDS_FOR_COMPLETENESS
rather than hand-rolling a percentage anywhere else.
"""

from app.models.profile import UserProfile

FIELDS_FOR_COMPLETENESS: tuple[str, ...] = (
    "name",
    "age",
    "state",
    "district",
    "area_type",
    "gender",
    "education_level",
    "employment_status",
    "annual_family_income",
    "social_category",
    "bpl_status",
    "disability_status",
)


def calculate_profile_completeness(profile: UserProfile) -> int:
    """
    Returns an integer 0–100: the percentage of FIELDS_FOR_COMPLETENESS
    that have been answered.

    "Answered" means the column is non-NULL — this correctly treats an
    explicit "Unknown" (for bpl_status/disability_status) as complete,
    the same as any other explicit answer, since the person did engage
    with the question. It is NULL — never having been asked or having
    skipped the step — that counts as incomplete. Do not special-case
    "Unknown" here: it must never be scored the same as leaving the
    field untouched, and it must never be scored differently from a
    "Yes"/"No" answer either — all three are equally "answered".

    `occupation` is deliberately excluded: it only applies to some
    employment statuses, and this calculation has no notion of
    conditional/not-applicable fields — including it would incorrectly
    cap a Student's or Unemployed person's max completeness below 100%.
    """
    filled = sum(1 for field in FIELDS_FOR_COMPLETENESS if getattr(profile, field) is not None)
    return round((filled / len(FIELDS_FOR_COMPLETENESS)) * 100)