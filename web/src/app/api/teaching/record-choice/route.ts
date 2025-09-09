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

    const { studentId, lessonId, chosenMethod, success, timeSpent } = await request.json();

    if (!studentId || !lessonId || !chosenMethod || success === undefined || !timeSpent) {
      return NextResponse.json(
        { error: 'Missing required fields: studentId, lessonId, chosenMethod, success, timeSpent' },
        { status: 400 }
      );
    }

    // Check if user has permission to record data for this student
    if (session.user.role !== 'admin' && session.user.role !== 'teacher' && session.user.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const engine = new MultiMethodTeachingEngine();
    await engine.recordStudentChoice(studentId, lessonId, chosenMethod, success, timeSpent);

    return NextResponse.json({
      success: true,
      message: 'Student choice recorded successfully'
    });
  } catch (error) {
    console.error('Error recording student choice:', error);
    return NextResponse.json(
      { error: 'Failed to record student choice' },
      { status: 500 }
    );
  }
}
