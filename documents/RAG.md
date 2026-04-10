# RAG (Retrieval‑Augmented Generation) — Ingestion & Lesson Tutor Chat

This guide wires:

1. **Upload → Chunk → Embed → pgvector** (PDF & plain text)
2. **/api/rag/query** (top‑k retrieval with cosine similarity)
3. **/api/chat/lesson** (LLM answers grounded in citations, streaming)
4. **Minimal UI page** for upload + ask

---

## 0) Install deps

```bash
cd web
pnpm add openai ai zod
pnpm add pdf-parse mammoth # pdf & docx text extraction (we'll start with PDF + .txt; docx optional)
```

---

## 1) pgvector & Prisma models

(Same as before; RagDocument + RagChunk with `embedding vector(1536)` and index.)

---

## 2) Helpers (packages/ai)

`packages/ai/rag/chunk.ts`, `embed.ts`, `query.ts` remain unchanged.
*(See previous section for code.)*

---

## 3) API — Upload & Ingest

`/api/content/upload` → store doc meta + raw text length.
`/api/rag/ingest` → chunk, embed, insert vectors.

*(Same as before; see prior code.)*

---

## 4) API — Retrieval

### `/api/rag/query`

```ts
import { NextResponse } from "next/server";
import { embedQuery } from "@/../packages/ai/rag/embed";
import { searchByEmbedding } from "@/../packages/ai/rag/query";

export async function POST(req: Request) {
  const { query, k } = await req.json();
  if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });
  const v = await embedQuery(query);
  const rows = await searchByEmbedding(v, Math.min(k ?? 5, 20));
  return NextResponse.json({ snippets: rows });
}
```

---

## 5) API — Lesson Tutor Chat (Streaming)

### `/api/chat/lesson`

Use **Vercel AI SDK** for streaming.

```ts
import { NextResponse } from "next/server";
import { embedQuery } from "@/../packages/ai/rag/embed";
import { searchByEmbedding } from "@/../packages/ai/rag/query";
import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { question, k = 5 } = await req.json();
  if (!question) return NextResponse.json({ error: "question required" }, { status: 400 });

  const v = await embedQuery(question);
  const ctx = await searchByEmbedding(v, k);
  const contextBlock = ctx.map((s, i) => `[[${i + 1}]] ${s.content}`).join("\n\n");

  const system = `You are a precise, student-friendly teacher. Answer ONLY using the provided context. If context is insufficient, say you don't know. Cite sources inline like [1].`;
  const user = `Question: ${question}\n\nContext:\n${contextBlock}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // or GPT-5 later
    stream: true,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}
```

---

## 6) Minimal UI page (Upload + Ask)

Create `src/app/rag/page.tsx`:

```tsx
"use client";
import { useState } from "react";

export default function RagPage() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", file.name);
    const res = await fetch("/api/content/upload", { method: "POST", body: fd });
    const data = await res.json();
    alert("Uploaded docId=" + data.docId + " chars=" + data.chars);
  }

  async function handleAsk() {
    setLoading(true);
    setAnswer("");
    const res = await fetch("/api/chat/lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const reader = res.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      setAnswer((prev) => prev + decoder.decode(value));
    }
    setLoading(false);
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">RAG Tutor Demo</h1>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <button onClick={handleUpload} className="px-4 py-2 bg-blue-500 text-white rounded">
        Upload
      </button>

      <textarea
        className="w-full border rounded p-2"
        rows={3}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a question..."
      />
      <button
        onClick={handleAsk}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        {loading ? "Asking..." : "Ask"}
      </button>

      {answer && (
        <div className="mt-4 p-3 border rounded bg-gray-50 whitespace-pre-wrap">
          {answer}
        </div>
      )}
    </div>
  );
}
```

---

## 7) Quick test

1. Start DB + migrate.
2. Set `OPENAI_API_KEY`.
3. Visit `/rag` in browser.
4. Upload a PDF, then type a question and click **Ask**.
5. You should see streamed output appear live.

---

## 8) Next steps

* Batch ingestion jobs (BullMQ worker).
* Hybrid search (BM25 + vector).
* Add citations UI (highlight \[1], \[2] linking to doc page).
* Add teacher-only upload permissions.
* Evaluate with RAGAS nightly.

---

## 10) Streaming chat variant + Minimal UI page

This section adds a **streaming** lesson-tutor endpoint and a tiny UI page:

