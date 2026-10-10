# YojanaAI backend

FastAPI + SQLAlchemy + Alembic + PostgreSQL service for the scheme
catalog and user profiles. Independently runnable — nothing here
depends on the frontend.

## Setup

```bash
cd backend
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
cp .env.example .env
# then edit .env: DATABASE_URL, and (for the bootstrap import)
# BOOTSTRAP_DATASET_PATH
```

## Database

Start PostgreSQL (either is fine):

```bash
# Option A — Docker (from the repo root)
docker compose up -d

# Option B — a PostgreSQL you already have running locally; just make
# sure DATABASE_URL in .env points at it and the database exists:
#   createuser yojanaai --pwprompt
#   createdb yojanaai --owner yojanaai
```

Apply migrations:

```bash
./venv/bin/alembic upgrade head
```

`alembic check` confirms the models and the live schema are in sync at
any time (`./venv/bin/alembic check`).

## Run the API

```bash
./venv/bin/uvicorn app.main:app --reload --port 8000
```

Then open http://localhost:8000/docs (interactive OpenAPI docs) or
http://localhost:8000/api/health.

## Import the bootstrap scheme dataset

```bash
export BOOTSTRAP_DATASET_PATH=/path/to/Schemes.csv
./venv/bin/python scripts/import_bootstrap_schemes.py
```

Safe to run repeatedly against the same file — unchanged records are
left alone (see `records_unchanged` in the printed summary), and no
duplicate schemes are ever created. See the module docstrings in
`app/services/scheme_import.py` and `app/services/scheme_normalization.py`
for how de-duplication, content hashing, and versioning work.

**Provenance note**: the bootstrap dataset this project currently
imports has *unverified* provenance (see `app/services/scheme_import.py`
and the `data_source_registry` table it writes to) — every scheme it
creates is tagged `data_status="development"`, never `"verified"`, and
`data_source_registry.is_official_government_source` is `false`. This
is enforced by the import pipeline, not just documentation.

## Tests

```bash
./venv/bin/pytest tests/ -v
```

Tests run against an isolated in-memory SQLite database (see
`tests/conftest.py`) — they never touch the real Postgres database.

## Project layout

```
app/
  core/          settings, indian_states reference data
  db/            SQLAlchemy engine/session, declarative base
  models/        ORM models + enums
  schemas/       Pydantic request/response schemas
  api/routes/    FastAPI routers
  services/      business logic (content hashing, import pipeline,
                 profile completeness) + providers/ (SchemeProvider
                 abstraction)
scripts/         CLI entry points (bootstrap import)
tests/           pytest suite + fixtures/
alembic/         migrations
```
