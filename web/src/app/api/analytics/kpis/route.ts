import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
    const kpiType = searchParams.get('kpiType');
    const period = searchParams.get('period') || 'weekly';
    const limit = parseInt(searchParams.get('limit') || '10');

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
        message: 'No student ID provided - showing all accessible KPIs (empty for demo)'
      });
    }

    // Get performance KPIs
    const kpis = await prisma.performanceKPI.findMany({
      where: {
        studentId,
        ...(subjectId && { subjectId }),
        ...(kpiType && { kpiType: kpiType as any }),
        period: period as any
      },
      include: {
        subject: true
      },
      orderBy: { startDate: 'desc' },
      take: limit
    });

    return NextResponse.json({
      success: true,
      data: kpis
    });

  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KPIs' },
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
    const { 
      studentId, 
      subjectId, 
      kpiType, 
      period, 
      startDate, 
      endDate 
    } = body;

    if (!studentId || !kpiType || !period || !startDate || !endDate) {
      return NextResponse.json({ 
        error: 'Student ID, KPI type, period, start date, and end date are required' 
      }, { status: 400 });
    }

    // Check permissions
    if (session.user.role === 'student' && session.user.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calculate KPIs based on the specified period
    const kpiData = await calculateKPIs(studentId, subjectId, kpiType, period, startDate, endDate);

    // Store or update KPI record
    const kpi = await prisma.performanceKPI.upsert({
      where: {
        studentId_subjectId_kpiType_period_startDate: {
          studentId,
          subjectId: subjectId || '',
          kpiType: kpiType as any,
          period: period as any,
          startDate: new Date(startDate)
        }
      },
      update: kpiData,
      create: {
        studentId,
        subjectId,
        kpiType: kpiType as any,
        period: period as any,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        ...kpiData
      }
    });

    return NextResponse.json({
      success: true,
      data: kpi
    });

  } catch (error) {
    console.error('Error calculating KPIs:', error);
    return NextResponse.json(
      { error: 'Failed to calculate KPIs' },
      { status: 500 }
    );
  }
}

async function calculateKPIs(
  studentId: string, 
  subjectId: string | null, 
  kpiType: string, 
  period: string, 
  startDate: string, 
  endDate: string
) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Get relevant data based on KPI type
  const [
    progressData,
    assessmentData,
    engagementData,
    attendanceData
  ] = await Promise.all([
    // Progress data
    prisma.studentProgress.findMany({
      where: {
        studentId,
        ...(subjectId && {
          lesson: {
            topic: {
              subjectId
            }
          }
        }),
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        lesson: {
          include: {
            topic: true
          }
        }
      }
    }),

    // Assessment data
    prisma.assessmentAttempt.findMany({
      where: {
        studentId,
        ...(subjectId && {
          assessment: {
            lesson: {
              topic: {
                subjectId
              }
            }
          }
        }),
        startedAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        assessment: {
          include: {
            lesson: {
              include: {
                topic: true
              }
            }
          }
        }
      }
    }),

    // Engagement data
    prisma.engagementOptimization.findMany({
      where: {
        studentId,
        timestamp: {
          gte: start,
          lte: end
        }
      }
    }),

    // Attendance data
    prisma.attendance.findMany({
      where: {
        studentId,
        date: {
          gte: start,
          lte: end
        }
      }
    })
  ]);

  // Calculate different types of KPIs
  switch (kpiType) {
    case 'ACADEMIC_PERFORMANCE':
      return calculateAcademicKPIs(progressData, assessmentData);
    
    case 'ENGAGEMENT_METRICS':
      return calculateEngagementKPIs(engagementData, progressData);
    
    case 'RETENTION_ANALYSIS':
      return calculateRetentionKPIs();
    
    case 'BEHAVIORAL_INSIGHTS':
      return calculateBehavioralKPIs(attendanceData, progressData);
    
    case 'GROWTH_TRACKING':
      return calculateGrowthKPIs();
    
    default:
      return calculateAcademicKPIs(progressData, assessmentData);
  }
}

function calculateAcademicKPIs(progressData: any[], assessmentData: any[]) {
  const totalLessons = progressData.length;
  const completedLessons = progressData.filter(p => p.status === 'completed').length;
  const completionRate = totalLessons > 0 ? completedLessons / totalLessons : 0;

  const totalAssessments = assessmentData.length;
  const passedAssessments = assessmentData.filter(a => a.passed).length;
  const masteryRate = totalAssessments > 0 ? passedAssessments / totalAssessments : 0;

  const averageScore = assessmentData.length > 0 
    ? assessmentData.reduce((sum, a) => sum + (a.score || 0), 0) / assessmentData.length 
    : 0;

  const totalTimeSpent = progressData.reduce((sum, p) => sum + p.timeSpent, 0);
  const learningVelocity = totalTimeSpent > 0 ? completedLessons / (totalTimeSpent / 60) : 0; // lessons per hour

  return {
    masteryRate,
    completionRate,
    assessmentScore: averageScore,
    learningVelocity,
    timeOnTask: totalTimeSpent,
    interactionRate: 0, // Will be calculated from engagement data
    persistenceScore: 0, // Will be calculated from retry attempts
    retentionRate: 0, // Will be calculated from spaced repetition
    transferRate: 0, // Will be calculated from cross-domain performance
    applicationRate: 0, // Will be calculated from practical assessments
    attendanceRate: 0, // Will be calculated from attendance data
    punctualityRate: 0, // Will be calculated from submission times
    collaborationScore: 0, // Will be calculated from social interactions
    improvementRate: 0, // Will be calculated from historical trends
    goalAchievement: 0, // Will be calculated from goal completion
    selfEfficacy: 0, // Will be calculated from confidence surveys
    engagementScore: 0, // Will be calculated from engagement data
    peerComparison: {},
    historicalTrend: {},
    benchmarkScore: null
  };
}

