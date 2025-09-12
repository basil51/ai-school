import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const CreateAnalyticsSchema = z.object({
  subjectId: z.string().optional(),
  timeframe: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  periodStart: z.string(),
  periodEnd: z.string(),
  totalLearningTime: z.number().min(0).optional(),
  totalSessions: z.number().min(0).optional(),
  averageSessionLength: z.number().min(0).optional(),
  averageEngagement: z.number().min(0).max(1).optional(),
  lessonsCompleted: z.number().min(0).optional(),
  assessmentsCompleted: z.number().min(0).optional(),
  averageAccuracy: z.number().min(0).max(1).optional(),
  improvementRate: z.number().optional(),
  learningVelocity: z.number().min(0).optional(),
  retentionRate: z.number().min(0).max(1).optional(),
  difficultyProgression: z.number().min(0).max(1).optional(),
  preferredLearningTime: z.string().optional(),
  preferredLearningStyle: z.string().optional(),
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
  recommendations: z.record(z.string(), z.any()).optional(),
});

const UpdateAnalyticsSchema = z.object({
  id: z.string(),
  totalLearningTime: z.number().min(0).optional(),
  totalSessions: z.number().min(0).optional(),
  averageSessionLength: z.number().min(0).optional(),
  averageEngagement: z.number().min(0).max(1).optional(),
  lessonsCompleted: z.number().min(0).optional(),
  assessmentsCompleted: z.number().min(0).optional(),
  averageAccuracy: z.number().min(0).max(1).optional(),
  improvementRate: z.number().optional(),
  learningVelocity: z.number().min(0).optional(),
  retentionRate: z.number().min(0).max(1).optional(),
  difficultyProgression: z.number().min(0).max(1).optional(),
  preferredLearningTime: z.string().optional(),
  preferredLearningStyle: z.string().optional(),
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
  recommendations: z.record(z.string(), z.any()).optional(),
});

// GET /api/analytics/learning - Get learning analytics data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || session.user.id;
    const subjectId = searchParams.get('subjectId');
    const timeframe = searchParams.get('timeframe') || 'weekly';
    const periodStart = searchParams.get('periodStart');
    const periodEnd = searchParams.get('periodEnd');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = { studentId };
    if (subjectId) where.subjectId = subjectId;
    if (timeframe) where.timeframe = timeframe;
    if (periodStart) where.periodStart = { gte: new Date(periodStart) };
    if (periodEnd) where.periodEnd = { lte: new Date(periodEnd) };

    const analytics = await prisma.phase3LearningAnalytics.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        subject: {
          select: { id: true, name: true, level: true }
        }
      },
      orderBy: { periodStart: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.phase3LearningAnalytics.count({ where });

    // Calculate summary statistics
    const summary = await prisma.phase3LearningAnalytics.aggregate({
      where,
      _avg: {
        totalLearningTime: true,
        averageSessionLength: true,
        averageEngagement: true,
        averageAccuracy: true,
        improvementRate: true,
        learningVelocity: true,
        retentionRate: true,
        difficultyProgression: true,
      },
      _sum: {
        totalLearningTime: true,
        totalSessions: true,
        lessonsCompleted: true,
        assessmentsCompleted: true,
      },
    });

    return NextResponse.json({
      analytics,
      summary,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching learning analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning analytics' },
      { status: 500 }
    );
  }
}

