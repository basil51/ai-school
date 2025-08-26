# AI School — Status

Last updated: 2025-08-26

---

## Summary
- ✅ **Phase 1 COMPLETED**: NextAuth authentication system fully implemented
- ✅ **Phase 2 COMPLETED**: RAG Foundations (pgvector, OpenAI, document ingestion)
- ✅ **Phase 3 COMPLETED**: Streaming Tutor Endpoint + UI
- 🔄 **Phase 4 IN PROGRESS**: Background Ingestion (Redis, BullMQ, async processing)
- Web app running on http://localhost:3000

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
- ✅ **Phase 3: Streaming Tutor** - Real-time streaming chat with citations
- ✅ `/api/chat/lesson` streaming endpoint with Vercel AI SDK
- ✅ `/tutor` page with streaming responses and navigation
- ✅ RAG + LLM integration with citation format `[1]`, `[2]`

## In Progress
- 🔄 **Phase 4: Background Ingestion** - Redis, BullMQ, async processing

## Blockers/Risks
- None currently.

## Next Actions (Week 2-3)
1. ✅ **Phase 1 — Auth + RBAC** (COMPLETED)
   - ✅ NextAuth credentials, register endpoint, middleware, sign-in page
   - ✅ Env: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
   - ✅ Demo users working: admin@example.com / admin123, etc.

2. ✅ **Phase 2 — RAG Foundations** (COMPLETED)
   - ✅ Install `openai ai zod`
   - ✅ Add pgvector + Prisma models `RagDocument`, `RagChunk`
   - ✅ Implement chunk/embed/search helpers; routes: upload, ingest, query
   - ✅ Minimal `/rag` page

3. ✅ **Phase 3 — Streaming Tutor Endpoint** (COMPLETED)
   - ✅ Add `/api/chat/lesson` streaming variant (Vercel AI SDK)
   - ✅ Client page `/tutor` with streaming answer area
   - ✅ Basic citations format like `[1]`, `[2]`

4. 🔄 **Phase 4 — Background Ingestion** (IN PROGRESS)
   - Add Redis and BullMQ for async processing
   - Worker app for batch embeddings and progress updates
   - API to enqueue jobs + status endpoint
   - Frontend polling for job status

## Future Phases (Planning)
- **Phase 5**: UX + Admin (shadcn/ui, role-based uploads, admin panel)
- **Phase 6**: Quality & Search (RAGAS evaluations, hybrid search)
- **Phase 7**: Ops & Deployment (monitoring, deployment)
- **Phase 8**: Guardian Emails (weekly progress summaries)

## Milestones
- ✅ M1: Auth working (login/logout, protected `/dashboard`) — **COMPLETED**
- ✅ M2: RAG upload→ingest→ask flow (non‑streaming) — **COMPLETED**
- ✅ M3: Streaming tutor + citations — **COMPLETED**
- 🔄 M4: Background ingestion + status — **IN PROGRESS**

## Notes
- Postgres mapped to host `5433` (update envs in all services).
- NextAuth configured with JWT sessions and role-based tokens.
- pgvector enabled with OpenAI embeddings (text-embedding-3-small).
- Streaming tutor fully functional with real-time responses.
- See `README.md`, `RAG.md`, `RAG2.md`, and `EMAILS.md` for reference.
- App running on port 3000 (port conflict resolved).
- **Need OpenAI API key** in `web/.env` to test RAG functionality.
