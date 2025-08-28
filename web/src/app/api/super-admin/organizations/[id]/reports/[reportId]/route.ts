import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toSerializable } from '@/lib/utils';
import { z } from 'zod';

const updateReportSchema = z.object({
  name: z.string().min(1, 'Report name is required').optional(),
  description: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
  isActive: z.boolean().optional(),
  recipients: z.array(z.string().email()).min(1, 'At least one recipient is required').optional(),
  metrics: z.array(z.string()).min(1, 'At least one metric is required').optional(),
  format: z.enum(['pdf', 'csv', 'html']).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if ((session as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const { id: organizationId, reportId } = await params;
    const body = await request.json();

    // Validate request body
    const validatedData = updateReportSchema.parse(body);

    // Check if report exists and belongs to organization
    const existingReport = await prisma.scheduledReport.findFirst({
      where: {
        id: reportId,
        organizationId,
      },
    });

    if (!existingReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Calculate next scheduled time if schedule-related fields changed
    const nextScheduled = (validatedData.frequency || validatedData.dayOfWeek || validatedData.dayOfMonth || validatedData.time) 
      ? calculateNextScheduledTime({
          ...existingReport,
          ...validatedData,
        })
      : existingReport.nextScheduled;

    // Update the scheduled report
    const report = await prisma.scheduledReport.update({
      where: { id: reportId },
      data: {
        ...validatedData,
        nextScheduled,
      },
    });

    // Log audit activity
    await prisma.auditLog.create({
      data: {
        action: 'scheduled_report_updated',
        details: {
          reportId: report.id,
          reportName: report.name,
          changes: validatedData,
        },
        organizationId,
        userId: (session as any).user.id,
        resource: 'ScheduledReport',
        resourceId: report.id,
      },
    });

    return NextResponse.json({
      report: toSerializable(report),
      message: 'Scheduled report updated successfully',
    });
  } catch (error) {
    console.error('Error updating scheduled report:', error);
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if ((session as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const { id: organizationId, reportId } = await params;

    // Check if report exists and belongs to organization
    const existingReport = await prisma.scheduledReport.findFirst({
      where: {
        id: reportId,
        organizationId,
      },
    });

    if (!existingReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Delete the scheduled report
    await prisma.scheduledReport.delete({
      where: { id: reportId },
    });

    // Log audit activity
    await prisma.auditLog.create({
      data: {
        action: 'scheduled_report_deleted',
        details: {
          reportId: existingReport.id,
          reportName: existingReport.name,
        },
        organizationId,
        userId: (session as any).user.id,
        resource: 'ScheduledReport',
        resourceId: existingReport.id,
      },
    });

    return NextResponse.json({
      message: 'Scheduled report deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting scheduled report:', error);
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
