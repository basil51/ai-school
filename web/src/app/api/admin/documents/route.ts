import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use raw SQL to get documents with chunk counts
    const documents = await prisma.$queryRaw`
      SELECT 
        d.id,
        d.title,
        d.length,
        d."createdAt",
        COUNT(c.id)::int as chunk_count
      FROM "RagDocument" d
      LEFT JOIN "RagChunk" c ON d.id = c."docId"
      GROUP BY d.id, d.title, d.length, d."createdAt"
      ORDER BY d."createdAt" DESC
    `;

    // Transform the result to match expected format
    const formattedDocuments = (documents as { id: string; title: string; length: number; createdAt: Date; chunk_count: number }[]).map(doc => ({
      id: doc.id,
      title: doc.title,
      length: doc.length,
      createdAt: doc.createdAt,
      chunks: Array.from({ length: doc.chunk_count }, (_, i) => ({ id: `chunk_${i}` }))
    }));

    return NextResponse.json(formattedDocuments);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