* Server route: `/api/chat/lesson/stream` using **Vercel AI SDK** (`ai`) with OpenAI
* Client page: `/tutor` with upload → ingest → chat

### 10.1 Install client helpers

```bash
cd web
pnpm add ai @ai-sdk/openai
```

> We already installed `ai` earlier for non-streaming; here we also add the provider `@ai-sdk/openai` for the streaming helper.

### 10.2 Server route — `/api/chat/lesson/stream`

Create `src/app/api/chat/lesson/stream/route.ts`:

```ts
import { NextRequest } from "next/server";
import { embedQuery } from "@/../packages/ai/rag/embed";
import { searchByEmbedding } from "@/../packages/ai/rag/query";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { question, k = 5 } = await req.json();
  if (!question) return new Response(JSON.stringify({ error: "question required" }), { status: 400 });

  const v = await embedQuery(question);
  const ctx = await searchByEmbedding(v, k);
  const contextBlock = ctx.map((s, i) => `[[${i + 1}]] ${s.content}`).join("

");

  const system = `You are a precise, student-friendly teacher. Answer ONLY using the provided context. If insufficient, say you don't know. Cite sources inline like [1], [2].`;
  const user = `Question: ${question}

Context:
${contextBlock}`;

  const result = await streamText({
    model: openai("gpt-4o-mini"), // swap to your primary model when ready
    system,
    temperature: 0.2,
    messages: [{ role: "user", content: user }],
  });

  return result.toAIStreamResponse();
}
```

### 10.3 Minimal UI page — `/tutor`

Create `src/app/tutor/page.tsx` (Client Component):

```tsx
"use client";
import { useEffect, useRef, useState } from "react";

