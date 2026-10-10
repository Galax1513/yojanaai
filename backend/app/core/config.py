"""
Application configuration, loaded from environment variables (or a .env
file in local development). See .env.example for the full list of
variables this application understands.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Core ---
    ENVIRONMENT: str = "development"

    # --- Database ---
    # e.g. postgresql+psycopg2://user:password@localhost:5432/yojanaai
    DATABASE_URL: str

    # --- CORS ---
    # Comma-separated list of allowed origins, e.g.
    # "http://localhost:5173,http://localhost:5174,http://localhost:4173"
    # Never use "*" outside of local development. Vite's dev server picks
    # 5173 by default but will use 5174, 5175, etc. if that port is
    # already taken (e.g. another dev server already running) — the
    # local-dev default here covers the common range rather than
    # assuming exactly one port. Production should set this explicitly
    # to the real deployed frontend origin(s), never rely on this default.
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:4173"

    # --- Auth ---
    # Secret used to sign login tokens (JWT, HS256). The default is for
    # local development only — production must set a long random value
    # (e.g. `python -c "import secrets; print(secrets.token_urlsafe(64))"`).
    JWT_SECRET: str = "dev-only-insecure-secret-change-me"
    # How long a login stays valid. Long-lived so a person who has
    # entered their details stays signed in across visits.
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if settings.is_production and settings.JWT_SECRET.startswith("dev-only"):
        raise RuntimeError("JWT_SECRET must be set to a real secret in production")
    if settings.is_production:
        origins = settings.cors_origins_list
        if not origins or any(o == "*" or "localhost" in o or "127.0.0.1" in o for o in origins):
            raise RuntimeError("CORS_ORIGINS must list the real frontend origin(s) in production (no '*' or localhost)")
    return settings