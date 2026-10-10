import asyncio
from pathlib import Path

from app.models.scheme import EligibilityRule, Scheme, SchemeVersion
from app.services.content_hash import compute_content_hash
from app.services.providers.bootstrap_dataset_provider import BootstrapDatasetProvider
from app.services.scheme_import import run_import

FIXTURE_CSV = Path(__file__).parent / "fixtures" / "sample_schemes.csv"


def _load_rows(csv_path: Path = FIXTURE_CSV) -> list[dict]:
    provider = BootstrapDatasetProvider(csv_path)

    async def _collect():
        return [row async for row in provider.fetch_schemes()]

    return asyncio.run(_collect())


def test_scheme_creation(db_session, data_source):
    """A valid row produces a Scheme row with the expected fields,
    including the central/state level split and income cap carried
    onto the scheme itself."""
    rows = _load_rows()
    run_import(db_session, data_source, rows)

    scheme = db_session.query(Scheme).filter(Scheme.source_id == "tst-001").first()
    assert scheme is not None
    assert scheme.name == "Sample Merit Scholarship"
    assert scheme.category == "education"
    assert scheme.level == "central"
    assert scheme.state is None
    assert scheme.max_annual_income == 300000
    assert scheme.data_source_id == data_source.id
    assert scheme.data_status == "development"  # never fabricated as verified
    assert scheme.status == "active"


def test_sync_run_statistics(db_session, data_source):
    """The sync run records accurate created/failed counts for the fixture."""
    rows = _load_rows()
    sync_run = run_import(db_session, data_source, rows)

    # Fixture has 3 rows: 2 valid (tst-001, tst-002), 1 invalid (tst-003, blank name).
    assert sync_run.records_seen == 3
    assert sync_run.records_created == 2
    assert sync_run.records_failed == 1
    assert sync_run.records_updated == 0
    assert sync_run.records_unchanged == 0
    assert sync_run.status in ("completed", "partial")
    assert sync_run.error_summary is not None
    assert "row 2" in sync_run.error_summary  # tst-003 is the 3rd row (index 2)


def test_invalid_records_rejected_safely(db_session, data_source):
    """A record missing required fields is skipped, not inserted, and
    does not crash the run."""
    rows = _load_rows()
    run_import(db_session, data_source, rows)

    all_schemes = db_session.query(Scheme).all()
    assert len(all_schemes) == 2  # the invalid 3rd row never became a Scheme


def test_duplicate_detection_on_reimport(db_session, data_source):
    """Running the same dataset twice must not create duplicate schemes."""
    rows = _load_rows()
    run_import(db_session, data_source, rows)
    first_count = db_session.query(Scheme).count()

    run_import(db_session, data_source, rows)
    second_count = db_session.query(Scheme).count()

    assert first_count == 2
    assert second_count == 2  # unchanged, not duplicated


def test_unchanged_scheme_does_not_create_new_version(db_session, data_source):
    """Re-importing identical content must not add a SchemeVersion or
    change the recorded content_hash / updated_at."""
    rows = _load_rows()
    run_import(db_session, data_source, rows)

    scheme = db_session.query(Scheme).filter(Scheme.source_id == "tst-001").first()
    version_count_before = (
        db_session.query(SchemeVersion).filter(SchemeVersion.scheme_id == scheme.id).count()
    )
    updated_at_before = scheme.updated_at
    hash_before = scheme.content_hash

    second_run = run_import(db_session, data_source, rows)

    db_session.refresh(scheme)
    version_count_after = (
        db_session.query(SchemeVersion).filter(SchemeVersion.scheme_id == scheme.id).count()
    )

    assert version_count_before == 1  # initial creation makes version 1
    assert version_count_after == 1  # re-import adds no new version
    assert scheme.updated_at == updated_at_before
    assert scheme.content_hash == hash_before
    assert second_run.records_unchanged == 2
    assert second_run.records_updated == 0


def test_changed_scheme_creates_new_version(db_session, data_source):
    """A real content change must update the scheme, bump
    content_hash/updated_at, and add a SchemeVersion — the old version
    must still exist afterward (history is never destroyed)."""
    rows = _load_rows()
    run_import(db_session, data_source, rows)

    scheme = db_session.query(Scheme).filter(Scheme.source_id == "tst-001").first()
    original_hash = scheme.content_hash
    original_description = scheme.description

    changed_rows = [dict(r) for r in rows]
    changed_rows[0]["description"] = "UPDATED: expanded financial support for undergraduate students."

    run_import(db_session, data_source, changed_rows)

    db_session.refresh(scheme)
    versions = (
        db_session.query(SchemeVersion)
        .filter(SchemeVersion.scheme_id == scheme.id)
        .order_by(SchemeVersion.version_number)
        .all()
    )

    assert scheme.content_hash != original_hash
    assert scheme.description != original_description
    assert len(versions) == 2
    assert versions[0].version_number == 1
    assert versions[0].snapshot["description"] == original_description  # old version preserved
    assert versions[1].version_number == 2
    assert versions[1].snapshot["description"] == scheme.description


