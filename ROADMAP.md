# AI School — Roadmap

This roadmap translates README.md, RAG.md, RAG2.md, and EMAILS.md into actionable phases. Each phase ends with a working milestone and clear exit criteria.

---

## Phase 0 — Bootstrap (DONE)
- Next.js app scaffolded in `web/` (App Router + TS)
- TailwindCSS wired
- Axios, React Query installed
- Postgres via Docker (port 5433)
- Prisma initialized; `User` + `Role` models; migrated
- Seed users created

Exit criteria: `pnpm dev` runs and DB is migrated/seeded.

---

## Phase 1 — Auth + RBAC (DONE) ✅
- ✅ NextAuth Credentials provider
- ✅ Register endpoint hashing passwords (argon2)
- ✅ JWT session with role on token/session
- ✅ Middleware protecting `/dashboard`, `/teacher`, `/admin`
- ✅ Simple sign-in form and sign-out
- ✅ Dashboard with user info and role display
- ✅ RBAC utilities for API route protection

Exit criteria: Can sign in with seeded users; role-gated routes enforced. **COMPLETED**

---

## Phase 2 — RAG Foundations (DONE) ✅
- ✅ Install `openai`, `ai`, `zod`
- ✅ Enable pgvector in Postgres and Prisma types
- ✅ Create `RagDocument` and `RagChunk` models with `embedding vector(1536)` + index
- ✅ Implement helpers: chunk, embed, vector search
- ✅ API:
  - `/api/content/upload` (store doc meta, length)
  - `/api/rag/ingest` (chunk → embed → insert)
  - `/api/rag/query` (top‑k retrieval)
- ✅ Minimal UI page `/rag` for upload + ask (non‑streaming)

Exit criteria: Upload .txt, ingest, ask a question, receive grounded answer with snippets. **COMPLETED**

---

## Phase 3 — Streaming Tutor Endpoint + UI (DONE) ✅
- ✅ Add `/api/chat/lesson` streaming variant (Vercel AI SDK)
- ✅ Client page `/tutor` with streaming answer area
- ✅ Basic citations format like `[1]`, `[2]`
- ✅ Integrate RAG retrieval with streaming LLM responses
- ✅ Navigation links from home and dashboard

Exit criteria: See streamed answers citing retrieved context. **COMPLETED**

---

## Phase 4 — Ingestion at Scale (Background Jobs) (IN PROGRESS) 🔄
- Add Redis and BullMQ
- Worker app to process ingestion (batch embeddings, progress updates)
- API to enqueue jobs + status endpoint
- Frontend polling for job status
- Handle large documents efficiently

Exit criteria: Large docs ingest asynchronously with visible progress until completion.

---

## Phase 5 — UX + Admin
- shadcn/ui integration for forms, modals, tables
- Teacher‑only uploads; admin panel for users/docs
- Role‑aware navigation and dashboards

Exit criteria: Role‑based navigation; teachers upload; admins manage users and docs.

---

## Phase 6 — Quality & Search (RAGAS Evaluations)
- RAGAS metrics: faithfulness, answer_relevancy, context_precision, context_recall
- Nightly CI with GitHub Actions
- Golden dataset with Q/A pairs
- Hybrid search (BM25 + vector)
- Similarity thresholding + re‑ranking

Exit criteria: Evaluation dashboard shows nightly scores; hybrid search improves answer quality.

---

## Phase 7 — Ops & Deployment
- Environment configs, secrets
- Database migrations workflow
- Observability (logs/metrics), backups
- Deployment to Vercel (web) + managed Postgres, Redis

Exit criteria: Deployed app with monitoring and documented runbooks.

---

## Phase 8 — Guardian Emails & Communication
- Guardian ↔ Student linking with consent management
- Weekly progress summaries via email (Resend/SMTP)
- Automated cron jobs (Vercel Cron or GitHub Actions)
- Email templates and unsubscribe management

Exit criteria: Guardians receive weekly progress emails for consented students.

---

## Phase 9 — Stretch Goals
- Multi‑tenant orgs (schools)
- Attendance/grades integrations
- Classroom chat, lesson plans, assignment generation
- Advanced analytics and reporting

---

## Tracking
- See `STATUS.md` for weekly status, blockers, and next actions.


