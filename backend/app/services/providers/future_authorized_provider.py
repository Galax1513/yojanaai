"""
Placeholder for a future, authorized live data provider (e.g. an
official API or a licensed data-sharing agreement), which would
periodically synchronize the database the same way BootstrapDatasetProvider
does once, on an ongoing basis.

NOT IMPLEMENTED. No network calls exist anywhere in this file or in this
phase of the project. This class exists only to show where a future
provider plugs into the same SchemeProvider interface — implementing it
is a distinct, later piece of work that requires an actual authorization
agreement to exist first.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

from app.services.providers.base import ProviderSourceInfo, SchemeProvider


class FutureAuthorizedProvider(SchemeProvider):
    """Not implemented. See module docstring."""

    def __init__(self, *_args: Any, **_kwargs: Any):
        raise NotImplementedError(
            "FutureAuthorizedProvider is an architectural placeholder only. "
            "It requires an authorized data source/API agreement that does not exist yet."
        )

    @property
    def source_info(self) -> ProviderSourceInfo:
        raise NotImplementedError

    async def fetch_schemes(self) -> AsyncIterator[dict[str, Any]]:
        raise NotImplementedError
        yield  # pragma: no cover
