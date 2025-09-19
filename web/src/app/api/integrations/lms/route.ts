import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createLMSIntegrationSchema = z.object({
  lmsType: z.enum([
    'canvas',
    'blackboard',
    'google_classroom',
    'moodle',
    'schoology',
    'brightspace',
    'sakai',
    'custom',
  ]),
  lmsName: z.string().min(1),
  baseUrl: z.string().url(),
  apiKey: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  configuration: z.record(z.string(), z.any()),
  syncFrequency: z.number().min(1).default(60), // in minutes
  autoSync: z.boolean().default(false),
});

//const updateLMSIntegrationSchema = createLMSIntegrationSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lmsType = searchParams.get('lmsType');
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

    if (lmsType) {
      where.lmsType = lmsType;
    }

    if (status) {
      where.status = status;
    }

    const integrations = await prisma.lMSIntegration.findMany({
      where,
      include: {
        _count: {
          select: {
            courses: true,
            enrollments: true,
            assignments: true,
            grades: true,
            syncLogs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.lMSIntegration.count({ where });

    return NextResponse.json({
      integrations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching LMS integrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LMS integrations' },
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
    const validatedData = createLMSIntegrationSchema.parse(body);

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'User not associated with organization' }, { status: 400 });
    }

    const integration = await prisma.lMSIntegration.create({
      data: {
        ...validatedData,
        organizationId: user.organizationId,
        status: 'pending',
      },
      include: {
        _count: {
          select: {
            courses: true,
            enrollments: true,
            assignments: true,
            grades: true,
            syncLogs: true,
          },
        },
      },
    });

    return NextResponse.json(integration, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating LMS integration:', error);
    return NextResponse.json(
      { error: 'Failed to create LMS integration' },
      { status: 500 }
    );
  }
}
