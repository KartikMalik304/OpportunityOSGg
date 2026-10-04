# OpportunityOS — Student Opportunity & Career Intelligence Platform

> **"The right opportunity. At the right time."**

OpportunityOS is a full-stack career intelligence platform that collects and structures scattered student opportunities (internships, hackathons, open-source fellowships, coding contests, scholarships, research roles, and new-grad jobs), personalizes them for every student, automatically checks rule-by-rule eligibility, analyzes skill gaps, provides interactive preparation roadmaps, aggregates coding profiles, and tracks applications and deadlines.

---

## 1. Key Modules & Features

1. **Startup Landing Page**: Interactive personalized opportunity preview, category directory, live eligibility breakdown showcase, student testimonials, and FAQ.
2. **Multi-Step Student Onboarding Wizard**: Captures personal details, degree, branch, graduation cohort, CGPA, active backlogs, 50+ technical skills, interests, career goals, and work preferences.
3. **Personalized Opportunity Feed**: Ranked by a 7-factor weighted Recommendation Engine (`Skill Match 30%`, `Eligibility 25%`, `Career Interest 15%`, `Experience 10%`, `GitHub/Coding Profile Similarity 10%`, `Location 5%`, `Deadline Urgency 5%`).
4. **Automatic Eligibility Checker**: Evaluates `Education/Degree`, `Graduation Year Cohort`, `Location`, `Academic CGPA`, and `Required Skills` (`✓ Eligible`, `⚠ Partially Eligible`, `✕ Not Eligible`).
5. **Interactive Roadmaps & AI Roadmap Generator**: 5 built-in engineering roadmaps (`Full Stack`, `AI Engineer`, `Competitive Programmer`, `GSoC & Open Source`, `Cloud Native & DevOps`) with step progress tracking (`Not started`, `In progress`, `Completed`) and custom AI roadmap generation.
6. **Coding Profile Aggregator & Live GitHub Integration**: Connects `GitHub` (live REST API), `Codeforces` (live API), `LeetCode`, `HackerRank`, `CodeChef`, and `AtCoder` to compute the unified **Opportunity Readiness Score (0–100)**.
7. **Kanban Application Tracker**: 8-stage drag-and-drop pipeline (`Interested`, `Saved`, `Preparing`, `Applied`, `Assessment`, `Interview`, `Selected`, `Rejected`) persisted in PostgreSQL.
8. **Deadline Management & Integrated Calendar**: Urgency bucketing (`1–3 days`, `4–7 days`, `8–30 days`) plus `Agenda`, `Week`, and `Month` calendar views.
9. **AI Career Intelligence (Server-Side Gemini API)**:
   - AI Opportunity & Eligibility Explanation
   - AI Skill Gap Analysis
   - AI Resume Parser & Skill Extractor
   - AI Opportunity Assistant grounded strictly on trusted database records
10. **Admin Console & Organization Portal**: Opportunity verification workflow (`Draft → Pending Review → Approved → Published → Expired`), partner feed ingestion with deduplication, and Recharts analytics.

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts
- **Backend**: Node.js + Express (`server.ts`) with REST APIs and Vite middleware
- **Database**: Google Cloud SQL for PostgreSQL + Drizzle ORM (`src/db/schema.ts`, `src/db/index.ts`)
- **Authentication**: Firebase Authentication (Google Sign-In via `signInWithPopup` + `firebase-admin` ID token verification) + Role-Based Access Control (`STUDENT`, `ADMIN`, `ORGANIZATION`)
- **AI Engine**: Server-side `@google/genai` SDK (`gemini-3.8-flash`)

---

## 3. Database Schema (17 Normalized PostgreSQL Tables)

Defined in `src/db/schema.ts`:
- `users`, `student_profiles`, `skills`, `user_skills`
- `organizations`, `opportunities`, `opportunity_skills`, `eligibility_rules`
- `saved_opportunities`, `applications`
- `roadmaps`, `roadmap_steps`, `user_roadmap_progress`
- `coding_profiles`, `notifications`, `events`, `analytics_events`

Seeded automatically via `src/db/seed.ts` with **120+ opportunities** (30 internships, 20 hackathons, 20 open-source programs, 15 scholarships, 15 coding contests, 10 research fellowships, 10 new-grad jobs), **52 skills**, **22 organizations**, and **5 roadmaps**.

---

## 4. REST API Endpoints

- `GET /api/public/showcase` — Public landing page metrics
- `GET /api/public-profile/:username` — Public shareable developer portfolio
- `GET /api/dashboard` — Full authenticated student & opportunity workspace bundle
- `GET /api/opportunities` & `GET /api/opportunities/recommended`
- `POST /api/opportunities` — Create opportunity with automatic deduplication
- `PUT /api/opportunities/:id` & `DELETE /api/opportunities/:id`
- `POST /api/opportunities/:id/save` & `DELETE /api/opportunities/:id/save`
- `POST /api/applications`, `PUT /api/applications/:id`, `DELETE /api/applications/:id`
- `GET /api/roadmaps`, `POST /api/roadmaps/:id/progress`, `POST /api/roadmaps/generate-ai`
- `GET /api/profile`, `PUT /api/profile`
- `POST /api/coding-profiles/connect`
- `PUT /api/notifications/:id/read`, `PUT /api/notifications/read-all`
- `POST /api/events`
- `POST /api/ai/explain-opportunity`, `POST /api/ai/parse-resume`, `POST /api/ai/assistant`
- `GET /api/admin/analytics`, `POST /api/admin/ingest-feed`

---

## 5. Local Development & Verification

```bash
# Install dependencies
npm install

# Type-check codebase
npm run lint

# Start full-stack server on port 3000
npm run dev

# Build for production
npm run build
```
