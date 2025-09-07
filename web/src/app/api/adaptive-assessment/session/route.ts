import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdaptiveAssessmentEngine } from '@/lib/assessment/adaptive-engine';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId, subjectId, sessionType } = await request.json();

    // Validate required fields
    if (!studentId || !subjectId || !sessionType) {
      return NextResponse.json(
        { error: 'Missing required fields: studentId, subjectId, sessionType' },
        { status: 400 }
      );
    }

    // Check permissions
    if ((session?.user as any)?.role !== 'admin' && 
        (session?.user as any)?.role !== 'teacher' && 
        (session?.user as any)?.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create adaptive assessment engine
    const engine = new AdaptiveAssessmentEngine(studentId, subjectId, sessionType);
    
    // Create new assessment session
    const assessmentId = await engine.createAssessmentSession();

    return NextResponse.json({
      success: true,
      data: {
        assessmentId,
        studentId,
        subjectId,
        sessionType,
        message: 'Adaptive assessment session created successfully'
      }
    });

  } catch (error) {
    console.error('Error creating adaptive assessment session:', error);
    return NextResponse.json(
      { error: 'Failed to create adaptive assessment session' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const subjectId = searchParams.get('subjectId');
    const sessionType = searchParams.get('sessionType');

    // Check permissions
    if ((session?.user as any)?.role !== 'admin' && 
        (session?.user as any)?.role !== 'teacher' && 
        (session?.user as any)?.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { prisma } = await import('@/lib/prisma');
    
    // Build query filters
    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (subjectId) where.subjectId = subjectId;
    if (sessionType) where.sessionType = sessionType;

    const assessments = await prisma.adaptiveAssessment.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        subject: {
          select: { id: true, name: true }
        },
        questions: {
          select: { id: true, questionType: true, difficulty: true, order: true }
        },
        responses: {
          select: { id: true, isCorrect: true, timeSpent: true }
        },
        analytics: {
          select: { metricType: true, value: true, timestamp: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({
      success: true,
      data: assessments
    });

  } catch (error) {
    console.error('Error fetching adaptive assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch adaptive assessments' },
      { status: 500 }
    );
  }
}
