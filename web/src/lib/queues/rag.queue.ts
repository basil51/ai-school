import { Queue, QueueEvents, JobsOptions } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379");

export const RAG_INGEST_QUEUE = "rag_ingest";

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
