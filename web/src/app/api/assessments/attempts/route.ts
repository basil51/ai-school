import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toSerializable } from '@/lib/utils';

// GET - Fetch assessment attempts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get('assessmentId');
    const studentId = searchParams.get('studentId');
    const includeResponses = searchParams.get('includeResponses') === 'true';

    const userRole = (session as any).role;
    const userId = (session as any).id;

    // Build where clause based on user role
    const whereClause: any = {};

    if (assessmentId) {
      whereClause.assessmentId = assessmentId;
    }

    // Students can only see their own attempts
    if (userRole === 'student') {
      whereClause.studentId = userId;
    } else if (studentId) {
      whereClause.studentId = studentId;
    }

    const attempts = await prisma.assessmentAttempt.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assessment: {
          include: {
            lesson: {
              include: {
                topic: {
                  include: {
                    subject: true
                  }
                }
              }
            }
          }
        },
        responses: includeResponses ? {
          include: {
            question: {
              include: {
                options: true
              }
            }
          }
        } : false
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    return NextResponse.json(toSerializable(attempts));
  } catch (error) {
    console.error('Error fetching assessment attempts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Start a new assessment attempt
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session as any).role;
    const userId = (session as any).id;

    // Only students can start assessment attempts
    if (userRole !== 'student') {
      return NextResponse.json({ error: 'Only students can start assessment attempts' }, { status: 403 });
    }

    const data = await request.json();
    const { assessmentId } = data;

    if (!assessmentId) {
      return NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 });
    }

    // Verify the assessment exists and is active
    const assessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        isActive: true,
        lesson: {
          topic: {
            subject: {
              organizationId: (session as any).organizationId
            }
          }
        }
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
        }
      }
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found or inactive' }, { status: 404 });
    }

    // Check if student is enrolled in the subject
    const enrollment = await prisma.studentEnrollment.findFirst({
      where: {
        studentId: userId,
        subjectId: assessment.lesson.topic.subjectId,
        isActive: true
      }
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Student not enrolled in this subject' }, { status: 403 });
    }

    // Check existing attempts
    const existingAttempts = await prisma.assessmentAttempt.findMany({
      where: {
        studentId: userId,
        assessmentId: assessmentId
      }
    });

    // Check if max attempts reached
    if (existingAttempts.length >= assessment.maxAttempts) {
      return NextResponse.json({ 
        error: `Maximum attempts (${assessment.maxAttempts}) reached for this assessment` 
      }, { status: 400 });
    }

    // Check if there's an incomplete attempt
    const incompleteAttempt = existingAttempts.find(attempt => !attempt.completedAt);
    if (incompleteAttempt) {
      return NextResponse.json({ 
        error: 'You have an incomplete attempt. Please complete it first.',
        attemptId: incompleteAttempt.id
      }, { status: 400 });
    }

    // Create new attempt
    const attempt = await prisma.assessmentAttempt.create({
      data: {
        studentId: userId,
        assessmentId: assessmentId
      },
      include: {
        assessment: {
          include: {
            lesson: {
              include: {
                topic: {
                  include: {
                    subject: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return NextResponse.json(toSerializable(attempt), { status: 201 });
  } catch (error) {
    console.error('Error starting assessment attempt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Submit assessment attempt
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session as any).role;
    const userId = (session as any).id;

    // Only students can submit assessment attempts
    if (userRole !== 'student') {
      return NextResponse.json({ error: 'Only students can submit assessment attempts' }, { status: 403 });
    }

    const data = await request.json();
    const { attemptId, responses } = data;

    if (!attemptId || !responses || !Array.isArray(responses)) {
      return NextResponse.json({ 
        error: 'Attempt ID and responses are required' 
      }, { status: 400 });
    }

    // Verify the attempt exists and belongs to the user
    const attempt = await prisma.assessmentAttempt.findFirst({
      where: {
        id: attemptId,
        studentId: userId,
        completedAt: null // Only allow submission of incomplete attempts
      },
      include: {
        assessment: {
          include: {
            questions: {
              include: {
                options: true
              }
            }
          }
        }
      }
    });

    if (!attempt) {
      return NextResponse.json({ 
        error: 'Attempt not found or already completed' 
      }, { status: 404 });
    }

    // Calculate score and process responses
    let _totalScore = 0;
    let _totalPoints = 0;
    const processedResponses: any[] = [];

    for (const response of responses) {
      const question = attempt.assessment.questions.find(q => q.id === response.questionId);
      if (!question) continue;

      _totalPoints += question.points;
      
      let isCorrect = false;
      let pointsEarned = 0;

      // Grade based on question type
      switch (question.type) {
        case 'multiple_choice':
          const selectedOption = question.options.find(opt => opt.id === response.answer);
          isCorrect = selectedOption?.isCorrect || false;
          pointsEarned = isCorrect ? question.points : 0;
          break;
        
        case 'true_false':
          isCorrect = response.answer.toLowerCase() === question.correctAnswer?.toLowerCase();
          pointsEarned = isCorrect ? question.points : 0;
          break;
        
        case 'short_answer':
        case 'essay':
          // For now, auto-grade based on exact match or keyword matching
          // In Phase 13, we'll implement AI grading
          isCorrect = response.answer.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim();
          pointsEarned = isCorrect ? question.points : 0;
          break;
        
        default:
          pointsEarned = 0;
      }

      _totalScore += pointsEarned;

      processedResponses.push({
        attemptId,
        questionId: response.questionId,
        answer: response.answer,
        isCorrect,
        pointsEarned,
        timeSpent: response.timeSpent || 0
      });
    }

    //const percentage = totalPoints > 0 ? (totalScore / totalPoints) : 0;
    //const passed = percentage >= attempt.assessment.passingScore;

    // Update attempt and create responses in a transaction
    /*const result = await prisma.$transaction(async (tx) => {
      // Update the attempt
      const updatedAttempt = await tx.assessmentAttempt.update({
        where: { id: attemptId },
        data: {
          completedAt: new Date(),
          score: totalScore,
          passed
        }
      });

      // Create responses
      await tx.studentResponse.createMany({
        data: processedResponses
      });

      // Update student progress if passed
      if (passed) {
        await tx.studentProgress.upsert({
          where: {
            studentId_lessonId: {
              studentId: userId,
              lessonId: attempt.assessment.lessonId
            }
          },
          update: {
            status: 'completed',
            completedAt: new Date()
          },
          create: {
            studentId: userId,
            lessonId: attempt.assessment.lessonId,
            status: 'completed',
            completedAt: new Date()
          }
        });
      }

      return updatedAttempt;
    });*/

    // Fetch complete attempt with responses
    const completeAttempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assessment: {
          include: {
            lesson: {
              include: {
                topic: {
                  include: {
                    subject: true
                  }
                }
              }
            }
          }
        },
        responses: {
          include: {
            question: {
              include: {
                options: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(toSerializable(completeAttempt));
  } catch (error) {
    console.error('Error submitting assessment attempt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
