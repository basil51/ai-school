# AI School — Status

Last updated: 2025-08-26

---

## Summary
- ✅ **Phase 1 COMPLETED**: NextAuth authentication system fully implemented
- ✅ **Phase 2 COMPLETED**: RAG Foundations (pgvector, OpenAI, document ingestion)
- 🔄 **Phase 3 IN PROGRESS**: Streaming Tutor Endpoint + UI
- Web app running on http://localhost:3001 (port 3000 was in use)

## Completed (to date)
- ✅ Next.js + TS + App Router scaffolded in `web/`
- ✅ Tailwind, React Query, Axios installed
- ✅ Dockerized Postgres; Prisma init, model, migrate, generate
- ✅ Seed script added and executed
- ✅ **Phase 1: Auth + RBAC** - NextAuth with credentials, JWT sessions, role-based access
- ✅ Protected routes, sign-in page, dashboard with user info
- ✅ RBAC utilities for API route protection
- ✅ **Phase 2: RAG Foundations** - pgvector, OpenAI embeddings, document ingestion
- ✅ RAG models (RagDocument, RagChunk) with vector support
- ✅ Upload, ingest, and query APIs with vector search
- ✅ `/rag` page for document upload and question asking

## In Progress
- 🔄 **Phase 3: Streaming Tutor Endpoint** - Adding streaming chat with citations

## Blockers/Risks
- None currently.

## Next Actions (Week 2)
1. ✅ **Phase 1 — Auth + RBAC** (COMPLETED)
   - ✅ NextAuth credentials, register endpoint, middleware, sign-in page
   - ✅ Env: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
   - ✅ Demo users working: admin@example.com / admin123, etc.

2. ✅ **Phase 2 — RAG Foundations** (COMPLETED)
   - ✅ Install `openai ai zod`
   - ✅ Add pgvector + Prisma models `RagDocument`, `RagChunk`
   - ✅ Implement chunk/embed/search helpers; routes: upload, ingest, query
   - ✅ Minimal `/rag` page

3. 🔄 **Phase 3 — Streaming Tutor Endpoint** (IN PROGRESS)
   - Add `/api/chat/lesson` streaming variant (Vercel AI SDK)
   - Client page `/tutor` with streaming answer area
   - Basic citations format like `[1]`, `[2]`

## Milestones
- ✅ M1: Auth working (login/logout, protected `/dashboard`) — **COMPLETED**
- ✅ M2: RAG upload→ingest→ask flow (non‑streaming) — **COMPLETED**
- 🔄 M3: Streaming tutor + citations — **IN PROGRESS**
- ⏳ M4: Background ingestion + status — target: Week 3

## Notes
- Postgres mapped to host `5433` (update envs in all services).
- NextAuth configured with JWT sessions and role-based tokens.
- pgvector enabled with OpenAI embeddings (text-embedding-3-small).
- See `README.md` and `RAG.md` for reference commands and APIs.
- App running on port 3001 due to port 3000 being in use.
- **Need OpenAI API key** in `web/.env` to test RAG functionality.
