import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a legitimate cron service
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all approved guardian-student relationships
    const relationships = await prisma.guardianRelationship.findMany({
      where: { status: 'approved' },
      include: {
        guardian: {
          include: {
            emailPreferences: true,
          },
        },
        student: true,
      },
    });

    const results = [];
    const now = new Date();

    for (const relationship of relationships) {
      const { guardian, student } = relationship;
      
      // Check if guardian has email preferences
      if (!guardian.emailPreferences) {
        // Create default email preference
        await prisma.emailPreference.create({
          data: {
            userId: guardian.id,
            weeklyProgressEnabled: true,
            emailFrequency: 'weekly',
          },
        });
      }

      // Skip if guardian has disabled weekly progress emails
      if (!guardian.emailPreferences?.weeklyProgressEnabled) {
        results.push({
          guardianEmail: guardian.email,
          studentEmail: student.email,
          status: 'skipped',
          reason: 'Email preferences disabled',
        });
        continue;
      }

      // Check if we should send email based on frequency
      const lastEmailSent = guardian.emailPreferences.lastEmailSent;
      if (lastEmailSent) {
        const daysSinceLastEmail = Math.floor(
          (now.getTime() - lastEmailSent.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastEmail < 7) {
          results.push({
            guardianEmail: guardian.email,
            studentEmail: student.email,
            status: 'skipped',
            reason: 'Email sent recently',
          });
          continue;
        }
      }

      // Get or create progress report for the current week
      const startOfWeek = new Date(now);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      let progressReport = await prisma.progressReport.findFirst({
        where: {
          userId: student.id,
          reportDate: {
            gte: startOfWeek,
            lte: endOfWeek,
          },
        },
      });

      if (!progressReport) {
        // Create a default progress report if none exists
        progressReport = await prisma.progressReport.create({
          data: {
            userId: student.id,
            reportDate: startOfWeek,
            sessionsCount: 0,
            questionsAsked: 0,
            topicsCovered: [],
            timeSpent: 0,
          },
        });
      }

      // Get the weekly progress email template
      let template = await prisma.emailTemplate.findUnique({
        where: { name: 'weekly_progress' },
      });

      if (!template) {
        // Create default template if it doesn't exist
        await EmailService.getDefaultTemplates();
        template = await prisma.emailTemplate.findUnique({
          where: { name: 'weekly_progress' },
        });
      }

      if (!template) {
        results.push({
          guardianEmail: guardian.email,
          studentEmail: student.email,
          status: 'failed',
          reason: 'Email template not found',
        });
        continue;
      }

      try {
        // Send the progress email
        await EmailService.sendProgressEmail({
          guardian,
          student,
          progressReport,
          template,
        });

        // Update last email sent timestamp
        await prisma.emailPreference.update({
          where: { userId: guardian.id },
          data: { lastEmailSent: now },
        });

        results.push({
          guardianEmail: guardian.email,
          studentEmail: student.email,
          status: 'sent',
        });
      } catch (error) {
        console.error(`Failed to send email to ${guardian.email}:`, error);
        results.push({
          guardianEmail: guardian.email,
          studentEmail: student.email,
          status: 'failed',
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const summary = {
      total: results.length,
      sent: results.filter(r => r.status === 'sent').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      failed: results.filter(r => r.status === 'failed').length,
    };

    return NextResponse.json({
      message: 'Weekly progress emails processed',
      summary,
      results,
    });
  } catch (error) {
    console.error('Error processing weekly emails:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for testing (remove in production)
export async function GET() {
  return NextResponse.json({
    message: 'Weekly emails cron endpoint',
    instructions: 'Send POST request with Bearer token to trigger weekly emails',
  });
}
