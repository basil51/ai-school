import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET - Get assessment details
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

    const assessment = await prisma.assessment.findFirst({
      where: {
        id,
        lesson: {
          topic: {
            subject: {
              organizationId: user.organizationId
            }
          }
        },
        isActive: true
      },
      include: {
        lesson: {
          include: {
            topic: {
              include: {
                subject: true
              }
            }
          }
        },
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
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      assessment: {
        id: assessment.id,
        title: assessment.title,
        instructions: assessment.instructions,
        type: assessment.type,
        timeLimit: assessment.timeLimit,
        passingScore: assessment.passingScore,
        maxAttempts: assessment.maxAttempts,
        questionCount: assessment._count.questions,
        attemptCount: assessment._count.attempts,
        lesson: {
          id: assessment.lesson.id,
          title: assessment.lesson.title,
          topic: {
            id: assessment.lesson.topic.id,
            name: assessment.lesson.topic.name,
            subject: {
              id: assessment.lesson.topic.subject.id,
              name: assessment.lesson.topic.subject.name
            }
          }
        },
        questions: assessment.questions.map(question => ({
          id: question.id,
          type: question.type,
          content: (question as any).content,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          order: question.order,
          // removed non-existent fields (text, difficulty, options, metadata)
        }))
      }
    });

  } catch (error) {
    console.error("Error fetching assessment:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessment" },
      { status: 500 }
    );
  }
}

// PATCH - Update assessment
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
    const { 
      title, 
      instructions, 
      timeLimit, 
      passingScore, 
      maxAttempts,
      questions 
    } = body;

    // Verify assessment exists and user has access
    const existingAssessment = await prisma.assessment.findFirst({
      where: {
        id,
        lesson: {
          topic: {
            subject: {
              organizationId: user.organizationId
            }
          }
        },
        isActive: true
      }
    });

    if (!existingAssessment) {
      return NextResponse.json(
        { error: "Assessment not found or access denied" },
        { status: 404 }
      );
    }

    // Update assessment
    const updatedAssessment = await prisma.assessment.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(instructions && { instructions }),
        ...(timeLimit !== undefined && { timeLimit }),
        ...(passingScore !== undefined && { passingScore }),
        ...(maxAttempts !== undefined && { maxAttempts }),
        updatedAt: new Date()
      }
    });

    // Update questions if provided
    if (questions && Array.isArray(questions)) {
      // Delete existing questions
      await prisma.question.updateMany({
        where: {
          assessmentId: id,
          isActive: true
        },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      // Create new questions
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        await prisma.question.create({
          data: {
            assessmentId: id,
            type: question.type,
            content: question.text || question.content || '',
            correctAnswer: question.correctAnswer || '',
            explanation: question.explanation || '',
            order: i + 1,
            isActive: true
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      assessment: {
        id: updatedAssessment.id,
        title: updatedAssessment.title,
        instructions: updatedAssessment.instructions,
        type: updatedAssessment.type,
        timeLimit: updatedAssessment.timeLimit,
        passingScore: updatedAssessment.passingScore,
        maxAttempts: updatedAssessment.maxAttempts,
        updatedAt: updatedAssessment.updatedAt
      }
    });

  } catch (error) {
    console.error("Error updating assessment:", error);
    return NextResponse.json(
      { error: "Failed to update assessment" },
      { status: 500 }
    );
  }
}

// DELETE - Delete assessment
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

    // Verify assessment exists and user has access
    const existingAssessment = await prisma.assessment.findFirst({
      where: {
        id,
        lesson: {
          topic: {
            subject: {
              organizationId: user.organizationId
            }
          }
        },
        isActive: true
      },
      include: {
        _count: {
          select: {
            attempts: true
          }
        }
      }
    });

    if (!existingAssessment) {
      return NextResponse.json(
        { error: "Assessment not found or access denied" },
        { status: 404 }
      );
    }

    // Check for dependencies
    const hasAttempts = existingAssessment._count.attempts > 0;

    if (hasAttempts) {
      return NextResponse.json({
        error: "Cannot delete assessment with existing student attempts",
        details: {
          attemptCount: existingAssessment._count.attempts
        }
      }, { status: 409 });
    }

    // Soft delete assessment
    await prisma.assessment.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    // Soft delete related questions
    await prisma.question.updateMany({
      where: {
        assessmentId: id,
        isActive: true
      },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: "Assessment deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting assessment:", error);
    return NextResponse.json(
      { error: "Failed to delete assessment" },
      { status: 500 }
    );
  }
}
