import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const CreateExperimentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  hypothesis: z.string().min(1).max(1000),
  testType: z.enum(['TEACHING_METHOD', 'CONTENT_PRESENTATION', 'ASSESSMENT_FORMAT', 'UI_UX_DESIGN', 'PERSONALIZATION_ALGORITHM', 'ENGAGEMENT_STRATEGY', 'DIFFICULTY_ADJUSTMENT', 'FEEDBACK_MECHANISM']),
  targetAudience: z.object({
    roles: z.array(z.string()).optional(),
    organizations: z.array(z.string()).optional(),
    subjects: z.array(z.string()).optional(),
    gradeLevels: z.array(z.string()).optional(),
  }),
  successMetrics: z.array(z.string()).min(1),
  minimumSampleSize: z.number().min(10).max(10000).default(100),
  confidenceLevel: z.number().min(0.8).max(0.99).default(0.95),
  variants: z.array(z.object({
    name: z.string().min(1).max(100),
    description: z.string().min(1).max(1000),
    variantType: z.enum(['control', 'treatment', 'alternative']),
    configuration: z.record(z.string(), z.any()),
    trafficAllocation: z.number().min(0).max(1),
    isControl: z.boolean().default(false),
  })).min(2),
});

const UpdateExperimentSchema = CreateExperimentSchema.partial().extend({
  id: z.string(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// GET /api/ab-testing/experiments - List all experiments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const testType = searchParams.get('testType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (testType) where.testType = testType;

    const [experiments, total] = await Promise.all([
      prisma.aBTestExperiment.findMany({
        where,
        include: {
          createdByUser: {
            select: { id: true, name: true, email: true }
          },
          variants: {
            select: {
              id: true,
              name: true,
              variantType: true,
              isControl: true,
              trafficAllocation: true,
              _count: {
                select: { participants: true }
              }
            }
          },
          _count: {
            select: { participants: true, results: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.aBTestExperiment.count({ where })
    ]);

    return NextResponse.json({
      experiments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching experiments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/ab-testing/experiments - Create new experiment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and super_admins can create experiments
    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = CreateExperimentSchema.parse(body);

    // Validate traffic allocation sums to 1
    const totalAllocation = validatedData.variants.reduce((sum, variant) => sum + variant.trafficAllocation, 0);
    if (Math.abs(totalAllocation - 1) > 0.01) {
      return NextResponse.json({ error: 'Traffic allocation must sum to 1.0' }, { status: 400 });
    }

    // Ensure exactly one control variant
    const controlCount = validatedData.variants.filter(v => v.isControl).length;
    if (controlCount !== 1) {
      return NextResponse.json({ error: 'Exactly one variant must be marked as control' }, { status: 400 });
    }

    const experiment = await prisma.aBTestExperiment.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        hypothesis: validatedData.hypothesis,
        testType: validatedData.testType,
        targetAudience: validatedData.targetAudience,
        successMetrics: validatedData.successMetrics,
        minimumSampleSize: validatedData.minimumSampleSize,
        confidenceLevel: validatedData.confidenceLevel,
        createdBy: session.user.id,
        variants: {
          create: validatedData.variants.map(variant => ({
            name: variant.name,
            description: variant.description,
            variantType: variant.variantType,
            configuration: variant.configuration,
            trafficAllocation: variant.trafficAllocation,
            isControl: variant.isControl,
          }))
        }
      },
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true }
        },
        variants: true
      }
    });

    return NextResponse.json(experiment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Error creating experiment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/ab-testing/experiments - Update experiment
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and super_admins can update experiments
    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = UpdateExperimentSchema.parse(body);

    const experiment = await prisma.aBTestExperiment.update({
      where: { id: validatedData.id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.description && { description: validatedData.description }),
        ...(validatedData.hypothesis && { hypothesis: validatedData.hypothesis }),
        ...(validatedData.testType && { testType: validatedData.testType }),
        ...(validatedData.targetAudience && { targetAudience: validatedData.targetAudience }),
        ...(validatedData.successMetrics && { successMetrics: validatedData.successMetrics }),
        ...(validatedData.minimumSampleSize && { minimumSampleSize: validatedData.minimumSampleSize }),
        ...(validatedData.confidenceLevel && { confidenceLevel: validatedData.confidenceLevel }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.startDate && { startDate: new Date(validatedData.startDate) }),
        ...(validatedData.endDate && { endDate: new Date(validatedData.endDate) }),
        ...(validatedData.status === 'active' && { isActive: true }),
        ...(validatedData.status === 'completed' && { isActive: false }),
      },
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true }
        },
        variants: true
      }
    });

    return NextResponse.json(experiment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Error updating experiment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
