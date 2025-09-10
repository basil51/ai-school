import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createTestSchema = z.object({
  testName: z.string().min(1),
  testType: z.enum([
    'load_testing',
    'stress_testing',
    'spike_testing',
    'volume_testing',
    'endurance_testing',
    'capacity_testing',
  ]),
  description: z.string().min(1),
  targetConcurrentUsers: z.number().min(1),
  testDuration: z.number().min(1), // in minutes
  testConfiguration: z.record(z.string(), z.any()),
});

const updateTestSchema = createTestSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('testType');
    const status = searchParams.get('status');
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

    if (testType) {
      where.testType = testType;
    }

    if (status) {
      where.status = status;
    }

    const tests = await prisma.scalabilityTest.findMany({
      where,
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
          take: 10,
        },
        _count: {
          select: {
            loadTests: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.scalabilityTest.count({ where });

    return NextResponse.json({
      tests,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching scalability tests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scalability tests' },
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
    const validatedData = createTestSchema.parse(body);

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'User not associated with organization' }, { status: 400 });
    }

    const test = await prisma.scalabilityTest.create({
      data: {
        ...validatedData,
        organizationId: user.organizationId,
        createdBy: session.user.id,
        status: 'pending',
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            loadTests: true,
          },
        },
      },
    });

    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating scalability test:', error);
    return NextResponse.json(
      { error: 'Failed to create scalability test' },
      { status: 500 }
    );
  }
}
