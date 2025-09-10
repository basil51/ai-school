import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createLoadTestSchema = z.object({
  scalabilityTestId: z.string(),
  testPhase: z.string().min(1),
  concurrentUsers: z.number().min(0),
  requestsPerSecond: z.number().min(0),
  responseTime: z.number().min(0),
  errorRate: z.number().min(0).max(100),
  throughput: z.number().min(0),
  cpuUsage: z.number().min(0).max(100),
  memoryUsage: z.number().min(0).max(100),
  databaseConnections: z.number().min(0),
  cacheHitRate: z.number().min(0).max(100),
  networkLatency: z.number().min(0),
  metadata: z.record(z.string(), z.any()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scalabilityTestId = searchParams.get('scalabilityTestId');
    const testPhase = searchParams.get('testPhase');
    const limit = parseInt(searchParams.get('limit') || '100');
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
      scalabilityTest: {
        organizationId: user.organizationId,
      },
    };

    if (scalabilityTestId) {
      where.scalabilityTestId = scalabilityTestId;
    }

    if (testPhase) {
      where.testPhase = testPhase;
    }

    const loadTests = await prisma.loadTest.findMany({
      where,
      include: {
        scalabilityTest: {
          select: {
            id: true,
            testName: true,
            testType: true,
            status: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.loadTest.count({ where });

    return NextResponse.json({
      loadTests,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching load tests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch load tests' },
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
    const validatedData = createLoadTestSchema.parse(body);

    const loadTest = await prisma.loadTest.create({
      data: validatedData,
      include: {
        scalabilityTest: {
          select: {
            id: true,
            testName: true,
            testType: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(loadTest, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating load test:', error);
    return NextResponse.json(
      { error: 'Failed to create load test' },
      { status: 500 }
    );
  }
}
