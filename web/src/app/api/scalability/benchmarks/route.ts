import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createBenchmarkSchema = z.object({
  benchmarkName: z.string().min(1),
  benchmarkType: z.enum([
    'response_time',
    'throughput',
    'resource_utilization',
    'database_performance',
    'cache_performance',
    'api_performance',
    'user_experience',
  ]),
  description: z.string().min(1),
  targetMetrics: z.record(z.string(), z.any()),
  actualMetrics: z.record(z.string(), z.any()),
  performanceScore: z.number().min(0).max(100),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'baseline', 'comparison']),
  baselineDate: z.string().datetime(),
  comparisonDate: z.string().datetime().optional(),
  improvements: z.record(z.string(), z.any()).optional(),
  regressions: z.record(z.string(), z.any()).optional(),
  recommendations: z.record(z.string(), z.any()).optional(),
});

//const updateBenchmarkSchema = createBenchmarkSchema.partial().omit({ baselineDate: true });

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const benchmarkType = searchParams.get('benchmarkType');
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

    if (benchmarkType) {
      where.benchmarkType = benchmarkType;
    }

    if (status) {
      where.status = status;
    }

    const benchmarks = await prisma.performanceBenchmark.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.performanceBenchmark.count({ where });

    return NextResponse.json({
      benchmarks,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching performance benchmarks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance benchmarks' },
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
    const validatedData = createBenchmarkSchema.parse(body);

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'User not associated with organization' }, { status: 400 });
    }

    const benchmark = await prisma.performanceBenchmark.create({
      data: {
        ...validatedData,
        organizationId: user.organizationId,
        createdBy: session.user.id,
        baselineDate: new Date(validatedData.baselineDate),
        comparisonDate: validatedData.comparisonDate ? new Date(validatedData.comparisonDate) : null,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(benchmark, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating performance benchmark:', error);
    return NextResponse.json(
      { error: 'Failed to create performance benchmark' },
      { status: 500 }
    );
  }
}
