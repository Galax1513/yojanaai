from tests.conftest import register_user


def test_register_returns_token_and_user(anon_client):
    response = anon_client.post(
        "/api/auth/register", json={"email": "Priya@Example.com", "password": "s3cret-pass"}
    )
    assert response.status_code == 201
    body = response.json()
    assert body["access_token"]
    assert body["token_type"] == "bearer"
    assert body["user"]["email"] == "priya@example.com"  # normalized
    assert body["user"]["profile_id"] is None


def test_register_duplicate_email_rejected(anon_client):
    register_user(anon_client, "dup@example.com")
    response = anon_client.post(
        "/api/auth/register", json={"email": "DUP@example.com", "password": "another-pass"}
    )
    assert response.status_code == 409


def test_register_rejects_short_password_and_bad_email(anon_client):
    assert anon_client.post(
        "/api/auth/register", json={"email": "a@example.com", "password": "short"}
    ).status_code == 422
    assert anon_client.post(
        "/api/auth/register", json={"email": "not-an-email", "password": "long-enough"}
    ).status_code == 422


def test_login_success_and_failure(anon_client):
    register_user(anon_client, "login@example.com", password="right-password")

    ok = anon_client.post(
        "/api/auth/login", json={"email": "LOGIN@example.com", "password": "right-password"}
    )
    assert ok.status_code == 200
    assert ok.json()["access_token"]

    wrong = anon_client.post(
        "/api/auth/login", json={"email": "login@example.com", "password": "wrong-password"}
    )
    assert wrong.status_code == 401

    unknown = anon_client.post(
        "/api/auth/login", json={"email": "nobody@example.com", "password": "right-password"}
    )
    assert unknown.status_code == 401
    assert unknown.json()["detail"] == wrong.json()["detail"]


def test_password_is_not_stored_in_plaintext(anon_client, db_session):
    from app.models.user import User

    register_user(anon_client, "hash@example.com", password="plaintext-check")
    user = db_session.query(User).filter_by(email="hash@example.com").one()
    assert "plaintext-check" not in user.password_hash
    assert user.password_hash.startswith("scrypt$")


def test_me_requires_valid_token(anon_client):
    assert anon_client.get("/api/auth/me").status_code == 401
    assert anon_client.get(
        "/api/auth/me", headers={"Authorization": "Bearer not-a-real-token"}
    ).status_code == 401


def test_me_reports_profile_id_after_onboarding(client):
    assert client.get("/api/auth/me").json()["profile_id"] is None
    profile_id = client.post("/api/profiles", json={"name": "Returning User"}).json()["profile"]["id"]
    assert client.get("/api/auth/me").json()["profile_id"] == profile_id


def test_profile_persists_across_logins(anon_client):
    """The whole point of accounts: details entered once are there
    again after signing back in."""
    headers = register_user(anon_client, "persist@example.com", password="persist-pass")
    anon_client.post("/api/profiles", json={"name": "Persistent", "age": 30}, headers=headers)

    login = anon_client.post(
        "/api/auth/login", json={"email": "persist@example.com", "password": "persist-pass"}
    )
    new_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    me = anon_client.get("/api/profiles/me", headers=new_headers)
    assert me.status_code == 200
    assert me.json()["profile"]["name"] == "Persistent"
    assert me.json()["profile"]["age"] == 30


def test_profile_endpoints_require_auth(anon_client):
    assert anon_client.post("/api/profiles", json={}).status_code == 401
    assert anon_client.get("/api/profiles/me").status_code == 401
    some_id = "00000000-0000-0000-0000-000000000000"
    assert anon_client.get(f"/api/profiles/{some_id}").status_code == 401
    assert anon_client.put(f"/api/profiles/{some_id}", json={}).status_code == 401
    assert anon_client.get(f"/api/profiles/{some_id}/matches").status_code == 401


def test_cannot_access_another_users_profile(anon_client):
    owner = register_user(anon_client, "owner@example.com")
    intruder = register_user(anon_client, "intruder@example.com")
    profile_id = anon_client.post(
        "/api/profiles", json={"name": "Private"}, headers=owner
    ).json()["profile"]["id"]

    assert anon_client.get(f"/api/profiles/{profile_id}", headers=intruder).status_code == 404
    assert anon_client.put(
        f"/api/profiles/{profile_id}", json={"name": "Hijacked"}, headers=intruder
    ).status_code == 404
    assert anon_client.get(f"/api/profiles/{profile_id}/matches", headers=intruder).status_code == 404
    assert anon_client.get(f"/api/profiles/{profile_id}", headers=owner).json()["profile"]["name"] == "Private"


def test_only_one_profile_per_user(client):
    assert client.post("/api/profiles", json={}).status_code == 201
    assert client.post("/api/profiles", json={}).status_code == 409


def test_profiles_me_404_before_onboarding(client):
    assert client.get("/api/profiles/me").status_code == 404
