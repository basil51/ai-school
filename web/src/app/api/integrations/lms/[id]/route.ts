import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateLMSIntegrationSchema = z.object({
  lmsType: z.enum([
    'canvas',
    'blackboard',
    'google_classroom',
    'moodle',
    'schoology',
    'brightspace',
    'sakai',
    'custom',
  ]).optional(),
  lmsName: z.string().min(1).optional(),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  configuration: z.record(z.string(), z.any()).optional(),
  status: z.enum(['active', 'inactive', 'error', 'pending', 'configuring']).optional(),
  syncFrequency: z.number().min(1).optional(),
  autoSync: z.boolean().optional(),
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

    const integration = await prisma.lMSIntegration.findUnique({
      where: { id },
      include: {
        courses: {
          include: {
            _count: {
              select: {
                enrollments: true,
                assignments: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        syncLogs: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
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

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    return NextResponse.json(integration);
  } catch (error) {
    console.error('Error fetching LMS integration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LMS integration' },
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
    const validatedData = updateLMSIntegrationSchema.parse(body);

    const integration = await prisma.lMSIntegration.update({
      where: { id },
      data: validatedData,
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

    return NextResponse.json(integration);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating LMS integration:', error);
    return NextResponse.json(
      { error: 'Failed to update LMS integration' },
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

    await prisma.lMSIntegration.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Integration deleted successfully' });
  } catch (error) {
    console.error('Error deleting LMS integration:', error);
    return NextResponse.json(
      { error: 'Failed to delete LMS integration' },
      { status: 500 }
    );
  }
}
