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

    const { assessmentId } = await request.json();

    if (!assessmentId) {
      return NextResponse.json(
        { error: 'Missing required field: assessmentId' },
        { status: 400 }
      );
    }

    // Get assessment to check permissions
    const { prisma } = await import('@/lib/prisma');
    const assessment = await prisma.adaptiveAssessment.findUnique({
      where: { id: assessmentId },
      include: { student: true }
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Check permissions
    if ((session?.user as any)?.role !== 'admin' && 
        (session?.user as any)?.role !== 'teacher' && 
        (session?.user as any)?.id !== assessment.studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create adaptive assessment engine
    const engine = new AdaptiveAssessmentEngine(
      assessment.studentId,
      assessment.subjectId,
      assessment.sessionType
    );
    
    // Complete assessment
    const result = await engine.completeAssessment(assessmentId);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error completing adaptive assessment:', error);
    return NextResponse.json(
      { error: 'Failed to complete adaptive assessment' },
      { status: 500 }
    );
  }
}
