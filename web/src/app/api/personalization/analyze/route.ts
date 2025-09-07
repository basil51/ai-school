import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LearningAnalyticsEngine } from '@/lib/personalization/learning-analytics';
import { DemoDataGenerator } from '@/lib/personalization/demo-data';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId, timeframe } = await request.json();
    
    // Check if user has permission to analyze this student
    if ((session?.user as any)?.role !== 'admin' && (session?.user as any)?.role !== 'teacher' && (session?.user as any)?.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if we're in demo mode
    if (DemoDataGenerator.isDemoMode()) {
      const learningPattern = DemoDataGenerator.generateDemoLearningPattern(studentId);
      return NextResponse.json({
        success: true,
        data: learningPattern,
        demoMode: true,
        message: 'Demo data - Learning patterns are simulated for demonstration purposes'
      });
    }

    const analyticsEngine = new LearningAnalyticsEngine();
    
    const learningPattern = await analyticsEngine.analyzeLearningPattern(
      studentId,
      timeframe || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        end: new Date()
      }
    );

    return NextResponse.json({
      success: true,
      data: learningPattern,
      demoMode: false
    });

  } catch (error) {
    console.error('Error analyzing learning pattern:', error);
    return NextResponse.json(
      { error: 'Failed to analyze learning pattern' },
      { status: 500 }
    );
  }
}
