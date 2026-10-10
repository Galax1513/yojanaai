from app.models.profile import UserProfile
from app.services.profile_completeness import calculate_profile_completeness


def test_create_valid_profile(client):
    payload = {
        "name": "Priya Sharma",
        "age": 21,
        "gender": "Female",
        "state": "Tamil Nadu",
        "district": "Chennai",
        "area_type": "Urban",
        "education_level": "Undergraduate",
        "course": "B.Tech",
        "year_of_study": "3rd Year",
        "institution_type": "Government",
        "employment_status": "Student",
        "annual_family_income": 350000,
        "social_category": "General",
        "bpl_status": "No",
        "disability_status": "No",
    }
    response = client.post("/api/profiles", json=payload)
    assert response.status_code == 201
    body = response.json()
    assert body["profile"]["name"] == "Priya Sharma"
    assert body["profile"]["social_category"] == "General"
    assert body["profile"]["bpl_status"] == "No"
    assert "id" in body["profile"]
    assert isinstance(body["profile_completeness"], int)


def test_invalid_age_rejected(client):
    response = client.post("/api/profiles", json={"age": -5})
    assert response.status_code == 422

    response_too_old = client.post("/api/profiles", json={"age": 200})
    assert response_too_old.status_code == 422


def test_invalid_income_rejected(client):
    response = client.post("/api/profiles", json={"annual_family_income": -1000})
    assert response.status_code == 422


def test_invalid_enum_value_rejected(client):
    response = client.post("/api/profiles", json={"social_category": "NotARealCategory"})
    assert response.status_code == 422

    response_area = client.post("/api/profiles", json={"area_type": "Semi-urban"})
    assert response_area.status_code == 422  # removed from the enum in Phase 2A

    response_gender = client.post("/api/profiles", json={"gender": "Invalid"})
    assert response_gender.status_code == 422


def test_social_category_ews(client):
    response = client.post("/api/profiles", json={"social_category": "EWS"})
    assert response.status_code == 201
    assert response.json()["profile"]["social_category"] == "EWS"


def test_social_category_prefer_not_to_say(client):
    response = client.post("/api/profiles", json={"social_category": "Prefer not to say"})
    assert response.status_code == 201
    assert response.json()["profile"]["social_category"] == "Prefer not to say"


def test_bpl_status_yes_no_unknown(client):
    profile_id = client.post("/api/profiles", json={}).json()["profile"]["id"]
    for value in ("Yes", "No", "Unknown"):
        response = client.put(f"/api/profiles/{profile_id}", json={"bpl_status": value})
        assert response.status_code == 200
        assert response.json()["profile"]["bpl_status"] == value


def test_disability_status_yes_no_unknown(client):
    profile_id = client.post("/api/profiles", json={}).json()["profile"]["id"]
    for value in ("Yes", "No", "Unknown"):
        response = client.put(f"/api/profiles/{profile_id}", json={"disability_status": value})
        assert response.status_code == 200
        assert response.json()["profile"]["disability_status"] == value


def test_get_profile(client):
    create_response = client.post("/api/profiles", json={"name": "Test User"})
    profile_id = create_response.json()["profile"]["id"]

    get_response = client.get(f"/api/profiles/{profile_id}")
    assert get_response.status_code == 200
    assert get_response.json()["profile"]["name"] == "Test User"


def test_put_profile_updates_fields(client):
    create_response = client.post("/api/profiles", json={"name": "Initial Name"})
    profile_id = create_response.json()["profile"]["id"]

    put_response = client.put(
        f"/api/profiles/{profile_id}",
        json={"age": 30, "occupation": "Farmer"},
    )
    assert put_response.status_code == 200
    body = put_response.json()["profile"]
    assert body["name"] == "Initial Name"  # untouched fields preserved
    assert body["age"] == 30
    assert body["occupation"] == "Farmer"


def test_nonexistent_profile_returns_404(client):
    response = client.get("/api/profiles/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404

    put_response = client.put(
        "/api/profiles/00000000-0000-0000-0000-000000000000", json={"age": 25}
    )
    assert put_response.status_code == 404


def test_completeness_reflects_answered_fields(db_session):
    profile = UserProfile(name="Test", age=25, state="Kerala")
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)

    completeness = calculate_profile_completeness(profile)
    # 3 of 12 FIELDS_FOR_COMPLETENESS answered
    assert 0 < completeness < 100


def test_completeness_unknown_counts_same_as_any_other_answer(db_session):
    """An explicit 'Unknown' for bpl_status/disability_status must count
    as answered — the same as 'Yes' or 'No' — never treated as
    equivalent to the field being unanswered (NULL)."""
    profile_unknown = UserProfile(bpl_status="Unknown", disability_status="Unknown")
    profile_no = UserProfile(bpl_status="No", disability_status="No")
    profile_unanswered = UserProfile()

    db_session.add_all([profile_unknown, profile_no, profile_unanswered])
    db_session.commit()
    for p in (profile_unknown, profile_no, profile_unanswered):
        db_session.refresh(p)

    completeness_unknown = calculate_profile_completeness(profile_unknown)
    completeness_no = calculate_profile_completeness(profile_no)
    completeness_unanswered = calculate_profile_completeness(profile_unanswered)

    assert completeness_unknown == completeness_no  # both are "answered"
    assert completeness_unknown > completeness_unanswered  # unanswered scores lower
    assert completeness_unanswered == 0


def test_no_document_upload_endpoint_exists(client):
    """Privacy requirement: YojanaAI must never expose a way to upload
    identity/supporting documents. 404 (no matching route) or 405 (path
    happens to match /profiles/{profile_id} but rejects POST) are both
    valid proof no such endpoint exists — either way, nothing accepts
    an upload."""
    for path in ["/api/profiles/upload", "/api/upload", "/api/documents/upload"]:
        response = client.post(path, json={})
        assert response.status_code in (404, 405)