import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createDashboardSchema = z.object({
  dashboardName: z.string().min(1),
  dashboardType: z.enum([
    'system_overview',
    'performance_monitoring',
    'usage_analytics',
    'health_monitoring',
    'custom',
  ]),
  description: z.string().optional(),
  configuration: z.record(z.string(), z.any()),
  isDefault: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  refreshInterval: z.number().min(5).default(30), // in seconds
  autoRefresh: z.boolean().default(true),
});

//const updateDashboardSchema = createDashboardSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dashboardType = searchParams.get('dashboardType');
    const isDefault = searchParams.get('isDefault');
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

    if (dashboardType) {
      where.dashboardType = dashboardType;
    }

    if (isDefault !== null) {
      where.isDefault = isDefault === 'true';
    }

    const dashboards = await prisma.monitoringDashboard.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        widgets: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            widgets: true,
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    const total = await prisma.monitoringDashboard.count({ where });

    return NextResponse.json({
      dashboards,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching monitoring dashboards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitoring dashboards' },
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
    const validatedData = createDashboardSchema.parse(body);

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'User not associated with organization' }, { status: 400 });
    }

    // If setting as default, unset other default dashboards of the same type
    if (validatedData.isDefault) {
      await prisma.monitoringDashboard.updateMany({
        where: {
          organizationId: user.organizationId,
          dashboardType: validatedData.dashboardType,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const dashboard = await prisma.monitoringDashboard.create({
      data: {
        ...validatedData,
        organizationId: user.organizationId,
        createdBy: session.user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        widgets: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            widgets: true,
          },
        },
      },
    });

    return NextResponse.json(dashboard, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating monitoring dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to create monitoring dashboard' },
      { status: 500 }
    );
  }
}
