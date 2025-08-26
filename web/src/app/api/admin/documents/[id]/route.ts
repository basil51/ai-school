import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: documentId } = await params;

    // Check if document exists using raw SQL
    const document = await prisma.$queryRaw`SELECT id FROM "RagDocument" WHERE id = ${documentId}`;

    if (!Array.isArray(document) || document.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete document (this will cascade to chunks) using raw SQL
    await prisma.$executeRaw`DELETE FROM "RagDocument" WHERE id = ${documentId}`;

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
