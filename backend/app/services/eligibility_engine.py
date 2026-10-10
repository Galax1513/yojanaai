"""
The deterministic eligibility engine (Phase 2B).

No LLM is used anywhere in this module. No probability or confidence
score is produced — every result is a deterministic evaluation of
structured EligibilityRule rows against a UserProfile, fully traceable
back to the rule that produced it.

Evaluation semantics (see the Phase 2B audit and product spec):
  - A scheme's structured rules combine with AND — every rule must be
    satisfied for an overall MATCH.
  - A rule's own `in` operator provides OR *within one field* (e.g.
    state in [Kerala, Tamil Nadu]). There is no cross-field OR: the
    current rule data cannot represent it, and none exists today.
  - A missing profile value (None) is NEEDS_INFORMATION, never treated
    as a failing/false value.
  - An explicit "Unknown" answer (bpl_status, disability_status) is
    also NEEDS_INFORMATION, never treated as "No".
  - A scheme's text_review rule (present on almost every scheme) is
    surfaced via `requires_source_review` and never overrides a
    deterministic structured MATCH — see EligibilityResult.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from app.models.profile import UserProfile
from app.models.scheme import EligibilityRule, Scheme
from app.schemas.eligibility import EligibilityResult, EligibilityRuleEvaluation
from app.schemas.scheme import SchemeListItem

# Fields whose profile enum includes a literal "Unknown" value, distinct
# from the field simply being unanswered (None). Only these two exist
# today — see the Phase 2B audit.
_UNKNOWN_CAPABLE_FIELDS = {"bpl_status", "disability_status"}

_FIELD_LABELS: dict[str, str] = {
    "age": "age",
    "annual_family_income": "annual family income",
    "gender": "gender",
    "area_type": "area type",
    "state": "state",
    "social_category": "social category",
    "bpl_status": "BPL status",
    "disability_status": "disability status",
}

_COMPARATOR_WORDS: dict[str, str] = {
    ">=": "at least",
    "<=": "at most",
    ">": "more than",
    "<": "less than",
}


def _format_value(field: str, value: Any) -> str:
    if field == "annual_family_income" and isinstance(value, (int, float)):
        return f"₹{value:,.0f}"
    return str(value)


def _reason_missing(field: str) -> str:
    return f"Your {_FIELD_LABELS.get(field, field)} is not provided, so we cannot determine this requirement."


def _reason_unknown(field: str) -> str:
    label = _FIELD_LABELS.get(field, field)
    return f"You indicated you're not sure about your {label}, so we cannot determine this requirement."


def _reason_comparison(field: str, operator: str, profile_value: Any, rule_value: Any, matched: bool) -> str:
    label = _FIELD_LABELS.get(field, field)
    pv = _format_value(field, profile_value)
    rv = _format_value(field, rule_value)
    word = _COMPARATOR_WORDS.get(operator, operator)
    if matched:
        return f"Your {label} is {pv} and this requirement is {word} {rv}."
    return f"Your {label} is {pv}, but this requirement is {word} {rv}."


def _reason_membership(field: str, profile_value: Any, rule_value: Any, matched: bool, negated: bool) -> str:
    label = _FIELD_LABELS.get(field, field)
    pv = _format_value(field, profile_value)
    noun = {
        "state": "eligible states",
        "social_category": "eligible categories",
    }.get(field, f"eligible {label} values")
    included = matched if not negated else not matched
    if included:
        return f"Your {label} is {pv}, which is included in the scheme's {noun}."
    return f"Your {label} is {pv}, which is not included in the scheme's {noun}."


def _reason_equality(field: str, profile_value: Any, rule_value: Any, matched: bool) -> str:
    if field == "bpl_status":
        if matched:
            return "This scheme requires a BPL (Below Poverty Line) card, and your profile indicates you have one."
        return "This scheme requires a BPL (Below Poverty Line) card, but your profile indicates you do not have one."
    if field == "disability_status":
        if matched:
            return "This scheme requires the applicant to have a disability, and your profile confirms this."
        return "This scheme requires the applicant to have a disability, but your profile says no."
    label = _FIELD_LABELS.get(field, field)
    pv = _format_value(field, profile_value)
    rv = _format_value(field, rule_value)
    if matched:
        return f"Your {label} is {pv}, which matches this scheme's requirement."
    return f"Your {label} is {pv}, but this scheme requires {rv}."


def evaluate_rule(rule: EligibilityRule, profile: UserProfile) -> EligibilityRuleEvaluation:
    """Evaluates one structured rule against one profile. Never called
    for text_review rules — those have no field/operator/value to
    evaluate by design."""
    field = rule.field or ""
    operator = rule.operator.value if hasattr(rule.operator, "value") else str(rule.operator)
    rule_value = rule.value

    raw_profile_value = getattr(profile, field, None) if field else None

    if raw_profile_value is None:
        return EligibilityRuleEvaluation(
            eligibility_rule_id=rule.id,
            field=field,
            operator=operator,
            normalized_value=rule_value,
            profile_value_used=None,
            result="needs_information",
            reason=_reason_missing(field),
        )

    if field in _UNKNOWN_CAPABLE_FIELDS and raw_profile_value == "Unknown":
        return EligibilityRuleEvaluation(
            eligibility_rule_id=rule.id,
            field=field,
            operator=operator,
            normalized_value=rule_value,
            profile_value_used=str(raw_profile_value),
            result="needs_information",
            reason=_reason_unknown(field),
        )

    # Numeric coercion: annual_family_income is stored as Decimal.
    pv: Any = float(raw_profile_value) if isinstance(raw_profile_value, Decimal) else raw_profile_value
    if isinstance(pv, str):
        pv = str(pv)  # normalize enum-instance-that-is-a-str to plain str for clean JSON output

    matched: bool | None
    if operator == ">=":
        matched = pv >= rule_value
        reason = _reason_comparison(field, operator, pv, rule_value, matched)
    elif operator == "<=":
        matched = pv <= rule_value
        reason = _reason_comparison(field, operator, pv, rule_value, matched)
    elif operator == ">":
        matched = pv > rule_value
        reason = _reason_comparison(field, operator, pv, rule_value, matched)
    elif operator == "<":
        matched = pv < rule_value
        reason = _reason_comparison(field, operator, pv, rule_value, matched)
    elif operator == "in":
        matched = isinstance(rule_value, list) and pv in rule_value
        reason = _reason_membership(field, pv, rule_value, matched, negated=False)
    elif operator == "not_in":
        matched = isinstance(rule_value, list) and pv not in rule_value
        reason = _reason_membership(field, pv, rule_value, matched, negated=True)
    elif operator == "=":
        matched = pv == rule_value
        reason = _reason_equality(field, pv, rule_value, matched)
    elif operator == "!=":
        matched = pv != rule_value
        reason = _reason_equality(field, pv, rule_value, matched)
    else:
        # An operator outside the known set should never occur (the DB
        # column is constrained to RuleOperator's values), but never
        # silently guess at a result for one — flag it for review
        # instead of pretending to have evaluated it.
        matched = None
        reason = (
            f"This scheme has an eligibility rule ({field} {operator} {rule_value}) "
            "that could not be automatically evaluated."
        )

    result: str = "needs_information" if matched is None else ("matched" if matched else "not_matched")

    return EligibilityRuleEvaluation(
        eligibility_rule_id=rule.id,
        field=field,
        operator=operator,
        normalized_value=rule_value,
        profile_value_used=pv,
        result=result,  # type: ignore[arg-type]
        reason=reason,
    )


def evaluate_scheme(scheme: Scheme, profile: UserProfile) -> EligibilityResult:
    """
    Evaluates every structured rule on `scheme` against `profile` and
    combines them with AND semantics:
      - any not_matched  -> overall NOT_MATCHED
      - else any needs_information -> overall NEEDS_INFORMATION
      - else -> overall MATCH

    A scheme with zero structured rules has nothing to fail or need
    information about, so it evaluates to MATCH — requires_source_review
    is what tells the caller there's still free-text eligibility
    information on the official source worth checking, independent of
    this structured result.
    """
    structured_rules = [r for r in scheme.eligibility_rules if r.rule_type == "structured"]
    has_text_review = any(r.rule_type == "text_review" for r in scheme.eligibility_rules)

    evaluations = [evaluate_rule(rule, profile) for rule in structured_rules]

    if any(e.result == "not_matched" for e in evaluations):
        status = "NOT_MATCHED"
    elif any(e.result == "needs_information" for e in evaluations):
        status = "NEEDS_INFORMATION"
    else:
        status = "MATCH"

    return EligibilityResult(
        scheme_id=str(scheme.id),
        scheme_slug=scheme.slug,
        scheme_name=scheme.name,
        status=status,  # type: ignore[arg-type]
        requires_source_review=has_text_review,
        evaluations=evaluations,
        scheme=SchemeListItem.model_validate(scheme),
    )


def evaluate_schemes(schemes: list[Scheme], profile: UserProfile) -> list[EligibilityResult]:
    return [evaluate_scheme(scheme, profile) for scheme in schemes]