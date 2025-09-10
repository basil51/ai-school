import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { personalizationEngine } from '@/lib/analytics/personalization-engine';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const isActive = searchParams.get('isActive') === 'true';

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Check permissions
    if (session.user.role === 'student' && session.user.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get learning interventions
    const interventions = await prisma.learningIntervention.findMany({
      where: {
        studentId,
        ...(isActive !== null && { isActive })
      },
      include: {
        pathway: true,
        feedback: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: interventions
    });

  } catch (error) {
    console.error('Error fetching interventions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interventions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, strugglingConcepts } = body;

    if (!studentId || !strugglingConcepts || !Array.isArray(strugglingConcepts)) {
      return NextResponse.json({ 
        error: 'Student ID and struggling concepts array are required' 
      }, { status: 400 });
    }

    // Check permissions
    if (session.user.role === 'student' && session.user.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate intervention recommendations
    const interventions = await personalizationEngine.recommendInterventions(
      studentId, 
      strugglingConcepts
    );

    // Store interventions in database
    const storedInterventions = [];
    for (const intervention of interventions) {
      const stored = await prisma.learningIntervention.create({
        data: {
          studentId,
          interventionType: intervention.type.toUpperCase() as any,
          trigger: `Struggling with: ${strugglingConcepts.join(', ')}`,
          approach: intervention.strategy,
          expectedOutcome: intervention.expectedOutcome,
          confidence: intervention.confidence,
          personalizedContent: JSON.stringify(intervention),
          emotionalSupport: 'Encourage the student and provide positive reinforcement during learning sessions.',
          successMetrics: ['completion_rate', 'mastery_level', 'engagement_score']
        }
      });
      storedInterventions.push(stored);
    }

    return NextResponse.json({
      success: true,
      data: storedInterventions
    });

  } catch (error) {
    console.error('Error generating interventions:', error);
    return NextResponse.json(
      { error: 'Failed to generate interventions' },
      { status: 500 }
    );
  }
}
