import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toSerializable } from '@/lib/utils';

// GET - Fetch assessments for a lesson or student
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');
    const studentId = searchParams.get('studentId');
    const type = searchParams.get('type');
    const includeQuestions = searchParams.get('includeQuestions') === 'true';
    const includeAttempts = searchParams.get('includeAttempts') === 'true';

    const userRole = (session as any).role;
    const userId = (session as any).user?.id;
    const organizationId = (session as any).user?.organizationId;

    // Build where clause based on user role and parameters
    const whereClause: any = {};

    if (lessonId) {
      whereClause.lessonId = lessonId;
    }

    if (type) {
      whereClause.type = type;
    }

    // Filter by organization for all users
    if (organizationId) {
      whereClause.lesson = {
        topic: {
          subject: {
            organizationId: organizationId
          }
        }
      };
    }

    // Students can only see assessments they have access to
    if (userRole === 'student') {
      // For students, we need to ensure they can only see assessments from their organization
      // and optionally filter by their attempts if studentId is provided
      if (studentId && studentId !== userId) {
        return NextResponse.json({ error: 'Unauthorized access to student data' }, { status: 403 });
      }
      
      // If studentId is provided, filter by their attempts
      if (studentId) {
        whereClause.attempts = {
          some: {
            studentId: studentId
          }
        };
      }
    }

    const assessments = await prisma.assessment.findMany({
      where: whereClause,
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
        questions: includeQuestions ? {
          include: {
            options: true
          },
          orderBy: {
            order: 'asc'
          }
        } : false,
        attempts: includeAttempts ? {
          where: userRole === 'student' && studentId ? { studentId } : undefined,
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            responses: {
              include: {
                question: true
              }
            }
          },
          orderBy: {
            startedAt: 'desc'
          }
        } : false,
        _count: {
          select: {
            questions: true,
            attempts: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(toSerializable(assessments));
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new assessment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session as any).role;
    
    // Only teachers and admins can create assessments
    if (!['teacher', 'admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const data = await request.json();
    const {
      lessonId,
      type,
      title,
      instructions,
      timeLimit,
      passingScore,
      maxAttempts,
      questions
    } = data;

    if (!lessonId || !type || !title || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Lesson ID, type, title, and questions are required' },
        { status: 400 }
      );
    }

    // Verify the lesson exists and user has access
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        topic: {
          subject: {
            organizationId: (session as any).organizationId
          }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Create assessment with questions in a transaction
    const assessment = await prisma.$transaction(async (tx) => {
      const newAssessment = await tx.assessment.create({
        data: {
          lessonId,
          type,
          title,
          instructions: instructions || '',
          timeLimit: timeLimit || null,
          passingScore: passingScore || 0.7,
          maxAttempts: maxAttempts || 3
        }
      });

      // Create questions with options
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const newQuestion = await tx.question.create({
          data: {
            assessmentId: newAssessment.id,
            type: question.type,
            content: question.content,
            points: question.points || 1.0,
            correctAnswer: question.correctAnswer || null,
            explanation: question.explanation || null,
            order: i + 1
          }
        });

        // Create options for multiple choice questions
        if (question.type === 'multiple_choice' && question.options) {
          for (let j = 0; j < question.options.length; j++) {
            const option = question.options[j];
            await tx.questionOption.create({
              data: {
                questionId: newQuestion.id,
                content: option.content,
                isCorrect: option.isCorrect || false,
                order: j + 1
              }
            });
          }
        }
      }

      return newAssessment;
    });

    // Fetch the complete assessment with questions
    const completeAssessment = await prisma.assessment.findUnique({
      where: { id: assessment.id },
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
          include: {
            options: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    return NextResponse.json(toSerializable(completeAssessment), { status: 201 });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update an assessment
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session as any).role;
    
    // Only teachers and admins can update assessments
    if (!['teacher', 'admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const data = await request.json();
    const {
      id,
      type,
      title,
      instructions,
      timeLimit,
      passingScore,
      maxAttempts,
      isActive
    } = data;

    if (!id) {
      return NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 });
    }

    // Verify the assessment exists and user has access
    const existingAssessment = await prisma.assessment.findFirst({
      where: {
        id,
        lesson: {
          topic: {
            subject: {
              organizationId: (session as any).organizationId
            }
          }
        }
      }
    });

    if (!existingAssessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const updatedAssessment = await prisma.assessment.update({
      where: { id },
      data: {
        type,
        title,
        instructions,
        timeLimit,
        passingScore,
        maxAttempts,
        isActive
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
          include: {
            options: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    return NextResponse.json(toSerializable(updatedAssessment));
  } catch (error) {
    console.error('Error updating assessment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an assessment
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session as any).role;
    
    // Only teachers and admins can delete assessments
    if (!['teacher', 'admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 });
    }

    // Verify the assessment exists and user has access
    const existingAssessment = await prisma.assessment.findFirst({
      where: {
        id,
        lesson: {
          topic: {
            subject: {
              organizationId: (session as any).organizationId
            }
          }
        }
      }
    });

    if (!existingAssessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    await prisma.assessment.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