export default function TutorPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [docId, setDocId] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", file.name);
    const up = await fetch("/api/content/upload", { method: "POST", body: fd }).then((r) => r.json());
    setDocId(up.docId);

    // Read raw text client-side (PDF parsing is server-side; for demo, allow .txt here)
    const isText = file.type.includes("text");
    let rawText = "";
    if (isText) rawText = await file.text();
    else {
      // In a production flow, create an endpoint to return parsed text from the upload step.
      alert("For PDFs, add a small endpoint to return parsed text, or upload a .txt for this demo.");
      return;
    }

    await fetch("/api/rag/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docId: up.docId, rawText }),
    });
    alert("Ingested!");
  }

  async function ask() {
    setBusy(true);
    setAnswer("");
    const res = await fetch("/api/chat/lesson/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const reader = res.body?.getReader();
    if (!reader) return setBusy(false);

    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      setAnswer((prev) => prev + decoder.decode(value));
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Lesson Tutor (Streaming RAG)</h1>
      <div className="space-y-2">
        <label className="block text-sm font-medium">Upload textbook or notes (.txt for demo)</label>
        <input type="file" onChange={handleUpload} className="block w-full" />
        {docId && <p className="text-xs text-gray-500">Doc ID: {docId}</p>}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Ask a question</label>
        <textarea
          ref={textRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={4}
          className="w-full rounded border p-2"
          placeholder="e.g., Explain the distributive property with an example"
        />
        <button onClick={ask} disabled={busy || !question} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
          {busy ? "Thinking…" : "Ask"}
        </button>
      </div>

      <div className="rounded border p-4 whitespace-pre-wrap">
        {answer || "Answer will appear here…"}
      </div>
    </div>
  );
}
```

> For a more robust chat UX, you can use `useChat` from `ai/react`. The above shows a minimal streaming reader without extra libs.

### 10.4 Notes

* For PDFs and DOCX, wire a server endpoint that returns parsed text after `/api/content/upload` so the client doesn’t need to parse.
* Consider moving ingestion to a background job and poll status.
* Add similarity thresholding to filter weak context.
* Upgrade to **SSE streaming** with tokens + citations markers if needed.

---

## 11) Move ingestion to BullMQ worker + status polling

Large textbooks can take minutes to embed. Instead of blocking the API route, offload work to a **BullMQ queue** with Redis and poll status.

### 11.1 Install BullMQ

```bash
cd web
pnpm add bullmq ioredis
```

> Ensure Redis is running (local Docker or Upstash/Redis Cloud).

Docker example (`docker-compose.yml` in project root):

```yaml
redis:
  image: redis:7
  restart: unless-stopped
  ports:
    - "6379:6379"
```

---

### 11.2 Queue setup

**`apps/worker/src/queues/ingest.ts`**

```ts
import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379");
export const ingestQueue = new Queue("ingest", { connection });
```

**`apps/worker/src/processors/ingestProcessor.ts`**

```ts
import { Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { chunkText } from "../../../packages/ai/rag/chunk";
import { embedTexts } from "../../../packages/ai/rag/embed";

const prisma = new PrismaClient();

export default async function ingestProcessor(job: Job) {
  const { docId, rawText } = job.data as { docId: string; rawText: string };
  const chunks = chunkText(rawText);
  const vectors = await embedTexts(chunks.map((c) => c.text));

  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    const v = vectors[i];
    const vecLiteral = `[${v.join(",")}]`;
    const chunk = await prisma.ragChunk.create({ data: { docId, content: c.text } });
    await prisma.$executeRawUnsafe(
      'UPDATE "RagChunk" SET embedding = $1::vector WHERE id = $2',
      vecLiteral,
      chunk.id,
    );
  }
  return { inserted: chunks.length };
}
```

**`apps/worker/src/index.ts`**

```ts
import { Worker } from "bullmq";
import IORedis from "ioredis";
import ingestProcessor from "./processors/ingestProcessor";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379");

new Worker("ingest", ingestProcessor, { connection });

console.log("Worker started: ingest queue");
```

Run the worker:

```bash
cd apps/worker
pnpm ts-node src/index.ts
```

---

### 11.3 API routes

**Enqueue ingestion job** — `src/app/api/rag/ingest/route.ts`

```ts
import { NextResponse } from "next/server";
import { ingestQueue } from "@/../apps/worker/src/queues/ingest";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const { docId, rawText } = await req.json();
  if (!docId || !rawText) return NextResponse.json({ error: "docId and rawText required" }, { status: 400 });

  const jobId = randomUUID();
  await ingestQueue.add("ingest", { docId, rawText }, { jobId });

  return NextResponse.json({ ok: true, jobId });
}
```

**Check job status** — `src/app/api/rag/status/[id]/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { Queue, Job } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379");
const q = new Queue("ingest", { connection });

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const job = await Job.fromId(q, params.id);
  if (!job) return NextResponse.json({ status: "not_found" }, { status: 404 });
  const state = await job.getState();
  return NextResponse.json({ state, progress: job.progress, returnvalue: job.returnvalue });
}
```

---

### 11.4 Client polling example

Update the `/tutor` page after ingestion:

```ts
async function ingestAndPoll(docId: string, rawText: string) {
  const { jobId } = await fetch("/api/rag/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ docId, rawText }),
  }).then((r) => r.json());

  let state = "waiting";
  while (state !== "completed" && state !== "failed") {
    const s = await fetch(`/api/rag/status/${jobId}`).then((r) => r.json());
    state = s.state;
    if (state === "completed") {
      alert(`Ingested: ${s.returnvalue.inserted} chunks`);
      return;
    }
    if (state === "failed") throw new Error("Ingestion failed");
    await new Promise((res) => setTimeout(res, 2000));
  }
}
```

---

### 11.5 Notes

* Each ingestion job is **idempotent** per `docId`. You may enforce uniqueness by checking existing chunks.
* Poll every 2–5s; or upgrade to WebSockets/events for real‑time updates.
* Track ingestion status in DB (`IngestionJob` table) if you need audit/history.
* Workers can be horizontally scaled; concurrency controlled with `new Worker("ingest", fn, { concurrency: 5 })`.
* If docs are huge, batch embeddings inside the worker in chunks of 64–128 calls.

---

## 11) Move ingestion to **BullMQ** worker + status polling

Offload heavy ingestion (chunk → embed → insert) to a background worker to avoid API timeouts and improve UX.

### 11.1 Install & Redis

```bash
# in repo root (ai-school/)
pnpm add -w bullmq ioredis
```

Add Redis to `docker-compose.yml` in the project root:

```yaml
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
```

Start services:

```bash
docker compose up -d redis
```

Set env (both `web/.env.local` and `apps/worker/.env.local` if separate):

```env
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your-key
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_school?schema=public
```

### 11.2 Worker app structure

Create a separate worker (if not already):

```
apps/worker/
├─ src/
│  ├─ queues/rag.queue.ts
│  ├─ processors/rag.ingest.ts
│  └─ index.ts
├─ tsconfig.json
├─ package.json
```

Add `apps/worker/package.json`:

```json
{
  "name": "worker",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node dist/index.js",
    "dev": "tsx src/index.ts"
  },
  "dependencies": {
    "bullmq": "^5.7.0",
    "ioredis": "^5.4.1",
    "@prisma/client": "*"
  },
  "devDependencies": {
    "tsx": "^4.15.7"
  }
}
```

### 11.3 Shared queue definition (producer + worker)

`apps/worker/src/queues/rag.queue.ts`:

```ts
import { Queue, QueueEvents, Worker, JobsOptions } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379");

