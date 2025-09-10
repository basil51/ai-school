import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createRecommendationSchema = z.object({
  complianceId: z.string(),
  recommendationType: z.enum([
    'technical_implementation',
    'design_improvement',
    'content_enhancement',
    'training_requirement',
    'policy_update',
    'tool_implementation',
  ]),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  title: z.string().min(1),
  description: z.string().min(1),
  implementation: z.string().min(1),
  estimatedEffort: z.string().optional(),
  benefits: z.string().min(1),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  assignedTo: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const updateRecommendationSchema = createRecommendationSchema.partial().omit({ complianceId: true });

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const complianceId = searchParams.get('complianceId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const recommendationType = searchParams.get('recommendationType');
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

    const where: any = {};

    if (complianceId) {
      where.complianceId = complianceId;
    } else {
      // Filter by organization through compliance
      where.compliance = {
        organizationId: user.organizationId,
      };
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (recommendationType) {
      where.recommendationType = recommendationType;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    const recommendations = await prisma.accessibilityRecommendation.findMany({
      where,
      include: {
        compliance: {
          select: {
            id: true,
            auditDate: true,
            status: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
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

    const total = await prisma.accessibilityRecommendation.count({ where });

    return NextResponse.json({
      recommendations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching accessibility recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accessibility recommendations' },
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
    const validatedData = createRecommendationSchema.parse(body);

    const recommendation = await prisma.accessibilityRecommendation.create({
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      },
      include: {
        compliance: {
          select: {
            id: true,
            auditDate: true,
            status: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
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

    return NextResponse.json(recommendation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating accessibility recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to create accessibility recommendation' },
      { status: 500 }
    );
  }
}
