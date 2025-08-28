import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { embedText } from "@/lib/rag/embed";

const prisma = new PrismaClient();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { content } = await req.json();
    if (typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "content must be a non-empty string" }, { status: 400 });
    }

    // Ensure chunk exists and fetch docId
    const chunk = await prisma.$queryRaw<{ id: string; docId: string }[]>`
      SELECT id, "docId" FROM "RagChunk" WHERE id = ${id} LIMIT 1
    `;
    if (!Array.isArray(chunk) || chunk.length === 0) {
      return NextResponse.json({ error: "Chunk not found" }, { status: 404 });
    }

    // Re-embed content
    const embedding = await embedText(content);
    if (!Array.isArray(embedding) || embedding.length !== 1536) {
      return NextResponse.json({ error: "Embedding dimension mismatch. Expected 1536." }, { status: 500 });
    }
    const vectorLiteral = `[${embedding.join(",")}]`;

    await prisma.$executeRaw`
      UPDATE "RagChunk"
      SET content = ${content}, embedding = ${vectorLiteral}::vector
      WHERE id = ${id}
    `;

    return NextResponse.json({ id, content });
  } catch (error) {
    console.error("Error updating chunk:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Ensure chunk exists
    const chunk = await prisma.$queryRaw`SELECT id FROM "RagChunk" WHERE id = ${id} LIMIT 1`;
    if (!Array.isArray(chunk) || chunk.length === 0) {
      return NextResponse.json({ error: "Chunk not found" }, { status: 404 });
    }

    await prisma.$executeRaw`DELETE FROM "RagChunk" WHERE id = ${id}`;
    return NextResponse.json({ id, deleted: true });
  } catch (error) {
    console.error("Error deleting chunk:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


