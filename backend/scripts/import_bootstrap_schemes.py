"""
Bootstrap import CLI: reads the third-party bootstrap CSV and populates
the schemes catalog. Safe to run more than once — re-running against an
unchanged file updates nothing (see app/services/scheme_import.py).

Usage:
    python -m scripts.import_bootstrap_schemes --csv-path /path/to/dataset.csv

Or set BOOTSTRAP_DATASET_PATH in the environment / .env and omit
--csv-path. Neither the path nor the dataset itself is hardcoded into
application code — see .env.example.

IMPORTANT: --source-license, --source-url, --source-collected and
--source-name only take effect the FIRST time this source's `key` is
imported (get_or_create_data_source never overwrites an existing
DataSourceRegistry row) — see app/services/scheme_import.py.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal  # noqa: E402
from app.services.providers.bootstrap_dataset_provider import (  # noqa: E402
    BootstrapDatasetProvider,
    BootstrapDatasetProviderError,
)
from app.services.scheme_import import get_or_create_data_source, run_import  # noqa: E402


async def _collect_rows(provider: BootstrapDatasetProvider) -> list[dict]:
    return [row async for row in provider.fetch_schemes()]


def _derive_collected_at(rows: list[dict]) -> str | None:
    """
    If the dataset carries its own per-record collection timestamp (this
    bootstrap dataset has a `scraped_at` column), use the most recent
    one as a representative "collected at" date for the whole source —
    derived from the data itself, never invented. Returns an ISO date
    string or None if no such column is present.
    """
    dates = []
    for row in rows:
        raw = row.get("scraped_at")
        if not raw:
            continue
        try:
            dates.append(datetime.fromisoformat(raw.strip().replace(" ", "T", 1)))
        except ValueError:
            continue
    if not dates:
        return None
    return max(dates).date().isoformat()


def main() -> int:
    parser = argparse.ArgumentParser(description="Import the bootstrap scheme dataset into PostgreSQL.")
    parser.add_argument(
        "--csv-path",
        default=os.environ.get("BOOTSTRAP_DATASET_PATH"),
        help="Path to the bootstrap CSV. Defaults to the BOOTSTRAP_DATASET_PATH env var.",
    )
    parser.add_argument(
        "--source-license",
        default=os.environ.get("BOOTSTRAP_DATASET_LICENSE", "CC BY 4.0"),
    )
    parser.add_argument("--source-url", default=os.environ.get("BOOTSTRAP_DATASET_URL"))
    parser.add_argument("--source-collected", default=os.environ.get("BOOTSTRAP_DATASET_COLLECTED_AT"))
    parser.add_argument(
        "--source-name",
        default=os.environ.get("BOOTSTRAP_DATASET_NAME", "SmartDuke Indian Government Schemes Dataset"),
    )
    args = parser.parse_args()

    if not args.csv_path:
        print(
            "No CSV path given. Pass --csv-path or set BOOTSTRAP_DATASET_PATH.",
            file=sys.stderr,
        )
        return 2

    provider = BootstrapDatasetProvider(args.csv_path)

    try:
        rows = asyncio.run(_collect_rows(provider))
    except BootstrapDatasetProviderError as exc:
        print(f"Could not read dataset: {exc}", file=sys.stderr)
        return 1

    db = SessionLocal()
    try:
        collected_at = args.source_collected or _derive_collected_at(rows)
        data_source = get_or_create_data_source(
            db,
            key=provider.source_info.key,
            provider_name="SmartDuke (third party, unverified provenance)",
            dataset_name=args.source_name,
            license=args.source_license,
            source_url=args.source_url,
            collected_at=collected_at,
            attribution=f"Data provided by SmartDuke. Licensed under {args.source_license}.",
            notes=(
                "PROVENANCE UNVERIFIED. This dataset's underlying source (scheme records "
                "referencing myscheme.gov.in URLs, with a scraped_at column) has not been "
                "independently confirmed as an authorized redistribution. It is for "
                "development/bootstrap purposes only until the redistribution/provenance "
                "position is established. This is NOT an official Government of India "
                "dataset, is NOT published or endorsed by the Government of India, and no "
                "scheme record from it should be marked data_status='verified'. The "
                "SmartDuke attribution and CC BY 4.0 license are recorded here exactly as "
                "provided with the dataset; they describe SmartDuke's own claimed license "
                "for their compilation, not an official government license."
            ),
            is_official_government_source=False,
        )
        db.commit()
        db.refresh(data_source)
        sync_run = run_import(db, data_source, rows)
    finally:
        db.close()

    status_value = sync_run.status.value if hasattr(sync_run.status, "value") else sync_run.status
    print(f"Sync run #{sync_run.id} — status: {status_value}")
    print(f"  seen:        {sync_run.records_seen}")
    print(f"  created:     {sync_run.records_created}")
    print(f"  updated:     {sync_run.records_updated}")
    print(f"  unchanged:   {sync_run.records_unchanged}")
    print(f"  deactivated: {sync_run.records_deactivated}")
    print(f"  failed:      {sync_run.records_failed}")
    if sync_run.error_summary:
        print("\nErrors (first 50):")
        print(sync_run.error_summary)

    return 0 if sync_run.status in ("completed", "partial") else 1


if __name__ == "__main__":
    raise SystemExit(main())
