import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toSerializable } from '@/lib/utils';
import { z } from 'zod';

const createReportSchema = z.object({
  name: z.string().min(1, 'Report name is required'),
  description: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  isActive: z.boolean().default(true),
  recipients: z.array(z.string().email()).min(1, 'At least one recipient is required'),
  metrics: z.array(z.string()).min(1, 'At least one metric is required'),
  format: z.enum(['pdf', 'csv', 'html']),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if ((session as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const { id: organizationId } = await params;

    // Get scheduled reports for the organization
    const reports = await prisma.scheduledReport.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      reports: toSerializable(reports),
    });
  } catch (error) {
    console.error('Error fetching scheduled reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if ((session as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const { id: organizationId } = await params;
    const body = await request.json();

    // Validate request body
    const validatedData = createReportSchema.parse(body);

    // Calculate next scheduled time
    const nextScheduled = calculateNextScheduledTime(validatedData);

    // Create the scheduled report
    const report = await prisma.scheduledReport.create({
      data: {
        ...validatedData,
        organizationId,
        nextScheduled,
        createdBy: (session as any).user.id,
      },
    });

    // Log audit activity
    await prisma.auditLog.create({
      data: {
        action: 'scheduled_report_created',
        details: {
          reportId: report.id,
          reportName: report.name,
          frequency: report.frequency,
          recipients: report.recipients,
        },
        organizationId,
        userId: (session as any).user.id,
        resource: 'ScheduledReport',
        resourceId: report.id,
      },
    });

    return NextResponse.json({
      report: toSerializable(report),
      message: 'Scheduled report created successfully',
    });
  } catch (error) {
    console.error('Error creating scheduled report:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: (error as any).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateNextScheduledTime(report: any): Date {
  const now = new Date();
  const [hours, minutes] = report.time.split(':').map(Number);
  
  const nextScheduled = new Date();
  nextScheduled.setHours(hours, minutes, 0, 0);

  // If the time has already passed today, schedule for next occurrence
  if (nextScheduled <= now) {
    switch (report.frequency) {
      case 'daily':
        nextScheduled.setDate(nextScheduled.getDate() + 1);
        break;
      case 'weekly':
        const daysUntilNext = (report.dayOfWeek - nextScheduled.getDay() + 7) % 7;
        nextScheduled.setDate(nextScheduled.getDate() + daysUntilNext);
        break;
      case 'monthly':
        nextScheduled.setDate(report.dayOfMonth);
        if (nextScheduled <= now) {
          nextScheduled.setMonth(nextScheduled.getMonth() + 1);
        }
        break;
    }
  }

  return nextScheduled;
}
