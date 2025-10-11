import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
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

    // Get books for the user's organization
    const books = await prisma.book.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true
      },
      include: {
        subject: true,
        units: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              where: { isActive: true },
              orderBy: { order: 'asc' }
            }
          }
        },
        _count: {
          select: {
            units: true,
            ragDocuments: true
          }
        }
      },
      orderBy: [
        { academicYear: 'desc' },
        { title: 'asc' }
      ]
    });

    return NextResponse.json({ books });

  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}
