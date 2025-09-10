import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const syncRequestSchema = z.object({
  syncType: z.enum(['full', 'incremental', 'manual', 'scheduled']).default('manual'),
  syncCourses: z.boolean().default(true),
  syncEnrollments: z.boolean().default(true),
  syncAssignments: z.boolean().default(true),
  syncGrades: z.boolean().default(true),
});

export async function POST(
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
    const validatedData = syncRequestSchema.parse(body);

    // Get the integration
    const integration = await prisma.lMSIntegration.findUnique({
      where: { id },
    });

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // Create sync log entry
    const syncLog = await prisma.lMSSyncLog.create({
      data: {
        lmsIntegrationId: id,
        syncType: validatedData.syncType,
        status: 'running',
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsFailed: 0,
        metadata: {
          syncCourses: validatedData.syncCourses,
          syncEnrollments: validatedData.syncEnrollments,
          syncAssignments: validatedData.syncAssignments,
          syncGrades: validatedData.syncGrades,
        },
      },
    });

    // Update integration status
    await prisma.lMSIntegration.update({
      where: { id },
      data: {
        status: 'active',
        lastSyncAt: new Date(),
        errorCount: 0,
        lastError: null,
        lastErrorAt: null,
      },
    });

    // In a real implementation, this would trigger the actual sync process
    // For now, we'll simulate a successful sync
    setTimeout(async () => {
      try {
        await prisma.lMSSyncLog.update({
          where: { id: syncLog.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            duration: 5000, // 5 seconds
            recordsProcessed: 100,
            recordsCreated: 25,
            recordsUpdated: 75,
            recordsFailed: 0,
          },
        });
      } catch (error) {
        console.error('Error updating sync log:', error);
      }
    }, 1000);

    return NextResponse.json({
      message: 'Sync started successfully',
      syncLogId: syncLog.id,
      status: 'running',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error starting LMS sync:', error);
    return NextResponse.json(
      { error: 'Failed to start LMS sync' },
      { status: 500 }
    );
  }
}

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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const syncLogs = await prisma.lMSSyncLog.findMany({
      where: { lmsIntegrationId: id },
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.lMSSyncLog.count({
      where: { lmsIntegrationId: id },
    });

    return NextResponse.json({
      syncLogs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching LMS sync logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LMS sync logs' },
      { status: 500 }
    );
  }
}
