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

    const userId = token.sub;
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');

    // Get student progress for lessons
    const whereClause: any = {
      studentId: userId
    };

    if (subjectId) {
      whereClause.lesson = {
        topic: {
          subjectId: subjectId
        }
      };
    }

    const progress = await prisma.studentProgress.findMany({
      where: whereClause,
      include: {
        lesson: {
          include: {
            topic: {
              include: {
                subject: true
              }
            },
            bookUnit: {
              include: {
                book: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      progress: progress.map(p => ({
        id: p.id,
        lessonId: p.lessonId,
        lessonTitle: p.lesson.title,
        subjectName: p.lesson.topic.subject.name,
        topicName: p.lesson.topic.name,
        status: p.status,
        timeSpent: p.timeSpent,
        attempts: p.attempts,
        startedAt: p.startedAt,
        completedAt: p.completedAt,
        source: p.lesson.bookUnit ? {
          type: 'book',
          bookTitle: p.lesson.bookUnit.book.title,
          bookUnit: p.lesson.bookUnit.title,
          academicYear: p.lesson.bookUnit.book.academicYear,
          semester: p.lesson.bookUnit.book.semester
        } : {
          type: 'manual',
          source: 'teacher-created'
        }
      }))
    });

  } catch (error) {
    console.error("Error fetching student progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.sub;
    const { lessonId, status, timeSpent, attempts } = await request.json();

    if (!lessonId || !status) {
      return NextResponse.json(
        { error: "lessonId and status are required" },
        { status: 400 }
      );
    }

    // Verify the lesson exists and user has access
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        isActive: true,
        topic: {
          subject: {
            enrollments: {
              some: {
                studentId: userId,
                isActive: true
              }
            }
          }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found or access denied" },
        { status: 404 }
      );
    }

    // Update or create progress record
    const progress = await prisma.studentProgress.upsert({
      where: {
        studentId_lessonId: {
          studentId: userId,
          lessonId: lessonId
        }
      },
      update: {
        status: status as any,
        timeSpent: timeSpent || 0,
        attempts: attempts || 0,
        startedAt: status === 'in_progress' && !timeSpent ? new Date() : undefined,
        completedAt: status === 'completed' ? new Date() : undefined,
        updatedAt: new Date()
      },
      create: {
        studentId: userId,
        lessonId: lessonId,
        status: status as any,
        timeSpent: timeSpent || 0,
        attempts: attempts || 0,
        startedAt: status === 'in_progress' ? new Date() : undefined,
        completedAt: status === 'completed' ? new Date() : undefined
      }
    });

    return NextResponse.json({
      success: true,
      progress: {
        id: progress.id,
        lessonId: progress.lessonId,
        status: progress.status,
        timeSpent: progress.timeSpent,
        attempts: progress.attempts,
        startedAt: progress.startedAt,
        completedAt: progress.completedAt
      }
    });

  } catch (error) {
    console.error("Error updating student progress:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
