"""
The support-category filter (app/services/support_taxonomy.py) narrows
scheme lists by the kind of support offered. These tests pin down:
  * each category/subcategory maps to the documented scheme fields,
  * the catalog endpoint and the matches endpoint filter + paginate
    correctly and report honest counts,
  * filtering happens after eligibility evaluation and never changes a
    scheme's MATCH / NEEDS_INFORMATION status or lets NOT_MATCHED in.
"""

import uuid

from app.models.scheme import EligibilityRule, Scheme
from app.services.support_taxonomy import (
    SUPPORT_CATEGORIES,
    SchemeSupportProfile,
    is_disability_requirement,
    matches_filter,
    resolve_filter,
)


def _make_scheme(db_session, name, categories, scheme_type="grant", **overrides):
    fields = dict(
        id=uuid.uuid4(),
        slug=f"s-{uuid.uuid4().hex[:10]}",
        name=name,
        category="education",
        categories=categories,
        scheme_type=scheme_type,
        summary="A test scheme.",
        benefit="Some benefit",
        eligibility_summary="Some eligibility text.",
        who_can_apply="Some eligibility text.",
        application_process=[],
        status="active",
    )
    fields.update(overrides)
    scheme = Scheme(**fields)
    db_session.add(scheme)
    db_session.commit()
    db_session.refresh(scheme)
    return scheme


def _add_rule(db_session, scheme, field, operator, value):
    db_session.add(
        EligibilityRule(
            scheme_id=scheme.id, rule_type="structured", field=field, operator=operator, value=value
        )
    )
    db_session.commit()


def _catalog(db_session):
    """A small catalog shaped like the real data, including the
    comma-split source labels and both disability-rule encodings."""
    s = {}
    s["scholarship"] = _make_scheme(db_session, "Merit Scholarship", ["Education & Learning"], "scholarship")
    s["edu_loan"] = _make_scheme(db_session, "Education Loan Subsidy", ["Education & Learning"], "subsidy")
    s["edu_grant"] = _make_scheme(
        db_session, "Coaching Grant", ["Education & Learning", "Social welfare & Empowerment"], "grant"
    )
    s["skills"] = _make_scheme(db_session, "Skill Training", ["Skills & Employment"], "certification")
    s["farm"] = _make_scheme(
        db_session, "Farm Equipment Subsidy", ["Agriculture", "Rural & Environment"], "subsidy"
    )
    s["bank"] = _make_scheme(
        db_session, "Mudra Loan", ["Banking", "Financial Services and Insurance"], "insurance"
    )
    s["disability_new"] = _make_scheme(
        db_session, "Disability Pension", ["Social welfare & Empowerment"], "pension"
    )
    _add_rule(db_session, s["disability_new"], "disability_status", "=", "Yes")
    s["disability_legacy"] = _make_scheme(
        db_session, "Assistive Devices", ["Social welfare & Empowerment"], "grant"
    )
    _add_rule(db_session, s["disability_legacy"], "disability_status", "!=", "None")
    s["sports"] = _make_scheme(db_session, "Sports Stipend", ["Sports & Culture"], "grant")
    return s


def _names(body):
    return {item["name"] for item in body["items"]}


# --- taxonomy unit tests ---------------------------------------------------


def test_every_category_key_is_unique_and_subcategories_resolve():
    keys = [c.key for c in SUPPORT_CATEGORIES]
    assert len(keys) == len(set(keys))
    for category in SUPPORT_CATEGORIES:
        sub_keys = [s.key for s in category.subcategories]
        assert len(sub_keys) == len(set(sub_keys))
        for sub_key in sub_keys:
            assert resolve_filter(category.key, sub_key) is not None


def test_homepage_category_links_remain_valid_support_categories():
    # src/data/categories.ts links to /discover?category=<these>.
    for key in [
        "education", "women", "employment", "healthcare",
        "housing", "agriculture", "disability", "family-social-security",
    ]:
        assert resolve_filter(key, None) is not None


def test_comma_split_source_labels_match_on_either_half():
    agriculture = resolve_filter("agriculture", None)
    assert matches_filter(SchemeSupportProfile.build(["Agriculture"], "grant", False), agriculture)
    assert matches_filter(SchemeSupportProfile.build(["Rural & Environment"], "grant", False), agriculture)