export const RAG_INGEST_QUEUE = "rag:ingest";

export type IngestJobPayload = {
  docId: string;
  rawText: string;
  batchSize?: number; // optional for chunk batching
};

export function getIngestQueue() {
  return new Queue<IngestJobPayload>(RAG_INGEST_QUEUE, { connection });
}

export function getQueueEvents() {
  return new QueueEvents(RAG_INGEST_QUEUE, { connection });
}

export type ProgressPayload = { processed: number; total: number };

export type IngestJobOpts = JobsOptions;
```

### 11.4 Worker processor (chunk → embed → insert)

`apps/worker/src/processors/rag.ingest.ts`:

```ts
import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { chunkText } from "../../../packages/ai/rag/chunk";
import { embedTexts } from "../../../packages/ai/rag/embed";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379");
const prisma = new PrismaClient();

export const ingestWorker = new Worker(
  "rag:ingest",
  async (job: Job<{ docId: string; rawText: string; batchSize?: number }>) => {
    const { docId, rawText, batchSize = 64 } = job.data;
    const chunks = chunkText(rawText);

    let processed = 0;
    const total = chunks.length;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const vectors = await embedTexts(batch.map((c) => c.text));

      for (let j = 0; j < batch.length; j++) {
        const c = batch[j];
        const v = vectors[j];
        const vecLiteral = `[${v.join(",")}]`;
        const created = await prisma.ragChunk.create({ data: { docId, content: c.text } });
        await prisma.$executeRawUnsafe(
          'UPDATE "RagChunk" SET embedding = $1::vector WHERE id = $2',
          vecLiteral,
          created.id,
        );
        processed++;
      }

      await job.updateProgress(Math.round((processed / total) * 100));
    }

    return { processed, total };
  },
  { connection }
);

// graceful shutdown
process.on("SIGTERM", async () => { await ingestWorker.close(); process.exit(0); });
process.on("SIGINT", async () => { await ingestWorker.close(); process.exit(0); });
```

### 11.5 Worker entry

`apps/worker/src/index.ts`:

```ts
import "./processors/rag.ingest";
console.log("Worker started: rag:ingest");
```

Run the worker locally:

```bash
pnpm --filter worker dev
```

### 11.6 API — enqueue + status endpoints (web)

**Enqueue** `/api/rag/ingest/enqueue`
`apps/web/src/app/api/rag/ingest/enqueue/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getIngestQueue } from "@/../apps/worker/src/queues/rag.queue"; // if path not resolvable, duplicate a thin producer in web

export async function POST(req: Request) {
  const { docId, rawText } = await req.json();
  if (!docId || !rawText) return NextResponse.json({ error: "docId and rawText required" }, { status: 400 });
  const queue = getIngestQueue();
  const job = await queue.add("ingest", { docId, rawText }, { removeOnComplete: true, removeOnFail: false });
  return NextResponse.json({ jobId: job.id });
}
```

> **Note**: If importing from `apps/worker` is messy with TS pathing, copy the queue-init snippet into `apps/web/src/lib/queues.ts` using the same queue name.

**Status** `/api/rag/ingest/status`
`apps/web/src/app/api/rag/ingest/status/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { Queue, Job } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379");
const queue = new Queue("rag:ingest", { connection });

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });
  const job = await Job.fromId(queue, jobId);
  if (!job) return NextResponse.json({ status: "not_found" });
  const state = await job.getState();
  const progress = job.progress as number | object;
  const returnvalue = job.returnvalue as any;
  return NextResponse.json({ state, progress, result: returnvalue ?? null });
}
```

### 11.7 Frontend — update `/tutor` to poll

Modify the upload/ingest flow to enqueue and poll status.

Replace the ingest call in `src/app/tutor/page.tsx`:

```tsx
// enqueue
const enq = await fetch("/api/rag/ingest/enqueue", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ docId: up.docId, rawText }),
}).then((r) => r.json());

