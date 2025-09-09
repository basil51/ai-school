import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MultiMethodTeachingEngine } from '@/lib/teaching/multi-method-engine';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lessonContent, studentId, subject, topic } = await request.json();

    if (!lessonContent || !studentId || !subject || !topic) {
      return NextResponse.json(
        { error: 'Missing required fields: lessonContent, studentId, subject, topic' },
        { status: 400 }
      );
    }

    // Check if user has permission to access this student's data
    if (session.user.role !== 'admin' && session.user.role !== 'teacher' && session.user.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const engine = new MultiMethodTeachingEngine();
    const explanations = await engine.generateMultiMethodExplanations(
      lessonContent,
      studentId,
      subject,
      topic
    );

    return NextResponse.json({
      success: true,
      data: explanations
    });
  } catch (error) {
    console.error('Error in multi-method teaching:', error);
    return NextResponse.json(
      { error: 'Failed to generate multi-method explanations' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const engine = new MultiMethodTeachingEngine();

    if (action === 'methods') {
      // Get available teaching methods
      const methods = engine.getTeachingMethods();
      return NextResponse.json({
        success: true,
        data: methods
      });
    } else if (action === 'stats') {
      // Get method effectiveness statistics
      const stats = await engine.getMethodEffectivenessStats();
      return NextResponse.json({
        success: true,
        data: stats
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "methods" or "stats"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in multi-method teaching GET:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve multi-method data' },
      { status: 500 }
    );
  }
}
