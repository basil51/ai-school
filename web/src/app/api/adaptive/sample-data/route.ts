import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Create sample learning data for testing
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session as any).role;
    const userId = (session as any).user?.id;
    const organizationId = (session as any).user?.organizationId;

    const data = await request.json();
    const { studentId } = data;

    const targetStudentId = userRole === 'student' ? userId : studentId;

    if (!targetStudentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Create sample subject and topic
    const subject = await prisma.subject.upsert({
      where: { 
        organizationId_name: { 
          organizationId: organizationId,
          name: 'Mathematics'
        } 
      },
      update: {},
      create: {
        name: 'Mathematics',
        description: 'Sample mathematics subject',
        level: 'high',
        organizationId: organizationId
      }
    });

    const topic = await prisma.topic.upsert({
      where: { 
        subjectId_name: { 
          subjectId: subject.id, 
          name: 'Algebra' 
        } 
      },
      update: {},
      create: {
        subjectId: subject.id,
        name: 'Algebra',
        description: 'Basic algebra concepts',
        order: 1
      }
    });

    // Create sample lesson
    const lesson = await prisma.lesson.upsert({
      where: { 
        topicId_title: { 
          topicId: topic.id, 
          title: 'Linear Equations' 
        } 
      },
      update: {},
      create: {
        topicId: topic.id,
        title: 'Linear Equations',
        content: 'Learn how to solve linear equations with one variable.',
        objectives: ['Understand linear equations', 'Solve basic equations'],
        difficulty: 'beginner',
        estimatedTime: 30,
        order: 1
      }
    });

    // Create sample assessment
    let assessment = await prisma.assessment.findFirst({
      where: { 
        lessonId: lesson.id, 
        title: 'Linear Equations Quiz' 
      }
    });

    if (!assessment) {
      assessment = await prisma.assessment.create({
        data: {
          lessonId: lesson.id,
          type: 'quiz',
          title: 'Linear Equations Quiz',
          instructions: 'Answer the following questions about linear equations.',
          timeLimit: 15,
          passingScore: 0.7,
          maxAttempts: 3
        }
      });
    }

    // Create sample questions
    let question1 = await prisma.question.findFirst({
      where: { 
        assessmentId: assessment.id, 
        content: 'What is the solution to 2x + 3 = 7?' 
      }
    });

    if (!question1) {
      question1 = await prisma.question.create({
        data: {
          assessmentId: assessment.id,
          type: 'multiple_choice',
          content: 'What is the solution to 2x + 3 = 7?',
          points: 1.0,
          correctAnswer: 'x = 2',
          explanation: 'Subtract 3 from both sides, then divide by 2.',
          order: 1
        }
      });
    }

    // Create sample question options
    const option1 = await prisma.questionOption.findFirst({
      where: { 
        questionId: question1.id, 
        content: 'x = 2' 
      }
    });

    if (!option1) {
      await prisma.questionOption.create({
        data: {
          questionId: question1.id,
          content: 'x = 2',
          isCorrect: true,
          order: 1
        }
      });
    }

    const option2 = await prisma.questionOption.findFirst({
      where: { 
        questionId: question1.id, 
        content: 'x = 4' 
      }
    });

    if (!option2) {
      await prisma.questionOption.create({
        data: {
          questionId: question1.id,
          content: 'x = 4',
          isCorrect: false,
          order: 2
        }
      });
    }

    // Create sample student progress
    const progress = await prisma.studentProgress.upsert({
      where: { 
        studentId_lessonId: { 
          studentId: targetStudentId, 
          lessonId: lesson.id 
        } 
      },
      update: {},
      create: {
        studentId: targetStudentId,
        lessonId: lesson.id,
        status: 'completed',
        startedAt: new Date(Date.now() - 3600000), // 1 hour ago
        completedAt: new Date(Date.now() - 1800000), // 30 minutes ago
        timeSpent: 30,
        attempts: 1
      }
    });

    // Create sample assessment attempt
    const attempt = await prisma.assessmentAttempt.create({
      data: {
        studentId: targetStudentId,
        assessmentId: assessment.id,
        startedAt: new Date(Date.now() - 1800000), // 30 minutes ago
        completedAt: new Date(Date.now() - 1200000), // 20 minutes ago
        score: 0.8,
        feedback: 'Good work! You understand the basic concepts.',
        passed: true
      }
    });

    // Create sample student response
    await prisma.studentResponse.create({
      data: {
        attemptId: attempt.id,
        questionId: question1.id,
        answer: 'x = 2',
        isCorrect: true,
        pointsEarned: 1.0,
        feedback: 'Correct!',
        timeSpent: 30
      }
    });

    // Create sample learning analytics
    await prisma.learningAnalytics.create({
      data: {
        studentId: targetStudentId,
        dateRange: new Date(),
        conceptsMastered: 1,
        timeSpent: 30,
        assessmentScores: [0.8],
        strugglingTopics: [],
        improvingTopics: ['Algebra']
      }
    });

    return NextResponse.json({
      message: 'Sample data created successfully',
      data: {
        subject: subject.name,
        topic: topic.name,
        lesson: lesson.title,
        assessment: assessment.title,
        progress: progress.status,
        attempt: attempt.score
      }
    });
  } catch (error) {
    console.error('Error creating sample data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
