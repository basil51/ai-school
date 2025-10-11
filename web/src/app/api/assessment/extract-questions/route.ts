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

    const { bookId, unitId, lessonId, content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
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

    // Verify access to the book/unit/lesson
    if (bookId) {
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
    }

    if (unitId) {
      const unit = await prisma.bookUnit.findFirst({
        where: {
          id: unitId,
          book: {
            organizationId: user.organizationId,
            isActive: true
          }
        }
      });

      if (!unit) {
        return NextResponse.json(
          { error: "Unit not found or access denied" },
          { status: 404 }
        );
      }
    }

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
        }
      });

      if (!lesson) {
        return NextResponse.json(
          { error: "Lesson not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Extract questions from content
    const extractor = new BookQuestionExtractor(content, unitId, lessonId);
    const result = extractor.extractQuestions();

    console.log(`✅ [DEBUG] Extracted ${result.totalFound} questions from content`);

    return NextResponse.json({
      success: true,
      extraction: result,
      message: `Found ${result.totalFound} questions in the content`
    });

  } catch (error) {
    console.error("Error extracting questions:", error);
    return NextResponse.json(
      { error: "Failed to extract questions" },
      { status: 500 }
    );
  }
}
