"""
Normalizes a raw source record into the fields the Scheme model expects,
and into structured EligibilityRule rows where the source data supports
them.

COLUMN MAPPING — confirmed against the actual bootstrap dataset
(Schemes.csv, 4,693 rows, columns: slug, name, description, ministry,
department, state, category, beneficiary_type, benefits,
eligibility_text, application_process, documents_required, apply_url,
official_url, eligibility_age_min, eligibility_age_max,
eligibility_gender, eligibility_caste, eligibility_income_max,
eligibility_residence, eligibility_state, eligibility_disability,
eligibility_bpl, scraped_at). DEFAULT_COLUMN_MAP below matches these
exactly. If a future dataset uses different column names, update the
map (or pass a custom one to normalize_record) — nothing downstream
needs to change.

Unlike a purely free-text source, this dataset already provides
structured eligibility fields (age range, gender, caste, income cap,
residence, state list, disability, BPL). Where those are present, this
module builds real STRUCTURED EligibilityRule rows from them — not
just a text_review fallback. eligibility_text is still always preserved
as a text_review rule too, since the structured fields are visibly
partial relative to the full free-text eligibility description (e.g.
"must not already be a beneficiary of X" isn't captured by any
structured column).
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from typing import Any

from app.core.indian_states import normalize_state_name
from app.models.enums import SchemeCategory, SchemeType

DEFAULT_COLUMN_MAP: dict[str, list[str]] = {
    "source_id": ["slug"],
    "name": ["name"],
    "description": ["description"],
    "ministry": ["ministry"],
    "department": ["department"],
    "state": ["state"],
    "category_raw": ["category"],
    "tags_raw": ["beneficiary_type"],
    "benefits": ["benefits"],
    "eligibility_text": ["eligibility_text"],
    "application_process_raw": ["application_process"],
    "documents_required_raw": ["documents_required"],
    "official_application_url": ["apply_url"],
    "official_source_url": ["official_url"],
    "eligibility_age_min": ["eligibility_age_min"],
    "eligibility_age_max": ["eligibility_age_max"],
    "eligibility_gender": ["eligibility_gender"],
    "eligibility_caste": ["eligibility_caste"],
    "eligibility_income_max": ["eligibility_income_max"],
    "eligibility_residence": ["eligibility_residence"],
    "eligibility_state": ["eligibility_state"],
    "eligibility_disability": ["eligibility_disability"],
    "eligibility_bpl": ["eligibility_bpl"],
}

REQUIRED_NORMALIZED_FIELDS: tuple[str, ...] = ("name", "summary", "eligibility_summary")

_URL_RE = re.compile(r"^https?://", re.IGNORECASE)
_NULLISH = {"null", "none", "n/a", "na", "nil", ""}

_CATEGORY_KEYWORDS: dict[SchemeCategory, tuple[str, ...]] = {
    SchemeCategory.EDUCATION: ("education", "scholarship", "student", "learning"),
    SchemeCategory.WOMEN: ("women", "girl", "maternity", "woman"),
    SchemeCategory.EMPLOYMENT: (
        "employment", "skill", "job", "livelihood", "entrepreneur", "business",
    ),
    SchemeCategory.HEALTHCARE: ("health", "medical", "wellness", "hospital"),
    SchemeCategory.HOUSING: ("housing", "home", "shelter"),
    SchemeCategory.AGRICULTURE: ("agriculture", "farmer", "crop", "irrigation", "rural"),
    SchemeCategory.DISABILITY: ("disability", "divyang", "disable"),
    SchemeCategory.FAMILY_SOCIAL_SECURITY: (
        "pension", "social welfare", "empowerment", "senior citizen", "insurance", "banking",
    ),
}
CATEGORY_FALLBACK = SchemeCategory.FAMILY_SOCIAL_SECURITY

_SCHEME_TYPE_KEYWORDS: dict[SchemeType, tuple[str, ...]] = {
    SchemeType.SCHOLARSHIP: ("scholarship",),
    SchemeType.PENSION: ("pension",),
    SchemeType.INSURANCE: ("insurance", "bima"),
    SchemeType.CERTIFICATION: ("certification", "certificate", "training"),
    SchemeType.SUBSIDY: ("subsidy", "loan", "credit", "interest"),
}
SCHEME_TYPE_FALLBACK = SchemeType.GRANT


@dataclass
class NormalizationResult:
    fields: dict[str, Any] = field(default_factory=dict)
    documents: list[dict[str, str]] = field(default_factory=list)
    eligibility_rules: list[dict[str, Any]] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)

    @property
    def is_valid(self) -> bool:
        return len(self.errors) == 0


def _clean_str(value: Any) -> str | None:
    """Trim/collapse whitespace; treat blank and 'null'-ish literal
    strings (this source encodes missing values as the literal text
    "null") as no value at all."""
    if value is None:
        return None
    text = " ".join(str(value).strip().split())
    if not text or text.lower() in _NULLISH:
        return None
    return text


def _clean_multiline(value: Any) -> str | None:
    """Like _clean_str, but preserves internal newlines — needed for
    fields like documents_required/application_process where each line
    is a separate item (see _split_lines) and collapsing them into one
    line would destroy that structure."""
    if value is None:
        return None
    text = str(value).strip()
    if not text or text.lower() in _NULLISH:
        return None
    # Collapse runs of horizontal whitespace, but keep line breaks.
    lines = [" ".join(line.split()) for line in text.splitlines()]
    result = "\n".join(line for line in lines if line)
    return result or None


def _find_column(row: dict[str, Any], candidates: list[str]) -> str | None:
    lower_row = {k.strip().lower(): v for k, v in row.items() if k is not None}
    for candidate in candidates:
        if candidate.lower() in lower_row:
            cleaned = _clean_str(lower_row[candidate.lower()])
            if cleaned is not None:
                return cleaned
    return None


def _find_column_multiline(row: dict[str, Any], candidates: list[str]) -> str | None:
    lower_row = {k.strip().lower(): v for k, v in row.items() if k is not None}
    for candidate in candidates:
        if candidate.lower() in lower_row:
            cleaned = _clean_multiline(lower_row[candidate.lower()])
            if cleaned is not None:
                return cleaned
    return None


def _normalize_url(value: str | None) -> str | None:
    if value is None:
        return None
    if not _URL_RE.match(value):
        return None
    return value


def _truncate(text: str, max_len: int = 320) -> str:
    if len(text) <= max_len:
        return text
    cut = text[:max_len].rsplit(" ", 1)[0]
    return cut.rstrip(",.;:") + "…"


def _split_lines(text: str | None) -> list[str]:
    """For free-text multi-line fields (application steps, documents) —
    split on newlines, not commas, since the lines themselves contain
    commas as normal prose punctuation."""
    if not text:
        return []
    return [line.strip(" -\t") for line in text.splitlines() if line.strip(" -\t")]


def _split_categories(text: str | None) -> list[str] | None:
    if not text:
        return None
    parts = [p.strip() for p in re.split(r"[,]", text) if p.strip()]
    return parts or None


def _parse_json_list(value: str | None) -> list[str] | None:
    """Parses the source's JSON-array-as-string fields (e.g.
    '["SC","ST"]', '[]', '["All"]'). Returns None for empty/unparseable
    input rather than guessing at a value."""
    if not value:
        return None
    try:
        parsed = json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return None
    if not isinstance(parsed, list) or not parsed:
        return None
    return [str(v).strip() for v in parsed if str(v).strip()]


def _parse_bool(value: str | None) -> bool | None:
    if value is None:
        return None
    lowered = value.strip().lower()
    if lowered in ("true", "yes", "1"):
        return True
    if lowered in ("false", "no", "0"):
        return False
    return None


def _parse_int(value: str | None) -> int | None:
    if value is None:
        return None
    try:
        return int(float(value))
    except ValueError:
        return None


def _parse_float(value: str | None) -> float | None:
    if value is None:
        return None
    # Strip currency symbols/commas some sources embed (e.g. "₹3,00,000").
    cleaned = re.sub(r"[^\d.]", "", value)
    if not cleaned:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def _map_category(raw: str | None) -> SchemeCategory:
    if raw:
        lowered = raw.lower()
        for category, keywords in _CATEGORY_KEYWORDS.items():
            if any(kw in lowered for kw in keywords):
                return category
    return CATEGORY_FALLBACK


def _map_scheme_type(*texts: str | None) -> SchemeType:
    combined = " ".join(t for t in texts if t).lower()
    for scheme_type, keywords in _SCHEME_TYPE_KEYWORDS.items():
        if any(kw in combined for kw in keywords):
            return scheme_type
    return SCHEME_TYPE_FALLBACK


def _slugify_source_value(raw: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", raw.lower()).strip("-")
    return slug or "scheme"


def normalize_record(
    row: dict[str, Any], column_map: dict[str, list[str]] | None = None
) -> NormalizationResult:
    mapping = column_map or DEFAULT_COLUMN_MAP
    result = NormalizationResult()

    name = _find_column(row, mapping["name"])
    description = _find_column_multiline(row, mapping["description"])
    eligibility_text = _find_column_multiline(row, mapping["eligibility_text"])

    if not name:
        result.errors.append("missing required field: name")
    if not description:
        result.errors.append("missing required field: description")
    if not eligibility_text:
        result.errors.append("missing required field: eligibility_text")

    if not result.is_valid:
        return result

    summary = _truncate(description)

    # --- location / level ---
    state_raw = _find_column(row, mapping["state"])
    is_central = bool(state_raw) and state_raw.strip().lower() == "central"
    state = None if is_central else (normalize_state_name(state_raw) if state_raw else None)
    level = "central" if is_central else ("state" if state else None)

    # --- identity ---
    source_slug = _find_column(row, mapping["source_id"])
    source_id = source_slug or _slugify_source_value(name)
    slug = _slugify_source_value(source_slug or name)

    # --- category / type ---
    category_raw = _find_column(row, mapping["category_raw"])
    benefits = _find_column_multiline(row, mapping["benefits"])
    scheme_type = _map_scheme_type(name, category_raw, benefits)

    ministry = _find_column(row, mapping["ministry"])
    department = _find_column(row, mapping["department"])
    source_label = department or ministry

    income_max = _parse_float(_find_column(row, mapping["eligibility_income_max"]))

    result.fields = {
        "source_id": source_id,
        "slug": slug,
        "name": name,
        "short_title": None,
        "level": level,
        "ministry": ministry,
        "department": department,
        "state": state,
        "category": _map_category(f"{category_raw or ''} {name}").value,
        "categories": _split_categories(category_raw),
        "tags": _split_categories(_find_column(row, mapping["tags_raw"])),
        "scheme_type": scheme_type.value,
        "summary": summary,
        "description": description,
        "benefit": _truncate(benefits, 280) if benefits else "See scheme details",
        "benefits": benefits,
        "eligibility_summary": eligibility_text,
        "who_can_apply": eligibility_text,
        "official_source_url": _normalize_url(_find_column(row, mapping["official_source_url"])),
        "official_source_label": source_label,
        "official_application_url": _normalize_url(
            _find_column(row, mapping["official_application_url"])
        ),
        "education_levels": None,
        "max_annual_income": income_max,
    }

    # --- documents: newline-delimited free text, one document per line ---
    documents_raw = _find_column_multiline(row, mapping["documents_required_raw"])
    doc_lines = _split_lines(documents_raw)
    if doc_lines:
        result.documents = [
            {"name": _truncate(line, 200), "reason": "Listed as required by the source"}
            for line in doc_lines
        ]
    result.fields["documents_required_raw"] = documents_raw if not doc_lines else None

    # --- application process: newline-delimited ordered steps ---
    process_raw = _find_column_multiline(row, mapping["application_process_raw"])
    steps = _split_lines(process_raw)
    result.fields["application_process"] = steps if steps else ([process_raw] if process_raw else [])

    # --- structured eligibility rules, built from the source's own
    # structured columns. Each is only created when the source actually
    # states a constraint (e.g. gender != "all") — never invented. ---
    rules: list[dict[str, Any]] = []

    age_min = _parse_int(_find_column(row, mapping["eligibility_age_min"]))
    if age_min is not None:
        rules.append(_national_rule("age", ">=", age_min, "eligibility_age_min"))
    age_max = _parse_int(_find_column(row, mapping["eligibility_age_max"]))
    if age_max is not None:
        rules.append(_national_rule("age", "<=", age_max, "eligibility_age_max"))

    gender = _find_column(row, mapping["eligibility_gender"])
    if gender and gender.lower() not in ("all", "any"):
        rules.append(_national_rule("gender", "=", gender.title(), "eligibility_gender"))

    castes = _parse_json_list(_find_column(row, mapping["eligibility_caste"]))
    if castes and castes != ["All"]:
        rules.append(_national_rule("social_category", "in", castes, "eligibility_caste"))

    if income_max is not None:
        rules.append(_national_rule("annual_family_income", "<=", income_max, "eligibility_income_max"))

    residence = _find_column(row, mapping["eligibility_residence"])
    if residence and residence.lower() not in ("both", "all", "any"):
        rules.append(_national_rule("area_type", "=", residence.title(), "eligibility_residence"))

    eligible_states = _parse_json_list(_find_column(row, mapping["eligibility_state"]))
    if eligible_states and eligible_states != ["All"]:
        normalized_states = [normalize_state_name(s) or s for s in eligible_states]
        rules.append(_national_rule("state", "in", normalized_states, "eligibility_state"))

    if _parse_bool(_find_column(row, mapping["eligibility_disability"])) is True:
        # Normalized to the current Phase 2A DisabilityStatus enum
        # (Yes/No/Unknown) — this scheme requires the applicant to have
        # a disability. Never store the pre-Phase-2A "None" sentinel.
        rules.append(_national_rule("disability_status", "=", "Yes", "eligibility_disability"))

    if _parse_bool(_find_column(row, mapping["eligibility_bpl"])) is True:
        # Normalized to the current Phase 2A BplStatus enum (Yes/No/Unknown)
        # — a JSON boolean here would never match the profile's string enum.
        rules.append(_national_rule("bpl_status", "=", "Yes", "eligibility_bpl"))

    # The structured columns above are visibly partial relative to the
    # full free-text description (e.g. "must not already receive X" has
    # no structured column) — always preserve the original text too.
    rules.append(
        {
            "rule_type": "text_review",
            "raw_text": eligibility_text,
            "scope": "state" if state else "national",
            "scope_value": state,
            "source_reference": "eligibility_text",
        }
    )

    result.eligibility_rules = rules
    return result


def _national_rule(field_name: str, operator: str, value: Any, source_reference: str) -> dict[str, Any]:
    return {
        "rule_type": "structured",
        "field": field_name,
        "operator": operator,
        "value": value,
        "scope": "national",
        "scope_value": None,
        "source_reference": source_reference,
    }