import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET - Get lesson details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
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

    const lesson = await prisma.lesson.findFirst({
      where: {
        id,
        topic: {
          subject: {
            organizationId: user.organizationId
          }
        },
        isActive: true
      },
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
        },
        assessments: {
          where: { isActive: true },
          include: {
            questions: {
              where: { isActive: true },
              orderBy: { order: 'asc' }
            },
            _count: {
              select: {
                questions: true,
                attempts: true
              }
            }
          }
        },
        _count: {
          select: {
            assessments: true,
            progress: true
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

    return NextResponse.json({
      success: true,
      lesson: {
        id: lesson.id,
        title: lesson.title,
        content: lesson.content,
        objectives: lesson.objectives,
        difficulty: lesson.difficulty,
        estimatedTime: lesson.estimatedTime,
        order: lesson.order,
        source: lesson.bookUnit ? {
          type: 'book',
          bookTitle: lesson.bookUnit.book.title,
          bookUnit: lesson.bookUnit.title,
          academicYear: lesson.bookUnit.book.academicYear,
          semester: lesson.bookUnit.book.semester,
          language: lesson.bookUnit.book.language,
          pageRange: lesson.bookUnit.pageRange
        } : {
          type: 'manual'
        },
        topic: {
          id: lesson.topic.id,
          name: lesson.topic.name,
          subject: {
            id: lesson.topic.subject.id,
            name: lesson.topic.subject.name
          }
        },
        assessmentCount: lesson._count.assessments,
        studentProgressCount: (lesson as any)._count.progress,
        assessments: lesson.assessments.map(assessment => ({
          id: assessment.id,
          title: assessment.title,
          type: assessment.type,
          timeLimit: assessment.timeLimit,
          passingScore: assessment.passingScore,
          maxAttempts: assessment.maxAttempts,
          questionCount: assessment._count.questions,
          attemptCount: assessment._count.attempts,
          questions: assessment.questions.map(question => ({
            id: question.id,
            type: question.type,
            content: (question as any).content,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            // removed non-existent fields (text, difficulty, options, metadata)
          }))
        }))
      }
    });

  } catch (error) {
    console.error("Error fetching lesson:", error);
    return NextResponse.json(
      { error: "Failed to fetch lesson" },
      { status: 500 }
    );
  }
}

// PATCH - Update lesson
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
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
    const { title, content, objectives, difficulty, estimatedTime, order } = body;

    // Verify lesson exists and user has access
    const existingLesson = await prisma.lesson.findFirst({
      where: {
        id,
        topic: {
          subject: {
            organizationId: user.organizationId
          }
        },
        isActive: true
      }
    });

    if (!existingLesson) {
      return NextResponse.json(
        { error: "Lesson not found or access denied" },
        { status: 404 }
      );
    }

    // Update lesson
    const updatedLesson = await prisma.lesson.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(objectives && { objectives }),
        ...(difficulty && { difficulty }),
        ...(estimatedTime && { estimatedTime }),
        ...(order !== undefined && { order }),
        updatedAt: new Date()
      }
    });

    // If content was updated and this is a book lesson, update the RAG document
    if (content && existingLesson.bookUnitId) {
      await prisma.ragDocument.updateMany({
        where: {
          lessonId: id
        },
        data: {
          content: content,
          length: content.length,
          updatedAt: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      lesson: {
        id: updatedLesson.id,
        title: updatedLesson.title,
        content: updatedLesson.content,
        objectives: updatedLesson.objectives,
        difficulty: updatedLesson.difficulty,
        estimatedTime: updatedLesson.estimatedTime,
        order: updatedLesson.order,
        updatedAt: updatedLesson.updatedAt
      }
    });

  } catch (error) {
    console.error("Error updating lesson:", error);
    return NextResponse.json(
      { error: "Failed to update lesson" },
      { status: 500 }
    );
  }
}

// DELETE - Delete lesson
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
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

    // Verify lesson exists and user has access
    const existingLesson = await prisma.lesson.findFirst({
      where: {
        id,
        topic: {
          subject: {
            organizationId: user.organizationId
          }
        },
        isActive: true
      },
      include: {
        _count: {
          select: {
            assessments: true,
            progress: true
          }
        }
      }
    });

    if (!existingLesson) {
      return NextResponse.json(
        { error: "Lesson not found or access denied" },
        { status: 404 }
      );
    }

    // Check for dependencies
    const hasAssessments = existingLesson._count.assessments > 0;
    const hasStudentProgress = (existingLesson as any)._count.progress > 0;

    if (hasAssessments || hasStudentProgress) {
      return NextResponse.json({
        error: "Cannot delete lesson with existing assessments or student progress",
        details: {
          assessmentCount: existingLesson._count.assessments,
          studentProgressCount: (existingLesson as any)._count.progress
        }
      }, { status: 409 });
    }

    // Soft delete lesson
    await prisma.lesson.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    // Soft delete related RAG documents
    await prisma.ragDocument.updateMany({
      where: {
        lessonId: id
      },
      data: {
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: "Lesson deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting lesson:", error);
    return NextResponse.json(
      { error: "Failed to delete lesson" },
      { status: 500 }
    );
  }
}
