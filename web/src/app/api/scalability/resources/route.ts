import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createResourceSchema = z.object({
  resourceType: z.enum([
    'cpu',
    'memory',
    'disk',
    'network',
    'database',
    'cache',
    'api_endpoint',
    'queue',
  ]),
  resourceName: z.string().min(1),
  currentUsage: z.number().min(0),
  maxCapacity: z.number().min(0),
  utilizationPercentage: z.number().min(0).max(100),
  status: z.enum(['healthy', 'warning', 'critical', 'overloaded', 'offline']),
  alerts: z.record(z.string(), z.any()).optional(),
  metrics: z.record(z.string(), z.any()),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resourceType = searchParams.get('resourceType');
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

    if (resourceType) {
      where.resourceType = resourceType;
    }

    if (status) {
      where.status = status;
    }

    const resources = await prisma.systemResource.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.systemResource.count({ where });

    return NextResponse.json({
      resources,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching system resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system resources' },
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
    const validatedData = createResourceSchema.parse(body);

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'User not associated with organization' }, { status: 400 });
    }

    const resource = await prisma.systemResource.create({
      data: {
        ...validatedData,
        organizationId: user.organizationId,
      },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating system resource:', error);
    return NextResponse.json(
      { error: 'Failed to create system resource' },
      { status: 500 }
    );
  }
}