// POST /api/analytics/learning - Create new learning analytics record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreateAnalyticsSchema.parse(body);

    const analytics = await prisma.phase3LearningAnalytics.create({
      data: {
        studentId: session.user.id,
        subjectId: validatedData.subjectId,
        timeframe: validatedData.timeframe,
        periodStart: new Date(validatedData.periodStart),
        periodEnd: new Date(validatedData.periodEnd),
        totalLearningTime: validatedData.totalLearningTime || 0,
        totalSessions: validatedData.totalSessions || 0,
        averageSessionLength: validatedData.averageSessionLength || 0.0,
        averageEngagement: validatedData.averageEngagement || 0.0,
        lessonsCompleted: validatedData.lessonsCompleted || 0,
        assessmentsCompleted: validatedData.assessmentsCompleted || 0,
        averageAccuracy: validatedData.averageAccuracy || 0.0,
        improvementRate: validatedData.improvementRate || 0.0,
        learningVelocity: validatedData.learningVelocity || 0.0,
        retentionRate: validatedData.retentionRate || 0.0,
        difficultyProgression: validatedData.difficultyProgression || 0.0,
        preferredLearningTime: validatedData.preferredLearningTime,
        preferredLearningStyle: validatedData.preferredLearningStyle,
        strengths: validatedData.strengths || [],
        weaknesses: validatedData.weaknesses || [],
        goals: validatedData.goals || [],
        achievements: validatedData.achievements || [],
        recommendations: validatedData.recommendations,
      },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        subject: {
          select: { id: true, name: true, level: true }
        }
      },
    });

    return NextResponse.json(analytics, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating learning analytics:', error);
    return NextResponse.json(
      { error: 'Failed to create learning analytics' },
      { status: 500 }
    );
  }
}

// PUT /api/analytics/learning - Update existing learning analytics
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = UpdateAnalyticsSchema.parse(body);

    // Verify ownership
    const existingAnalytics = await prisma.phase3LearningAnalytics.findFirst({
      where: {
        id: validatedData.id,
        studentId: session.user.id,
      },
    });

    if (!existingAnalytics) {
      return NextResponse.json(
        { error: 'Learning analytics not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (validatedData.totalLearningTime !== undefined) updateData.totalLearningTime = validatedData.totalLearningTime;
    if (validatedData.totalSessions !== undefined) updateData.totalSessions = validatedData.totalSessions;
    if (validatedData.averageSessionLength !== undefined) updateData.averageSessionLength = validatedData.averageSessionLength;
    if (validatedData.averageEngagement !== undefined) updateData.averageEngagement = validatedData.averageEngagement;
    if (validatedData.lessonsCompleted !== undefined) updateData.lessonsCompleted = validatedData.lessonsCompleted;
    if (validatedData.assessmentsCompleted !== undefined) updateData.assessmentsCompleted = validatedData.assessmentsCompleted;
    if (validatedData.averageAccuracy !== undefined) updateData.averageAccuracy = validatedData.averageAccuracy;
    if (validatedData.improvementRate !== undefined) updateData.improvementRate = validatedData.improvementRate;
    if (validatedData.learningVelocity !== undefined) updateData.learningVelocity = validatedData.learningVelocity;
    if (validatedData.retentionRate !== undefined) updateData.retentionRate = validatedData.retentionRate;
    if (validatedData.difficultyProgression !== undefined) updateData.difficultyProgression = validatedData.difficultyProgression;
    if (validatedData.preferredLearningTime !== undefined) updateData.preferredLearningTime = validatedData.preferredLearningTime;
    if (validatedData.preferredLearningStyle !== undefined) updateData.preferredLearningStyle = validatedData.preferredLearningStyle;
    if (validatedData.strengths !== undefined) updateData.strengths = validatedData.strengths;
    if (validatedData.weaknesses !== undefined) updateData.weaknesses = validatedData.weaknesses;
    if (validatedData.goals !== undefined) updateData.goals = validatedData.goals;
    if (validatedData.achievements !== undefined) updateData.achievements = validatedData.achievements;
    if (validatedData.recommendations !== undefined) updateData.recommendations = validatedData.recommendations;

    const analytics = await prisma.phase3LearningAnalytics.update({
      where: { id: validatedData.id },
      data: updateData,
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        subject: {
          select: { id: true, name: true, level: true }
        }
      },
    });

    return NextResponse.json(analytics);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating learning analytics:', error);
    return NextResponse.json(
      { error: 'Failed to update learning analytics' },
      { status: 500 }
    );
  }
}
