import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { chunkText } from "@/lib/rag/chunk";
import { embedTexts } from "@/lib/rag/embed";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379");
const prisma = new PrismaClient();

export const ingestWorker = new Worker(
  "rag_ingest",
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
        // Create chunk and update with embedding using raw SQL
        const result = await prisma.$queryRaw`
          INSERT INTO "RagChunk" ("docId", "content", "createdAt") 
          VALUES (${docId}, ${c.text}, NOW()) 
          RETURNING id
        `;
        
        const chunkId = (result as { id: string }[])[0].id;
        
        await prisma.$executeRawUnsafe(
          'UPDATE "RagChunk" SET embedding = $1::vector WHERE id = $2',
          vecLiteral,
          chunkId,
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
