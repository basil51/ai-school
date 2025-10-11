import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET - Get book details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const book = await prisma.book.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        isActive: true
      },
      include: {
        subject: true,
        units: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              where: { isActive: true },
              orderBy: { order: 'asc' },
              include: {
                assessments: {
                  where: { isActive: true },
                  include: {
                    questions: {
                      where: { isActive: true }
                    },
                    _count: {
                      select: {
                        questions: true,
                        attempts: true
                      }
                    }
                  }
                },
                _count: {
                  select: {
                    assessments: true,
                    progress: true
                  }
                }
              }
            },
            _count: {
              select: {
                lessons: true
              }
            }
          }
        },
        _count: {
          select: {
            units: true,
            ragDocuments: true
          }
        }
      }
    });

    if (!book) {
      return NextResponse.json(
        { error: "Book not found or access denied" },
        { status: 404 }
      );
    }

    // Compute document count from _count to avoid accessing ragDocuments relation in TS types
    const documentCount = (book as any)._count?.ragDocuments ?? 0;

    return NextResponse.json({
      success: true,
      book: {
        id: book.id,
        title: book.title,
        academicYear: book.academicYear,
        semester: book.semester,
        language: book.language,
        pageCount: book.pageCount,
        sourceFileName: book.sourceFileName,
        sourceFileSize: book.sourceFileSize,
        unitCount: (book as any)._count?.units ?? 0,
        documentCount,
        subject: {
          id: (book as any).subject.id,
          name: (book as any).subject.name
        },
        units: (book as any).units.map((unit: any) => ({
          id: unit.id,
          title: unit.title,
          description: unit.description,
          order: unit.order,
          pageRange: unit.pageRange,
          summary: unit.summary,
          lessonCount: unit._count.lessons,
          lessons: unit.lessons.map((lesson: any) => ({
            id: lesson.id,
            title: lesson.title,
            objectives: lesson.objectives,
            difficulty: lesson.difficulty,
            estimatedTime: lesson.estimatedTime,
            order: lesson.order,
            assessmentCount: lesson._count.assessments,
            studentProgressCount: lesson._count.studentProgress,
            assessments: lesson.assessments.map((assessment: any) => ({
              id: assessment.id,
              title: assessment.title,
              type: assessment.type,
              timeLimit: assessment.timeLimit,
              passingScore: assessment.passingScore,
              maxAttempts: assessment.maxAttempts,
              questionCount: assessment._count.questions,
              attemptCount: assessment._count.attempts,
              questions: assessment.questions.map((question: any) => ({
                id: question.id,
                type: question.type,
                text: question.text,
                difficulty: question.difficulty,
                options: question.options,
                metadata: question.metadata
              }))
            }))
          }))
        }))
      }
    });

  } catch (error) {
    console.error("Error fetching book:", error);
    return NextResponse.json(
      { error: "Failed to fetch book" },
      { status: 500 }
    );
  }
}

// PATCH - Update book settings
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const body = await request.json();
    const { title, academicYear, semester, language } = body;

    // Verify book exists and user has access
    const existingBook = await prisma.book.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        isActive: true
      }
    });

    if (!existingBook) {
      return NextResponse.json(
        { error: "Book not found or access denied" },
        { status: 404 }
      );
    }

    // Check for duplicate title if title is being changed
    if (title && title !== existingBook.title) {
      const duplicateBook = await prisma.book.findFirst({
        where: {
          organizationId: user.organizationId,
          title: title,
          academicYear: academicYear || existingBook.academicYear,
          semester: semester || existingBook.semester,
          isActive: true,
          id: { not: id }
        }
      });

      if (duplicateBook) {
        return NextResponse.json(
          { error: `A book with the title "${title}" already exists for ${academicYear || existingBook.academicYear} ${semester || existingBook.semester}` },
          { status: 409 }
        );
      }
    }

    // Update book
    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(academicYear && { academicYear }),
        ...(semester && { semester }),
        ...(language && { language }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      book: {
        id: updatedBook.id,
        title: updatedBook.title,
        academicYear: updatedBook.academicYear,
        semester: updatedBook.semester,
        language: updatedBook.language,
        updatedAt: updatedBook.updatedAt
      }
    });

  } catch (error) {
    console.error("Error updating book:", error);
    return NextResponse.json(
      { error: "Failed to update book" },
      { status: 500 }
    );
  }
}

// DELETE - Delete book
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Verify book exists and user has access
    const existingBook = await prisma.book.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        isActive: true
      },
      include: {
        _count: {
          select: {
            units: true,
            ragDocuments: true
          }
        }
      }
    });

    if (!existingBook) {
      return NextResponse.json(
        { error: "Book not found or access denied" },
        { status: 404 }
      );
    }

    // Check for dependencies
    const hasUnits = existingBook._count.units > 0;
    const hasDocuments = existingBook._count.ragDocuments > 0;

    if (hasUnits || hasDocuments) {
      return NextResponse.json({
        error: "Cannot delete book with existing units or documents",
        details: {
          unitCount: existingBook._count.units,
          documentCount: existingBook._count.ragDocuments
        }
      }, { status: 409 });
    }

    // Soft delete book
    await prisma.book.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: "Book deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting book:", error);
    return NextResponse.json(
      { error: "Failed to delete book" },
      { status: 500 }
    );
  }
}
