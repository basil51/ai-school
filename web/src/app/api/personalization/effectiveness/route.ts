import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PersonalizationEngine } from '@/lib/personalization/personalization-engine';
import { DemoDataGenerator } from '@/lib/personalization/demo-data';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || (session?.user as any)?.id;
    
    // Check if user has permission to analyze effectiveness for this student
    // Allow demo students for demonstration purposes
    const isDemoStudent = studentId.startsWith('demo-student-');
    if (!isDemoStudent && (session?.user as any)?.role !== 'admin' && (session?.user as any)?.role !== 'teacher' && (session?.user as any)?.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if we're in demo mode
    if (DemoDataGenerator.isDemoMode()) {
      const effectiveness = DemoDataGenerator.generateDemoEffectiveness(studentId);
      return NextResponse.json({
        success: true,
        data: effectiveness,
        demoMode: true,
        message: 'Demo data - Effectiveness analysis is simulated for demonstration purposes'
      });
    }

    const personalizationEngine = new PersonalizationEngine();
    
    const effectiveness = await personalizationEngine.analyzeLearningEffectiveness(studentId);

    return NextResponse.json({
      success: true,
      data: effectiveness,
      demoMode: false
    });

  } catch (error) {
    console.error('Error analyzing learning effectiveness:', error);
    return NextResponse.json(
      { error: 'Failed to analyze learning effectiveness' },
      { status: 500 }
    );
  }
}
