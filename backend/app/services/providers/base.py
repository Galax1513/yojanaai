"""
The SchemeProvider abstraction.

    External scheme data source
            ↓
        SchemeProvider            <-- this module
            ↓
    validation + normalization    <-- app/services/scheme_import.py
            ↓
        PostgreSQL

A provider's only job is to yield raw scheme records exactly as its
source gives them — no field-name normalization, no validation, no
network calls beyond reading from the source itself. That keeps the
rest of the import pipeline (validation, normalization, hashing,
de-duplication, versioning) completely independent of which provider
supplied the data, so a future authorized/live provider can be swapped
in without touching that pipeline.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ProviderSourceInfo:
    """
    Identifies which DataSourceRegistry row a provider's records should
    be attributed to. The importer looks this up (or creates it) by
    `key` — the actual provider/license/attribution text lives in the
    database (DataSourceRegistry), not hardcoded in provider classes, so
    it can be corrected or updated without a code change.
    """

    key: str


class SchemeProvider(ABC):
    """Abstract base for anything that can supply raw scheme records."""

    @property
    @abstractmethod
    def source_info(self) -> ProviderSourceInfo:
        """Which DataSourceRegistry entry this provider's records belong to."""

    @abstractmethod
    async def fetch_schemes(self) -> AsyncIterator[dict[str, Any]]:
        """
        Yield raw scheme records, one dict per source record, with
        whatever keys/shape the source itself uses. Implementations
        should NOT rename fields to match our Scheme model — that
        normalization happens in the import pipeline, independent of
        the provider.
        """
        raise NotImplementedError
        yield  # pragma: no cover - makes this an async generator for type checkers
