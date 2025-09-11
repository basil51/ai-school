import { NextRequest, NextResponse } from 'next/server';
import { getToken } from "next-auth/jwt";
import { prisma } from '@/lib/prisma';
import { toSerializable } from '@/lib/utils';
import OpenAI from 'openai';

export const runtime = "nodejs";

// Lazy initialization of OpenAI client
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// POST - Generate adaptive questions based on smart teaching session
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, triggerType, context } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Verify the smart teaching session exists and belongs to the user
    const session = await prisma.smartTeachingSession.findFirst({
      where: {
        id: sessionId,
        studentId: token.sub
      },
      include: {
        lesson: {
          include: {
            topic: {
              include: {
                subject: true
              }
            }
          }
        },
        interactions: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 10 // Get recent interactions for context
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: "Smart teaching session not found" },
        { status: 404 }
      );
    }

    // Get student's performance history for this subject
    const studentHistory = await prisma.assessmentAttempt.findMany({
      where: {
        studentId: token.sub,
        assessment: {
          lesson: {
            topic: {
              subjectId: session.lesson.topic.subjectId
            }
          }
        }
      },
      include: {
        assessment: {
          include: {
            lesson: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: 5 // Get recent performance
    });

    // Analyze student's recent performance
    const recentScores = studentHistory.map(attempt => attempt.score || 0);
    const averageScore = recentScores.length > 0 
      ? recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length 
      : 0.7; // Default to 70% if no history

    // Determine difficulty level based on performance
    let difficultyLevel = 'intermediate';
    if (averageScore < 0.5) {
      difficultyLevel = 'easy';
    } else if (averageScore > 0.8) {
      difficultyLevel = 'hard';
    }

    // Generate adaptive questions using AI
    const systemPrompt = `You are an expert AI teacher creating adaptive assessment questions for a smart teaching session.

Student Context:
- Subject: ${session.lesson.topic.subject.name}
- Topic: ${session.lesson.topic.name}
- Lesson: ${session.lesson.title}
- Recent Performance: ${(averageScore * 100).toFixed(1)}% average
- Difficulty Level: ${difficultyLevel}
- Trigger: ${triggerType || 'periodic_check'}

Recent Session Interactions:
${session.interactions.map(interaction => 
  `- ${interaction.type}: ${interaction.content || 'N/A'}`
).join('\n')}

Context: ${context || 'General knowledge check'}

Generate 3-5 adaptive questions that:
1. Match the student's current performance level
2. Test understanding of the current lesson content
3. Are appropriate for the trigger type (${triggerType})
4. Include a mix of question types (multiple_choice, short_answer, true_false)
5. Progress from easier to harder concepts
6. Provide immediate feedback and explanations

Return your response as a JSON array with this structure:
[
  {
    "type": "multiple_choice",
    "content": "Question text here",
    "points": 1.0,
    "difficulty": "easy|intermediate|hard",
    "correctAnswer": "The correct answer text",
    "explanation": "Detailed explanation of the concept",
    "options": [
      {"content": "Option A", "isCorrect": false},
      {"content": "Option B", "isCorrect": true},
      {"content": "Option C", "isCorrect": false},
      {"content": "Option D", "isCorrect": false}
    ]
  }
]`;

    const userPrompt = `Lesson Content:
${session.lesson.content}

Generate adaptive questions based on the student's current performance level and the lesson content.`;

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

      // Log the adaptive question generation
      await prisma.smartTeachingInteraction.create({
        data: {
          sessionId: sessionId,
          type: 'adaptive_question_generated',
          content: `Generated ${questions.length} adaptive questions (${triggerType})`,
          metadata: {
            triggerType,
            difficultyLevel,
            averageScore,
            questionCount: questions.length
          }
        }
      });

      return NextResponse.json({
        questions: toSerializable(questions),
        session: toSerializable(session),
        adaptiveContext: {
          triggerType,
          difficultyLevel,
          averageScore,
          studentHistory: studentHistory.length
        },
        generatedAt: new Date().toISOString()
      });
    } catch (parseError) {
      console.error('Error parsing generated adaptive questions:', parseError);
      return NextResponse.json({ 
        error: 'Failed to parse generated adaptive questions',
        rawContent: generatedContent
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error generating adaptive questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get adaptive question generation history for a session
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Get adaptive question generation history
    const interactions = await prisma.smartTeachingInteraction.findMany({
      where: {
        sessionId: sessionId,
        type: 'adaptive_question_generated'
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    return NextResponse.json(toSerializable(interactions));
  } catch (error) {
    console.error('Error fetching adaptive question history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
