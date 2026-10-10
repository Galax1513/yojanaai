"""
Reads the bootstrap third-party CSV dataset and yields raw rows exactly
as the file has them — no column renaming, no validation. That mapping
happens in app/services/scheme_import.py's normalization step, kept
separate specifically so it can be adjusted once the actual dataset's
column names are known, without touching this provider.

This provider makes NO network calls. It only reads a local CSV file
whose path comes from configuration (BOOTSTRAP_DATASET_PATH), never
hardcoded to one machine's filesystem.
"""

from __future__ import annotations

import csv
from collections.abc import AsyncIterator
from pathlib import Path
from typing import Any

from app.services.providers.base import ProviderSourceInfo, SchemeProvider

BOOTSTRAP_SOURCE_KEY = "bootstrap-dataset-v1"


class BootstrapDatasetProviderError(Exception):
    """Raised for problems reading the bootstrap dataset itself (missing
    file, unreadable CSV) — distinct from a single record being invalid,
    which the import pipeline handles per-record instead of failing the
    whole run."""


class BootstrapDatasetProvider(SchemeProvider):
    """Yields raw rows from a local CSV file, one dict per row."""

    def __init__(self, csv_path: str | Path):
        self._csv_path = Path(csv_path)

    @property
    def source_info(self) -> ProviderSourceInfo:
        return ProviderSourceInfo(key=BOOTSTRAP_SOURCE_KEY)

    async def fetch_schemes(self) -> AsyncIterator[dict[str, Any]]:
        if not self._csv_path.exists():
            raise BootstrapDatasetProviderError(
                f"Bootstrap dataset not found at {self._csv_path}. Set BOOTSTRAP_DATASET_PATH "
                "or pass --csv-path to point at the actual file."
            )
        try:
            with self._csv_path.open("r", encoding="utf-8-sig", newline="") as f:
                reader = csv.DictReader(f)
                if reader.fieldnames is None:
                    raise BootstrapDatasetProviderError(
                        f"{self._csv_path} has no header row — cannot read column names."
                    )
                for row in reader:
                    yield dict(row)
        except csv.Error as exc:
            raise BootstrapDatasetProviderError(f"Could not parse {self._csv_path} as CSV: {exc}") from exc
