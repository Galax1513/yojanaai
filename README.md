# YojanaAI

**Know what you may be eligible for.**

YojanaAI helps people in India discover government schemes and
scholarships they may be eligible for. Browse the scheme catalog, or
create a profile to see personalized potential matches with a clear
explanation of why each scheme was suggested.

YojanaAI is an independent discovery tool. It is not a government
service, is not affiliated with or endorsed by the Government of India,
and never submits anything on your behalf — applications always happen
on the official scheme websites.

## Features

- **Scheme discovery** — search and filter the catalog by category,
  state and support type, with paginated results.
- **Scheme detail pages** — benefits, eligibility, documents, process
  and a link to the official application website.
- **Profiles** — sign up, create a profile, and edit it at any time.
- **Personalized results** — a deterministic, rules-based eligibility
  engine on the backend returns `MATCH` ("Potential match") and
  `NEEDS_INFORMATION` results, each with the criteria that were met or
  still need details. Schemes that clearly don't apply are left out.
- **Privacy Policy and Terms** pages.

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React 19 · TypeScript · Vite · Tailwind CSS v4 · Framer Motion · React Router |
| Backend | FastAPI · SQLAlchemy 2 · Alembic · Pydantic · Python 3.13 |
| Database | PostgreSQL |

## Repository layout

```
src/            React frontend (pages, components, API services)
public/         static assets
backend/        FastAPI service, Alembic migrations, tests — see backend/README.md
render.yaml     Render Blueprint for the backend
vercel.json     Vercel config for the frontend (SPA rewrites)
docker-compose.yml  local PostgreSQL for development
```

## Local development

### 1. Database and backend

See [`backend/README.md`](backend/README.md) for full details.

```bash
docker compose up -d                 # local PostgreSQL
cd backend
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
cp .env.example .env                 # then edit values
./venv/bin/alembic upgrade head
./venv/bin/uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

Requires Node 18+.

```bash
cp .env.example .env                 # VITE_API_BASE_URL=http://localhost:8000/api
npm install
npm run dev       # start the dev server
npm run build     # type-check + production build
npm run lint      # oxlint
```

## Tests

```bash
cd backend && ./venv/bin/pytest
```

## Deployment

- **Frontend (Vercel)** — framework preset Vite, build `npm run build`,
  output `dist`. Set `VITE_API_BASE_URL` to the backend's public URL
  ending in `/api`. `vercel.json` rewrites all routes to `index.html`
  so deep links work on refresh.
- **Backend (Render)** — deploy with `render.yaml`. Set
  `DATABASE_URL` and `CORS_ORIGINS` (the frontend origin, e.g.
  `https://your-app.vercel.app`) in the Render dashboard; `JWT_SECRET`
  is generated automatically. In production the API refuses to start
  with a `*` or localhost CORS origin.
- **Database (PostgreSQL, e.g. Neon)** — run
  `alembic upgrade head` against the production `DATABASE_URL` before
  importing scheme data.

Never commit `.env` files or real connection strings.

## Scheme data

Scheme records are loaded with the bootstrap importer
(`backend/scripts/import_bootstrap_schemes.py`), which is idempotent.
The current dataset is third-party with unverified provenance: every
record it creates is tagged `data_status="development"` and its source
is recorded as not an official government source. The dataset file
itself is not part of this repository. Always confirm details on the
official scheme website before applying.

## Design system

- **Themes**: light (ivory and sand) and dark (night sands), switchable
  from the navbar and remembered per browser; defaults to the system
  setting. All colours are semantic tokens in `src/index.css`, so
  components never hard-code a theme.
- **Palette**: built around sand `#CBBD93`, with olive-espresso shades
  and ivory tints. Muted accents only: sage for potential matches, clay
  for "more information needed", tourmaline blue-grey for notices. No
  government seals, tricolour, or state emblems.
- **Surfaces**: frosted glass panels (`glass`, `glass-strong`,
  `glass-photo` utilities) over a soft, static colour-wash backdrop.
- **Type**: Urbanist (display) + DM Sans (UI), with small tracked
  uppercase labels (`label-micro`).
- **Components**: pill buttons and chips, round icon buttons, a floating
  glass navbar, and a glass bottom dock on phones.
- **Motion**: a subtle parallax on the hero photo and light
  scroll-reveals; `prefers-reduced-motion` is respected globally.
