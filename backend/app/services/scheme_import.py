"""
The import pipeline that turns a provider's raw records into Scheme
rows, safely and idempotently:

    provider.fetch_schemes()
        -> normalize_record()          (app/services/scheme_normalization.py)
        -> de-duplicate by (data_source_id, source_id)
        -> compute_content_hash()      (app/services/content_hash.py)
        -> create, or update + version, or leave unchanged
        -> mark records no longer seen as inactive
        -> record a SchemeSyncRun

Running this twice against the same dataset must not create duplicate
schemes or spurious versions — see tests/test_scheme_import.py.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.enums import SyncRunStatus
from app.models.scheme import (
    DataSourceRegistry,
    EligibilityRule,
    RequiredDocument,
    Scheme,
    SchemeSyncRun,
    SchemeVersion,
)
from app.services.content_hash import compute_content_hash, snapshot_for_scheme
from app.services.providers.base import SchemeProvider
from app.services.scheme_normalization import normalize_record

logger = logging.getLogger(__name__)


def get_or_create_data_source(
    db: Session,
    *,
    key: str,
    provider_name: str,
    dataset_name: str,
    license: str | None = None,
    source_url: str | None = None,
    collected_at=None,
    attribution: str | None = None,
    notes: str | None = None,
    is_official_government_source: bool = False,
) -> DataSourceRegistry:
    """
    Looks up a DataSourceRegistry row by its stable `key`, creating it
    if this is the first time this source has been imported. Existing
    rows are never silently overwritten by a later call with different
    metadata — update them explicitly if the source's own metadata
    changes.
    """
    existing = db.query(DataSourceRegistry).filter(DataSourceRegistry.key == key).first()
    if existing:
        return existing
    source = DataSourceRegistry(
        key=key,
        provider_name=provider_name,
        dataset_name=dataset_name,
        license=license,
        source_url=source_url,
        collected_at=collected_at,
        attribution=attribution,
        notes=notes,
        is_official_government_source=is_official_government_source,
    )
    db.add(source)
    db.flush()
    return source


def run_import(
    db: Session,
    data_source: DataSourceRegistry,
    rows: list[dict],
) -> SchemeSyncRun:
    """
    Runs the import pipeline against already-fetched raw rows (the
    caller is responsible for draining the provider's async generator —
    see scripts/import_bootstrap_schemes.py — so this function itself
    can stay plain, synchronous SQLAlchemy code).
    """
    sync_run = SchemeSyncRun(data_source_id=data_source.id, status=SyncRunStatus.RUNNING.value)
    db.add(sync_run)
    db.flush()

    errors: list[str] = []
    seen_source_ids: set[str] = set()

    for i, row in enumerate(rows):
        sync_run.records_seen += 1
        result = normalize_record(row)

        if not result.is_valid:
            sync_run.records_failed += 1
            errors.append(f"row {i}: {'; '.join(result.errors)}")
            continue

        source_id = result.fields["source_id"]
        seen_source_ids.add(source_id)

        try:
            with db.begin_nested():  # SAVEPOINT: isolates this row's writes only
                _upsert_scheme(db, data_source, result, sync_run)
        except Exception as exc:  # noqa: BLE001 - one bad record must not fail the whole run
            sync_run.records_failed += 1
            errors.append(f"row {i} (source_id={source_id}): {exc}")
            logger.warning("Failed to import row %s (source_id=%s): %s", i, source_id, exc)
            continue

    deactivated = _deactivate_missing(db, data_source, seen_source_ids)
    sync_run.records_deactivated = deactivated

    records_processed = sync_run.records_created + sync_run.records_updated + sync_run.records_unchanged
    sync_run.status = (
        SyncRunStatus.COMPLETED.value if not errors
        else SyncRunStatus.PARTIAL.value if records_processed > 0
        else SyncRunStatus.FAILED.value
    )
    sync_run.completed_at = datetime.now(timezone.utc)
    if errors:
        # Keep this readable and bounded — not an unbounded dump of every
        # row's error for a dataset with thousands of records.
        preview = errors[:50]
        suffix = f"\n… and {len(errors) - 50} more" if len(errors) > 50 else ""
        sync_run.error_summary = "\n".join(preview) + suffix

    db.commit()
    db.refresh(sync_run)
    return sync_run


def _upsert_scheme(
    db: Session,
    data_source: DataSourceRegistry,
    result,
    sync_run: SchemeSyncRun,
) -> None:
    fields = result.fields
    now = datetime.now(timezone.utc)

    existing = (
        db.query(Scheme)
        .filter(Scheme.data_source_id == data_source.id, Scheme.source_id == fields["source_id"])
        .first()
    )

    new_hash = compute_content_hash(fields)

    if existing is None:
        scheme = Scheme(
            data_source_id=data_source.id,
            content_hash=new_hash,
            last_synced_at=now,
            **fields,
        )
        db.add(scheme)
        db.flush()

        for doc in result.documents:
            db.add(RequiredDocument(scheme_id=scheme.id, name=doc["name"], reason=doc["reason"]))
        for rule in result.eligibility_rules:
            db.add(EligibilityRule(scheme_id=scheme.id, **rule))

        db.add(
            SchemeVersion(
                scheme_id=scheme.id,
                version_number=1,
                snapshot=snapshot_for_scheme(scheme),
                source_updated_at=fields.get("source_updated_at"),
                content_hash=new_hash,
            )
        )
        sync_run.records_created += 1
        return

    if existing.content_hash == new_hash:
        # Unchanged: only bookkeeping, never a new version, never bumps
        # updated_at (onupdate only fires when a mapped column actually
        # changes, and none do here beyond last_synced_at).
        existing.last_synced_at = now
        sync_run.records_unchanged += 1
        return

    # Changed: update the row, create a new version, bump updated_at.
    for key, value in fields.items():
        setattr(existing, key, value)
    existing.content_hash = new_hash
    existing.last_synced_at = now
    existing.updated_at = now
    if fields.get("source_updated_at"):
        existing.source_updated_at = fields["source_updated_at"]
    if existing.status != "active":
        existing.status = "active"

    # Replace structured children with the freshly normalized set.
    for doc in list(existing.required_documents):
        db.delete(doc)
    for doc in result.documents:
        db.add(RequiredDocument(scheme_id=existing.id, name=doc["name"], reason=doc["reason"]))

    for rule in list(existing.eligibility_rules):
        db.delete(rule)
    for rule in result.eligibility_rules:
        db.add(EligibilityRule(scheme_id=existing.id, **rule))

    db.flush()

    next_version_number = (
        db.query(SchemeVersion.version_number)
        .filter(SchemeVersion.scheme_id == existing.id)
        .order_by(SchemeVersion.version_number.desc())
        .limit(1)
        .scalar()
        or 0
    ) + 1
    db.add(
        SchemeVersion(
            scheme_id=existing.id,
            version_number=next_version_number,
            snapshot=snapshot_for_scheme(existing),
            source_updated_at=fields.get("source_updated_at"),
            content_hash=new_hash,
        )
    )
    sync_run.records_updated += 1


def _deactivate_missing(db: Session, data_source: DataSourceRegistry, seen_source_ids: set[str]) -> int:
    """Schemes from this data source that existed before this run but
    weren't seen in it are marked inactive (never deleted — their
    history stays in SchemeVersion).

    If this run saw zero valid records at all (e.g. every row failed
    validation, or the source was empty/unreadable), deactivation is
    skipped entirely rather than being treated as "nothing exists
    anymore" — a failed run should not be able to wipe out the whole
    active catalog for a source.
    """
    if not seen_source_ids:
        return 0
    to_deactivate = (
        db.query(Scheme)
        .filter(
            Scheme.data_source_id == data_source.id,
            Scheme.status == "active",
            ~Scheme.source_id.in_(seen_source_ids),
        )
        .all()
    )
    for scheme in to_deactivate:
        scheme.status = "inactive"
    return len(to_deactivate)