def test_eligibility_caste_maps_to_social_category_field(db_session, data_source):
    """eligibility_caste must become field='social_category', not a
    generic 'category' (which is a different concept — the scheme's own
    subject-matter category, e.g. 'education'). The source's caste
    values are preserved verbatim, never converted or guessed at."""
    rows = _load_rows()
    caste_row = dict(rows[0])  # tst-001, currently eligibility_caste="[]"
    caste_row["eligibility_caste"] = '["SC","ST"]'
    rows_with_caste = [caste_row] + rows[1:]

    run_import(db_session, data_source, rows_with_caste)

    scheme = db_session.query(Scheme).filter(Scheme.source_id == "tst-001").first()
    rules = db_session.query(EligibilityRule).filter(EligibilityRule.scheme_id == scheme.id).all()

    social_category_rules = [r for r in rules if r.field == "social_category"]
    assert len(social_category_rules) == 1
    rule = social_category_rules[0]
    assert rule.operator == "in"
    assert rule.value == ["SC", "ST"]  # preserved exactly as the source gave it
    assert not any(r.field == "category" for r in rules)  # never the generic name


def test_content_hash_deterministic_and_excludes_timestamps():
    """The same content fields always hash the same way."""
    fields_a = {"name": "Test Scheme", "summary": "A summary.", "benefit": "₹1,000"}
    fields_b = {"name": "Test Scheme", "summary": "A summary.", "benefit": "₹1,000"}
    assert compute_content_hash(fields_a) == compute_content_hash(fields_b)

    fields_changed = {"name": "Test Scheme", "summary": "A different summary.", "benefit": "₹1,000"}
    assert compute_content_hash(fields_a) != compute_content_hash(fields_changed)


def test_structured_eligibility_rules_created_from_source_columns(db_session, data_source):
    """The source's structured eligibility columns (age min/max, income
    cap) become real structured rules the engine can evaluate — not
    just free text."""
    rows = _load_rows()
    run_import(db_session, data_source, rows)

    scheme = db_session.query(Scheme).filter(Scheme.source_id == "tst-001").first()
    rules = db_session.query(EligibilityRule).filter(EligibilityRule.scheme_id == scheme.id).all()
    structured = [r for r in rules if r.rule_type == "structured"]

    by_field = {r.field: r for r in structured}
    assert by_field["age"].operator in (">=", "<=")
    assert any(r.field == "age" and r.operator == ">=" and r.value == 18 for r in structured)
    assert any(r.field == "age" and r.operator == "<=" and r.value == 25 for r in structured)
    assert any(
        r.field == "annual_family_income" and r.operator == "<=" and r.value == 300000
        for r in structured
    )


def test_eligibility_text_always_preserved_as_text_review(db_session, data_source):
    """Even when structured rules exist, the original free-text
    eligibility description is always preserved too — the structured
    columns are visibly partial relative to it."""
    rows = _load_rows()
    run_import(db_session, data_source, rows)

    scheme = db_session.query(Scheme).filter(Scheme.source_id == "tst-001").first()
    rules = db_session.query(EligibilityRule).filter(EligibilityRule.scheme_id == scheme.id).all()
    text_reviews = [r for r in rules if r.rule_type == "text_review"]

    assert len(text_reviews) == 1
    assert text_reviews[0].field is None
    assert text_reviews[0].operator is None
    assert "central scholarship" in text_reviews[0].raw_text.lower()


def test_no_spurious_rule_when_source_states_no_constraint(db_session, data_source):
    """gender="all" and eligibility_state=["All"] mean "no constraint" —
    the importer must not invent a rule out of a non-constraint."""
    rows = _load_rows()
    run_import(db_session, data_source, rows)

    scheme = db_session.query(Scheme).filter(Scheme.source_id == "tst-001").first()
    rules = db_session.query(EligibilityRule).filter(EligibilityRule.scheme_id == scheme.id).all()

    assert not any(r.field == "gender" for r in rules)
    assert not any(r.field == "state" for r in rules)


def test_eligibility_rule_scope_matches_scheme_state(db_session, data_source):
    """A scheme scoped to a state produces a state-scoped text_review
    rule (the structured rules it carries are evaluated nationally —
    their own value is what encodes the state restriction)."""
    rows = _load_rows()
    run_import(db_session, data_source, rows)

    scheme = db_session.query(Scheme).filter(Scheme.source_id == "tst-002").first()
    rules = db_session.query(EligibilityRule).filter(EligibilityRule.scheme_id == scheme.id).all()
    text_review = next(r for r in rules if r.rule_type == "text_review")

    assert scheme.state == "Tamil Nadu"
    assert text_review.scope == "state"
    assert text_review.scope_value == "Tamil Nadu"

    state_rule = next(r for r in rules if r.field == "state")
    assert state_rule.value == ["Tamil Nadu"]


def test_url_fields_preserved(db_session, data_source):
    """official_source_url and official_application_url are stored
    distinctly and never invented — tst-002 has no apply URL (the
    source's own "null" literal) and must stay None rather than
    falling back to the source URL."""
    rows = _load_rows()
    run_import(db_session, data_source, rows)

    scheme_1 = db_session.query(Scheme).filter(Scheme.source_id == "tst-001").first()
    assert scheme_1.official_source_url == "https://www.myscheme.gov.in/schemes/tst-001"
    assert scheme_1.official_application_url == "https://example.gov.in/apply/tst-001"

    scheme_2 = db_session.query(Scheme).filter(Scheme.source_id == "tst-002").first()
    assert scheme_2.official_source_url == "https://www.myscheme.gov.in/schemes/tst-002"
    assert scheme_2.official_application_url is None  # source said "null" — never invented
