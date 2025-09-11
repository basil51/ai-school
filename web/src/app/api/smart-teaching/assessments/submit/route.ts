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

// POST - Submit smart teaching assessment responses
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { smartTeachingAssessmentId, responses } = body;

    if (!smartTeachingAssessmentId || !responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: "Smart Teaching Assessment ID and responses are required" },
        { status: 400 }
      );
    }

    // Verify the smart teaching assessment exists and belongs to the user
    const smartTeachingAssessment = await prisma.smartTeachingAssessment.findFirst({
      where: {
        id: smartTeachingAssessmentId,
        session: {
          studentId: token.sub
        },
        status: 'in_progress'
      },
      include: {
        assessment: {
          include: {
            questions: {
              include: {
                options: true
              }
            }
          }
        },
        session: {
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

    if (!smartTeachingAssessment) {
      return NextResponse.json(
        { error: "Smart teaching assessment not found or already completed" },
        { status: 404 }
      );
    }

    // Calculate score and process responses
    let totalScore = 0;
    let totalPoints = 0;
    const processedResponses: any[] = [];
    const feedbackItems: any[] = [];

    for (const response of responses) {
      const question = smartTeachingAssessment.assessment.questions.find(q => q.id === response.questionId);
      if (!question) continue;

      totalPoints += question.points;
      
      let isCorrect = false;
      let pointsEarned = 0;

      // Grade based on question type
      switch (question.type) {
        case 'multiple_choice':
          const selectedOption = question.options.find(opt => opt.id === response.answer);
          isCorrect = selectedOption?.isCorrect || false;
          pointsEarned = isCorrect ? question.points : 0;
          break;
        
        case 'true_false':
          isCorrect = response.answer.toLowerCase() === question.correctAnswer?.toLowerCase();
          pointsEarned = isCorrect ? question.points : 0;
          break;
        
        case 'short_answer':
        case 'essay':
          // For now, auto-grade based on exact match or keyword matching
          // In a full implementation, we'd use AI grading
          isCorrect = response.answer.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim();
          pointsEarned = isCorrect ? question.points : 0;
          break;
        
        default:
          pointsEarned = 0;
      }

      totalScore += pointsEarned;

      processedResponses.push({
        questionId: response.questionId,
        answer: response.answer,
        isCorrect,
        pointsEarned,
        timeSpent: response.timeSpent || 0
      });

      // Generate feedback for incorrect answers
      if (!isCorrect && question.explanation) {
        feedbackItems.push({
          questionId: response.questionId,
          feedback: question.explanation,
          type: 'explanation'
        });
      }
    }

    const percentage = totalPoints > 0 ? (totalScore / totalPoints) : 0;
    const passed = percentage >= smartTeachingAssessment.assessment.passingScore;

    // Generate AI feedback for the overall assessment
    let aiFeedback = null;
    try {
      const openai = getOpenAI();
      const feedbackPrompt = `You are an AI teaching assistant. Provide encouraging and constructive feedback for a student's assessment performance.

Assessment Details:
- Subject: ${smartTeachingAssessment.session.lesson.topic.subject.name}
- Topic: ${smartTeachingAssessment.session.lesson.topic.name}
- Lesson: ${smartTeachingAssessment.session.lesson.title}
- Score: ${totalScore}/${totalPoints} (${(percentage * 100).toFixed(1)}%)
- Passed: ${passed ? 'Yes' : 'No'}

Student Responses:
${processedResponses.map((r, i) => 
  `Question ${i + 1}: ${r.isCorrect ? 'Correct' : 'Incorrect'} - ${r.answer}`
).join('\n')}

Provide:
1. Overall performance assessment
2. Specific areas of strength
3. Areas for improvement
4. Encouraging next steps
5. Study recommendations

Keep the tone supportive and educational.`;

      const feedbackResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: "You are a supportive AI teaching assistant providing constructive feedback." },
          { role: "user", content: feedbackPrompt }
        ],
      });

      aiFeedback = feedbackResponse.choices[0]?.message?.content ?? null;
    } catch (aiError) {
      console.error('Error generating AI feedback:', aiError);
      // Continue without AI feedback if it fails
    }

    // Update smart teaching assessment and create regular assessment attempt
    const result = await prisma.$transaction(async (tx) => {
      // Update the smart teaching assessment
      const updatedSmartAssessment = await tx.smartTeachingAssessment.update({
        where: { id: smartTeachingAssessmentId },
        data: {
          completedAt: new Date(),
          score: totalScore,
          status: 'completed',
          responses: processedResponses,
          feedback: {
            aiFeedback,
            feedbackItems,
            percentage,
            passed
          }
        }
      });

      // Create a regular assessment attempt for tracking
      const assessmentAttempt = await tx.assessmentAttempt.create({
        data: {
          studentId: token.sub!,
          assessmentId: smartTeachingAssessment.assessmentId,
          completedAt: new Date(),
          score: totalScore,
          passed
        }
      });

      // Create student responses
      await tx.studentResponse.createMany({
        data: processedResponses.map(response => ({
          attemptId: assessmentAttempt.id,
          questionId: response.questionId,
          answer: response.answer,
          isCorrect: response.isCorrect,
          pointsEarned: response.pointsEarned,
          timeSpent: response.timeSpent
        }))
      });

      // Update student progress if passed
      if (passed) {
        await tx.studentProgress.upsert({
          where: {
            studentId_lessonId: {
              studentId: token.sub!,
              lessonId: smartTeachingAssessment.session.lessonId
            }
          },
          update: {
            status: 'completed',
            completedAt: new Date()
          },
          create: {
            studentId: token.sub!,
            lessonId: smartTeachingAssessment.session.lessonId,
            status: 'completed',
            completedAt: new Date()
          }
        });
      }

      return updatedSmartAssessment;
    });

    // Fetch complete result with all related data
    const completeResult = await prisma.smartTeachingAssessment.findUnique({
      where: { id: smartTeachingAssessmentId },
      include: {
        assessment: {
          include: {
            questions: {
              include: {
                options: true
              }
            }
          }
        },
        session: {
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

    return NextResponse.json(toSerializable(completeResult));
  } catch (error) {
    console.error('Error submitting smart teaching assessment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
