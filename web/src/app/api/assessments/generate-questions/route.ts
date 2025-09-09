import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toSerializable } from '@/lib/utils';
import OpenAI from 'openai';

// Lazy initialization of OpenAI client to prevent build-time errors
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// POST - Generate questions from lesson content using AI
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session as any).role;
    
    // Only teachers and admins can generate questions
    if (!['teacher', 'admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const data = await request.json();
    const {
      lessonId,
      questionTypes = ['multiple_choice', 'short_answer'],
      numQuestions = 5,
      difficulty = 'intermediate'
    } = data;

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 });
    }

    // Verify the lesson exists and user has access
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        topic: {
          subject: {
            organizationId: (session as any).organizationId
          }
        }
      },
      include: {
        topic: {
          include: {
            subject: true
          }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }


    // Generate questions using AI
    const systemPrompt = `You are an expert educational content creator. Generate ${numQuestions} assessment questions based on the provided lesson content.

Lesson Title: ${lesson.title}
Subject: ${lesson.topic.subject.name}
Topic: ${lesson.topic.name}
Difficulty Level: ${lesson.difficulty}
Learning Objectives: ${lesson.objectives.join(', ')}

Requirements:
- Generate questions of types: ${questionTypes.join(', ')}
- Match the difficulty level: ${difficulty}
- Ensure questions test understanding of key concepts
- For multiple choice questions, provide 4 options with only one correct answer
- For short answer questions, provide a clear correct answer
- Make questions specific to the lesson content

Return your response as a JSON array with this structure:
[
  {
    "type": "multiple_choice",
    "content": "What is the main concept discussed in this lesson?",
    "points": 1.0,
    "correctAnswer": "The correct answer text",
    "explanation": "Explanation of why this is correct",
    "options": [
      {"content": "Option A", "isCorrect": false},
      {"content": "Option B", "isCorrect": true},
      {"content": "Option C", "isCorrect": false},
      {"content": "Option D", "isCorrect": false}
    ]
  },
  {
    "type": "short_answer",
    "content": "Explain the key concept in your own words.",
    "points": 2.0,
    "correctAnswer": "Expected answer or key points",
    "explanation": "Explanation of the concept"
  }
]`;

    const userPrompt = `Lesson Content:
${lesson.content}

Generate ${numQuestions} questions that test understanding of this content.`;

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    });

    const generatedContent = response.choices[0]?.message?.content ?? "";
    
    try {
      const questions = JSON.parse(generatedContent);
      
      // Validate the generated questions
      if (!Array.isArray(questions)) {
        throw new Error('Generated content is not an array');
      }

      // Validate each question structure
      for (const question of questions) {
        if (!question.type || !question.content) {
          throw new Error('Invalid question structure');
        }
        
        if (question.type === 'multiple_choice' && (!question.options || !Array.isArray(question.options))) {
          throw new Error('Multiple choice questions must have options array');
        }
      }

      return NextResponse.json({
        questions: toSerializable(questions),
        lesson: toSerializable(lesson),
        generatedAt: new Date().toISOString()
      });
    } catch (parseError) {
      console.error('Error parsing generated questions:', parseError);
      return NextResponse.json({ 
        error: 'Failed to parse generated questions',
        rawContent: generatedContent
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get question generation history for a lesson
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session as any).role;
    
    // Only teachers and admins can view generation history
    if (!['teacher', 'admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 });
    }

    // Get existing assessments for this lesson
    const assessments = await prisma.assessment.findMany({
      where: {
        lessonId,
        isActive: true
      },
      include: {
        questions: {
          include: {
            options: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        _count: {
          select: {
            attempts: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(toSerializable(assessments));
  } catch (error) {
    console.error('Error fetching question generation history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
