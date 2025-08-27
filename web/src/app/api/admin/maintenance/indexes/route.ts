import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [{ count }] = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int as count FROM "RagChunk"
    `;

    const indexes = await prisma.$queryRaw<{ indexname: string; indexdef: string }[]>`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND tablename = 'RagChunk'
        AND indexname IN (
          'RagChunk_embedding_ivfflat_idx',
          'RagChunk_embedding_hnsw_idx',
          'RagChunk_content_tsv_gin_idx'
        )
    `;

    return NextResponse.json({ count, indexes });
  } catch (error) {
    console.error("Index status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const method = (body?.method === 'hnsw' ? 'hnsw' : 'ivfflat') as 'ivfflat' | 'hnsw';
    const reindexGin = Boolean(body?.reindexGin);

    const [{ count }] = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int as count FROM "RagChunk"
    `;

    // Heuristic: lists ~ sqrt(n) clamped
    const defaultLists = Math.max(32, Math.min(8192, Math.ceil(Math.sqrt(Math.max(1, count)))));
    const lists: number = Number.isFinite(body?.lists) && body.lists > 0 ? Math.floor(body.lists) : defaultLists;

    // Drop existing vector indexes concurrently if present
    const dropIvf = `DROP INDEX CONCURRENTLY IF EXISTS "RagChunk_embedding_ivfflat_idx"`;
    const dropHnsw = `DROP INDEX CONCURRENTLY IF EXISTS "RagChunk_embedding_hnsw_idx"`;
    await prisma.$executeRawUnsafe(dropIvf);
    await prisma.$executeRawUnsafe(dropHnsw);

    let createVectorSql: string;
    if (method === 'ivfflat') {
      createVectorSql = `CREATE INDEX CONCURRENTLY "RagChunk_embedding_ivfflat_idx" ON "public"."RagChunk" USING ivfflat ("embedding") WITH (lists = ${lists})`;
    } else {
      // HNSW defaults; may fail if pgvector version does not support HNSW
      const m = Number.isFinite(body?.m) && body.m > 0 ? Math.floor(body.m) : 16;
      const ef = Number.isFinite(body?.ef_construction) && body.ef_construction > 0 ? Math.floor(body.ef_construction) : 64;
      createVectorSql = `CREATE INDEX CONCURRENTLY "RagChunk_embedding_hnsw_idx" ON "public"."RagChunk" USING hnsw ("embedding") WITH (m = ${m}, ef_construction = ${ef})`;
    }

    await prisma.$executeRawUnsafe(createVectorSql);

    if (reindexGin) {
      const createGin = `CREATE INDEX CONCURRENTLY IF NOT EXISTS "RagChunk_content_tsv_gin_idx" ON "public"."RagChunk" USING GIN (to_tsvector('english', "content"))`;
      await prisma.$executeRawUnsafe(createGin);
    }

    return NextResponse.json({
      success: true,
      method,
      lists: method === 'ivfflat' ? lists : undefined,
      count,
    });
  } catch (error) {
    console.error("Index rebuild error:", error);
    return NextResponse.json({ error: (error as any)?.message ?? 'Internal server error' }, { status: 500 });
  }
}


