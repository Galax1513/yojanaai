"""
Schemas for the support-category taxonomy (app/services/support_taxonomy.py)
— the "what kind of support are you looking for?" filter. These describe
how to NARROW a list; they never say anything about eligibility.
"""

from pydantic import BaseModel


class SupportSubcategoryRead(BaseModel):
    key: str
    label: str


class SupportCategoryRead(BaseModel):
    key: str
    label: str
    description: str
    subcategories: list[SupportSubcategoryRead]


class SupportSubcategoryFacet(BaseModel):
    subcategory: str
    count: int


class SupportFacet(BaseModel):
    """How many items in the current list (before the support filter
    itself is applied) fall under this category and each subcategory."""

    category: str
    count: int
    subcategories: list[SupportSubcategoryFacet]
