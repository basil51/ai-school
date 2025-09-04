import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { toSerializable } from '@/lib/utils';
import { neuralPathwayEngine, NeuralPathway } from '@/lib/adaptive/neural-pathways';
import { predictiveEngine, EarlyWarningSignal, LearningTrajectory } from '@/lib/adaptive/predictive-engine';
import { prisma } from '@/lib/prisma';

// Helper function to check if student has any learning data
async function checkStudentHasData(studentId: string): Promise<boolean> {
  const [progressCount, attemptsCount] = await Promise.all([
    prisma.studentProgress.count({ where: { studentId } }),
    prisma.assessmentAttempt.count({ where: { studentId } })
  ]);
  
  return progressCount > 0 || attemptsCount > 0;
}

// POST - Analyze student's learning patterns and create neural pathways
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session as any).role;
    const userId = (session as any).user?.id;

    const data = await request.json();
    const { studentId } = data;

    // Students can only analyze their own data
    if (userRole === 'student') {
      if (studentId && studentId !== userId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const targetStudentId = userRole === 'student' ? userId : studentId;

    if (!targetStudentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Check if student has any data first
    const hasData = await checkStudentHasData(targetStudentId);
    
    let pathways: NeuralPathway[] = [];
    let predictions: any[] = [];
    let warnings: EarlyWarningSignal[] = [];
    let trajectory: LearningTrajectory | null = null;

    if (hasData) {
      // Analyze learning patterns and create neural pathways
      pathways = await neuralPathwayEngine.analyzeLearningPatterns(targetStudentId);
      
      // Generate predictions
      predictions = await Promise.all([
        predictiveEngine.predictLearningOutcome(targetStudentId, 'success', 'short-term'),
        predictiveEngine.predictLearningOutcome(targetStudentId, 'engagement', 'short-term'),
        predictiveEngine.predictLearningOutcome(targetStudentId, 'retention', 'medium-term')
      ]);

      // Detect early warnings
      warnings = await predictiveEngine.detectEarlyWarnings(targetStudentId);

      // Predict learning trajectory
      trajectory = await predictiveEngine.predictLearningTrajectory(targetStudentId);
    } else {
      // Return empty data with message
      console.log(`No data found for student ${targetStudentId}`);
    }

    return NextResponse.json({
      pathways: toSerializable(pathways),
      predictions: toSerializable(predictions),
      warnings: toSerializable(warnings),
      trajectory: toSerializable(trajectory),
      analyzedAt: new Date().toISOString(),
      hasData,
      message: hasData ? 'Analysis completed' : 'No learning data found for this student'
    });
  } catch (error) {
    console.error('Error analyzing learning patterns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get existing analysis for a student
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session as any).role;
    const userId = (session as any).user?.id;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    //console.log('Adaptive Analyze GET - Session:', { userRole, userId, studentId });

    // Students can only view their own data
    if (userRole === 'student') {
      if (studentId && studentId !== userId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const targetStudentId = userRole === 'student' ? userId : studentId;

    //console.log('Adaptive Analyze GET - Target Student ID:', targetStudentId);

    if (!targetStudentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Check if student has any data first
    const hasData = await checkStudentHasData(targetStudentId);
    
    let pathways: NeuralPathway[] = [];
    let predictions: any[] = [];
    let warnings: EarlyWarningSignal[] = [];
    let trajectory: LearningTrajectory | null = null;

    if (hasData) {
      // Get existing analysis data
      [pathways, predictions, warnings, trajectory] = await Promise.all([
        neuralPathwayEngine.getStudentPathways(targetStudentId),
        predictiveEngine.getRecentPredictions(targetStudentId),
        predictiveEngine.getActiveWarnings(targetStudentId),
        predictiveEngine.predictLearningTrajectory(targetStudentId)
      ]);
    } else {
      console.log(`No data found for student ${targetStudentId}`);
    }

    return NextResponse.json({
      pathways: toSerializable(pathways),
      predictions: toSerializable(predictions),
      warnings: toSerializable(warnings),
      trajectory: toSerializable(trajectory),
      hasData,
      message: hasData ? 'Data retrieved successfully' : 'No learning data found for this student'
    });
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
