import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createMetricSchema = z.object({
  metricName: z.string().min(1),
  metricType: z.enum(['counter', 'gauge', 'histogram', 'summary', 'custom']),
  value: z.number(),
  unit: z.string().optional(),
  tags: z.record(z.string(), z.any()).optional(),
});

const createPerformanceMetricSchema = z.object({
  endpoint: z.string().min(1),
  method: z.string().min(1),
  responseTime: z.number().min(0),
  statusCode: z.number().min(100).max(599),
  requestSize: z.number().min(0).optional(),
  responseSize: z.number().min(0).optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
});

const createUsageAnalyticSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  eventType: z.enum(['page_view', 'user_action', 'api_call', 'error', 'performance', 'custom']),
  eventName: z.string().min(1),
  eventData: z.record(z.string(), z.any()).optional(),
  pageUrl: z.string().optional(),
  referrer: z.string().optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const metricType = searchParams.get('metricType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
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
      organizationId: user.organizationId,
    };

    if (metricType) {
      where.metricType = metricType;
    }

    if (startDate && endDate) {
      where.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const metrics = await prisma.systemMetric.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.systemMetric.count({ where });

    return NextResponse.json({
      metrics,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system metrics' },
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
    const { type, ...data } = body;

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'User not associated with organization' }, { status: 400 });
    }

    let result;

    switch (type) {
      case 'system_metric':
        const validatedSystemMetric = createMetricSchema.parse(data);
        result = await prisma.systemMetric.create({
          data: {
            ...validatedSystemMetric,
            organizationId: user.organizationId,
          },
        });
        break;

      case 'performance_metric':
        const validatedPerformanceMetric = createPerformanceMetricSchema.parse(data);
        result = await prisma.performanceMetric.create({
          data: {
            ...validatedPerformanceMetric,
            organizationId: user.organizationId,
          },
        });
        break;

      case 'usage_analytic':
        const validatedUsageAnalytic = createUsageAnalyticSchema.parse(data);
        result = await prisma.usageAnalytic.create({
          data: {
            ...validatedUsageAnalytic,
            organizationId: user.organizationId,
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid metric type' },
          { status: 400 }
        );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating metric:', error);
    return NextResponse.json(
      { error: 'Failed to create metric' },
      { status: 500 }
    );
  }
}
