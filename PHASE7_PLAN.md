# Phase 7 — Ops & Deployment Plan

## Goals
- Production deployment of the web app
- Managed databases and queues (Postgres, Redis)
- Observability (logs, metrics, tracing)
- Safe migrations and backups

## Deliverables
- Vercel deployment for `web/` (envs and secrets configured)
- Managed Postgres (Supabase/Neon/Railway) + managed Redis (Upstash/Redis Cloud)
- Prisma migration workflow (deploy + resolve)
- Health endpoints and uptime checks
- Logging baseline and error reporting (Sentry or similar)
- Backup and restore procedure documented

## Tasks
1) Environments & Secrets
- Create `.env.production` mapping
- Document secrets in README (no values)
- Add Vercel environment variables for OPENAI_API_KEY, DATABASE_URL, NEXTAUTH_SECRET

2) Database
- Provision managed Postgres
- Run `prisma migrate deploy`
- Verify extensions (pgvector, pg_trgm) available
- Create indexes if missing
- Set up daily backups

3) Redis / Queues
- Provision managed Redis
- Configure BullMQ connections
- Verify worker starts and processes jobs

4) Observability
- Add Sentry SDK (frontend + API routes)
- Add basic request logging
- Expose `/api/health` endpoint
- Track key timings (embed/search) already added

5) Deployment
- Vercel project for `web/`
- Preview deployments on PRs
- Production promotion flow

6) Runbooks
- Incident response checklist
- Rolling back migrations
- Rotating secrets

## Exit Criteria
- App deployed on Vercel with managed Postgres/Redis
- Healthcheck passes, logs visible, metrics available
- Documented backup/restore and runbooks
