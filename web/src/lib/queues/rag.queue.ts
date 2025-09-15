import { Queue, QueueEvents, JobsOptions } from "bullmq";
import IORedis from "ioredis";

let connection: IORedis | null = null;

// Only initialize Redis if configured
try {
  if (process.env.REDIS_URL || process.env.REDIS_HOST) {
    connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableReadyCheck: false,
    });

    connection.on('error', (error) => {
      console.warn('Queue Redis connection error:', error.message);
      connection = null;
    });
  }
} catch (error) {
  console.warn('Failed to initialize queue Redis:', error);
  connection = null;
}

export const RAG_INGEST_QUEUE = "rag_ingest";

export type IngestJobPayload = {
  docId: string;
  rawText: string;
  batchSize?: number; // optional for chunk batching
};

export function getIngestQueue() {
  if (!connection) {
    throw new Error('Redis connection not available for queue operations');
  }
  return new Queue<IngestJobPayload>(RAG_INGEST_QUEUE, { connection });
}

export function getQueueEvents() {
  if (!connection) {
    throw new Error('Redis connection not available for queue events');
  }
  return new QueueEvents(RAG_INGEST_QUEUE, { connection });
}

export type ProgressPayload = { processed: number; total: number };

export type IngestJobOpts = JobsOptions;
