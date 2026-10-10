import uuid

import pytest

from app.models.profile import UserProfile
from app.models.scheme import EligibilityRule, Scheme
from app.services.eligibility_engine import evaluate_rule, evaluate_scheme

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def make_scheme(**overrides) -> Scheme:
    defaults = dict(
        id=uuid.uuid4(),
        slug=f"test-scheme-{uuid.uuid4().hex[:8]}",
        name="Test Scheme",
        category="education",
        scheme_type="scholarship",
        summary="A test scheme.",
        benefit="Some benefit",
        eligibility_summary="Some eligibility text.",
        who_can_apply="Some eligibility text.",
        application_process=[],
    )
    defaults.update(overrides)
    return Scheme(**defaults)


def make_rule(scheme: Scheme, field: str, operator: str, value, rule_type: str = "structured", **overrides):
    kwargs = dict(
        scheme_id=scheme.id,
        rule_type=rule_type,
        field=field if rule_type == "structured" else None,
        operator=operator if rule_type == "structured" else None,
        value=value if rule_type == "structured" else None,
        raw_text="Some raw eligibility text." if rule_type == "text_review" else None,
        scope="national",
    )
    kwargs.update(overrides)
    return EligibilityRule(**kwargs)


def make_profile(**overrides) -> UserProfile:
    return UserProfile(id=uuid.uuid4(), **overrides)


def persist(db_session, *objs):
    for o in objs:
        db_session.add(o)
    db_session.commit()
    for o in objs:
        db_session.refresh(o)
    return objs


# ---------------------------------------------------------------------------
# 1-4: age
# ---------------------------------------------------------------------------


def test_age_gte_matching(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "age", ">=", 18)
    persist(db_session, scheme, rule)
    profile = make_profile(age=21)

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.result == "matched"
    assert "21" in evaluation.reason and "18" in evaluation.reason


def test_age_gte_failing(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "age", ">=", 18)
    persist(db_session, scheme, rule)
    profile = make_profile(age=15)

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.result == "not_matched"


def test_age_lte_matching(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "age", "<=", 35)
    persist(db_session, scheme, rule)
    profile = make_profile(age=30)

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.result == "matched"


def test_age_lte_failing(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "age", "<=", 35)
    persist(db_session, scheme, rule)
    profile = make_profile(age=40)

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.result == "not_matched"


# ---------------------------------------------------------------------------
# 5-6: state in
# ---------------------------------------------------------------------------


def test_state_in_matching(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "state", "in", ["Tamil Nadu", "Kerala"])
    persist(db_session, scheme, rule)
    profile = make_profile(state="Tamil Nadu")

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.result == "matched"
    assert "Tamil Nadu" in evaluation.reason
    assert "included" in evaluation.reason


def test_state_in_failing(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "state", "in", ["Tamil Nadu", "Kerala"])
    persist(db_session, scheme, rule)
    profile = make_profile(state="Gujarat")

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.result == "not_matched"
    assert "not included" in evaluation.reason


# ---------------------------------------------------------------------------
# 7-8: social_category in
# ---------------------------------------------------------------------------


def test_social_category_in_matching(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "social_category", "in", ["SC", "ST"])
    persist(db_session, scheme, rule)
    profile = make_profile(social_category="SC")

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.result == "matched"


def test_social_category_in_failing(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "social_category", "in", ["SC", "ST"])
    persist(db_session, scheme, rule)
    profile = make_profile(social_category="General")

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.result == "not_matched"


# ---------------------------------------------------------------------------
# 9-10: annual_family_income <=
# ---------------------------------------------------------------------------


def test_income_lte_matching(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "annual_family_income", "<=", 300000.0)
    persist(db_session, scheme, rule)
    profile = make_profile(annual_family_income=250000)

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.result == "matched"
    assert "₹" in evaluation.reason


def test_income_lte_failing(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "annual_family_income", "<=", 300000.0)
    persist(db_session, scheme, rule)
    profile = make_profile(annual_family_income=500000)

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.result == "not_matched"


# ---------------------------------------------------------------------------
# 11-12: gender =
# ---------------------------------------------------------------------------


def test_gender_eq_matching(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "gender", "=", "Female")
    persist(db_session, scheme, rule)
    profile = make_profile(gender="Female")

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.result == "matched"


def test_gender_eq_failing(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "gender", "=", "Female")
    persist(db_session, scheme, rule)
    profile = make_profile(gender="Male")

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.result == "not_matched"


