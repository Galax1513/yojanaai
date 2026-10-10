"""
Controlled "what kind of support are you looking for?" taxonomy, used
to NARROW scheme lists (catalog browsing and a profile's potential
matches). It never affects eligibility: a profile's MATCH /
NEEDS_INFORMATION / NOT_MATCHED status comes only from
app/services/eligibility_engine.py, and filtering by support category
happens strictly afterwards.

Every category and subcategory here is a deterministic rule over fields
the scheme record already has — no LLM, no keyword guessing over free
text, no per-scheme manual labels. The fields used are:

  * Scheme.categories — the source dataset's own multi-label category
    list (myScheme-style labels such as "Education & Learning"). This is
    the primary signal. Note: the importer splits the source string on
    commas, so three source labels that themselves contain a comma are
    stored as two halves that always appear together:
        "Agriculture,Rural & Environment"
            -> "Agriculture" + "Rural & Environment"
        "Banking,Financial Services and Insurance"
            -> "Banking" + "Financial Services and Insurance"
        "Science, IT & Communications"
            -> "Science" + "IT & Communications"
    Each such pair is treated as one label below (matching either half).

  * Scheme.scheme_type — used for subcategories, but only the values
    that were checked against the real data and found dependable:
        scholarship   ~80% have scholarship/fellowship/stipend wording
                      in the scheme name itself; the rest in benefits
        pension       ~81% have "pension" in the scheme name
        subsidy       ~88% have "subsidy"/"loan" in name or benefits; the
                      rest matched only "credit"/"interest" in prose
    Deliberately NOT used:
        insurance     the importer matched the word "Insurance" in the
                      Banking/Financial Services label's own name, and
                      elsewhere any passing mention in benefits text —
                      only ~20% of non-banking ones are insurance schemes
        certification many are awards/fellowships that merely issue a
                      certificate, not training
        grant         the importer's fallback when nothing else matched;
                      it carries no meaning

  * A structured disability_status rule built from the source's own
    eligibility_disability column. The source has no disability
    category label, so this is the only structured evidence that a
    scheme is aimed at persons with disabilities. Two encodings exist:
    the current importer writes disability_status = "Yes", while rows
    imported before Phase 2A hold disability_status != "None". Both mean
    the source marked the scheme as requiring a disability, so both are
    recognised here (read-only — the rules themselves are untouched).

A scheme can belong to several support categories (the source labels
are multi-label); within any single filtered list each scheme still
appears at most once.
"""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass, field


@dataclass(frozen=True)
class SupportSubcategory:
    key: str
    label: str
    # Exactly one of these is set: a subcategory is either a scheme_type
    # within its parent category, or (for "Other") one source label.
    scheme_types: frozenset[str] = field(default_factory=frozenset)
    source_categories: frozenset[str] = field(default_factory=frozenset)

    def matches(self, scheme_type: str, source_categories: frozenset[str]) -> bool:
        if self.scheme_types:
            return scheme_type in self.scheme_types
        return bool(self.source_categories & source_categories)


@dataclass(frozen=True)
class SupportCategory:
    key: str
    label: str
    description: str
    # Matches when the scheme carries any of these source labels...
    source_categories: frozenset[str] = field(default_factory=frozenset)
    # ...or, for disability, when it has a structured disability rule.
    requires_disability_rule: bool = False
    subcategories: tuple[SupportSubcategory, ...] = ()

    def matches(self, source_categories: frozenset[str], requires_disability: bool) -> bool:
        if self.requires_disability_rule:
            return requires_disability
        return bool(self.source_categories & source_categories)

    def get_subcategory(self, key: str) -> SupportSubcategory | None:
        return next((s for s in self.subcategories if s.key == key), None)


def _by_type(key: str, label: str, scheme_type: str) -> SupportSubcategory:
    return SupportSubcategory(key=key, label=label, scheme_types=frozenset({scheme_type}))


def _by_label(key: str, label: str, *source_labels: str) -> SupportSubcategory:
    return SupportSubcategory(key=key, label=label, source_categories=frozenset(source_labels))


SCHOLARSHIPS = _by_type("scholarship", "Scholarships", "scholarship")
PENSIONS = _by_type("pension", "Pensions", "pension")
SUBSIDIES_LOANS = _by_type("subsidy-loan", "Subsidies & loans", "subsidy")

OTHER_SUBCATEGORIES: tuple[SupportSubcategory, ...] = (
    _by_label("sports-culture", "Sports & culture", "Sports & Culture"),
    _by_label("science-it", "Science, IT & communications", "Science", "IT & Communications"),
    _by_label("transport-infrastructure", "Transport & infrastructure", "Transport & Infrastructure"),
    _by_label("travel-tourism", "Travel & tourism", "Travel & Tourism"),
    _by_label("utility-sanitation", "Utilities & sanitation", "Utility & Sanitation"),
    _by_label("law-justice", "Law & justice", "Law & Justice"),
    _by_label("public-safety", "Public safety", "Public Safety"),
)

