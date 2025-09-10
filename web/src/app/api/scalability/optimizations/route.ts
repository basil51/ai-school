import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createOptimizationSchema = z.object({
  recommendationType: z.enum([
    'database_optimization',
    'cache_optimization',
    'api_optimization',
    'resource_scaling',
    'code_optimization',
    'infrastructure_optimization',
    'query_optimization',
    'indexing_optimization',
  ]),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  title: z.string().min(1),
  description: z.string().min(1),
  currentPerformance: z.record(z.string(), z.any()),
  expectedImprovement: z.record(z.string(), z.any()),
  implementation: z.string().min(1),
  estimatedEffort: z.string().min(1),
  impact: z.string().min(1),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'failed']).default('pending'),
  assignedTo: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const updateOptimizationSchema = createOptimizationSchema.partial().omit({ currentPerformance: true, expectedImprovement: true });

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recommendationType = searchParams.get('recommendationType');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
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

    if (recommendationType) {
      where.recommendationType = recommendationType;
    }

    if (priority) {
      where.priority = priority;
    }

    if (status) {
      where.status = status;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    const optimizations = await prisma.optimizationRecommendation.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    const total = await prisma.optimizationRecommendation.count({ where });

    return NextResponse.json({
      optimizations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching optimization recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch optimization recommendations' },
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
    const validatedData = createOptimizationSchema.parse(body);

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'User not associated with organization' }, { status: 400 });
    }

    const optimization = await prisma.optimizationRecommendation.create({
      data: {
        ...validatedData,
        organizationId: user.organizationId,
        createdBy: session.user.id,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(optimization, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating optimization recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to create optimization recommendation' },
      { status: 500 }
    );
  }
}