const jobId = enq.jobId as string;
setAnswer("Ingestion started…
");

// poll every 1s until completed/failed
let done = false;
while (!done) {
  const st = await fetch(`/api/rag/ingest/status?jobId=${jobId}`).then((r) => r.json());
  const pct = typeof st.progress === "number" ? st.progress : 0;
  setAnswer((prev) => `Ingestion: ${pct}% (state=${st.state})
`);
  if (st.state === "completed" || st.state === "failed" || st.status === "not_found") done = true;
  if (!done) await new Promise((res) => setTimeout(res, 1000));
}

alert("Ingestion finished (check status panel).");
```

### 11.8 Optional: persist job meta in DB

For auditability, create a table `IngestJob` with fields `{ id, docId, status, progress, error, createdAt, finishedAt }` and update it inside the worker using Prisma. This enables historical views and admin reporting.

### 11.9 Ops notes

* Use `removeOnComplete: true` to keep Redis trim; add metrics via QueueEvents if you need dashboards.
* Rate limits: pace embedding batches (64–128) and add retry with exponential backoff on 429s.
* For large PDFs, consider server-side text extraction + streaming upload (Tus) to avoid timeouts.

With this, ingestion runs off the request path, the UI polls status, and your API stays snappy even for big textbooks.

---

## 12) Hybrid search (BM25 + Vector) + Query Planner

Improve retrieval quality by combining **semantic vector search (pgvector)** with **lexical BM25/trigram search**. Then add a lightweight **query planner** that merges both results and re-ranks.

### 12.1 Enable pg\_trgm + GIN index

Add migration:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add trigram index for full-text search
CREATE INDEX IF NOT EXISTS ragchunk_content_trgm_idx ON "RagChunk" USING gin ("content" gin_trgm_ops);
```

Run:

```bash
pnpm prisma migrate dev --name add_pgtrgm
```

### 12.2 Lexical search helper

`packages/ai/rag/bm25.ts`:

```ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export type LexicalHit = { id: string; content: string; page: number | null; score: number };

export async function searchByLexical(query: string, k = 5): Promise<LexicalHit[]> {
  // pg_trgm similarity search; order by word_similarity (BM25-ish proxy)
  const rows = await prisma.$queryRaw<any[]>`
    SELECT id, content, page, similarity(content, ${query}) AS score
    FROM "RagChunk"
    WHERE content % ${query}
    ORDER BY score DESC
    LIMIT ${k};
  `;
  return rows.map((r) => ({ id: r.id, content: r.content, page: r.page ?? null, score: Number(r.score) }));
}
```

> **Note**: BM25 proper is in Postgres FTS; here we use `pg_trgm` similarity as a proxy (works well for short queries). For full BM25, consider wrapping with [pg\_search](https://github.com/begriffs/pg_search) or external search like Meilisearch.

### 12.3 Hybrid search + query planner

`packages/ai/rag/hybrid.ts`:

```ts
import { embedQuery } from "./embed";
import { searchByEmbedding } from "./query";
import { searchByLexical } from "./bm25";

export type HybridHit = { id: string; content: string; page: number | null; score: number; source: string };

// naive hybrid: run both, normalize scores, combine & rerank
export async function hybridSearch(query: string, k = 5): Promise<HybridHit[]> {
  const v = await embedQuery(query);
  const vecHits = await searchByEmbedding(v, k);
  const lexHits = await searchByLexical(query, k);

  // Normalize scores to 0–1
  const norm = (arr: { score: number }[]) => {
    const max = Math.max(...arr.map((a) => a.score), 1e-6);
    return arr.map((a) => ({ ...a, score: a.score / max }));
  };
  const vNorm = norm(vecHits).map((h) => ({ ...h, source: "vector" }));
  const lNorm = norm(lexHits).map((h) => ({ ...h, source: "lexical" }));

  // Merge by id (keep best score)
  const merged: Record<string, HybridHit> = {};
  [...vNorm, ...lNorm].forEach((h) => {
    const prev = merged[h.id];
    if (!prev || h.score > prev.score) merged[h.id] = h as HybridHit;
  });

  return Object.values(merged)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
```

### 12.4 Query planner

`packages/ai/rag/planner.ts`:

```ts
import { hybridSearch } from "./hybrid";

// Basic query planner: detect if query is factual vs. conceptual
export async function planAndSearch(query: string, k = 5) {
  const lower = query.toLowerCase();
  let strategy: "vector" | "lexical" | "hybrid" = "hybrid";

  // heuristic: short keyword-like query → lexical, long natural-language → vector
  if (lower.split(" ").length <= 3) strategy = "lexical";
  else if (lower.includes("explain") || lower.includes("why")) strategy = "vector";

  switch (strategy) {
    case "lexical":
      return { strategy, hits: await hybridSearch(query, k) }; // still hybrid, but lexical-weighted
    case "vector":
      return { strategy, hits: await hybridSearch(query, k) }; // still hybrid, vector-weighted
    default:
      return { strategy, hits: await hybridSearch(query, k) };
  }
}
```

### 12.5 API route — `/api/rag/hybrid`

`src/app/api/rag/hybrid/route.ts`:

```ts
import { NextResponse } from "next/server";
import { planAndSearch } from "@/../packages/ai/rag/planner";

export async function POST(req: Request) {
  const { query, k } = await req.json();
  if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });
  const result = await planAndSearch(query, k ?? 5);
  return NextResponse.json(result);
}
```

### 12.6 Chat with hybrid retrieval

Swap `/api/chat/lesson` or add `/api/chat/lesson/hybrid`:

```ts
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { planAndSearch } from "@/../packages/ai/rag/planner";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { question, k = 5 } = await req.json();
  if (!question) return NextResponse.json({ error: "question required" }, { status: 400 });
  const { strategy, hits } = await planAndSearch(question, k);

  const contextBlock = hits.map((h, i) => `[[${i + 1}]] (${h.source}) ${h.content}`).join("

");

  const system = `You are a precise, student-friendly teacher. Answer ONLY using the provided context. Strategy=${strategy}. Cite sources inline like [1], [2].`;
  const user = `Question: ${question}

Context:
${contextBlock}`;

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const answer = resp.choices[0]?.message?.content ?? "";
  return NextResponse.json({ answer, citations: hits.map((_, i) => i + 1), strategy });
}
```

---

## 13) Notes on Hybrid Retrieval

* **Score balancing**: current method normalizes by max; for better fusion, apply weighted sum: `0.6 * vector + 0.4 * lexical`.
* **Query planner**: expand heuristics with regex or a tiny classifier (e.g., factual vs. explanatory queries).
* **Performance**: lexical search is fast with GIN trigram index. For large corpus, consider **BM25 via Postgres FTS** or Meilisearch.
* **Evaluation**: run RAGAS or custom eval to compare pure vector vs. hybrid.

With this, your system supports **hybrid retrieval** and **query planning**, improving grounding quality and reducing hallucinations.



# RAG Evaluations (RAGAS) & Nightly CI

Automate retrieval/answer quality checks using **RAGAS** metrics and run them **nightly** in GitHub Actions. Produces a JSON/CSV report and fails the job on regression.

---

## 1) Overview

* **Dataset**: a small golden set of questions with reference answers and (optionally) reference contexts.
* **Prediction**: call your non‑streaming tutor endpoint (`/api/chat/lesson`) to generate answers.
* **Scoring**: run **RAGAS** metrics: faithfulness, answer\_relevancy, context\_precision, context\_recall.
* **CI**: scheduled workflow writes artifacts and status badge, fails if below thresholds.

---

## 2) Repo layout

```
tools/evals/
  dataset.jsonl           # golden Q/A (+optional contexts)
  ragas_eval.py           # main evaluator
  README.md
```

---

## 3) Prepare golden dataset

Create `tools/evals/dataset.jsonl`:

```jsonl
{"question": "Explain the distributive property.", "answer": "a(b+c)=ab+ac with example.", "contexts": []}
{"question": "What is a rational number?", "answer": "Any number expressible as a/b with integers and b!=0.", "contexts": []}
{"question": "How do you convert a fraction to a decimal?", "answer": "Divide numerator by denominator; may terminate or repeat.", "contexts": []}
```

> Add \~20–50 high‑quality items per subject to start. If you have curated pages, place text snippets into `contexts` to evaluate retrieval more strictly.

---

## 4) Python environment

Create a **Python 3.11** venv locally or use CI only.

```bash
python -m venv .venv
source .venv/bin/activate
pip install ragas datasets pandas openai tiktoken
```

Set env (locally and in CI Secrets):

```bash
export OPENAI_API_KEY=sk-...
export APP_URL=http://localhost:3006 # or your deployed URL
export MODEL_NAME=gpt-4o-mini        # judge & embed model used by ragas
```

---

## 5) Evaluator script

Create `tools/evals/ragas_eval.py`:

```python
import os, json, time
import pandas as pd
import requests
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall

APP_URL = os.environ.get("APP_URL", "http://localhost:3006")
MODEL_NAME = os.environ.get("MODEL_NAME", "gpt-4o-mini")
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]

# RAGAS uses OpenAI under the hood for judgments. Configure via env var.
os.environ["RAGAS_OPENAI_API_KEY"] = OPENAI_API_KEY
os.environ["RAGAS_OPENAI_MODEL"] = MODEL_NAME


def predict(question: str) -> dict:
    """Call your non-streaming endpoint and return {answer, citations?}."""
    url = f"{APP_URL}/api/chat/lesson"
    r = requests.post(url, json={"question": question, "k": 6}, timeout=120)
    r.raise_for_status()
    data = r.json()
    return {"answer": data.get("answer", ""), "contexts": []}


def load_dataset(path: str):
    rows = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            j = json.loads(line)
            rows.append(j)
    return rows


def main():
    rows = load_dataset("tools/evals/dataset.jsonl")
    preds = []
    for i, row in enumerate(rows):
        ans = predict(row["question"])  # {answer, contexts}
        preds.append({
            "question": row["question"],
            "answer": ans["answer"],
            "contexts": ans.get("contexts", row.get("contexts", [])),
            "ground_truth": row["answer"],
        })
        time.sleep(0.5)  # be nice to your API

    ds = Dataset.from_list(preds)
    result = evaluate(
        ds,
        metrics=[faithfulness, answer_relevancy, context_precision, context_recall],
    )

    df = result.to_pandas()
    os.makedirs("tools/evals/out", exist_ok=True)
    ts = int(time.time())
    csv_path = f"tools/evals/out/ragas_{ts}.csv"
    json_path = f"tools/evals/out/ragas_{ts}.json"
    df.to_csv(csv_path, index=False)
    df.to_json(json_path, orient="records")

    # thresholds
    thresholds = {
        "faithfulness": 0.80,
        "answer_relevancy": 0.75,
        "context_precision": 0.60,
        "context_recall": 0.60,
    }

    # compute means and assert
    means = df.mean(numeric_only=True).to_dict()
    print("Metric means:", means)

    bad = []
    for k, thr in thresholds.items():
        val = means.get(k, 0)
        if val < thr:
            bad.append((k, val, thr))

    with open("tools/evals/out/summary.txt", "w") as f:
        for k, v in means.items():
            f.write(f"{k}: {v:.3f}\n")
        if bad:
            f.write("FAILURES:\n")
            for (k, v, thr) in bad:
                f.write(f" - {k}: {v:.3f} < {thr}\n")

    if bad:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
```

> If you want to evaluate **retrieval** more strictly, return actual snippets in `predict()` (from `/api/rag/hybrid-query`) and pass them under `contexts`.

---

## 6) Nightly GitHub Action

Create `.github/workflows/nightly-ragas.yml`:

```yaml
name: nightly-ragas
on:
  schedule:
    - cron: "0 2 * * *"  # nightly 02:00 UTC
  workflow_dispatch: {}

jobs:
  eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install deps
        run: |
          python -m pip install --upgrade pip
          pip install ragas datasets pandas openai tiktoken requests
      - name: Run RAGAS
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          APP_URL: ${{ secrets.APP_URL }}
          MODEL_NAME: gpt-4o-mini
        run: |
          python tools/evals/ragas_eval.py
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ragas-results
          path: tools/evals/out/*
```

> Store `OPENAI_API_KEY` and `APP_URL` as **GitHub Secrets**. The job will fail if metrics fall below thresholds.

---

## 7) Local run

```bash
export APP_URL=http://localhost:3006
export OPENAI_API_KEY=sk-...
python tools/evals/ragas_eval.py
open tools/evals/out/summary.txt
```

---

## 8) Optional improvements

* Add a second job to post results to **Slack** or create a **GitHub Pages** dashboard.
* Track metrics over time (append to a CSV / SQLite) to see trends.
* Add subject‑specific thresholds.
* Evaluate **hybrid vs vector‑only** by adding a second predictor.

With this setup, you get continuous signal on **faithfulness** and **retrieval quality** and catch regressions automatically.
