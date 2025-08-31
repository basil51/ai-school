import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getOrganizationContext } from "@/lib/organization";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session as any)?.role;
    if (!session || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const context = await getOrganizationContext();
    
    // Check if organizationId is provided in query params (for super admin organization switching)
    const { searchParams } = new URL(request.url);
    const queryOrgId = searchParams.get('organizationId');
    
    // Determine which organization to filter by
    let targetOrgId = context.organizationId;
    if (queryOrgId && userRole === 'super_admin') {
      // Super admin is viewing a specific organization
      targetOrgId = queryOrgId;
    } else if (userRole === 'super_admin' && !queryOrgId) {
      // Super admin viewing all organizations (no filter)
      targetOrgId = null;
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
      ${targetOrgId ? Prisma.sql`WHERE d."organizationId" = ${targetOrgId}` : Prisma.empty}
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
