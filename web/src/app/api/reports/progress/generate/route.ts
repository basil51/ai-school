import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/reports/progress/generate - Generate AI-powered progress report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, reportType, periodStart, periodEnd } = body;

    if (!studentId || !reportType || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'Missing required fields: studentId, reportType, periodStart, periodEnd' },
        { status: 400 }
      );
    }

    // Check permissions
    const userRole = (session as any)?.role;
    if (userRole !== 'teacher' && userRole !== 'admin' && userRole !== 'super_admin' && studentId !== session.user.id) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    // Get real-time progress data for the period
    const progressData = await prisma.realTimeProgress.findMany({
      where: {
        studentId: studentId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        lesson: {
          include: {
            topic: {
              select: { name: true, subject: { select: { name: true } } }
            }
          }
        }
      },
      orderBy: { startTime: 'asc' },
    });

    // Get learning analytics for the period
    const analytics = await prisma.phase3LearningAnalytics.findMany({
      where: {
        studentId: studentId,
        periodStart: { gte: startDate },
        periodEnd: { lte: endDate },
      },
      include: {
        subject: {
          select: { name: true, level: true }
        }
      },
    });

    // Get performance metrics
    /*const metrics = await prisma.phase3PerformanceMetrics.findMany({
      where: {
        studentId: studentId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });*/

    // Calculate key metrics
    const totalLearningTime = progressData.reduce((sum, p) => sum + (p.duration || 0), 0) / 60; // Convert to minutes
    const totalSessions = progressData.length;
    const averageEngagement = progressData.reduce((sum, p) => sum + (p.engagementLevel || 0), 0) / Math.max(1, totalSessions);
    const lessonsCompleted = progressData.filter(p => p.completionRate === 1).length;
    const averageAccuracy = progressData.reduce((sum, p) => sum + (p.accuracy || 0), 0) / Math.max(1, progressData.filter(p => p.accuracy !== null).length);
    const totalFocusTime = progressData.reduce((sum, p) => sum + (p.focusTime || 0), 0) / 60; // Convert to minutes
    const totalDistractions = progressData.reduce((sum, p) => sum + (p.distractionCount || 0), 0);

    // Generate AI summary
    const summary = `During this ${reportType} period, the student completed ${lessonsCompleted} lessons with an average engagement level of ${Math.round(averageEngagement * 100)}%. ` +
      `Total learning time was ${Math.round(totalLearningTime)} minutes across ${totalSessions} sessions. ` +
      `The student maintained focus for ${Math.round(totalFocusTime)} minutes with ${totalDistractions} distractions. ` +
      `Average accuracy across assessments was ${Math.round(averageAccuracy * 100)}%.`;

    // Generate achievements
    const achievements: string[] = [];
    if (lessonsCompleted >= 5) achievements.push('Completed 5+ lessons');
    if (averageEngagement >= 0.8) achievements.push('High engagement maintained');
    if (averageAccuracy >= 0.9) achievements.push('Excellent assessment performance');
    if (totalFocusTime >= 60) achievements.push('Demonstrated strong focus');
    if (totalDistractions <= totalSessions) achievements.push('Minimal distractions');

    // Generate improvements
    const improvements: string[] = [];
    if (averageEngagement < 0.6) improvements.push('Work on maintaining higher engagement levels');
    if (averageAccuracy < 0.7) improvements.push('Review material to improve accuracy');
    if (totalDistractions > totalSessions * 2) improvements.push('Find a quieter learning environment');
    if (totalFocusTime < totalSessions * 5) improvements.push('Practice longer focused study sessions');

    // Generate recommendations
    const recommendations: string[] = [];
    if (averageEngagement < 0.7) recommendations.push('Take more frequent breaks to maintain focus');
    if (averageAccuracy < 0.8) recommendations.push('Review previous lessons before moving to new content');
    if (totalDistractions > totalSessions) recommendations.push('Use noise-canceling headphones or find a quieter space');
    if (totalLearningTime < 30) recommendations.push('Increase daily learning time gradually');

    // Generate goals for next period
    const goals: string[] = [];
    goals.push(`Complete ${Math.max(1, Math.round(lessonsCompleted * 1.2))} lessons`);
    goals.push(`Maintain engagement level above ${Math.round(Math.max(0.7, averageEngagement) * 100)}%`);
    goals.push(`Achieve accuracy above ${Math.round(Math.max(0.8, averageAccuracy) * 100)}%`);
    goals.push(`Reduce distractions to less than ${Math.max(1, Math.round(totalDistractions * 0.8))} per session`);

    const keyMetrics = {
      totalLearningTime: Math.round(totalLearningTime),
      totalSessions,
      averageEngagement: Math.round(averageEngagement * 100) / 100,
      lessonsCompleted,
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
      totalFocusTime: Math.round(totalFocusTime),
      totalDistractions,
      learningVelocity: analytics.length > 0 ? analytics[0].learningVelocity : 0,
      improvementRate: analytics.length > 0 ? analytics[0].improvementRate : 0,
    };

    // Create the report
    const report = await prisma.phase3ProgressReport.create({
      data: {
        studentId: studentId,
        reportType: reportType,
        periodStart: startDate,
        periodEnd: endDate,
        generatedBy: session.user.id,
        summary: summary,
        keyMetrics: keyMetrics,
        achievements: achievements,
        improvements: improvements,
        recommendations: recommendations,
        goals: goals,
        isShared: false,
        sharedWith: [],
      },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        }
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error generating progress report:', error);
    return NextResponse.json(
      { error: 'Failed to generate progress report' },
      { status: 500 }
    );
  }
}