function calculateEngagementKPIs(engagementData: any[], progressData: any[]) {
  const totalSessions = engagementData.length;
  const averageEngagement = totalSessions > 0 
    ? engagementData.reduce((sum, e) => sum + e.engagementLevel, 0) / totalSessions 
    : 0;

  const totalTimeSpent = progressData.reduce((sum, p) => sum + p.timeSpent, 0);
  const totalInteractions = progressData.reduce((sum, p) => sum + p.attempts, 0);
  const interactionRate = totalTimeSpent > 0 ? totalInteractions / (totalTimeSpent / 60) : 0;

  return {
    engagementScore: averageEngagement,
    timeOnTask: totalTimeSpent,
    interactionRate,
    persistenceScore: 0, // Will be calculated from retry patterns
    masteryRate: 0,
    completionRate: 0,
    assessmentScore: 0,
    learningVelocity: 0,
    retentionRate: 0,
    transferRate: 0,
    applicationRate: 0,
    attendanceRate: 0,
    punctualityRate: 0,
    collaborationScore: 0,
    improvementRate: 0,
    goalAchievement: 0,
    selfEfficacy: 0,
    peerComparison: {},
    historicalTrend: {},
    benchmarkScore: null
  };
}

function calculateRetentionKPIs() {
  // Calculate retention based on spaced repetition and long-term performance
  const retentionRate = 0.85; // Placeholder - will be calculated from actual retention data
  const transferRate = 0.75; // Placeholder - will be calculated from cross-domain performance
  const applicationRate = 0.80; // Placeholder - will be calculated from practical applications

  return {
    retentionRate,
    transferRate,
    applicationRate,
    masteryRate: 0,
    completionRate: 0,
    assessmentScore: 0,
    learningVelocity: 0,
    engagementScore: 0,
    timeOnTask: 0,
    interactionRate: 0,
    persistenceScore: 0,
    attendanceRate: 0,
    punctualityRate: 0,
    collaborationScore: 0,
    improvementRate: 0,
    goalAchievement: 0,
    selfEfficacy: 0,
    peerComparison: {},
    historicalTrend: {},
    benchmarkScore: null
  };
}

function calculateBehavioralKPIs(attendanceData: any[], progressData: any[]) {
  const totalDays = attendanceData.length;
  const presentDays = attendanceData.filter(a => a.status === 'present').length;
  const attendanceRate = totalDays > 0 ? presentDays / totalDays : 0;

  const punctualityRate = 0.90; // Placeholder - will be calculated from submission times
  const collaborationScore = 0.75; // Placeholder - will be calculated from social interactions
  console.log(attendanceData, progressData);
  return {
    attendanceRate,
    punctualityRate,
    collaborationScore,
    masteryRate: 0,
    completionRate: 0,
    assessmentScore: 0,
    learningVelocity: 0,
    engagementScore: 0,
    timeOnTask: 0,
    interactionRate: 0,
    persistenceScore: 0,
    retentionRate: 0,
    transferRate: 0,
    applicationRate: 0,
    improvementRate: 0,
    goalAchievement: 0,
    selfEfficacy: 0,
    peerComparison: {},
    historicalTrend: {},
    benchmarkScore: null
  };
}

function calculateGrowthKPIs() {
  // Calculate improvement rate over time
  const improvementRate = 0.15; // Placeholder - will be calculated from historical trends
  const goalAchievement = 0.80; // Placeholder - will be calculated from goal completion
  const selfEfficacy = 0.75; // Placeholder - will be calculated from confidence surveys

  return {
    improvementRate,
    goalAchievement,
    selfEfficacy,
    masteryRate: 0,
    completionRate: 0,
    assessmentScore: 0,
    learningVelocity: 0,
    engagementScore: 0,
    timeOnTask: 0,
    interactionRate: 0,
    persistenceScore: 0,
    retentionRate: 0,
    transferRate: 0,
    applicationRate: 0,
    attendanceRate: 0,
    punctualityRate: 0,
    collaborationScore: 0,
    peerComparison: {},
    historicalTrend: {},
    benchmarkScore: null
  };
}
