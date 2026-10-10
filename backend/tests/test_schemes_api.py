import asyncio
from pathlib import Path

from app.services.providers.bootstrap_dataset_provider import BootstrapDatasetProvider
from app.services.scheme_import import run_import

FIXTURE_CSV = Path(__file__).parent / "fixtures" / "sample_schemes.csv"


def _import_fixture(db_session, data_source):
    provider = BootstrapDatasetProvider(FIXTURE_CSV)

    async def _collect():
        return [row async for row in provider.fetch_schemes()]

    rows = asyncio.run(_collect())
    return run_import(db_session, data_source, rows)


def test_list_schemes_reads_from_database(client, db_session, data_source):
    """GET /api/schemes returns the imported schemes — confirms the API
    reads from Postgres/the ORM, not from any hardcoded/mock source."""
    _import_fixture(db_session, data_source)

    response = client.get("/api/schemes")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    names = {item["name"] for item in body["items"]}
    assert "Sample Merit Scholarship" in names
    assert "Sample Farmer Support Grant" in names


def test_list_schemes_filters_by_category_and_state(client, db_session, data_source):
    _import_fixture(db_session, data_source)

    by_category = client.get("/api/schemes", params={"category": "agriculture"}).json()
    assert by_category["total"] == 1
    assert by_category["items"][0]["name"] == "Sample Farmer Support Grant"

    by_state = client.get("/api/schemes", params={"state": "Tamil Nadu"}).json()
    names = {item["name"] for item in by_state["items"]}
    assert "Sample Farmer Support Grant" in names


def test_search_matches_ministry_and_department_not_just_name(client, db_session, data_source):
    """Search must cover more than just the name field (Step 4)."""
    _import_fixture(db_session, data_source)

    by_ministry = client.get("/api/schemes", params={"search": "Ministry of Education"}).json()
    assert any(item["name"] == "Sample Merit Scholarship" for item in by_ministry["items"])

    by_department = client.get("/api/schemes", params={"search": "Agriculture Department"}).json()
    assert any(item["name"] == "Sample Farmer Support Grant" for item in by_department["items"])


def test_search_matches_categories_tag_text(client, db_session, data_source):
    _import_fixture(db_session, data_source)
    result = client.get("/api/schemes", params={"search": "Rural & Environment"}).json()
    assert any(item["name"] == "Sample Farmer Support Grant" for item in result["items"])


def test_income_filter_excludes_schemes_above_cap_and_schemes_with_no_cap(client, db_session, data_source):
    """income filters to schemes whose own income cap is at or below the
    given value; schemes with no stated cap at all are excluded (this is
    a catalog-browsing filter, not eligibility matching)."""
    _import_fixture(db_session, data_source)

    # tst-001 has max_annual_income=300000; tst-002 has none.
    result = client.get("/api/schemes", params={"income": 300000}).json()
    names = {item["name"] for item in result["items"]}
    assert "Sample Merit Scholarship" in names
    assert "Sample Farmer Support Grant" not in names  # no income cap stated

    result_low = client.get("/api/schemes", params={"income": 100000}).json()
    assert result_low["total"] == 0  # 300000 cap is above a 100000 threshold


def test_pagination_limit_and_offset(client, db_session, data_source):
    _import_fixture(db_session, data_source)

    page_1 = client.get("/api/schemes", params={"limit": 1, "offset": 0}).json()
    page_2 = client.get("/api/schemes", params={"limit": 1, "offset": 1}).json()

    assert page_1["total"] == 2
    assert len(page_1["items"]) == 1
    assert len(page_2["items"]) == 1
    assert page_1["items"][0]["id"] != page_2["items"][0]["id"]


def test_empty_result_for_nonmatching_filter(client, db_session, data_source):
    _import_fixture(db_session, data_source)
    result = client.get("/api/schemes", params={"category": "healthcare"}).json()
    assert result["total"] == 0
    assert result["items"] == []


def test_combined_filters(client, db_session, data_source):
    _import_fixture(db_session, data_source)
    result = client.get(
        "/api/schemes", params={"category": "agriculture", "state": "Tamil Nadu"}
    ).json()
    assert result["total"] == 1
    assert result["items"][0]["name"] == "Sample Farmer Support Grant"

    # A combination that matches nothing.
    result_none = client.get(
        "/api/schemes", params={"category": "agriculture", "state": "Kerala"}
    ).json()
    assert result_none["total"] == 0


def test_get_scheme_by_slug_returns_full_detail(client, db_session, data_source):
    """GET /api/schemes/{slug} exposes both distinct URLs and the
    data_source attribution — the frontend never needs to hardcode a
    scheme link or invent an official-data claim."""
    _import_fixture(db_session, data_source)

    list_response = client.get("/api/schemes").json()
    slug = next(item["slug"] for item in list_response["items"] if item["name"] == "Sample Merit Scholarship")

    response = client.get(f"/api/schemes/{slug}")
    assert response.status_code == 200
    body = response.json()

    assert body["official_source_url"] == "https://www.myscheme.gov.in/schemes/tst-001"
    assert body["official_application_url"] == "https://example.gov.in/apply/tst-001"
    assert body["data_status"] == "development"
    assert body["data_source"]["is_official_government_source"] is False
    assert len(body["required_documents"]) == 3


def test_get_scheme_not_found_returns_404(client, db_session, data_source):
    response = client.get("/api/schemes/does-not-exist")
    assert response.status_code == 404
