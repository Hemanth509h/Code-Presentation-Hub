# 🛡️ SkillEngine — Blind Recruitment & Skill-Based Hiring Platform

> **Our Mission:** To build a world where the only thing that matters in hiring is your ability to do the job.

SkillEngine is a **gender-neutral, bias-free hiring platform** that evaluates candidates purely on demonstrated skills. Recruiter see anonymized candidates ranked by merit — identity is never revealed until both parties agree.

---

## ✨ Key Features

### 🎭 Blind Recruitment
- Candidates register with no personal information collected
- All identities replaced with anonymous IDs (e.g., `CND-4821`)
- Identity only revealed after **mutual consent** (candidate accepts recruiter's interest)

### 📊 Skill-Based Evaluation
- Standardized assessments: **Multiple Choice**, **Coding**, and **Short Answer**
- Custom recruiter-built tests assigned directly to matched candidates
- Auto-scoring with percentage breakdowns per question type
- **Overall Score** = running average across all completed assessments

### 🏆 Merit-Only Rankings
- Candidates ranked **exclusively by assessment score** (highest first)
- Top 3 highlighted with 🥇🥈🥉 medals
- Role-specific filtering available

### 🛡️ Fairness & Rankings Hub *(Admin only)*
- **Bias Detection Score (0–100):** Measures whether experience years predict scores (high score = unbiased)
- **Adverse Impact Ratio (AIR):** Monitors pass-rate parity between anonymized cohorts (target ≥ 0.8)
- **Score Variance:** Standard deviation of assessments for evaluation consistency
- **Neutrality Index:** Inverse of experience-score correlation
- **Transparency Audit Logs:** Timestamped fairness checks

### 💬 Recruiter ↔ Candidate Chat
- Real-time messaging after a connection is accepted
- Linked to assigned custom tests for context

---

## 🗂️ Project Structure

```
/
├── frontend/                    # React 19 + Vite (JSX)
│   └── src/
│       ├── App.jsx              # Route guard & role-based routing
│       ├── modules/
│       │   ├── auth/            # Login & Register pages
│       │   ├── candidate/       # Candidate dashboard, assessments, results
│       │   ├── recruiter/       # Recruiter dashboard (Analytics, Custom Tests, Blind Hiring)
│       │   └── admin/           # Admin dashboard, Fairness & Rankings Hub
│       ├── shared/
│       │   ├── layout/          # App shell & navigation
│       │   └── components/      # UI elements, ChatBox, charts
│       └── store/
│           └── use-app-store.js # Zustand global state (auth, candidateId)
│
├── backend/                     # Express 5 API (Node.js)
│   └── src/
│       ├── index.js             # Entry point (port 8080)
│       ├── routes/
│       │   ├── auth.js          # Login, register, logout, /me (with token refresh)
│       │   ├── candidates.js    # Candidate CRUD, results, assigned tests
│       │   ├── assessments.js   # Assessment listing & submission scoring
│       │   ├── recruiters.js    # Rankings, blind pool, shortlist, connections
│       │   ├── custom-tests.js  # Recruiter custom tests & submissions
│       │   └── fairness.js      # Fairness metrics & anonymized results
│       ├── middleware/
│       │   └── auth.js          # requireAuth middleware (JWT cookie validation)
│       └── lib/
│           ├── supabase.js      # Admin Supabase client
│           └── supabase-anon.js # Anon Supabase client (for auth flows)
│
└── package.json                 # npm workspaces root
```

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Zustand, TanStack React Query, Tailwind CSS |
| **Backend** | Express 5, Node.js |
| **Database** | PostgreSQL via Supabase |
| **Auth** | Supabase Auth (JWT cookies + auto-refresh) |
| **ORM** | Drizzle ORM |
| **Package Manager** | npm workspaces |

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+
- A Supabase project with the required tables (see Database section)
- `.env` files set up in both `frontend/` and `backend/`

### Start both services

```bash
npm run dev
```

This runs:
- **Backend** on `http://localhost:8080`
- **Frontend** on `http://localhost:21181`

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=development
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8080
```

---

## 🗄️ Database Tables

| Table | Purpose |
|---|---|
| `candidates` | Candidate profiles (no PII — skill data only) |
| `assessments` | Platform assessment definitions |
| `questions` | Questions linked to assessments |
| `submissions` | Candidate assessment results |
| `custom_tests` | Recruiter-created tests |
| `custom_test_questions` | Questions for custom tests |
| `custom_test_assignments` | Candidate ↔ custom test links |
| `custom_test_submissions` | Custom test results |
| `recruiter_shortlists` | Saved candidates per recruiter |
| `recruiter_connections` | Interest requests (pending/accepted/declined) |
| `candidate_aliases` | Anonymized ID mappings |
| `chat_messages` | Recruiter ↔ candidate messages |

---

## 👥 User Roles

| Role | Access |
|---|---|
| **Candidate** | Register anonymously, take assessments, view own results, respond to recruiter interest |
| **Recruiter** | View blind talent pool, shortlist candidates, send interest, create custom tests, chat |
| **Admin** | Everything above + Fairness & Rankings Hub with bias metrics |

---

## 📐 Scoring Logic

### Per Assessment
```
percentage = (score / maxScore) × 100
passed = percentage >= 60
```

### Overall Score (stored on candidate)
```
overallScore = average of all submission percentages
```
Updated automatically after every submission.

### Bias Detection Score
```
biasScore = 100 − |Pearson(experience, score)| × 25
```
Where **100 = perfectly unbiased**, scores drop as experience correlates more with test results.

---

## 🔐 Authentication

- Sessions stored as **HTTP-only cookies** (`sb_access_token` + `sb_refresh_token`)
- **7-day cookie lifetime** with **automatic token refresh** — no forced logouts
- Only a confirmed `401` from the server clears the session

---

## 📄 License

MIT License — built for demonstration and academic purposes.