# ---------------------------------------------------------------------------
# 13-14: area_type =
# ---------------------------------------------------------------------------


def test_area_type_eq_matching(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "area_type", "=", "Rural")
    persist(db_session, scheme, rule)
    profile = make_profile(area_type="Rural")

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.result == "matched"


def test_area_type_eq_failing(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "area_type", "=", "Rural")
    persist(db_session, scheme, rule)
    profile = make_profile(area_type="Urban")

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.result == "not_matched"


# ---------------------------------------------------------------------------
# 15-17: BPL yes/no/unknown
# ---------------------------------------------------------------------------


def test_bpl_rule_yes_profile_yes(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "bpl_status", "=", "Yes")
    persist(db_session, scheme, rule)
    profile = make_profile(bpl_status="Yes")

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.result == "matched"
    assert "BPL" in evaluation.reason


def test_bpl_rule_yes_profile_no(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "bpl_status", "=", "Yes")
    persist(db_session, scheme, rule)
    profile = make_profile(bpl_status="No")

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.result == "not_matched"


def test_bpl_rule_yes_profile_unknown(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "bpl_status", "=", "Yes")
    persist(db_session, scheme, rule)
    profile = make_profile(bpl_status="Unknown")

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.result == "needs_information"  # never treated as No


# ---------------------------------------------------------------------------
# 18-20: disability yes/no/unknown
# ---------------------------------------------------------------------------


def test_disability_rule_yes_profile_yes(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "disability_status", "=", "Yes")
    persist(db_session, scheme, rule)
    profile = make_profile(disability_status="Yes")

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.result == "matched"


def test_disability_rule_yes_profile_no(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "disability_status", "=", "Yes")
    persist(db_session, scheme, rule)
    profile = make_profile(disability_status="No")

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.result == "not_matched"
    assert evaluation.reason == (
        "This scheme requires the applicant to have a disability, but your profile says no."
    )


def test_disability_rule_yes_profile_unknown(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "disability_status", "=", "Yes")
    persist(db_session, scheme, rule)
    profile = make_profile(disability_status="Unknown")

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.result == "needs_information"  # never treated as No


# ---------------------------------------------------------------------------
# 21-22: missing / unknown generically
# ---------------------------------------------------------------------------


def test_missing_profile_value_needs_information(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "annual_family_income", "<=", 300000.0)
    persist(db_session, scheme, rule)
    profile = make_profile()  # income never provided

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.result == "needs_information"
    assert "not provided" in evaluation.reason


def test_unknown_value_needs_information(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "bpl_status", "=", "Yes")
    persist(db_session, scheme, rule)
    profile = make_profile(bpl_status="Unknown")

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.result == "needs_information"


# ---------------------------------------------------------------------------
# 23-26: scheme-level AND semantics
# ---------------------------------------------------------------------------


def test_multiple_rules_use_and_semantics_all_match(db_session):
    scheme = make_scheme()
    r1 = make_rule(scheme, "age", ">=", 18)
    r2 = make_rule(scheme, "annual_family_income", "<=", 300000.0)
    persist(db_session, scheme, r1, r2)
    scheme.eligibility_rules = [r1, r2]

    profile = make_profile(age=21, annual_family_income=200000)
    result = evaluate_scheme(scheme, profile)
    assert result.status == "MATCH"


def test_one_failing_rule_makes_overall_not_matched(db_session):
    scheme = make_scheme()
    r1 = make_rule(scheme, "age", ">=", 18)
    r2 = make_rule(scheme, "annual_family_income", "<=", 300000.0)
    persist(db_session, scheme, r1, r2)
    scheme.eligibility_rules = [r1, r2]

    profile = make_profile(age=15, annual_family_income=200000)  # age fails
    result = evaluate_scheme(scheme, profile)
    assert result.status == "NOT_MATCHED"


def test_one_missing_rule_with_no_failures_makes_needs_information(db_session):
    scheme = make_scheme()
    r1 = make_rule(scheme, "age", ">=", 18)
    r2 = make_rule(scheme, "annual_family_income", "<=", 300000.0)
    persist(db_session, scheme, r1, r2)
    scheme.eligibility_rules = [r1, r2]

    profile = make_profile(age=21)  # income never provided; age matches
    result = evaluate_scheme(scheme, profile)
    assert result.status == "NEEDS_INFORMATION"


