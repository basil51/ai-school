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

// POST - AI-powered grading of student responses
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session as any).role;
    
    // Only teachers and admins can use AI grading
    if (!['teacher', 'admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const data = await request.json();
    const {
      attemptId,
      questionId,
      studentResponse,
      gradingCriteria
    } = data;

    if (!attemptId || !questionId || !studentResponse) {
      return NextResponse.json({ 
        error: 'Attempt ID, question ID, and student response are required' 
      }, { status: 400 });
    }

    // Get the question and attempt details
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        assessment: {
          include: {
            lesson: {
              include: {
                topic: {
                  include: {
                    subject: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Assessment attempt not found' }, { status: 404 });
    }


    // Skip AI grading for multiple choice and true/false (already auto-graded)
    if (['multiple_choice', 'true_false'].includes(question.type)) {
      return NextResponse.json({
        isCorrect: false, // Will be determined by existing logic
        pointsEarned: 0,
        feedback: 'Auto-graded question type',
        confidence: 1.0
      });
    }

    // AI grading for short answer and essay questions
    const systemPrompt = `You are an expert educational grader. Grade the student's response to the given question.

Question Type: ${question.type}
Question: ${question.content}
Correct Answer: ${question.correctAnswer || 'Not provided'}
Points Available: ${question.points}
Explanation: ${question.explanation || 'Not provided'}

Grading Criteria:
- Accuracy: How correct is the answer? (0-1)
- Completeness: How complete is the response? (0-1)
- Clarity: How clear and well-expressed is the answer? (0-1)
- Understanding: Does the response show understanding of the concept? (0-1)

Return your response as JSON with this structure:
{
  "isCorrect": boolean,
  "pointsEarned": number (0 to max points),
  "feedback": "Detailed feedback for the student",
  "confidence": number (0-1, how confident you are in this grade),
  "criteria": {
    "accuracy": number (0-1),
    "completeness": number (0-1),
    "clarity": number (0-1),
    "understanding": number (0-1)
  }
}`;

    const userPrompt = `Student Response: "${studentResponse}"

Please grade this response and provide detailed feedback.`;

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    });

    const gradingResult = response.choices[0]?.message?.content ?? "";
    
    try {
      const grade = JSON.parse(gradingResult);
      
      // Validate the grading result
      if (typeof grade.isCorrect !== 'boolean' || 
          typeof grade.pointsEarned !== 'number' || 
          typeof grade.feedback !== 'string') {
        throw new Error('Invalid grading result structure');
      }

      // Ensure points earned doesn't exceed available points
      grade.pointsEarned = Math.min(grade.pointsEarned, question.points);
      grade.pointsEarned = Math.max(grade.pointsEarned, 0);

      return NextResponse.json({
        ...grade,
        questionId,
        attemptId,
        gradedAt: new Date().toISOString()
      });
    } catch (parseError) {
      console.error('Error parsing AI grading result:', parseError);
      return NextResponse.json({ 
        error: 'Failed to parse AI grading result',
        rawResult: gradingResult
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in AI grading:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update student response with AI grading
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session as any).role;
    
    // Only teachers and admins can update grades
    if (!['teacher', 'admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const data = await request.json();
    const {
      responseId,
      isCorrect,
      pointsEarned,
      feedback,
      confidence
    } = data;

    if (!responseId) {
      return NextResponse.json({ error: 'Response ID is required' }, { status: 400 });
    }

    // Update the student response
    const updatedResponse = await prisma.studentResponse.update({
      where: { id: responseId },
      data: {
        isCorrect,
        pointsEarned,
        feedback
      },
      include: {
        question: {
          include: {
            options: true
          }
        },
        attempt: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            assessment: {
              include: {
                lesson: {
                  include: {
                    topic: {
                      include: {
                        subject: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Recalculate total score for the attempt
    const allResponses = await prisma.studentResponse.findMany({
      where: { attemptId: updatedResponse.attemptId },
      include: { question: true }
    });

    const totalScore = allResponses.reduce((sum, response) => sum + (response.pointsEarned || 0), 0);
    const totalPoints = allResponses.reduce((sum, response) => sum + response.question.points, 0);
    const percentage = totalPoints > 0 ? (totalScore / totalPoints) : 0;
    const passed = percentage >= updatedResponse.attempt.assessment.passingScore;

    // Update the attempt score
    await prisma.assessmentAttempt.update({
      where: { id: updatedResponse.attemptId },
      data: {
        score: totalScore,
        passed
      }
    });

    return NextResponse.json({
      response: toSerializable(updatedResponse),
      updatedScore: {
        totalScore,
        totalPoints,
        percentage,
        passed
      }
    });
  } catch (error) {
    console.error('Error updating student response grade:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
