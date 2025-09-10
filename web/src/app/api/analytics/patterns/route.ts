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
    const timeframe = searchParams.get('timeframe') || '30'; // days

    // For students, studentId is required and must match their own ID
    if (session.user.role === 'student') {
      if (!studentId || studentId !== session.user.id) {
        return NextResponse.json({ error: 'Student ID is required and must match your own ID' }, { status: 400 });
      }
    }
    // For other roles, studentId is optional - if not provided, get all accessible students
    else if (!studentId) {
      // For teachers, admins, guardians - get all students they have access to
      // For now, return empty array - in a real implementation, you'd query based on role
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No student ID provided - showing all accessible students (empty for demo)'
      });
    }

    // Calculate timeframe
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(timeframe));

    // Get existing learning patterns
    const existingPatterns = await prisma.learningPattern.findMany({
      where: { studentId },
      orderBy: { updatedAt: 'desc' }
    });

    // If no recent patterns or patterns are older than 7 days, generate new ones
    const shouldRegenerate = existingPatterns.length === 0 || 
      (existingPatterns[0] && 
       new Date().getTime() - existingPatterns[0].updatedAt.getTime() > 7 * 24 * 60 * 60 * 1000);

    if (shouldRegenerate) {
      // Generate new learning patterns
      await personalizationEngine.analyzeLearningPattern(studentId, {
        startDate,
        endDate
      });
    }

    // Return the most recent patterns
    const patterns = await prisma.learningPattern.findMany({
      where: { studentId },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: patterns,
      generated: shouldRegenerate
    });

  } catch (error) {
    console.error('Error fetching learning patterns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning patterns' },
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
    const { studentId, timeframe } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Check permissions
    if (session.user.role === 'student' && session.user.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calculate timeframe
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (timeframe || 30));

    // Generate new learning patterns
    const patterns = await personalizationEngine.analyzeLearningPattern(studentId, {
      startDate,
      endDate
    });

    return NextResponse.json({
      success: true,
      data: patterns
    });

  } catch (error) {
    console.error('Error generating learning patterns:', error);
    return NextResponse.json(
      { error: 'Failed to generate learning patterns' },
      { status: 500 }
    );
  }
}
