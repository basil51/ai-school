import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createAlertSchema = z.object({
  alertName: z.string().min(1),
  alertType: z.enum(['threshold_breach', 'error_rate', 'performance_degradation', 'system_down', 'custom']),
  severity: z.enum(['info', 'warning', 'critical', 'emergency']),
  status: z.enum(['active', 'acknowledged', 'resolved', 'suppressed']).default('active'),
  message: z.string().min(1),
  description: z.string().optional(),
  source: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const updateAlertSchema = z.object({
  status: z.enum(['active', 'acknowledged', 'resolved', 'suppressed']),
  acknowledgedBy: z.string().optional(),
  resolvedBy: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const alertType = searchParams.get('alertType');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
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

    if (alertType) {
      where.alertType = alertType;
    }

    if (severity) {
      where.severity = severity;
    }

    if (status) {
      where.status = status;
    }

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        acknowledgedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        resolvedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    const total = await prisma.alert.count({ where });

    // Get alert summary
    const alertSummary = await prisma.alert.groupBy({
      by: ['status', 'severity'],
      where: { organizationId: user.organizationId },
      _count: {
        status: true,
      },
    });

    return NextResponse.json({
      alerts,
      alertSummary,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
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
    const validatedData = createAlertSchema.parse(body);

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'User not associated with organization' }, { status: 400 });
    }

    const alert = await prisma.alert.create({
      data: {
        ...validatedData,
        organizationId: user.organizationId,
      },
      include: {
        acknowledgedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        resolvedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating alert:', error);
    return NextResponse.json(
      { error: 'Failed to create alert' },
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

    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('alertId');

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateAlertSchema.parse(body);

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'User not associated with organization' }, { status: 400 });
    }

    const updateData: any = {
      ...validatedData,
    };

    if (validatedData.status === 'acknowledged' && validatedData.acknowledgedBy) {
      updateData.acknowledgedAt = new Date();
    }

    if (validatedData.status === 'resolved' && validatedData.resolvedBy) {
      updateData.resolvedAt = new Date();
    }

    const alert = await prisma.alert.update({
      where: {
        id: alertId,
        organizationId: user.organizationId,
      },
      data: updateData,
      include: {
        acknowledgedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        resolvedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(alert);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating alert:', error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}
