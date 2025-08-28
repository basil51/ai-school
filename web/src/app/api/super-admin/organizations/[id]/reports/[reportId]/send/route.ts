import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { generateReportContent } from '@/lib/reports';

export async function POST(
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

    // Get the scheduled report
    const report = await prisma.scheduledReport.findFirst({
      where: {
        id: reportId,
        organizationId,
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Get organization analytics data
    const analyticsResponse = await fetch(`${request.nextUrl.origin}/api/super-admin/organizations/${organizationId}/analytics`);
    if (!analyticsResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
    }
    const analytics = await analyticsResponse.json();

    // Generate report content based on format
    const reportContent = await generateReportContent(report, analytics, report.format);

    // Send email to recipients
    const emailPromises = report.recipients.map(async (recipient) => {
      try {
        const emailResponse = await fetch(`${request.nextUrl.origin}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipient,
            subject: `Analytics Report: ${report.name}`,
            html: reportContent.html,
            attachments: reportContent.attachments,
          }),
        });

        return { recipient, success: emailResponse.ok };
      } catch (error) {
        console.error(`Failed to send email to ${recipient}:`, error);
        return { recipient, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    const emailResults = await Promise.all(emailPromises);
    const successfulEmails = emailResults.filter(result => result.success);
    const failedEmails = emailResults.filter(result => !result.success);

    // Update report with last sent time and calculate next scheduled time
    const nextScheduled = calculateNextScheduledTime(report);
    
    await prisma.scheduledReport.update({
      where: { id: reportId },
      data: {
        lastSent: new Date(),
        nextScheduled,
      },
    });

    // Log audit activity
    await prisma.auditLog.create({
      data: {
        action: 'scheduled_report_sent',
        details: {
          reportId: report.id,
          reportName: report.name,
          recipients: report.recipients,
          successfulEmails: successfulEmails.length,
          failedEmails: failedEmails.length,
          format: report.format,
        },
        organizationId,
        userId: (session as any).user.id,
        resource: 'ScheduledReport',
        resourceId: report.id,
      },
    });

    return NextResponse.json({
      message: 'Report sent successfully',
      results: {
        total: emailResults.length,
        successful: successfulEmails.length,
        failed: failedEmails.length,
        failedRecipients: failedEmails.map(result => result.recipient),
      },
    });
  } catch (error) {
    console.error('Error sending scheduled report:', error);
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
