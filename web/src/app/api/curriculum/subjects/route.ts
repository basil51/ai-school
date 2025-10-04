import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get subjects for the user's organization
    const subjects = await prisma.subject.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true
      },
      include: {
        topics: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ subjects });

  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}
