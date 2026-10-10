"""
Canonical list of India's states and union territories, used to
normalize the free-text "state" values a source dataset provides.

Same source and snapshot date as the frontend's state/district dataset
(src/data/statesAndDistricts.ts): Wikipedia's actively maintained "List
of districts in India", which cites India's Local Government Directory
and Census of India records. Only the top-level state/UT names are
needed here — scheme records are scoped at the state level, not the
district level.
"""

INDIAN_STATES: tuple[str, ...] = (
    "Andaman and Nicobar Islands",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
)

# Lowercase, trimmed -> canonical name, for tolerant matching against
# source data that may vary in case or include common variant spellings.
_CANONICAL_BY_LOWER: dict[str, str] = {s.lower(): s for s in INDIAN_STATES}

# A few common variant spellings seen in public datasets. Extend this
# as real source data reveals more — never guess a state into existence
# that isn't in INDIAN_STATES.
_VARIANTS: dict[str, str] = {
    "orissa": "Odisha",
    "pondicherry": "Puducherry",
    "nct of delhi": "Delhi",
    "delhi (nct)": "Delhi",
    "uttaranchal": "Uttarakhand",
    "dadra & nagar haveli and daman & diu": "Dadra and Nagar Haveli and Daman and Diu",
}


def normalize_state_name(raw: str | None) -> str | None:
    """
    Returns the canonical state/UT name for a raw source value, or None
    if it's blank or doesn't match a known state/UT (never invents or
    guesses a name — an unmatched value should be treated as missing/
    needing review by the caller, not silently coerced).
    """
    if raw is None:
        return None
    cleaned = " ".join(raw.strip().split())
    if not cleaned:
        return None
    lower = cleaned.lower()
    if lower in _CANONICAL_BY_LOWER:
        return _CANONICAL_BY_LOWER[lower]
    if lower in _VARIANTS:
        return _VARIANTS[lower]
    return None
