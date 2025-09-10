import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateRecommendationSchema = z.object({
  recommendationType: z.enum([
    'technical_implementation',
    'design_improvement',
    'content_enhancement',
    'training_requirement',
    'policy_update',
    'tool_implementation',
  ]).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  implementation: z.string().min(1).optional(),
  estimatedEffort: z.string().optional(),
  benefits: z.string().min(1).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  completedDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const recommendation = await prisma.accessibilityRecommendation.findUnique({
      where: { id },
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

    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    return NextResponse.json(recommendation);
  } catch (error) {
    console.error('Error fetching accessibility recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accessibility recommendation' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role or is assigned to the recommendation
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateRecommendationSchema.parse(body);

    // Check if user is assigned to this recommendation or has admin role
    const recommendation = await prisma.accessibilityRecommendation.findUnique({
      where: { id },
      select: { assignedTo: true },
    });

    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    if (session.user.role !== 'admin' && 
        session.user.role !== 'super-admin' && 
        recommendation.assignedTo !== session.user.id) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const updateData: any = { ...validatedData };
    if (validatedData.dueDate) {
      updateData.dueDate = new Date(validatedData.dueDate);
    }
    if (validatedData.completedDate) {
      updateData.completedDate = new Date(validatedData.completedDate);
    }

    const updatedRecommendation = await prisma.accessibilityRecommendation.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(updatedRecommendation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating accessibility recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to update accessibility recommendation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    if (session.user.role !== 'admin' && session.user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.accessibilityRecommendation.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Recommendation deleted successfully' });
  } catch (error) {
    console.error('Error deleting accessibility recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to delete accessibility recommendation' },
      { status: 500 }
    );
  }
}
