import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const subjectId = searchParams.get('subjectId');
    const reinforcementNeeded = searchParams.get('reinforcementNeeded') === 'true';

    // For students, studentId is required and must match their own ID
    if (session.user.role === 'student') {
      if (!studentId || studentId !== session.user.id) {
        return NextResponse.json({ error: 'Student ID is required and must match your own ID' }, { status: 400 });
      }
    }
    // For other roles, studentId is optional
    else if (!studentId) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No student ID provided - showing all accessible retention data (empty for demo)'
      });
    }

    // Get knowledge retention data
    const retentionData = await prisma.knowledgeRetention.findMany({
      where: {
        studentId,
        ...(subjectId && { subjectId }),
        ...(reinforcementNeeded !== null && { reinforcementNeeded })
      },
      include: {
        subject: true
      },
      orderBy: { nextReview: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: retentionData
    });

  } catch (error) {
    console.error('Error fetching knowledge retention:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge retention data' },
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
    const { 
      studentId, 
      conceptId, 
      conceptName, 
      subjectId, 
      initialMastery, 
      retentionLevel,
      masteryThreshold = 0.8
    } = body;

    if (!studentId || !conceptId || !conceptName || !subjectId) {
      return NextResponse.json({ 
        error: 'Student ID, concept ID, concept name, and subject ID are required' 
      }, { status: 400 });
    }

    // Check permissions
    if (session.user.role === 'student' && session.user.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calculate next review date based on spaced repetition algorithm
    const nextReview = calculateNextReviewDate(retentionLevel || initialMastery);

    // Create or update knowledge retention record
    const retention = await prisma.knowledgeRetention.upsert({
      where: {
        studentId_conceptId: {
          studentId,
          conceptId
        }
      },
      update: {
        retentionLevel: retentionLevel || initialMastery,
        lastReviewed: new Date(),
        nextReview,
        reviewCount: {
          increment: 1
        },
        reinforcementNeeded: (retentionLevel || initialMastery) < masteryThreshold,
        masteryThreshold
      },
      create: {
        studentId,
        conceptId,
        conceptName,
        subjectId,
        initialMastery: initialMastery || 0.5,
        retentionLevel: retentionLevel || initialMastery || 0.5,
        lastReviewed: new Date(),
        nextReview,
        reviewCount: 1,
        reinforcementNeeded: (retentionLevel || initialMastery || 0.5) < masteryThreshold,
        masteryThreshold,
        forgettingCurve: generateForgettingCurve(initialMastery || 0.5)
      }
    });

    return NextResponse.json({
      success: true,
      data: retention
    });

  } catch (error) {
    console.error('Error updating knowledge retention:', error);
    return NextResponse.json(
      { error: 'Failed to update knowledge retention' },
      { status: 500 }
    );
  }
}

function calculateNextReviewDate(retentionLevel: number): Date {
  // Spaced repetition algorithm based on retention level
  const now = new Date();
  
  if (retentionLevel >= 0.9) {
    // Excellent retention - review in 7 days
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else if (retentionLevel >= 0.8) {
    // Good retention - review in 3 days
    return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  } else if (retentionLevel >= 0.6) {
    // Fair retention - review in 1 day
    return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  } else {
    // Poor retention - review in 4 hours
    return new Date(now.getTime() + 4 * 60 * 60 * 1000);
  }
}

function generateForgettingCurve(initialMastery: number): any {
  // Generate forgetting curve data points
  const curve = [];
  const days = [1, 2, 3, 7, 14, 30, 60, 90];
  
  for (const day of days) {
    // Simplified forgetting curve formula
    const retention = initialMastery * Math.exp(-day / 7);
    curve.push({
      day,
      retention: Math.max(0, retention)
    });
  }
  
  return curve;
}
