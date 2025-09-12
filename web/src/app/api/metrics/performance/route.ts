import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const CreateMetricSchema = z.object({
  studentId: z.string().optional(),
  teacherId: z.string().optional(),
  organizationId: z.string().optional(),
  metricType: z.enum(['system', 'user', 'content', 'engagement']),
  metricName: z.string(),
  metricValue: z.number(),
  metricUnit: z.string().optional(),
  context: z.record(z.string(), z.any()).optional(),
  sessionId: z.string().optional(),
  lessonId: z.string().optional(),
  assessmentId: z.string().optional(),
});

const UpdateMetricSchema = z.object({
  id: z.string(),
  metricValue: z.number().optional(),
  metricUnit: z.string().optional(),
  context: z.record(z.string(), z.any()).optional(),
});

// GET /api/metrics/performance - Get performance metrics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const teacherId = searchParams.get('teacherId');
    const organizationId = searchParams.get('organizationId');
    const metricType = searchParams.get('metricType');
    const metricName = searchParams.get('metricName');
    const sessionId = searchParams.get('sessionId');
    const lessonId = searchParams.get('lessonId');
    const assessmentId = searchParams.get('assessmentId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (teacherId) where.teacherId = teacherId;
    if (organizationId) where.organizationId = organizationId;
    if (metricType) where.metricType = metricType;
    if (metricName) where.metricName = metricName;
    if (sessionId) where.sessionId = sessionId;
    if (lessonId) where.lessonId = lessonId;
    if (assessmentId) where.assessmentId = assessmentId;
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const metrics = await prisma.phase3PerformanceMetrics.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        teacher: {
          select: { id: true, name: true, email: true }
        },
        organization: {
          select: { id: true, name: true, slug: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.phase3PerformanceMetrics.count({ where });

    // Calculate summary statistics
    const summary = await prisma.phase3PerformanceMetrics.aggregate({
      where,
      _avg: {
        metricValue: true,
      },
      _min: {
        metricValue: true,
      },
      _max: {
        metricValue: true,
      },
      _count: {
        id: true,
      },
    });

    // Group by metric type and name for detailed analysis
    const groupedMetrics = await prisma.phase3PerformanceMetrics.groupBy({
      by: ['metricType', 'metricName'],
      where,
      _avg: {
        metricValue: true,
      },
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      metrics,
      summary,
      groupedMetrics,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}

// POST /api/metrics/performance - Create new performance metric
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreateMetricSchema.parse(body);

    // Set default values based on user role
    const userRole = (session as any)?.role;
    const defaultData: any = {
      metricType: validatedData.metricType,
      metricName: validatedData.metricName,
      metricValue: validatedData.metricValue,
      metricUnit: validatedData.metricUnit,
      context: validatedData.context,
      sessionId: validatedData.sessionId,
      lessonId: validatedData.lessonId,
      assessmentId: validatedData.assessmentId,
    };

    // Set user/teacher/organization based on role and provided data
    if (userRole === 'student' && !validatedData.studentId) {
      defaultData.studentId = session.user.id;
    } else if (validatedData.studentId) {
      defaultData.studentId = validatedData.studentId;
    }

    if (userRole === 'teacher' && !validatedData.teacherId) {
      defaultData.teacherId = session.user.id;
    } else if (validatedData.teacherId) {
      defaultData.teacherId = validatedData.teacherId;
    }

    if (validatedData.organizationId) {
      defaultData.organizationId = validatedData.organizationId;
    }

    const metric = await prisma.phase3PerformanceMetrics.create({
      data: defaultData,
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        teacher: {
          select: { id: true, name: true, email: true }
        },
        organization: {
          select: { id: true, name: true, slug: true }
        }
      },
    });

    return NextResponse.json(metric, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating performance metric:', error);
    return NextResponse.json(
      { error: 'Failed to create performance metric' },
      { status: 500 }
    );
  }
}

// PUT /api/metrics/performance - Update existing performance metric
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = UpdateMetricSchema.parse(body);

    // Verify ownership or admin access
    const existingMetric = await prisma.phase3PerformanceMetrics.findFirst({
      where: {
        id: validatedData.id,
        OR: [
          { studentId: session.user.id },
          { teacherId: session.user.id },
          { organizationId: (session as any)?.organizationId },
        ],
      },
    });

    if (!existingMetric) {
      return NextResponse.json(
        { error: 'Performance metric not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (validatedData.metricValue !== undefined) updateData.metricValue = validatedData.metricValue;
    if (validatedData.metricUnit !== undefined) updateData.metricUnit = validatedData.metricUnit;
    if (validatedData.context !== undefined) updateData.context = validatedData.context;

    const metric = await prisma.phase3PerformanceMetrics.update({
      where: { id: validatedData.id },
      data: updateData,
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        teacher: {
          select: { id: true, name: true, email: true }
        },
        organization: {
          select: { id: true, name: true, slug: true }
        }
      },
    });

    return NextResponse.json(metric);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating performance metric:', error);
    return NextResponse.json(
      { error: 'Failed to update performance metric' },
      { status: 500 }
    );
  }
}
