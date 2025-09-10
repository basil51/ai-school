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
    const timeframe = searchParams.get('timeframe') || '30'; // days

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
        message: 'No student ID provided - showing all accessible engagement data (empty for demo)'
      });
    }

    // Calculate timeframe
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(timeframe));

    // Get engagement optimization data
    const engagementData = await prisma.engagementOptimization.findMany({
      where: {
        studentId,
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: engagementData
    });

  } catch (error) {
    console.error('Error fetching engagement data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch engagement data' },
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
      sessionId, 
      engagementLevel, 
      engagementFactors, 
      optimizationActions,
      contentAdjustments,
      pacingAdjustments,
      interactionChanges,
      beforeEngagement
    } = body;

    if (!studentId || engagementLevel === undefined) {
      return NextResponse.json({ 
        error: 'Student ID and engagement level are required' 
      }, { status: 400 });
    }

    // Check permissions
    if (session.user.role === 'student' && session.user.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create engagement optimization record
    const engagement = await prisma.engagementOptimization.create({
      data: {
        studentId,
        sessionId,
        engagementLevel,
        engagementFactors: engagementFactors || {},
        optimizationActions: optimizationActions || {},
        contentAdjustments: contentAdjustments || {},
        pacingAdjustments: pacingAdjustments || {},
        interactionChanges: interactionChanges || {},
        beforeEngagement: beforeEngagement || engagementLevel,
        timestamp: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: engagement
    });

  } catch (error) {
    console.error('Error creating engagement optimization:', error);
    return NextResponse.json(
      { error: 'Failed to create engagement optimization' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      engagementId, 
      afterEngagement, 
      effectiveness 
    } = body;

    if (!engagementId || afterEngagement === undefined) {
      return NextResponse.json({ 
        error: 'Engagement ID and after engagement level are required' 
      }, { status: 400 });
    }

    // Get the existing engagement record first to access beforeEngagement
    const existingEngagement = await prisma.engagementOptimization.findUnique({
      where: { id: engagementId }
    });

    if (!existingEngagement) {
      return NextResponse.json({ error: 'Engagement record not found' }, { status: 404 });
    }

    // Update engagement optimization record
    const engagement = await prisma.engagementOptimization.update({
      where: { id: engagementId },
      data: {
        afterEngagement,
        effectiveness: effectiveness || calculateEffectiveness(afterEngagement, existingEngagement.beforeEngagement)
      }
    });

    return NextResponse.json({
      success: true,
      data: engagement
    });

  } catch (error) {
    console.error('Error updating engagement optimization:', error);
    return NextResponse.json(
      { error: 'Failed to update engagement optimization' },
      { status: 500 }
    );
  }
}

function calculateEffectiveness(afterEngagement: number, beforeEngagement: number): number {
  // Calculate effectiveness as improvement percentage
  if (beforeEngagement === 0) return afterEngagement;
  return (afterEngagement - beforeEngagement) / beforeEngagement;
}