def test_all_rules_matched_makes_overall_match(db_session):
    scheme = make_scheme()
    r1 = make_rule(scheme, "gender", "=", "Female")
    r2 = make_rule(scheme, "area_type", "=", "Rural")
    persist(db_session, scheme, r1, r2)
    scheme.eligibility_rules = [r1, r2]

    profile = make_profile(gender="Female", area_type="Rural")
    result = evaluate_scheme(scheme, profile)
    assert result.status == "MATCH"


# ---------------------------------------------------------------------------
# 27-28: text_review behavior
# ---------------------------------------------------------------------------


def test_text_review_does_not_override_deterministic_match(db_session):
    scheme = make_scheme()
    structured = make_rule(scheme, "age", ">=", 18)
    text = make_rule(scheme, None, None, None, rule_type="text_review")
    persist(db_session, scheme, structured, text)
    scheme.eligibility_rules = [structured, text]

    profile = make_profile(age=21)
    result = evaluate_scheme(scheme, profile)
    assert result.status == "MATCH"  # text_review never downgrades this
    assert result.requires_source_review is True


def test_requires_source_review_true_when_text_review_exists(db_session):
    scheme = make_scheme()
    text = make_rule(scheme, None, None, None, rule_type="text_review")
    persist(db_session, scheme, text)
    scheme.eligibility_rules = [text]

    profile = make_profile()
    result = evaluate_scheme(scheme, profile)
    assert result.requires_source_review is True
    assert result.status == "MATCH"  # zero structured rules -> nothing to fail


def test_requires_source_review_false_when_no_text_review(db_session):
    scheme = make_scheme()
    structured = make_rule(scheme, "age", ">=", 18)
    persist(db_session, scheme, structured)
    scheme.eligibility_rules = [structured]

    profile = make_profile(age=21)
    result = evaluate_scheme(scheme, profile)
    assert result.requires_source_review is False


# ---------------------------------------------------------------------------
# 29-30: traceability + deterministic reasons
# ---------------------------------------------------------------------------


def test_traceability_fields_present(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "age", ">=", 18)
    persist(db_session, scheme, rule)
    profile = make_profile(age=21)

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.eligibility_rule_id == rule.id
    assert evaluation.field == "age"
    assert evaluation.operator == ">="
    assert evaluation.normalized_value == 18
    assert evaluation.profile_value_used == 21
    assert evaluation.result == "matched"
    assert evaluation.reason


def test_deterministic_reason_strings_are_stable(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "age", ">=", 18)
    persist(db_session, scheme, rule)
    profile = make_profile(age=21)

    e1 = evaluate_rule(rule, profile)
    e2 = evaluate_rule(rule, profile)
    assert e1.reason == e2.reason == "Your age is 21 and this requirement is at least 18."


def test_income_unknown_reason_matches_spec_example(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "annual_family_income", "<=", 300000.0)
    persist(db_session, scheme, rule)
    profile = make_profile()

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.reason == (
        "Your annual family income is not provided, so we cannot determine this requirement."
    )


def test_state_in_reason_matches_spec_example(db_session):
    scheme = make_scheme()
    rule = make_rule(scheme, "state", "in", ["Tamil Nadu", "Kerala"])
    persist(db_session, scheme, rule)
    profile = make_profile(state="Tamil Nadu")

    evaluation = evaluate_rule(rule, profile)
    assert evaluation.reason == (
        "Your state is Tamil Nadu, which is included in the scheme's eligible states."
    )


# ---------------------------------------------------------------------------
# 31: no LLM / network calls involved
# ---------------------------------------------------------------------------


def test_engine_module_has_no_llm_or_network_imports():
    import app.services.eligibility_engine as engine_module

    source = open(engine_module.__file__).read().lower()
    forbidden = ["openai", "anthropic", "requests", "httpx", "urllib", "socket"]
    for term in forbidden:
        assert term not in source, f"eligibility_engine.py unexpectedly references '{term}'"


def test_evaluate_scheme_makes_no_network_calls(db_session, monkeypatch):
    import socket

    def _blocked(*args, **kwargs):
        raise AssertionError("Network access attempted during deterministic evaluation")

    monkeypatch.setattr(socket, "socket", _blocked)

    scheme = make_scheme()
    rule = make_rule(scheme, "age", ">=", 18)
    persist(db_session, scheme, rule)
    scheme.eligibility_rules = [rule]
    profile = make_profile(age=21)

    result = evaluate_scheme(scheme, profile)
    assert result.status == "MATCH"