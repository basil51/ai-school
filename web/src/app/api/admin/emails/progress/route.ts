import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/email';
import { z } from 'zod';

const sendProgressEmailSchema = z.object({
  studentId: z.string(),
  reportDate: z.string().optional(), // ISO date string
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, reportDate } = sendProgressEmailSchema.parse(body);

    // Get the student
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentRelationships: {
          where: { status: 'approved' },
          include: {
            guardian: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    if (student.role !== 'student') {
      return NextResponse.json(
        { error: 'User is not a student' },
        { status: 400 }
      );
    }

    // Get approved guardian relationships
    const approvedRelationships = student.studentRelationships;
    
    if (approvedRelationships.length === 0) {
      return NextResponse.json(
        { error: 'No approved guardians found for this student' },
        { status: 404 }
      );
    }

    // Get or create progress report
    const reportDateObj = reportDate ? new Date(reportDate) : new Date();
    const startOfWeek = new Date(reportDateObj);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    let progressReport = await prisma.progressReport.findFirst({
      where: {
        userId: studentId,
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
          userId: studentId,
          reportDate: startOfWeek,
          sessionsCount: 0,
          questionsAsked: 0,
          topicsCovered: [],
          timeSpent: 0,
        },
      });
    }

    // Get the weekly progress email template
    const template = await prisma.emailTemplate.findUnique({
      where: { name: 'weekly_progress' },
    });

    if (!template) {
      // Create default template if it doesn't exist
      await EmailService.getDefaultTemplates();
      const defaultTemplate = await prisma.emailTemplate.findUnique({
        where: { name: 'weekly_progress' },
      });
      
      if (!defaultTemplate) {
        return NextResponse.json(
          { error: 'Email template not found' },
          { status: 500 }
        );
      }
    }

    const emailTemplate = template || await prisma.emailTemplate.findUnique({
      where: { name: 'weekly_progress' },
    });

    if (!emailTemplate) {
      return NextResponse.json(
        { error: 'Email template not found' },
        { status: 500 }
      );
    }

    // Send emails to all approved guardians
    const emailResults = [];
    
    for (const relationship of approvedRelationships) {
      const guardian = relationship.guardian;
      
      // Check if guardian has email preferences
      let emailPreference = await prisma.emailPreference.findUnique({
        where: { userId: guardian.id },
      });

      if (!emailPreference) {
        // Create default email preference
        emailPreference = await prisma.emailPreference.create({
          data: {
            userId: guardian.id,
            weeklyProgressEnabled: true,
            emailFrequency: 'weekly',
          },
        });
      }

      // Check if guardian has enabled weekly progress emails
      if (!emailPreference.weeklyProgressEnabled) {
        emailResults.push({
          guardianEmail: guardian.email,
          status: 'skipped',
          reason: 'Email preferences disabled',
        });
        continue;
      }

      try {
        await EmailService.sendProgressEmail({
          guardian,
          student,
          progressReport,
          template: emailTemplate,
        });

        // Update last email sent timestamp
        await prisma.emailPreference.update({
          where: { id: emailPreference.id },
          data: { lastEmailSent: new Date() },
        });

        emailResults.push({
          guardianEmail: guardian.email,
          status: 'sent',
        });
      } catch (error) {
        console.error(`Failed to send email to ${guardian.email}:`, error);
        emailResults.push({
          guardianEmail: guardian.email,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      message: 'Progress emails processed',
      results: emailResults,
      progressReport,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: (error as any).errors },
        { status: 400 }
      );
    }

    console.error('Error sending progress emails:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Get student's progress reports
    const progressReports = await prisma.progressReport.findMany({
      where: { userId: studentId },
      orderBy: { reportDate: 'desc' },
      take: 10, // Last 10 reports
    });

    return NextResponse.json(progressReports);
  } catch (error) {
    console.error('Error fetching progress reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
