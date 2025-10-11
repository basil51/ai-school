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

    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');
    const unitId = searchParams.get('unitId');
    const bookId = searchParams.get('bookId');
    const subjectId = searchParams.get('subjectId');

    const userId = token.sub;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build where clause based on parameters
    const whereClause: any = {
      isActive: true
    };

    if (lessonId) {
      whereClause.lessonId = lessonId;
    } else if (unitId) {
      // Find lessons in the unit
      const unitLessons = await prisma.lesson.findMany({
        where: {
          bookUnitId: unitId,
          isActive: true
        },
        select: { id: true }
      });
      
      whereClause.lessonId = {
        in: unitLessons.map(l => l.id)
      };
    } else if (bookId) {
      // Find lessons in the book
      const bookLessons = await prisma.lesson.findMany({
        where: {
          bookUnit: {
            bookId: bookId
          },
          isActive: true
        },
        select: { id: true }
      });
      
      whereClause.lessonId = {
        in: bookLessons.map(l => l.id)
      };
    } else if (subjectId) {
      // Find lessons in the subject
      const subjectLessons = await prisma.lesson.findMany({
        where: {
          topic: {
            subjectId: subjectId
          },
          isActive: true
        },
        select: { id: true }
      });
      
      whereClause.lessonId = {
        in: subjectLessons.map(l => l.id)
      };
    }

    // Get assessments
    const assessments = await prisma.assessment.findMany({
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
        },
        questions: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        },
        attempts: {
          where: { studentId: userId },
          orderBy: { startedAt: 'desc' },
          take: 1
        },
        _count: {
          select: {
            questions: true,
            attempts: {
              where: { studentId: userId }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform data for response
    const transformedAssessments = assessments.map(assessment => ({
      id: assessment.id,
      title: assessment.title,
      instructions: assessment.instructions,
      type: assessment.type,
      timeLimit: assessment.timeLimit,
      passingScore: assessment.passingScore,
      maxAttempts: assessment.maxAttempts,
      questionCount: assessment._count.questions,
      attemptCount: assessment._count.attempts,
      lastAttempt: assessment.attempts[0] ? {
        id: assessment.attempts[0].id,
        status: assessment.attempts[0].completedAt ? 'completed' : 'in_progress',
        score: assessment.attempts[0].score,
        startedAt: assessment.attempts[0].startedAt,
        completedAt: assessment.attempts[0].completedAt
      } : null,
      source: {
        lessonTitle: assessment.lesson?.title,
        subjectName: assessment.lesson?.topic?.subject?.name,
        topicName: assessment.lesson?.topic?.name,
        bookTitle: assessment.lesson?.bookUnit?.book?.title,
        bookUnit: assessment.lesson?.bookUnit?.title,
        academicYear: assessment.lesson?.bookUnit?.book?.academicYear,
        semester: assessment.lesson?.bookUnit?.book?.semester
      },
      questions: assessment.questions.map(q => ({
        id: q.id,
        type: q.type,
        content: (q as any).content,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      }))
    }));

    return NextResponse.json({
      success: true,
      assessments: transformedAssessments,
      total: transformedAssessments.length
    });

  } catch (error) {
    console.error("Error fetching assessments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessments" },
      { status: 500 }
    );
  }
}
