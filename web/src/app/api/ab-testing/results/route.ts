import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const CalculateResultsSchema = z.object({
  experimentId: z.string(),
  metrics: z.array(z.string()).optional(),
});

// GET /api/ab-testing/results - Get experiment results
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and super_admins can view results
    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const experimentId = searchParams.get('experimentId');
    const variantId = searchParams.get('variantId');
    const metricName = searchParams.get('metricName');

    if (!experimentId) {
      return NextResponse.json({ error: 'experimentId is required' }, { status: 400 });
    }

    const where: any = { experimentId };
    if (variantId) where.variantId = variantId;
    if (metricName) where.metricName = metricName;

    const results = await prisma.aBTestResult.findMany({
      where,
      include: {
        experiment: {
          select: { id: true, name: true, testType: true, status: true }
        },
        variant: {
          select: { id: true, name: true, variantType: true, isControl: true }
        }
      },
      orderBy: { calculatedAt: 'desc' }
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/ab-testing/results/calculate - Calculate experiment results
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and super_admins can calculate results
    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = CalculateResultsSchema.parse(body);

    const experiment = await prisma.aBTestExperiment.findUnique({
      where: { id: validatedData.experimentId },
      include: {
        variants: {
          include: {
            participants: {
              include: {
                interactions: true,
                user: {
                  select: { id: true, role: true }
                }
              }
            }
          }
        }
      }
    });

    if (!experiment) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
    }

    const results = [];

    for (const variant of experiment.variants) {
      const participants = variant.participants;
      const participantCount = participants.length;

      if (participantCount === 0) continue;

      // Calculate basic metrics
      const totalInteractions = participants.reduce((sum, p) => sum + p.interactions.length, 0);
      const avgInteractionsPerParticipant = totalInteractions / participantCount;

      // Calculate completion rates
      const lessonCompletions = participants.reduce((sum, p) => {
        return sum + p.interactions.filter(i => i.interactionType === 'lesson_complete').length;
      }, 0);
      const completionRate = lessonCompletions / participantCount;

      // Calculate engagement metrics
      const totalDuration = participants.reduce((sum, p) => {
        return sum + p.interactions.reduce((s, i) => s + (i.duration || 0), 0);
      }, 0);
      const avgSessionDuration = totalDuration / participantCount;

      // Calculate success metrics
      const successfulInteractions = participants.reduce((sum, p) => {
        return sum + p.interactions.filter(i => i.outcome === 'success').length;
      }, 0);
      const successRate = totalInteractions > 0 ? successfulInteractions / totalInteractions : 0;

      // Store results for each metric
      const metrics = [
        { name: 'participant_count', value: participantCount },
        { name: 'avg_interactions_per_participant', value: avgInteractionsPerParticipant },
        { name: 'completion_rate', value: completionRate },
        { name: 'avg_session_duration', value: avgSessionDuration },
        { name: 'success_rate', value: successRate },
      ];

      for (const metric of metrics) {
        // Check if this metric was requested
        if (validatedData.metrics && !validatedData.metrics.includes(metric.name)) {
          continue;
        }

        // Calculate confidence interval (simplified)
        const standardError = Math.sqrt(metric.value * (1 - metric.value) / participantCount);
        const confidenceInterval = {
          lower: Math.max(0, metric.value - 1.96 * standardError),
          upper: Math.min(1, metric.value + 1.96 * standardError),
          confidence: 0.95
        };

        // Calculate statistical significance (simplified)
        const controlVariant = experiment.variants.find(v => v.isControl);
        let statisticalSignificance = null;
        let pValue = null;
        let effectSize = null;

        if (controlVariant && controlVariant.id !== variant.id) {
          const controlParticipants = controlVariant.participants;
          const controlValue = controlParticipants.length > 0 ? 
            controlParticipants.reduce((sum, p) => sum + p.interactions.length, 0) / controlParticipants.length : 0;
          
          // Simplified t-test calculation
          const pooledStd = Math.sqrt((metric.value * (1 - metric.value) + controlValue * (1 - controlValue)) / 2);
          const tStat = (metric.value - controlValue) / (pooledStd * Math.sqrt(2 / participantCount));
          
          // Simplified p-value (this is a rough approximation)
          pValue = Math.exp(-Math.abs(tStat) * 0.5);
          statisticalSignificance = pValue < 0.05 ? 1 : 0;
          effectSize = Math.abs(metric.value - controlValue) / pooledStd;
        }

        const result = await prisma.aBTestResult.create({
          data: {
            experimentId: validatedData.experimentId,
            variantId: variant.id,
            metricName: metric.name,
            metricValue: metric.value,
            sampleSize: participantCount,
            confidenceInterval: confidenceInterval,
            statisticalSignificance: statisticalSignificance,
            pValue: pValue,
            effectSize: effectSize
          }
        });

        results.push(result);
      }
    }

    return NextResponse.json({
      message: 'Results calculated successfully',
      results: results
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Error calculating results:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
