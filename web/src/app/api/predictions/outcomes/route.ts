import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const CreatePredictionSchema = z.object({
  subjectId: z.string().optional(),
  predictionType: z.enum(['success', 'engagement', 'retention', 'completion']),
  predictedValue: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  timeframe: z.enum(['short_term', 'medium_term', 'long_term']),
  targetDate: z.string(),
  factors: z.record(z.string(), z.any()),
  recommendations: z.array(z.string()).optional(),
});

const UpdatePredictionSchema = z.object({
  id: z.string(),
  actualOutcome: z.number().min(0).max(1).optional(),
  accuracy: z.number().min(0).max(1).optional(),
});

// GET /api/predictions/outcomes - Get learning outcome predictions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || session.user.id;
    const subjectId = searchParams.get('subjectId');
    const predictionType = searchParams.get('predictionType');
    const timeframe = searchParams.get('timeframe');
    const targetDate = searchParams.get('targetDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = { studentId };
    if (subjectId) where.subjectId = subjectId;
    if (predictionType) where.predictionType = predictionType;
    if (timeframe) where.timeframe = timeframe;
    if (targetDate) where.targetDate = { gte: new Date(targetDate) };

    const predictions = await prisma.learningOutcomePrediction.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        subject: {
          select: { id: true, name: true, level: true }
        }
      },
      orderBy: { predictionDate: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.learningOutcomePrediction.count({ where });

    // Calculate prediction accuracy statistics
    const accuracyStats = await prisma.learningOutcomePrediction.aggregate({
      where: {
        ...where,
        accuracy: { not: null },
      },
      _avg: {
        accuracy: true,
        confidence: true,
        predictedValue: true,
        actualOutcome: true,
      },
      _count: {
        id: true,
      },
    });

    // Group predictions by type and timeframe
    const groupedPredictions = await prisma.learningOutcomePrediction.groupBy({
      by: ['predictionType', 'timeframe'],
      where,
      _avg: {
        predictedValue: true,
        confidence: true,
        accuracy: true,
      },
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      predictions,
      accuracyStats,
      groupedPredictions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching learning outcome predictions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning outcome predictions' },
      { status: 500 }
    );
  }
}

// POST /api/predictions/outcomes - Create new learning outcome prediction
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreatePredictionSchema.parse(body);

    const prediction = await prisma.learningOutcomePrediction.create({
      data: {
        studentId: session.user.id,
        subjectId: validatedData.subjectId,
        predictionType: validatedData.predictionType,
        predictedValue: validatedData.predictedValue,
        confidence: validatedData.confidence,
        timeframe: validatedData.timeframe,
        targetDate: new Date(validatedData.targetDate),
        factors: validatedData.factors,
        recommendations: validatedData.recommendations || [],
      },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        subject: {
          select: { id: true, name: true, level: true }
        }
      },
    });

    return NextResponse.json(prediction, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating learning outcome prediction:', error);
    return NextResponse.json(
      { error: 'Failed to create learning outcome prediction' },
      { status: 500 }
    );
  }
}

// PUT /api/predictions/outcomes - Update prediction with actual outcome
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = UpdatePredictionSchema.parse(body);

    // Verify ownership
    const existingPrediction = await prisma.learningOutcomePrediction.findFirst({
      where: {
        id: validatedData.id,
        studentId: session.user.id,
      },
    });

    if (!existingPrediction) {
      return NextResponse.json(
        { error: 'Learning outcome prediction not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (validatedData.actualOutcome !== undefined) {
      updateData.actualOutcome = validatedData.actualOutcome;
      
      // Calculate accuracy if both predicted and actual values are available
      if (validatedData.accuracy === undefined) {
        const predictedValue = existingPrediction.predictedValue;
        const actualValue = validatedData.actualOutcome;
        const accuracy = 1 - Math.abs(predictedValue - actualValue);
        updateData.accuracy = Math.max(0, Math.min(1, accuracy));
      }
    }
    if (validatedData.accuracy !== undefined) updateData.accuracy = validatedData.accuracy;

    const prediction = await prisma.learningOutcomePrediction.update({
      where: { id: validatedData.id },
      data: updateData,
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        subject: {
          select: { id: true, name: true, level: true }
        }
      },
    });

    return NextResponse.json(prediction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating learning outcome prediction:', error);
    return NextResponse.json(
      { error: 'Failed to update learning outcome prediction' },
      { status: 500 }
    );
  }
}