# Keys for the first eight intentionally match the SchemeCategory values
# the homepage already links to (/discover?category=education etc.), so
# those links keep working. A scheme_type subcategory is only listed
# under a category where the real catalog has at least ten such schemes.
SUPPORT_CATEGORIES: tuple[SupportCategory, ...] = (
    SupportCategory(
        key="education",
        label="Education & scholarships",
        description="Scholarships, fee support and help for students",
        source_categories=frozenset({"Education & Learning"}),
        subcategories=(SCHOLARSHIPS, SUBSIDIES_LOANS),
    ),
    SupportCategory(
        key="employment",
        label="Employment & skills",
        description="Jobs, skilling and livelihood support",
        source_categories=frozenset({"Skills & Employment"}),
        subcategories=(SUBSIDIES_LOANS,),
    ),
    SupportCategory(
        key="business",
        label="Business & entrepreneurship",
        description="Starting or growing an enterprise",
        source_categories=frozenset({"Business & Entrepreneurship"}),
        subcategories=(SUBSIDIES_LOANS,),
    ),
    SupportCategory(
        key="agriculture",
        label="Agriculture & rural",
        description="Farmers, rural livelihoods and the environment",
        source_categories=frozenset({"Agriculture", "Rural & Environment"}),
        subcategories=(SUBSIDIES_LOANS,),
    ),
    SupportCategory(
        key="healthcare",
        label="Healthcare",
        description="Medical assistance, treatment and health cover",
        source_categories=frozenset({"Health & Wellness"}),
        subcategories=(PENSIONS,),
    ),
    SupportCategory(
        key="housing",
        label="Housing",
        description="Building, buying or improving a home",
        source_categories=frozenset({"Housing & Shelter"}),
        subcategories=(SUBSIDIES_LOANS,),
    ),
    SupportCategory(
        key="women",
        label="Women & children",
        description="Support for women, girls and families with children",
        source_categories=frozenset({"Women and Child"}),
        subcategories=(SCHOLARSHIPS, PENSIONS, SUBSIDIES_LOANS),
    ),
    SupportCategory(
        key="disability",
        label="Disability support",
        description="Schemes for persons with disabilities",
        requires_disability_rule=True,
        subcategories=(PENSIONS, SCHOLARSHIPS),
    ),
    SupportCategory(
        key="family-social-security",
        label="Social welfare & pensions",
        description="Pensions, welfare and social security",
        source_categories=frozenset({"Social welfare & Empowerment"}),
        subcategories=(PENSIONS, SCHOLARSHIPS, SUBSIDIES_LOANS),
    ),
    SupportCategory(
        key="financial",
        label="Banking & financial services",
        description="Credit, banking and financial inclusion",
        source_categories=frozenset({"Banking", "Financial Services and Insurance"}),
        subcategories=(PENSIONS,),
    ),
    SupportCategory(
        key="other",
        label="Other",
        description="Sports, science, transport, tourism and more",
        source_categories=frozenset().union(*(s.source_categories for s in OTHER_SUBCATEGORIES)),
        subcategories=OTHER_SUBCATEGORIES,
    ),
)

_BY_KEY = {c.key: c for c in SUPPORT_CATEGORIES}


class UnknownSupportFilter(ValueError):
    pass


@dataclass(frozen=True)
class SupportFilter:
    category: SupportCategory
    subcategory: SupportSubcategory | None


def resolve_filter(category_key: str | None, subcategory_key: str | None) -> SupportFilter | None:
    """Validates query-string keys. Returns None when no filter is
    requested; raises UnknownSupportFilter for keys that don't exist."""
    if not category_key:
        if subcategory_key:
            raise UnknownSupportFilter("A support subcategory needs a support category.")
        return None
    category = _BY_KEY.get(category_key)
    if category is None:
        raise UnknownSupportFilter(f"Unknown support category: {category_key}")
    subcategory = None
    if subcategory_key:
        subcategory = category.get_subcategory(subcategory_key)
        if subcategory is None:
            raise UnknownSupportFilter(
                f"Unknown subcategory '{subcategory_key}' for support category '{category_key}'"
            )
    return SupportFilter(category=category, subcategory=subcategory)


def _enum_value(value) -> str:
    return value.value if hasattr(value, "value") else str(value)


def is_disability_requirement(rule_type, field_name, operator, value) -> bool:
    """True for a structured rule saying the scheme requires a
    disability, in either its current (= "Yes") or pre-Phase-2A
    (!= "None") encoding."""
    if _enum_value(rule_type) != "structured" or field_name != "disability_status":
        return False
    op = _enum_value(operator)
    return (op == "=" and value == "Yes") or (op == "!=" and value == "None")


def requires_disability_from_rules(rules: Iterable) -> bool:
    return any(
        is_disability_requirement(r.rule_type, r.field, r.operator, r.value) for r in rules
    )


@dataclass(frozen=True)
class SchemeSupportProfile:
    """The three facts the taxonomy reads from a scheme."""

    source_categories: frozenset[str]
    scheme_type: str
    requires_disability: bool

    @classmethod
    def build(
        cls, categories: list[str] | None, scheme_type: str, requires_disability: bool
    ) -> SchemeSupportProfile:
        return cls(
            source_categories=frozenset(categories or ()),
            scheme_type=scheme_type,
            requires_disability=requires_disability,
        )


def matches_filter(profile: SchemeSupportProfile, support_filter: SupportFilter | None) -> bool:
    if support_filter is None:
        return True
    if not support_filter.category.matches(profile.source_categories, profile.requires_disability):
        return False
    if support_filter.subcategory is None:
        return True
    return support_filter.subcategory.matches(profile.scheme_type, profile.source_categories)


def compute_facets(profiles: Iterable[SchemeSupportProfile]) -> list[dict]:
    """Counts per category and subcategory over the given schemes, in
    taxonomy order. Every category is always present (count may be 0)
    so the layout stays stable; the UI decides how to show zeroes."""
    profiles = list(profiles)
    facets = []
    for category in SUPPORT_CATEGORIES:
        in_category = [
            p for p in profiles if category.matches(p.source_categories, p.requires_disability)
        ]
        facets.append(
            {
                "category": category.key,
                "count": len(in_category),
                "subcategories": [
                    {
                        "subcategory": sub.key,
                        "count": sum(
                            1 for p in in_category if sub.matches(p.scheme_type, p.source_categories)
                        ),
                    }
                    for sub in category.subcategories
                ],
            }
        )
    return facets
