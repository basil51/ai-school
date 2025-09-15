import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createTrainingSchema = z.object({
  trainingType: z.enum([
    'general_accessibility',
    'wcag_guidelines',
    'screen_reader_usage',
    'keyboard_navigation',
    'color_contrast',
    'aria_implementation',
    'testing_methodologies',
  ]),
  title: z.string().min(1),
  description: z.string().min(1),
  content: z.string().min(1),
  duration: z.number().min(1), // in minutes
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  prerequisites: z.string().optional(),
  learningObjectives: z.array(z.string()).min(1),
  resources: z.array(z.string()).optional(),
  assessment: z.string().optional(),
  completionCriteria: z.string().min(1),
  isActive: z.boolean().default(true),
});

//const updateTrainingSchema = createTrainingSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const trainingType = searchParams.get('trainingType');
    const difficulty = searchParams.get('difficulty');
    const isActive = searchParams.get('isActive');
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

    const where: any = {
      organizationId: user.organizationId,
    };

    if (trainingType) {
      where.trainingType = trainingType;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const training = await prisma.accessibilityTraining.findMany({
      where,
      include: {
        _count: {
          select: {
            completions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.accessibilityTraining.count({ where });

    return NextResponse.json({
      training,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching accessibility training:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accessibility training' },
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

    // Check if user has admin role
    if (session.user.role !== 'admin' && session.user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createTrainingSchema.parse(body);

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'User not associated with organization' }, { status: 400 });
    }

    const training = await prisma.accessibilityTraining.create({
      data: {
        ...validatedData,
        organizationId: user.organizationId,
      },
      include: {
        _count: {
          select: {
            completions: true,
          },
        },
      },
    });

    return NextResponse.json(training, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating accessibility training:', error);
    return NextResponse.json(
      { error: 'Failed to create accessibility training' },
      { status: 500 }
    );
  }
}
