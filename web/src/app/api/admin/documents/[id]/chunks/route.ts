import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: documentId } = await params;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));
    const offset = (page - 1) * pageSize;

    // Ensure document exists
    const doc = await prisma.$queryRaw`SELECT id FROM "RagDocument" WHERE id = ${documentId}`;
    if (!Array.isArray(doc) || doc.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const chunks = await prisma.$queryRaw<{
      id: string;
      docId: string;
      content: string;
      createdAt: Date;
    }[]>`
      SELECT id, "docId", content, "createdAt"
      FROM "RagChunk"
      WHERE "docId" = ${documentId}
      ORDER BY "createdAt" ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const [{ count }] = (await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int as count FROM "RagChunk" WHERE "docId" = ${documentId}
    `);

    return NextResponse.json({
      page,
      pageSize,
      total: count,
      chunks,
    });
  } catch (error) {
    console.error("Error fetching chunks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


