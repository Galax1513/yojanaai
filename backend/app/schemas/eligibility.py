"""
Schemas for the deterministic eligibility engine (Phase 2B). Every
result is fully traceable back to the EligibilityRule row that produced
it — there is no confidence score, because this is deterministic rule
evaluation, not probabilistic prediction, and never will be an LLM
decision.
"""

from typing import Any, Literal

from pydantic import BaseModel

from app.schemas.scheme import SchemeListItem
from app.schemas.support import SupportFacet

EvaluationResult = Literal["matched", "needs_information", "not_matched"]
OverallStatus = Literal["MATCH", "NEEDS_INFORMATION", "NOT_MATCHED"]


class EligibilityRuleEvaluation(BaseModel):
    """One structured rule, evaluated against one profile. Always
    traceable back to its source row via eligibility_rule_id."""

    eligibility_rule_id: int
    field: str
    operator: str
    normalized_value: Any
    profile_value_used: Any
    result: EvaluationResult
    reason: str


class EligibilityResult(BaseModel):
    """
    The result for one scheme against one profile.

    status is derived purely from the scheme's STRUCTURED rules (AND
    semantics — see app/services/eligibility_engine.py). A scheme's
    text_review rule (present on almost every scheme) never overrides a
    deterministic structured MATCH; instead it's surfaced separately via
    requires_source_review so the person knows to check the scheme's
    full eligibility text on its official source before relying on this
    result alone.

    This is a "potential match" signal, never an official determination
    — see the language requirements in the product spec for how this
    must be presented to the user.
    """

    scheme_id: str
    scheme_slug: str
    scheme_name: str
    status: OverallStatus
    requires_source_review: bool
    evaluations: list[EligibilityRuleEvaluation]
    scheme: SchemeListItem


class EligibilityMatchesResponse(BaseModel):
    items: list[EligibilityResult]
    # Potential matches (MATCH + NEEDS_INFORMATION) after the support
    # category filter, if one was given.
    total: int
    limit: int
    offset: int
    # Potential matches before the support category filter — what "All
    # support" shows. Equal to total when no support filter is set.
    unfiltered_total: int
    # Per-category counts over those unfiltered potential matches.
    support_facets: list[SupportFacet]