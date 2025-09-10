import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createCompletionSchema = z.object({
  trainingId: z.string(),
  score: z.number().min(0).max(100).optional(),
  feedback: z.string().optional(),
  certificateUrl: z.string().url().optional(),
});

const updateCompletionSchema = z.object({
  score: z.number().min(0).max(100).optional(),
  feedback: z.string().optional(),
  certificateUrl: z.string().url().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const trainingId = searchParams.get('trainingId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'User not associated with organization' }, { status: 400 });
    }

    const where: any = {};

    if (trainingId) {
      where.trainingId = trainingId;
    }

    if (userId) {
      where.userId = userId;
    } else if (session.user.role !== 'admin' && session.user.role !== 'super-admin') {
      // Non-admin users can only see their own completions
      where.userId = session.user.id;
    }

    // Filter by organization through training
    where.training = {
      organizationId: user.organizationId,
    };

    const completions = await prisma.accessibilityTrainingCompletion.findMany({
      where,
      include: {
        training: {
          select: {
            id: true,
            title: true,
            trainingType: true,
            difficulty: true,
            duration: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.accessibilityTrainingCompletion.count({ where });

    return NextResponse.json({
      completions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching training completions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training completions' },
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
    const validatedData = createCompletionSchema.parse(body);

    // Check if training exists and user has access
    const training = await prisma.accessibilityTraining.findUnique({
      where: { id: validatedData.trainingId },
      select: { organizationId: true },
    });

    if (!training) {
      return NextResponse.json({ error: 'Training not found' }, { status: 404 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId || user.organizationId !== training.organizationId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if completion already exists
    const existingCompletion = await prisma.accessibilityTrainingCompletion.findUnique({
      where: {
        trainingId_userId: {
          trainingId: validatedData.trainingId,
          userId: session.user.id,
        },
      },
    });

    if (existingCompletion) {
      return NextResponse.json({ error: 'Training already completed' }, { status: 400 });
    }

    const completion = await prisma.accessibilityTrainingCompletion.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
      include: {
        training: {
          select: {
            id: true,
            title: true,
            trainingType: true,
            difficulty: true,
            duration: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(completion, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating training completion:', error);
    return NextResponse.json(
      { error: 'Failed to create training completion' },
      { status: 500 }
    );
  }
}
