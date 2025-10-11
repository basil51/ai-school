import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { AIHintsGenerator } from "@/lib/assessment/ai-hints-generator";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      questionId, 
      questionText, 
      questionType, 
      difficulty, 
      context, 
      correctAnswer,
      studentAttempts = 0,
      previousHints = [],
      studentLevel = 'intermediate'
    } = await request.json();

    if (!questionText) {
      return NextResponse.json(
        { error: "questionText is required" },
        { status: 400 }
      );
    }

    // Check if user has permission (students can get hints)
    const user = await prisma.user.findUnique({
      where: { id: token.sub }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get question details if questionId is provided
    let questionDetails = null;
    if (questionId) {
      questionDetails = await prisma.question.findFirst({
        where: {
          id: questionId,
          isActive: true
        },
        select: {
          id: true,
          type: true,
          correctAnswer: true,
          assessment: {
            include: {
              lesson: {
                include: {
                  topic: {
                    include: { subject: true }
                  },
                  bookUnit: { include: { book: true } }
                }
              }
            }
          }
        }
      });

      if (!questionDetails) {
        return NextResponse.json(
          { error: "Question not found" },
          { status: 404 }
        );
      }
    }

    // Generate AI hints and solution
    const hintsGenerator = new AIHintsGenerator();
    
    const result = await hintsGenerator.generateHintsAndSolution(
      questionText,
      questionType || questionDetails?.type || 'short_answer',
      difficulty || 'intermediate',
      context || questionDetails?.assessment?.lesson?.content,
      correctAnswer || questionDetails?.correctAnswer
    );

    // Generate adaptive hint if requested
    let adaptiveHint = null;
    if (studentAttempts > 0) {
      adaptiveHint = await hintsGenerator.generateAdaptiveHint(
        questionText,
        studentAttempts,
        previousHints,
        studentLevel as any
      );
    }

    // Store hint usage for analytics (optional)
    if (questionId && questionDetails) {
      try {
        await prisma.assessmentAttempt.create({
          data: {
            assessmentId: questionDetails.assessment.id,
            studentId: token.sub,
            score: 0
          }
        });
      } catch (error) {
        console.warn('Failed to log hint usage:', error);
      }
    }

    return NextResponse.json({
      success: true,
      hints: result.hints,
      solution: result.solution,
      adaptiveHint: adaptiveHint,
      difficulty: result.difficulty,
      estimatedTime: result.estimatedTime,
      questionContext: questionDetails ? {
        subject: questionDetails.assessment.lesson.topic.subject.name,
        topic: questionDetails.assessment.lesson.topic.name,
        lesson: questionDetails.assessment.lesson.title,
        bookTitle: questionDetails.assessment.lesson.bookUnit?.book?.title,
        bookUnit: questionDetails.assessment.lesson.bookUnit?.title,
        academicYear: questionDetails.assessment.lesson.bookUnit?.book?.academicYear,
        semester: questionDetails.assessment.lesson.bookUnit?.book?.semester
      } : null
    });

  } catch (error) {
    console.error("Error generating AI hints:", error);
    return NextResponse.json(
      { error: "Failed to generate hints" },
      { status: 500 }
    );
  }
}
