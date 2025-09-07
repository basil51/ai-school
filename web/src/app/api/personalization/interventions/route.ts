import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PersonalizationEngine } from '@/lib/personalization/personalization-engine';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId, strugglingConcepts } = await request.json();
    
    // Check if user has permission to create interventions for this student
    if ((session?.user as any)?.role !== 'admin' && (session?.user as any)?.role !== 'teacher' && (session?.user as any)?.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!strugglingConcepts || !Array.isArray(strugglingConcepts)) {
      return NextResponse.json(
        { error: 'Struggling concepts must be provided as an array' },
        { status: 400 }
      );
    }

    const personalizationEngine = new PersonalizationEngine();
    
    const interventions = await personalizationEngine.createLearningInterventions(
      studentId,
      strugglingConcepts
    );

    return NextResponse.json({
      success: true,
      data: interventions
    });

  } catch (error) {
    console.error('Error creating learning interventions:', error);
    return NextResponse.json(
      { error: 'Failed to create learning interventions' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!(session?.user as any)?.id) {
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

    // Check if user has permission to view interventions for this student
    if ((session?.user as any)?.role !== 'admin' && (session?.user as any)?.role !== 'teacher' && (session?.user as any)?.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { prisma } = await import('@/lib/prisma');
    
    const interventions = await prisma.learningIntervention.findMany({
      where: { 
        studentId,
        isActive: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      success: true,
      data: interventions
    });

  } catch (error) {
    console.error('Error fetching learning interventions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning interventions' },
      { status: 500 }
    );
  }
}
