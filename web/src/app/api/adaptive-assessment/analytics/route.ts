import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const subjectId = searchParams.get('subjectId');
    const assessmentId = searchParams.get('assessmentId');

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
    if (assessmentId) where.adaptiveAssessmentId = assessmentId;

    // Get analytics data
    const analytics = await prisma.adaptiveAnalytics.findMany({
      where,
      include: {
        adaptiveAssessment: {
          include: {
            student: {
              select: { id: true, name: true, email: true }
            },
            subject: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    // Get learning gaps
    const learningGaps = await prisma.learningGap.findMany({
      where: {
        studentId: studentId || undefined,
        subjectId: subjectId || undefined,
      },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        subject: {
          select: { id: true, name: true }
        },
        topic: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get assessment predictions
    const predictions = await prisma.assessmentPrediction.findMany({
      where: {
        studentId: studentId || undefined,
        subjectId: subjectId || undefined,
      },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        subject: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Aggregate analytics by metric type
    const aggregatedAnalytics = analytics.reduce((acc: any, analytic) => {
      const key = analytic.metricType;
      if (!acc[key]) {
        acc[key] = {
          values: [],
          average: 0,
          trend: 'stable'
        };
      }
      acc[key].values.push({
        value: analytic.value,
        timestamp: analytic.timestamp,
        assessmentId: analytic.adaptiveAssessmentId
      });
      return acc;
    }, {});

    // Calculate averages and trends
    Object.keys(aggregatedAnalytics).forEach(metricType => {
      const values = aggregatedAnalytics[metricType].values;
      aggregatedAnalytics[metricType].average = values.reduce((sum: number, v: any) => sum + v.value, 0) / values.length;
      
      // Simple trend calculation
      if (values.length >= 2) {
        const recent = values.slice(0, 3).reduce((sum: number, v: any) => sum + v.value, 0) / Math.min(3, values.length);
        const older = values.slice(3, 6).reduce((sum: number, v: any) => sum + v.value, 0) / Math.min(3, values.length - 3);
        if (recent > older * 1.1) {
          aggregatedAnalytics[metricType].trend = 'improving';
        } else if (recent < older * 0.9) {
          aggregatedAnalytics[metricType].trend = 'declining';
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        analytics: aggregatedAnalytics,
        learningGaps,
        predictions,
        summary: {
          totalAssessments: new Set(analytics.map(a => a.adaptiveAssessmentId)).size,
          totalGaps: learningGaps.length,
          unresolvedGaps: learningGaps.filter(g => !g.isResolved).length,
          totalPredictions: predictions.length,
          averageAccuracy: aggregatedAnalytics.RETENTION_RATE?.average || 0,
          averageVelocity: aggregatedAnalytics.LEARNING_VELOCITY?.average || 0,
        }
      }
    });

  } catch (error) {
    console.error('Error fetching adaptive assessment analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch adaptive assessment analytics' },
      { status: 500 }
    );
  }
}
