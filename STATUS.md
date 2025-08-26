# AI School — Status

Last updated: <!-- set on save -->

---

## Summary
- Repo bootstrapped; web app runs locally.
- Database online (Docker, port 5433), Prisma migrated, demo users seeded.
- RAG plan defined; implementation not yet started.

## Completed (to date)
- Next.js + TS + App Router scaffolded in `web/`
- Tailwind, React Query, Axios installed
- Dockerized Postgres; Prisma init, model, migrate, generate
- Seed script added and executed

## In Progress
- Roadmap structured into phases (see `ROADMAP.md`)

## Blockers/Risks
- None currently.

## Next Actions (Week 1)
1. Phase 1 — Auth + RBAC
   - Add NextAuth credentials, register endpoint, middleware, sign-in page
   - Env: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
2. Phase 2 — RAG Foundations
   - Install `openai ai zod`
   - Add pgvector + Prisma models `RagDocument`, `RagChunk`
   - Implement chunk/embed/search helpers; routes: upload, ingest, query
   - Minimal `/rag` page

## Milestones
- M1: Auth working (login/logout, protected `/dashboard`) — target: Week 1
- M2: RAG upload→ingest→ask flow (non‑streaming) — target: Week 2
- M3: Streaming tutor + citations — target: Week 2/3
- M4: Background ingestion + status — target: Week 3

## Notes
- Postgres mapped to host `5433` (update envs in all services).
- See `README.md` and `RAG.md` for reference commands and APIs.
