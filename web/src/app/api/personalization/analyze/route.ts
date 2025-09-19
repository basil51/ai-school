import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PersonalizationEngine } from '@/lib/personalization/personalization-engine';
import { DemoDataGenerator } from '@/lib/personalization/demo-data';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await request.json();
    
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }
    
    // Check if user has permission to analyze this student
    // Allow demo students for demonstration purposes
    const isDemoStudent = studentId.startsWith('demo-student-');
    if (!isDemoStudent && (session?.user as any)?.role !== 'admin' && (session?.user as any)?.role !== 'teacher' && (session?.user as any)?.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if we're in demo mode
    if (DemoDataGenerator.isDemoMode()) {
      const learningPattern = DemoDataGenerator.generateDemoLearningPattern(studentId);
      return NextResponse.json({
        success: true,
        data: learningPattern,
        demoMode: true,
        message: 'Demo data - Learning pattern analysis is simulated for demonstration purposes'
      });
    }

    const personalizationEngine = new PersonalizationEngine();
    
    const learningPattern = await personalizationEngine.analyzeLearningEffectiveness(studentId);

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
