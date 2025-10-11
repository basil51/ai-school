import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { BookQuestionExtractor } from "@/lib/assessment/book-question-extractor";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      lessonId, 
      unitId, 
      bookId, 
      title, 
      instructions, 
      timeLimit, 
      passingScore,
      maxAttempts,
      questionTypes,
      difficulty,
      questionCount
    } = await request.json();

    if (!lessonId && !unitId && !bookId) {
      return NextResponse.json(
        { error: "At least one of lessonId, unitId, or bookId is required" },
        { status: 400 }
      );
    }

    // Check if user has permission
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      include: { organization: true }
    });

    if (!user || (user.role !== 'teacher' && user.role !== 'admin' && user.role !== 'super_admin')) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get content to extract questions from
    let content = '';
    let sourceTitle = '';

    if (lessonId) {
      const lesson = await prisma.lesson.findFirst({
        where: {
          id: lessonId,
          topic: {
            subject: {
              organizationId: user.organizationId
            }
          },
          isActive: true
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
        return NextResponse.json(
          { error: "Lesson not found or access denied" },
          { status: 404 }
        );
      }

      content = lesson.content;
      sourceTitle = lesson.title;
    } else if (unitId) {
      const unit = await prisma.bookUnit.findFirst({
        where: {
          id: unitId,
          book: {
            organizationId: user.organizationId,
            isActive: true
          }
        },
        include: {
          book: true
        }
      });

      if (!unit) {
        return NextResponse.json(
          { error: "Unit not found or access denied" },
          { status: 404 }
        );
      }

      content = unit.description || '';
      sourceTitle = unit.title;
    } else if (bookId) {
      const book = await prisma.book.findFirst({
        where: {
          id: bookId,
          organizationId: user.organizationId,
          isActive: true
        }
      });

      if (!book) {
        return NextResponse.json(
          { error: "Book not found or access denied" },
          { status: 404 }
        );
      }

      // Get all content from book units
      const units = await prisma.bookUnit.findMany({
        where: {
          bookId: book.id,
          isActive: true
        },
        include: {
          lessons: {
            where: { isActive: true }
          }
        }
      });

      content = units.map(unit => 
        unit.lessons.map(lesson => lesson.content).join('\n\n')
      ).join('\n\n');
      
      sourceTitle = book.title;
    }

    if (!content) {
      return NextResponse.json(
        { error: "No content found to generate questions from" },
        { status: 400 }
      );
    }

    // Extract questions from content
    const extractor = new BookQuestionExtractor(content, unitId, lessonId);
    const extractionResult = extractor.extractQuestions();

    // Filter questions based on criteria
    let filteredQuestions = extractionResult.questions;

    if (questionTypes && questionTypes.length > 0) {
      filteredQuestions = filteredQuestions.filter(q => questionTypes.includes(q.type));
    }

    if (difficulty) {
      filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty);
    }

    // Limit number of questions
    if (questionCount && questionCount > 0) {
      filteredQuestions = filteredQuestions.slice(0, questionCount);
    }

    if (filteredQuestions.length === 0) {
      return NextResponse.json(
        { error: "No questions found matching the specified criteria" },
        { status: 400 }
      );
    }

    // Create assessment
    const assessment = await prisma.assessment.create({
      data: {
        lessonId: lessonId || null,
        type: 'quiz',
        title: title || `Assessment: ${sourceTitle}`,
        instructions: instructions || `Complete the following questions based on ${sourceTitle}`,
        timeLimit: timeLimit || 30,
        passingScore: passingScore || 0.7,
        maxAttempts: maxAttempts || 3,
        isActive: true
      }
    });

    // Create questions
    const createdQuestions = [];
    for (const questionData of filteredQuestions) {
      const question: any = await prisma.question.create({
        data: {
          assessmentId: assessment.id,
          type: questionData.type as any,
          content: questionData.text,
          options: questionData.options && questionData.options.length > 0 ? {
            create: questionData.options.map((opt: string, idx: number) => ({
              content: opt,
              isCorrect: questionData.correctAnswer ? opt === questionData.correctAnswer : idx === 0,
              order: idx + 1
            }))
          } : undefined,
          correctAnswer: questionData.correctAnswer || '',
          explanation: questionData.explanation || '',
          order: createdQuestions.length + 1,
          isActive: true,
          // no metadata/difficulty fields on Question model
        }
      });

      createdQuestions.push(question);
    }

    console.log(`✅ [DEBUG] Created assessment with ${createdQuestions.length} questions`);

    return NextResponse.json({
      success: true,
      assessment: {
        id: assessment.id,
        title: assessment.title,
        instructions: assessment.instructions,
        timeLimit: assessment.timeLimit,
        passingScore: assessment.passingScore,
        maxAttempts: assessment.maxAttempts,
        questionCount: createdQuestions.length
      },
      questions: createdQuestions.map(q => ({
        id: q.id,
        type: q.type,
        content: q.content,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      })),
      extraction: {
        totalFound: extractionResult.totalFound,
        used: createdQuestions.length,
        byType: extractionResult.byType,
        byDifficulty: extractionResult.byDifficulty
      }
    });

  } catch (error) {
    console.error("Error generating assessment:", error);
    return NextResponse.json(
      { error: "Failed to generate assessment" },
      { status: 500 }
    );
  }
}
