# syntax=docker/dockerfile:1

# ---- Base ----
FROM node:22-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

# ---- Dependencies + build ----
FROM base AS builder
COPY package.json pnpm-lock.yaml ./
# postinstall runs prisma generate; schema is not present yet — skip scripts here
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY . .
RUN pnpm exec prisma generate
# Next.js evaluates route modules during build; some libs construct OpenAI without a lazy guard
ARG OPENAI_BUILD_KEY=sk-docker-build-placeholder
ENV OPENAI_API_KEY=${OPENAI_BUILD_KEY}
RUN pnpm run build

# ---- Next.js (standalone) ----
FROM base AS web
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

RUN npm install -g prisma@6.19.0

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.js"]

# ---- BullMQ worker (RAG ingest) ----
FROM base AS worker
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./

CMD ["pnpm", "exec", "tsx", "src/lib/workers/index.ts"]