def test_disability_requirement_recognises_both_encodings_only():
    assert is_disability_requirement("structured", "disability_status", "=", "Yes")
    assert is_disability_requirement("structured", "disability_status", "!=", "None")
    assert not is_disability_requirement("structured", "disability_status", "=", "No")
    assert not is_disability_requirement("structured", "bpl_status", "=", "Yes")
    assert not is_disability_requirement("text_review", "disability_status", "=", "Yes")


def test_insurance_and_certification_are_not_exposed_as_subcategories():
    # Both scheme_type values were found unreliable in the real data.
    for category in SUPPORT_CATEGORIES:
        for sub in category.subcategories:
            assert not (sub.scheme_types & {"insurance", "certification", "grant"})


# --- GET /api/schemes ------------------------------------------------------


def test_taxonomy_endpoint_lists_categories(anon_client):
    body = anon_client.get("/api/schemes/support-categories").json()
    keys = [c["key"] for c in body]
    assert keys[0] == "education"
    education = body[0]
    assert {"key": "scholarship", "label": "Scholarships"} in education["subcategories"]


def test_unfiltered_list_returns_everything_with_facets(anon_client, db_session):
    _catalog(db_session)
    body = anon_client.get("/api/schemes", params={"limit": 100}).json()
    assert body["total"] == 9
    assert body["unfiltered_total"] == 9
    facets = {f["category"]: f for f in body["support_facets"]}
    assert facets["education"]["count"] == 3
    assert facets["disability"]["count"] == 2
    assert facets["financial"]["count"] == 1
    edu_subs = {s["subcategory"]: s["count"] for s in facets["education"]["subcategories"]}
    assert edu_subs == {"scholarship": 1, "subsidy-loan": 1}


def test_education_filter(anon_client, db_session):
    _catalog(db_session)
    body = anon_client.get("/api/schemes", params={"support_category": "education"}).json()
    assert _names(body) == {"Merit Scholarship", "Education Loan Subsidy", "Coaching Grant"}
    assert body["total"] == 3
    assert body["unfiltered_total"] == 9


def test_scholarship_subcategory(anon_client, db_session):
    _catalog(db_session)
    body = anon_client.get(
        "/api/schemes", params={"support_category": "education", "support_subcategory": "scholarship"}
    ).json()
    assert _names(body) == {"Merit Scholarship"}
    assert body["total"] == 1


def test_employment_filter(anon_client, db_session):
    _catalog(db_session)
    body = anon_client.get("/api/schemes", params={"support_category": "employment"}).json()
    assert _names(body) == {"Skill Training"}


def test_agriculture_filter(anon_client, db_session):
    _catalog(db_session)
    body = anon_client.get("/api/schemes", params={"support_category": "agriculture"}).json()
    assert _names(body) == {"Farm Equipment Subsidy"}


def test_disability_filter_uses_structured_rules(anon_client, db_session):
    _catalog(db_session)
    body = anon_client.get("/api/schemes", params={"support_category": "disability"}).json()
    assert _names(body) == {"Disability Pension", "Assistive Devices"}


def test_other_category_and_its_source_label_subcategory(anon_client, db_session):
    _catalog(db_session)
    body = anon_client.get(
        "/api/schemes", params={"support_category": "other", "support_subcategory": "sports-culture"}
    ).json()
    assert _names(body) == {"Sports Stipend"}


def test_support_filter_combines_with_existing_filters(anon_client, db_session):
    _catalog(db_session)
    body = anon_client.get(
        "/api/schemes", params={"support_category": "education", "search": "Loan"}
    ).json()
    assert _names(body) == {"Education Loan Subsidy"}
    # unfiltered_total respects the search but not the support filter
    assert body["unfiltered_total"] == 2  # Education Loan Subsidy + Mudra Loan


def test_pagination_after_filtering_has_no_duplicates(anon_client, db_session):
    _catalog(db_session)
    params = {"support_category": "family-social-security", "limit": 1}
    seen = []
    total = None
    offset = 0
    while True:
        body = anon_client.get("/api/schemes", params={**params, "offset": offset}).json()
        total = body["total"]
        if not body["items"]:
            break
        seen.extend(item["id"] for item in body["items"])
        offset += 1
    assert total == 3  # Coaching Grant + both disability schemes
    assert len(seen) == total
    assert len(set(seen)) == total


