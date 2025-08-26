# AI School — Roadmap

This roadmap translates README.md and RAG.md into actionable phases. Each phase ends with a working milestone and clear exit criteria.

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

## Phase 3 — Streaming Tutor Endpoint + UI (IN PROGRESS) 🔄
- Add `/api/chat/lesson` streaming variant (Vercel AI SDK)
- Client page `/tutor` with streaming answer area
- Basic citations format like `[1]`, `[2]`
- Integrate RAG retrieval with streaming LLM responses

Exit criteria: See streamed answers citing retrieved context.

---

## Phase 4 — Ingestion at Scale (Background Jobs)
- Add Redis and BullMQ
- Worker app to process ingestion (batch embeddings, progress updates)
- API to enqueue jobs + status endpoint
- Frontend polling for job status

Exit criteria: Large docs ingest asynchronously with visible progress until completion.

---

## Phase 5 — UX + Admin
- shadcn/ui integration for forms, modals, tables
- Teacher‑only uploads; admin panel for users/docs
- Role‑aware navigation and dashboards

Exit criteria: Role‑based navigation; teachers upload; admins manage users and docs.

---

## Phase 6 — Quality & Search
- Hybrid search (BM25 + vector)
- RAGAS based nightly evaluation and score tracking
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

## Phase 8 — Stretch Goals
- Multi‑tenant orgs (schools)
- Guardian portal, attendance/grades integrations
- Classroom chat, lesson plans, assignment generation

---

## Tracking
- See `STATUS.md` for weekly status, blockers, and next actions.


