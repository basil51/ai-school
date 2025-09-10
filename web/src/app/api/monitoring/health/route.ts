import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createHealthCheckSchema = z.object({
  checkName: z.string().min(1),
  checkType: z.enum(['api_endpoint', 'database', 'external_service', 'system_resource', 'custom']),
  status: z.enum(['healthy', 'warning', 'critical', 'unknown']),
  responseTime: z.number().min(0).optional(),
  errorMessage: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const updateHealthCheckSchema = createHealthCheckSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const checkType = searchParams.get('checkType');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
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

    if (checkType) {
      where.checkType = checkType;
    }

    if (status) {
      where.status = status;
    }

    const healthChecks = await prisma.healthCheck.findMany({
      where,
      orderBy: { lastCheckedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.healthCheck.count({ where });

    // Get health summary
    const healthSummary = await prisma.healthCheck.groupBy({
      by: ['status'],
      where: { organizationId: user.organizationId },
      _count: {
        status: true,
      },
    });

    return NextResponse.json({
      healthChecks,
      healthSummary,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching health checks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health checks' },
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
    const validatedData = createHealthCheckSchema.parse(body);

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'User not associated with organization' }, { status: 400 });
    }

    const healthCheck = await prisma.healthCheck.create({
      data: {
        ...validatedData,
        organizationId: user.organizationId,
        lastCheckedAt: new Date(),
      },
    });

    return NextResponse.json(healthCheck, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating health check:', error);
    return NextResponse.json(
      { error: 'Failed to create health check' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    if (session.user.role !== 'admin' && session.user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const checkName = searchParams.get('checkName');

    if (!checkName) {
      return NextResponse.json({ error: 'Check name is required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateHealthCheckSchema.parse(body);

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'User not associated with organization' }, { status: 400 });
    }

    const healthCheck = await prisma.healthCheck.updateMany({
      where: {
        organizationId: user.organizationId,
        checkName: checkName,
      },
      data: {
        ...validatedData,
        lastCheckedAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Health check updated successfully', updated: healthCheck.count });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating health check:', error);
    return NextResponse.json(
      { error: 'Failed to update health check' },
      { status: 500 }
    );
  }
}
