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

    const { studentId, lessonId, performance } = await request.json();
    
    // Check if user has permission to update memory for this student
    if ((session?.user as any)?.role !== 'admin' && (session?.user as any)?.role !== 'teacher' && (session?.user as any)?.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!performance || typeof performance !== 'object') {
      return NextResponse.json(
        { error: 'Performance data is required' },
        { status: 400 }
      );
    }

    const personalizationEngine = new PersonalizationEngine();
    
    await personalizationEngine.updateLearningMemory(
      studentId,
      lessonId,
      performance
    );

    return NextResponse.json({
      success: true,
      message: 'Learning memory updated successfully'
    });

  } catch (error) {
    console.error('Error updating learning memory:', error);
    return NextResponse.json(
      { error: 'Failed to update learning memory' },
      { status: 500 }
    );
  }
}
