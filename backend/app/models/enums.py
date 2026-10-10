"""
Plain Python enums shared between the SQLAlchemy models and the Pydantic
schemas. Keeping them here (rather than duplicating string literals in
both layers) is what lets validation stay in sync with what the
database can actually store.
"""

from enum import Enum


class SchemeCategory(str, Enum):
    EDUCATION = "education"
    WOMEN = "women"
    EMPLOYMENT = "employment"
    HEALTHCARE = "healthcare"
    HOUSING = "housing"
    AGRICULTURE = "agriculture"
    DISABILITY = "disability"
    FAMILY_SOCIAL_SECURITY = "family-social-security"


class SchemeType(str, Enum):
    SCHOLARSHIP = "scholarship"
    SUBSIDY = "subsidy"
    CERTIFICATION = "certification"
    PENSION = "pension"
    INSURANCE = "insurance"
    GRANT = "grant"


class DataStatus(str, Enum):
    """
    Whether a scheme record is confirmed against an official government
    source or is placeholder content used to build and test the product.
    Production UI must never present a "development" record as verified
    government data.
    """

    DEVELOPMENT = "development"
    VERIFIED = "verified"


class SchemeLevel(str, Enum):
    """Whether a scheme is run by the central government or a specific state."""

    CENTRAL = "central"
    STATE = "state"


class SchemeStatus(str, Enum):
    """
    Lifecycle status — distinct from DataStatus. This tracks whether a
    scheme is currently active in our catalog (e.g. still present in the
    source on the last sync) vs retired, not whether it's been verified
    against an official source.
    """

    ACTIVE = "active"
    INACTIVE = "inactive"
    DEPRECATED = "deprecated"


class RuleType(str, Enum):
    """
    A STRUCTURED rule has field/operator/value the eligibility engine can
    evaluate deterministically. A TEXT_REVIEW rule means the source only
    gave us natural-language eligibility text that could not be safely
    converted to a structured rule — the original text is preserved in
    raw_text and the rule is flagged for manual/structured review rather
    than an invented structured rule being guessed at.
    """

    STRUCTURED = "structured"
    TEXT_REVIEW = "text_review"


class RuleOperator(str, Enum):
    GTE = ">="
    LTE = "<="
    GT = ">"
    LT = "<"
    EQ = "="
    NEQ = "!="
    IN = "in"
    NOT_IN = "not_in"


class RuleScope(str, Enum):
    NATIONAL = "national"
    STATE = "state"
    DISTRICT = "district"


class SyncRunStatus(str, Enum):
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL = "partial"


class DeadlineUrgency(str, Enum):
    CLOSING_SOON = "closing-soon"
    OPEN = "open"
    UPCOMING = "upcoming"


class AreaType(str, Enum):
    URBAN = "Urban"
    RURAL = "Rural"


class Gender(str, Enum):
    FEMALE = "Female"
    MALE = "Male"
    OTHER = "Other"
    PREFER_NOT_TO_SAY = "Prefer not to say"


class EducationLevel(str, Enum):
    BELOW_CLASS_10 = "Below Class 10"
    CLASS_10 = "Class 10"
    CLASS_12 = "Class 12"
    UNDERGRADUATE = "Undergraduate"
    POSTGRADUATE = "Postgraduate"
    DIPLOMA = "Diploma"
    DOCTORATE = "Doctorate"
    OTHER = "Other"


class YearOfStudy(str, Enum):
    YEAR_1 = "1st Year"
    YEAR_2 = "2nd Year"
    YEAR_3 = "3rd Year"
    YEAR_4 = "4th Year"
    YEAR_5 = "5th Year"
    FINAL_YEAR = "Final Year"


class InstitutionType(str, Enum):
    GOVERNMENT = "Government"
    PRIVATE = "Private"
    AIDED = "Aided"
    OTHER = "Other"


class EmploymentStatus(str, Enum):
    STUDENT = "Student"
    FARMER = "Farmer"
    EMPLOYED = "Employed"
    UNEMPLOYED = "Unemployed"
    OTHER = "Other"


class SocialCategory(str, Enum):
    GENERAL = "General"
    OBC = "OBC"
    SC = "SC"
    ST = "ST"
    EWS = "EWS"
    OTHER = "Other"
    PREFER_NOT_TO_SAY = "Prefer not to say"


class DisabilityStatus(str, Enum):
    """
    Phase 2A collects only whether the person has a disability, not what
    kind — that level of detail (a future DisabilityType enum) is
    deliberately deferred until an actual eligibility rule demonstrates
    it's needed, per product decision. UNKNOWN is a distinct, explicit
    answer from NO — never conflate "doesn't have one" with "hasn't
    said" in completeness or any future matching logic.
    """

    YES = "Yes"
    NO = "No"
    UNKNOWN = "Unknown"


class BplStatus(str, Enum):
    """Whether the person's household holds a Below Poverty Line card.
    UNKNOWN is distinct from NO — a person who doesn't know their BPL
    status is not the same as a person who has confirmed they don't
    have one."""

    YES = "Yes"
    NO = "No"
    UNKNOWN = "Unknown"