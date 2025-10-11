import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// PATCH - Reorder lessons
export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      include: { organization: true }
    });

    if (!user || (user.role !== 'teacher' && user.role !== 'admin' && user.role !== 'super_admin')) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { lessons } = body; // Array of { id, order }

    if (!lessons || !Array.isArray(lessons)) {
      return NextResponse.json(
        { error: "Lessons array is required" },
        { status: 400 }
      );
    }

    // Verify all lessons exist and user has access
    const lessonIds = lessons.map((l: any) => l.id);
    const existingLessons = await prisma.lesson.findMany({
      where: {
        id: { in: lessonIds },
        topic: {
          subject: {
            organizationId: user.organizationId
          }
        },
        isActive: true
      }
    });

    if (existingLessons.length !== lessonIds.length) {
      return NextResponse.json(
        { error: "Some lessons not found or access denied" },
        { status: 404 }
      );
    }

    // Update lesson orders
    const updatePromises = lessons.map((lesson: any) =>
      prisma.lesson.update({
        where: { id: lesson.id },
        data: {
          order: lesson.order,
          updatedAt: new Date()
        }
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: "Lessons reordered successfully",
      updatedCount: lessons.length
    });

  } catch (error) {
    console.error("Error reordering lessons:", error);
    return NextResponse.json(
      { error: "Failed to reorder lessons" },
      { status: 500 }
    );
  }
}
