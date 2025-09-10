import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateTestSchema = z.object({
  testName: z.string().min(1).optional(),
  testType: z.enum([
    'load_testing',
    'stress_testing',
    'spike_testing',
    'volume_testing',
    'endurance_testing',
    'capacity_testing',
  ]).optional(),
  description: z.string().min(1).optional(),
  targetConcurrentUsers: z.number().min(1).optional(),
  testDuration: z.number().min(1).optional(),
  testConfiguration: z.record(z.string(), z.any()).optional(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']).optional(),
  results: z.record(z.string(), z.any()).optional(),
  performanceMetrics: z.record(z.string(), z.any()).optional(),
  bottlenecks: z.record(z.string(), z.any()).optional(),
  recommendations: z.record(z.string(), z.any()).optional(),
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

    const test = await prisma.scalabilityTest.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        loadTests: {
          orderBy: { timestamp: 'desc' },
        },
        _count: {
          select: {
            loadTests: true,
          },
        },
      },
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    return NextResponse.json(test);
  } catch (error) {
    console.error('Error fetching scalability test:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scalability test' },
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

    // Check if user has admin role
    if (session.user.role !== 'admin' && session.user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateTestSchema.parse(body);

    const test = await prisma.scalabilityTest.update({
      where: { id },
      data: validatedData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        loadTests: {
          orderBy: { timestamp: 'desc' },
        },
        _count: {
          select: {
            loadTests: true,
          },
        },
      },
    });

    return NextResponse.json(test);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating scalability test:', error);
    return NextResponse.json(
      { error: 'Failed to update scalability test' },
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

    await prisma.scalabilityTest.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Error deleting scalability test:', error);
    return NextResponse.json(
      { error: 'Failed to delete scalability test' },
      { status: 500 }
    );
  }
}
