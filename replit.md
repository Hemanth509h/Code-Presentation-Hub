# Gender-Neutral Skill Assessment Engine

## Overview

pnpm workspace monorepo using plain JavaScript (React + Vite on the frontend, Node.js/Express on the backend). No TypeScript — all source files are `.js` and `.jsx`.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **Frontend**: React 19 + Vite (JSX, no TypeScript)
- **Backend**: Express 5 (plain JS, `node --watch`)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **State**: Zustand + TanStack React Query
- **Auth**: Supabase auth

## Structure

```text
/
├── artifacts/
│   ├── api-server/         # Express 5 API server (plain JS)
│   └── skill-engine/       # React + Vite frontend (JSX)
├── lib/
│   ├── api-spec/           # OpenAPI spec
│   ├── api-client-react/   # React Query hooks (plain JS)
│   ├── api-zod/            # Zod schemas from OpenAPI (plain JS)
│   └── db/                 # Drizzle ORM schema + DB connection (plain JS)
├── scripts/                # Utility scripts (plain JS)
└── pnpm-workspace.yaml
```

## Running the project

The main workflow runs both services concurrently:
- **Backend**: `PORT=8080 pnpm --filter @workspace/api-server run dev` → `node --watch ./src/index.js`
- **Frontend**: `PORT=21181 pnpm --filter @workspace/skill-engine run dev` → Vite dev server

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. All source in `src/` as `.js` files.

- Entry: `src/index.js` — reads `PORT`, starts Express
- App setup: `src/app.js` — mounts CORS, JSON parsing, routes at `/api`
- Routes: `src/routes/` — candidates, assessments, recruiters, health
- Depends on: `@workspace/db`, `@workspace/api-zod`
- Dev: `node --watch ./src/index.js`

### `artifacts/skill-engine` (`@workspace/skill-engine`)

React 19 + Vite frontend. All source in `src/` as `.jsx` and `.js` files.

- Entry: `src/main.jsx`
- Routing: `src/App.jsx` — recruiter/candidate separation with route guard
- Vite proxy: `/api` → `localhost:8080`
- Depends on: `@workspace/api-client-react`

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

- `src/index.js` — creates a Pool + Drizzle instance, exports schema
- `drizzle.config.js` — Drizzle Kit config (requires `DATABASE_URL`)
- Dev migrations: `pnpm --filter @workspace/db run push`

### `lib/api-client-react` (`@workspace/api-client-react`)

React Query hooks and fetch client (plain JS).

### `lib/api-zod` (`@workspace/api-zod`)

Zod schemas generated from the OpenAPI spec (plain JS).

### `scripts` (`@workspace/scripts`)

Utility scripts including database seeding. Run via `pnpm --filter @workspace/scripts run <script>`.

## Key Design Notes

- Candidates register anonymously — no personal info collected
- Recruiters see anonymized, skill-based rankings only
- Recruiter dashboard is hidden from candidates (route guard in `App.jsx` + layout toggle)
