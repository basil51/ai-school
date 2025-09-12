import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const CreateReportSchema = z.object({
  studentId: z.string(),
  reportType: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  periodStart: z.string(),
  periodEnd: z.string(),
  generatedBy: z.string().optional(),
  summary: z.string(),
  keyMetrics: z.record(z.string(), z.any()),
  achievements: z.array(z.string()).optional(),
  improvements: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
  parentNotes: z.string().optional(),
  isShared: z.boolean().optional(),
  sharedWith: z.array(z.string()).optional(),
});

const UpdateReportSchema = z.object({
  id: z.string(),
  summary: z.string().optional(),
  keyMetrics: z.record(z.string(), z.any()).optional(),
  achievements: z.array(z.string()).optional(),
  improvements: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
  parentNotes: z.string().optional(),
  isShared: z.boolean().optional(),
  sharedWith: z.array(z.string()).optional(),
});

// GET /api/reports/progress - Get progress reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || session.user.id;
    const reportType = searchParams.get('reportType');
    const periodStart = searchParams.get('periodStart');
    const periodEnd = searchParams.get('periodEnd');
    const isShared = searchParams.get('isShared');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = { studentId };
    if (reportType) where.reportType = reportType;
    if (periodStart) where.periodStart = { gte: new Date(periodStart) };
    if (periodEnd) where.periodEnd = { lte: new Date(periodEnd) };
    if (isShared !== null) where.isShared = isShared === 'true';

    const reports = await prisma.phase3ProgressReport.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { periodStart: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.phase3ProgressReport.count({ where });

    return NextResponse.json({
      reports,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching progress reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress reports' },
      { status: 500 }
    );
  }
}

// POST /api/reports/progress - Create new progress report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreateReportSchema.parse(body);

    // Check permissions - only teachers, admins, or the student themselves can create reports
    const userRole = (session as any)?.role;
    if (userRole !== 'teacher' && userRole !== 'admin' && userRole !== 'super_admin' && validatedData.studentId !== session.user.id) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const report = await prisma.phase3ProgressReport.create({
      data: {
        studentId: validatedData.studentId,
        reportType: validatedData.reportType,
        periodStart: new Date(validatedData.periodStart),
        periodEnd: new Date(validatedData.periodEnd),
        generatedBy: validatedData.generatedBy || session.user.id,
        summary: validatedData.summary,
        keyMetrics: validatedData.keyMetrics,
        achievements: validatedData.achievements || [],
        improvements: validatedData.improvements || [],
        recommendations: validatedData.recommendations || [],
        goals: validatedData.goals || [],
        parentNotes: validatedData.parentNotes,
        isShared: validatedData.isShared || false,
        sharedWith: validatedData.sharedWith || [],
      },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        }
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating progress report:', error);
    return NextResponse.json(
      { error: 'Failed to create progress report' },
      { status: 500 }
    );
  }
}

// PUT /api/reports/progress - Update existing progress report
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = UpdateReportSchema.parse(body);

    // Verify ownership or admin access
    const existingReport = await prisma.phase3ProgressReport.findFirst({
      where: {
        id: validatedData.id,
        OR: [
          { studentId: session.user.id },
          { generatedBy: session.user.id },
        ],
      },
    });

    if (!existingReport) {
      return NextResponse.json(
        { error: 'Progress report not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (validatedData.summary !== undefined) updateData.summary = validatedData.summary;
    if (validatedData.keyMetrics !== undefined) updateData.keyMetrics = validatedData.keyMetrics;
    if (validatedData.achievements !== undefined) updateData.achievements = validatedData.achievements;
    if (validatedData.improvements !== undefined) updateData.improvements = validatedData.improvements;
    if (validatedData.recommendations !== undefined) updateData.recommendations = validatedData.recommendations;
    if (validatedData.goals !== undefined) updateData.goals = validatedData.goals;
    if (validatedData.parentNotes !== undefined) updateData.parentNotes = validatedData.parentNotes;
    if (validatedData.isShared !== undefined) updateData.isShared = validatedData.isShared;
    if (validatedData.sharedWith !== undefined) updateData.sharedWith = validatedData.sharedWith;

    const report = await prisma.phase3ProgressReport.update({
      where: { id: validatedData.id },
      data: updateData,
      include: {
        student: {
          select: { id: true, name: true, email: true }
        }
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating progress report:', error);
    return NextResponse.json(
      { error: 'Failed to update progress report' },
      { status: 500 }
    );
  }
}
