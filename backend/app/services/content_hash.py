"""
Deterministic content hashing for Scheme records.

The hash is computed only from fields a person would recognise as "the
scheme's content changing" — name, description, benefits, eligibility
text, documents, application steps, category/state/URLs, and so on. It
deliberately excludes anything that changes on every sync regardless of
content (last_synced_at, updated_at, created_at) so that re-running an
import against unchanged source data never produces spurious updates or
versions.
"""

from __future__ import annotations

import hashlib
import json
from typing import Any

# The fields that define a scheme's "content" for hashing purposes.
# Keep this list in sync with what a human would consider a real change
# to the scheme (see module docstring) — NOT with every column on the
# model. Timestamps, sync bookkeeping, and internal IDs are excluded on
# purpose.
CONTENT_FIELDS: tuple[str, ...] = (
    "source_id",
    "slug",
    "name",
    "short_title",
    "level",
    "ministry",
    "department",
    "state",
    "category",
    "categories",
    "tags",
    "scheme_type",
    "summary",
    "description",
    "benefit",
    "benefits",
    "eligibility_summary",
    "who_can_apply",
    "documents_required_raw",
    "application_process",
    "official_source_url",
    "official_source_label",
    "official_application_url",
    "education_levels",
    "max_annual_income",
    "deadline_label",
    "deadline_date",
    "deadline_urgency",
)


def _normalize_value(value: Any) -> Any:
    """Make a value stable for hashing: dates/decimals become strings,
    lists get a stable order where order isn't meaningful content."""
    if value is None:
        return None
    if isinstance(value, (list, tuple)):
        return [str(v) for v in value]
    if hasattr(value, "isoformat"):  # date/datetime
        return value.isoformat()
    return str(value) if not isinstance(value, (str, int, float, bool)) else value


def compute_content_hash(fields: dict[str, Any]) -> str:
    """
    fields: a dict of the CONTENT_FIELDS values (e.g. built from a
    normalized import record, or from an existing Scheme's __dict__).
    Extra keys are ignored; missing keys are treated as None.
    """
    normalized = {key: _normalize_value(fields.get(key)) for key in CONTENT_FIELDS}
    stable_json = json.dumps(normalized, sort_keys=True, ensure_ascii=True, separators=(",", ":"))
    return hashlib.sha256(stable_json.encode("utf-8")).hexdigest()


def content_hash_for_scheme(scheme) -> str:
    """Convenience wrapper: compute the hash directly from a Scheme ORM
    instance (or anything with matching attributes)."""
    fields = {key: getattr(scheme, key, None) for key in CONTENT_FIELDS}
    return compute_content_hash(fields)


def snapshot_for_scheme(scheme) -> dict[str, Any]:
    """The dict stored in SchemeVersion.snapshot — the content fields
    plus a couple of identifying, non-content fields useful when reading
    a snapshot back later."""
    snapshot = {key: _normalize_value(getattr(scheme, key, None)) for key in CONTENT_FIELDS}
    snapshot["id"] = str(scheme.id)
    return snapshot
