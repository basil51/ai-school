import { NextRequest, NextResponse } from 'next/server';
import { getToken } from "next-auth/jwt";
import { prisma } from '@/lib/prisma';
import { toSerializable } from '@/lib/utils';

export const runtime = "nodejs";

// GET - Fetch assessments for a smart teaching session
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const lessonId = searchParams.get('lessonId');
    const includeQuestions = searchParams.get('includeQuestions') === 'true';

    if (!sessionId && !lessonId) {
      return NextResponse.json(
        { error: "Session ID or Lesson ID is required" },
        { status: 400 }
      );
    }

    // Build where clause
    const whereClause: any = {};
    
    if (sessionId) {
      whereClause.smartTeachingAssessments = {
        some: {
          sessionId: sessionId
        }
      };
    }
    
    if (lessonId) {
      whereClause.lessonId = lessonId;
    }

    // Filter by user's organization
    whereClause.lesson = {
      topic: {
        subject: {
          organizationId: token.organizationId as string
        }
      }
    };

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
        smartTeachingAssessments: sessionId ? {
          where: {
            sessionId: sessionId
          }
        } : false,
        _count: {
          select: {
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
    console.error('Error fetching smart teaching assessments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or start a smart teaching assessment
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, assessmentId, action } = body;

    if (!sessionId || !assessmentId) {
      return NextResponse.json(
        { error: "Session ID and Assessment ID are required" },
        { status: 400 }
      );
    }

    // Verify the smart teaching session exists and belongs to the user
    const session = await prisma.smartTeachingSession.findFirst({
      where: {
        id: sessionId,
        studentId: token.sub
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: "Smart teaching session not found" },
        { status: 404 }
      );
    }

    // Verify the assessment exists and is active
    const assessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        isActive: true,
        lesson: {
          topic: {
            subject: {
              organizationId: token.organizationId as string
            }
          }
        }
      },
      include: {
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

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found or inactive" },
        { status: 404 }
      );
    }

    if (action === 'start') {
      // Check if assessment is already started for this session
      const existingAssessment = await prisma.smartTeachingAssessment.findFirst({
        where: {
          sessionId: sessionId,
          assessmentId: assessmentId
        }
      });

      if (existingAssessment) {
        return NextResponse.json(
          { 
            error: "Assessment already started for this session",
            smartTeachingAssessment: toSerializable(existingAssessment)
          },
          { status: 400 }
        );
      }

      // Create new smart teaching assessment
      const smartTeachingAssessment = await prisma.smartTeachingAssessment.create({
        data: {
          sessionId: sessionId,
          assessmentId: assessmentId,
          status: 'in_progress'
        },
        include: {
          assessment: {
            include: {
              questions: {
                include: {
                  options: true
                },
                orderBy: {
                  order: 'asc'
                }
              }
            }
          }
        }
      });

      return NextResponse.json(toSerializable(smartTeachingAssessment), { status: 201 });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error creating smart teaching assessment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
