import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { personalizationEngine } from '@/lib/analytics/personalization-engine';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const subjectId = searchParams.get('subjectId');
    const curveType = searchParams.get('curveType') || 'MASTERY_CURVE';

    // For students, studentId is required and must match their own ID
    if (session.user.role === 'student') {
      if (!studentId || studentId !== session.user.id) {
        return NextResponse.json({ error: 'Student ID is required and must match your own ID' }, { status: 400 });
      }
    }
    // For other roles, studentId is optional
    else if (!studentId) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No student ID provided - showing all accessible learning curves (empty for demo)'
      });
    }

    // Get learning curves
    const curves = await prisma.learningCurve.findMany({
      where: {
        studentId,
        ...(subjectId && { subjectId }),
        curveType: curveType as any
      },
      include: {
        subject: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: curves
    });

  } catch (error) {
    console.error('Error fetching learning curves:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning curves' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, subjectId = 'MASTERY_CURVE' } = body;

    if (!studentId || !subjectId) {
      return NextResponse.json({ 
        error: 'Student ID and Subject ID are required' 
      }, { status: 400 });
    }

    // Check permissions
    if (session.user.role === 'student' && session.user.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate new learning curve analysis
    const curve = await personalizationEngine.analyzeLearningCurve(studentId, subjectId);

    return NextResponse.json({
      success: true,
      data: curve
    });

  } catch (error) {
    console.error('Error generating learning curve:', error);
    return NextResponse.json(
      { error: 'Failed to generate learning curve' },
      { status: 500 }
    );
  }
}
