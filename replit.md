# Gender-Neutral Skill Assessment Engine

## Overview

npm workspace monorepo using plain JavaScript. All TypeScript removed — source files are `.js` and `.jsx` only.

## Project Structure

```
/
├── frontend/                  # React 19 + Vite app (JSX)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── pages/             # Route-level page components
│   │   ├── components/        # Shared UI components
│   │   ├── store/             # Zustand state
│   │   ├── hooks/
│   │   └── lib/               # supabase.js, utils.js
│   ├── mockup-sandbox/        # UI prototyping sandbox (Vite)
│   ├── index.html
│   └── vite.config.js
│
├── backend/                   # Express 5 API server (Node.js)
│   ├── src/
│   │   ├── index.js           # Entry point (port 8080)
│   │   ├── app.js             # Express setup
│   │   ├── routes/            # candidates, assessments, recruiters, health
│   │   └── lib/               # supabase server client
│   ├── shared/                # Shared libraries
│   │   ├── db/                # Drizzle ORM + PostgreSQL
│   │   ├── api-zod/           # Zod validation schemas
│   │   ├── api-client-react/  # React Query hooks
│   │   └── api-spec/          # OpenAPI spec
│   └── scripts/               # Utility scripts (seed, etc.)
│
└── package.json               # Root package with npm workspaces
```

## Stack

- **Frontend**: React 19 + Vite, Zustand, TanStack React Query, Tailwind CSS
- **Backend**: Express 5, Node.js (`node --watch`)
- **Database**: PostgreSQL + Drizzle ORM (Supabase)
- **Auth**: Supabase Auth
- **Package manager**: npm workspaces

## Running

The main workflow runs both services:
- **Backend**: port 8080 — `npm run dev --workspace=@workspace/api-server`
- **Frontend**: port 21181 — `npm run dev --workspace=@workspace/skill-engine`

## Key Design Notes

- Candidates register anonymously — no personal info collected
- Recruiters see anonymized, skill-based rankings only
- Recruiter dashboard hidden from candidates (route guard in `App.jsx`)

## Database

- Dev migrations: `npm run push --workspace=@workspace/db`
- Config: `backend/shared/db/drizzle.config.js` (requires `DATABASE_URL`)
