import re
import uuid

from pydantic import BaseModel, Field, field_validator

# Deliberately permissive — the goal is catching typos like a missing
# "@", not RFC 5322 compliance.
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class RegisterRequest(BaseModel):
    """Body for POST /api/auth/register."""

    email: str = Field(max_length=320)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def _normalize_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not _EMAIL_RE.match(value):
            raise ValueError("must be a valid email address")
        return value


class LoginRequest(BaseModel):
    """Body for POST /api/auth/login. No password-strength rules here —
    a wrong password should get "incorrect email or password", not a
    validation error."""

    email: str = Field(max_length=320)
    password: str = Field(max_length=128)

    @field_validator("email")
    @classmethod
    def _normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class UserRead(BaseModel):
    id: uuid.UUID
    email: str
    # The id of this user's saved profile, or null if they haven't
    # completed onboarding yet — lets the frontend send a returning
    # person straight to their results.
    profile_id: uuid.UUID | None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