def test_unknown_support_keys_are_rejected(anon_client):
    assert anon_client.get("/api/schemes", params={"support_category": "nope"}).status_code == 400
    assert anon_client.get(
        "/api/schemes", params={"support_category": "education", "support_subcategory": "pension"}
    ).status_code == 400
    assert anon_client.get("/api/schemes", params={"support_subcategory": "scholarship"}).status_code == 400


# --- GET /api/profiles/{id}/matches ----------------------------------------


def _matches_catalog(db_session):
    """Profile will be age 21 with no disability answer."""
    s = {}
    s["edu_match"] = _make_scheme(db_session, "Edu Match", ["Education & Learning"], "scholarship")
    _add_rule(db_session, s["edu_match"], "age", ">=", 18)
    s["edu_needs_info"] = _make_scheme(db_session, "Edu Needs Info", ["Education & Learning"], "subsidy")
    _add_rule(db_session, s["edu_needs_info"], "annual_family_income", "<=", 250000)
    s["edu_not_matched"] = _make_scheme(db_session, "Edu Not Matched", ["Education & Learning"], "scholarship")
    _add_rule(db_session, s["edu_not_matched"], "age", ">=", 60)
    s["farm_match"] = _make_scheme(db_session, "Farm Match", ["Agriculture", "Rural & Environment"], "subsidy")
    _add_rule(db_session, s["farm_match"], "age", ">=", 18)
    return s


def _status_by_name(body):
    return {item["scheme_name"]: item["status"] for item in body["items"]}


def test_matches_support_filter_narrows_without_changing_status(client, db_session):
    _matches_catalog(db_session)
    profile_id = client.post("/api/profiles", json={"age": 21}).json()["profile"]["id"]

    everything = client.get(f"/api/profiles/{profile_id}/matches").json()
    assert _status_by_name(everything) == {
        "Edu Match": "MATCH",
        "Farm Match": "MATCH",
        "Edu Needs Info": "NEEDS_INFORMATION",
    }
    assert everything["total"] == everything["unfiltered_total"] == 3

    education = client.get(
        f"/api/profiles/{profile_id}/matches", params={"support_category": "education"}
    ).json()
    # Same statuses as unfiltered, NOT_MATCHED still excluded, MATCH first.
    assert _status_by_name(education) == {"Edu Match": "MATCH", "Edu Needs Info": "NEEDS_INFORMATION"}
    assert [i["status"] for i in education["items"]] == ["MATCH", "NEEDS_INFORMATION"]
    assert education["total"] == 2
    assert education["unfiltered_total"] == 3

    facets = {f["category"]: f for f in education["support_facets"]}
    assert facets["education"]["count"] == 2  # Edu Not Matched is not counted
    assert facets["agriculture"]["count"] == 1


def test_matches_subcategory_filter(client, db_session):
    _matches_catalog(db_session)
    profile_id = client.post("/api/profiles", json={"age": 21}).json()["profile"]["id"]
    body = client.get(
        f"/api/profiles/{profile_id}/matches",
        params={"support_category": "education", "support_subcategory": "scholarship"},
    ).json()
    # Edu Not Matched is also a scholarship but must stay excluded.
    assert _status_by_name(body) == {"Edu Match": "MATCH"}
    assert body["total"] == 1


def test_matches_pagination_after_filtering(client, db_session):
    _matches_catalog(db_session)
    profile_id = client.post("/api/profiles", json={"age": 21}).json()["profile"]["id"]
    url = f"/api/profiles/{profile_id}/matches"
    params = {"support_category": "education", "limit": 1}
    first = client.get(url, params={**params, "offset": 0}).json()
    second = client.get(url, params={**params, "offset": 1}).json()
    third = client.get(url, params={**params, "offset": 2}).json()
    assert first["total"] == second["total"] == 2
    assert [i["scheme_name"] for i in first["items"]] == ["Edu Match"]
    assert [i["scheme_name"] for i in second["items"]] == ["Edu Needs Info"]
    assert third["items"] == []


def test_matches_unknown_support_key_rejected(client, db_session):
    profile_id = client.post("/api/profiles", json={"age": 21}).json()["profile"]["id"]
    response = client.get(
        f"/api/profiles/{profile_id}/matches", params={"support_category": "nope"}
    )
    assert response.status_code == 400
