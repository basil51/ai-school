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
    
    // Check if user has permission to get recommendations for this student
    if ((session?.user as any)?.role !== 'admin' && (session?.user as any)?.role !== 'teacher' && (session?.user as any)?.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if we're in demo mode
    if (DemoDataGenerator.isDemoMode()) {
      const recommendations = DemoDataGenerator.generateDemoRecommendations(studentId);
      return NextResponse.json({
        success: true,
        data: recommendations,
        demoMode: true,
        message: 'Demo data - Recommendations are simulated for demonstration purposes'
      });
    }

    const personalizationEngine = new PersonalizationEngine();
    
    const recommendations = await personalizationEngine.getPersonalizedRecommendations(studentId);

    return NextResponse.json({
      success: true,
      data: recommendations,
      demoMode: false
    });

  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get personalized recommendations' },
      { status: 500 }
    );
  }
}
