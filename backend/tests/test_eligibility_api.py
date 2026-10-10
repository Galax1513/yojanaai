import uuid

from app.models.scheme import EligibilityRule, Scheme


def _make_scheme(db_session, **overrides):
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
    scheme = Scheme(**defaults)
    db_session.add(scheme)
    db_session.commit()
    db_session.refresh(scheme)
    return scheme


def _add_rule(db_session, scheme, field, operator, value):
    rule = EligibilityRule(scheme_id=scheme.id, rule_type="structured", field=field, operator=operator, value=value)
    db_session.add(rule)
    db_session.commit()
    return rule


def test_matches_endpoint_excludes_not_matched(client, db_session):
    matching_scheme = _make_scheme(db_session, name="Matching Scheme")
    _add_rule(db_session, matching_scheme, "age", ">=", 18)

    failing_scheme = _make_scheme(db_session, name="Failing Scheme")
    _add_rule(db_session, failing_scheme, "age", ">=", 60)  # profile will be 21

    profile_resp = client.post("/api/profiles", json={"age": 21})
    profile_id = profile_resp.json()["profile"]["id"]

    matches_resp = client.get(f"/api/profiles/{profile_id}/matches")
    assert matches_resp.status_code == 200
    body = matches_resp.json()
    names = {item["scheme_name"] for item in body["items"]}
    assert "Matching Scheme" in names
    assert "Failing Scheme" not in names  # NOT_MATCHED never returned


def test_matches_endpoint_sorts_match_before_needs_information(client, db_session):
    needs_info_scheme = _make_scheme(db_session, name="Needs Info Scheme")
    _add_rule(db_session, needs_info_scheme, "annual_family_income", "<=", 300000.0)

    match_scheme = _make_scheme(db_session, name="Clean Match Scheme")
    _add_rule(db_session, match_scheme, "age", ">=", 18)

    profile_resp = client.post("/api/profiles", json={"age": 21})  # income left unanswered
    profile_id = profile_resp.json()["profile"]["id"]

    matches_resp = client.get(f"/api/profiles/{profile_id}/matches")
    body = matches_resp.json()
    statuses = [item["status"] for item in body["items"]]
    # every MATCH must appear before every NEEDS_INFORMATION
    if "MATCH" in statuses and "NEEDS_INFORMATION" in statuses:
        assert statuses.index("MATCH") < statuses.index("NEEDS_INFORMATION")


def test_matches_endpoint_404_for_nonexistent_profile(client):
    response = client.get("/api/profiles/00000000-0000-0000-0000-000000000000/matches")
    assert response.status_code == 404


def test_matches_response_never_claims_official_eligibility(client, db_session):
    scheme = _make_scheme(db_session, name="Language Check Scheme")
    _add_rule(db_session, scheme, "age", ">=", 18)

    profile_resp = client.post("/api/profiles", json={"age": 21})
    profile_id = profile_resp.json()["profile"]["id"]

    matches_resp = client.get(f"/api/profiles/{profile_id}/matches")
    raw = matches_resp.text.lower()
    for forbidden in ["officially eligible", "verified", "government-approved", "government approved"]:
        assert forbidden not in raw