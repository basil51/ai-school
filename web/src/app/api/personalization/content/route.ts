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

    const { studentId, lessonId } = await request.json();
    
    // Check if user has permission to generate content for this student
    if ((session?.user as any)?.role !== 'admin' && (session?.user as any)?.role !== 'teacher' && (session?.user as any)?.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const personalizationEngine = new PersonalizationEngine();
    
    const personalizedContent = await personalizationEngine.generatePersonalizedContent(
      studentId,
      lessonId
    );

    return NextResponse.json({
      success: true,
      data: personalizedContent
    });

  } catch (error) {
    console.error('Error generating personalized content:', error);
    return NextResponse.json(
      { error: 'Failed to generate personalized content' },
      { status: 500 }
    );
  }
}
