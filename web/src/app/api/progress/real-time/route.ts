import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const CreateProgressSchema = z.object({
  sessionId: z.string(),
  lessonId: z.string().optional(),
  activityType: z.string(),
  activityId: z.string().optional(),
  engagementLevel: z.number().min(0).max(1).optional(),
  interactionCount: z.number().min(0).optional(),
  focusTime: z.number().min(0).optional(),
  distractionCount: z.number().min(0).optional(),
  completionRate: z.number().min(0).max(1).optional(),
  accuracy: z.number().min(0).max(1).optional(),
  difficulty: z.string().optional(),
  learningStyle: z.string().optional(),
  emotionalState: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const UpdateProgressSchema = z.object({
  id: z.string(),
  endTime: z.string().optional(),
  duration: z.number().min(0).optional(),
  engagementLevel: z.number().min(0).max(1).optional(),
  interactionCount: z.number().min(0).optional(),
  focusTime: z.number().min(0).optional(),
  distractionCount: z.number().min(0).optional(),
  completionRate: z.number().min(0).max(1).optional(),
  accuracy: z.number().min(0).max(1).optional(),
  difficulty: z.string().optional(),
  learningStyle: z.string().optional(),
  emotionalState: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// GET /api/progress/real-time - Get real-time progress data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || session.user.id;
    const sessionId = searchParams.get('sessionId');
    const activityType = searchParams.get('activityType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (sessionId) where.sessionId = sessionId;
    if (activityType) where.activityType = activityType;

    const progress = await prisma.realTimeProgress.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        lesson: {
          select: { id: true, title: true, topic: { select: { name: true } } }
        }
      },
      orderBy: { startTime: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.realTimeProgress.count({ where });

    return NextResponse.json({
      progress,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching real-time progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress data' },
      { status: 500 }
    );
  }
}

// POST /api/progress/real-time - Create new progress tracking session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreateProgressSchema.parse(body);

    const progress = await prisma.realTimeProgress.create({
      data: {
        studentId: session.user.id,
        sessionId: validatedData.sessionId,
        lessonId: validatedData.lessonId,
        activityType: validatedData.activityType,
        activityId: validatedData.activityId,
        engagementLevel: validatedData.engagementLevel || 0.0,
        interactionCount: validatedData.interactionCount || 0,
        focusTime: validatedData.focusTime || 0,
        distractionCount: validatedData.distractionCount || 0,
        completionRate: validatedData.completionRate || 0.0,
        accuracy: validatedData.accuracy,
        difficulty: validatedData.difficulty,
        learningStyle: validatedData.learningStyle,
        emotionalState: validatedData.emotionalState,
        metadata: validatedData.metadata,
      },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        lesson: {
          select: { id: true, title: true, topic: { select: { name: true } } }
        }
      },
    });

    return NextResponse.json(progress, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating progress tracking:', error);
    return NextResponse.json(
      { error: 'Failed to create progress tracking' },
      { status: 500 }
    );
  }
}

// PUT /api/progress/real-time - Update existing progress tracking
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = UpdateProgressSchema.parse(body);

    // Verify ownership
    const existingProgress = await prisma.realTimeProgress.findFirst({
      where: {
        id: validatedData.id,
        studentId: session.user.id,
      },
    });

    if (!existingProgress) {
      return NextResponse.json(
        { error: 'Progress tracking not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (validatedData.endTime) updateData.endTime = new Date(validatedData.endTime);
    if (validatedData.duration !== undefined) updateData.duration = validatedData.duration;
    if (validatedData.engagementLevel !== undefined) updateData.engagementLevel = validatedData.engagementLevel;
    if (validatedData.interactionCount !== undefined) updateData.interactionCount = validatedData.interactionCount;
    if (validatedData.focusTime !== undefined) updateData.focusTime = validatedData.focusTime;
    if (validatedData.distractionCount !== undefined) updateData.distractionCount = validatedData.distractionCount;
    if (validatedData.completionRate !== undefined) updateData.completionRate = validatedData.completionRate;
    if (validatedData.accuracy !== undefined) updateData.accuracy = validatedData.accuracy;
    if (validatedData.difficulty !== undefined) updateData.difficulty = validatedData.difficulty;
    if (validatedData.learningStyle !== undefined) updateData.learningStyle = validatedData.learningStyle;
    if (validatedData.emotionalState !== undefined) updateData.emotionalState = validatedData.emotionalState;
    if (validatedData.metadata !== undefined) updateData.metadata = validatedData.metadata;

    const progress = await prisma.realTimeProgress.update({
      where: { id: validatedData.id },
      data: updateData,
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        lesson: {
          select: { id: true, title: true, topic: { select: { name: true } } }
        }
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating progress tracking:', error);
    return NextResponse.json(
      { error: 'Failed to update progress tracking' },
      { status: 500 }
    );
  }
}
