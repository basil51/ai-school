import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const includeContent = searchParams.get('includeContent') === 'true';

    const userId = token.sub;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== 'teacher' && user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Build where clause for subjects
    const subjectWhere = {
      organizationId: user.organizationId,
      isActive: true,
      ...(subjectId ? { id: subjectId } : {})
    } as const;

    // Get subjects with full curriculum data
    const subjects = await prisma.subject.findMany({
      where: subjectWhere,
      include: {
        topics: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              where: { isActive: true },
              orderBy: { order: 'asc' },
              include: {
                bookUnit: {
                  include: {
                    book: {
                      select: {
                        id: true,
                        title: true,
                        academicYear: true,
                        semester: true,
                        language: true,
                        pageCount: true
                      }
                    }
                  }
                },
                assessments: {
                  where: { isActive: true },
                  include: {
                    questions: {
                      where: { isActive: true },
                      orderBy: { order: 'asc' }
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
        books: {
          where: { isActive: true },
          include: {
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
                          where: { isActive: true },
                          orderBy: { order: 'asc' }
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
        },
        _count: {
          select: {
            topics: true,
            books: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Transform data for response
    const transformedSubjects = subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      description: subject.description,
      level: subject.level,
      topicCount: subject._count.topics,
      bookCount: subject._count.books,
      topics: subject.topics.map(topic => ({
        id: topic.id,
        name: topic.name,
        description: topic.description,
        order: topic.order,
        lessonCount: topic._count.lessons,
        lessons: topic.lessons.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          content: includeContent ? lesson.content : undefined,
          contentPreview: includeContent ? undefined : lesson.content?.substring(0, 200) + '...',
          objectives: lesson.objectives,
          difficulty: lesson.difficulty,
          estimatedTime: lesson.estimatedTime,
          order: lesson.order,
          assessmentCount: lesson._count.assessments,
          studentProgressCount: (lesson as any)._count.progress,
          source: lesson.bookUnit ? {
            type: 'book',
            bookTitle: lesson.bookUnit.book.title,
            bookUnit: lesson.bookUnit.title,
            academicYear: lesson.bookUnit.book.academicYear,
            semester: lesson.bookUnit.book.semester,
            language: lesson.bookUnit.book.language,
            pageRange: lesson.bookUnit.pageRange
          } : {
            type: 'manual'
          },
          assessments: lesson.assessments.map(assessment => ({
            id: assessment.id,
            title: assessment.title,
            type: assessment.type,
            timeLimit: assessment.timeLimit,
            passingScore: assessment.passingScore,
            maxAttempts: assessment.maxAttempts,
            questionCount: assessment._count.questions,
            attemptCount: assessment._count.attempts,
            questions: assessment.questions.map(question => ({
              id: question.id,
              type: question.type,
              content: (question as any).content,
              correctAnswer: question.correctAnswer,
              explanation: question.explanation
            }))
          }))
        }))
      })),
      books: subject.books.map(book => ({
        id: book.id,
        title: book.title,
        academicYear: book.academicYear,
        semester: book.semester,
        language: book.language,
        pageCount: book.pageCount,
        unitCount: book._count.units,
        documentCount: book._count.ragDocuments,
        units: book.units.map(unit => ({
          id: unit.id,
          title: unit.title,
          description: unit.description,
          order: unit.order,
          pageRange: unit.pageRange,
          summary: unit.summary,
          lessonCount: unit._count.lessons,
          lessons: unit.lessons.map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            content: includeContent ? lesson.content : undefined,
            contentPreview: includeContent ? undefined : lesson.content?.substring(0, 200) + '...',
            objectives: lesson.objectives,
            difficulty: lesson.difficulty,
            estimatedTime: lesson.estimatedTime,
            order: lesson.order,
          assessmentCount: lesson._count.assessments,
          studentProgressCount: (lesson as any)._count.progress,
            source: {
              type: 'book',
              bookTitle: book.title,
              bookUnit: unit.title,
              academicYear: book.academicYear,
              semester: book.semester,
              language: book.language,
              pageRange: unit.pageRange
            },
            assessments: lesson.assessments.map(assessment => ({
              id: assessment.id,
              title: assessment.title,
              type: assessment.type,
              timeLimit: assessment.timeLimit,
              passingScore: assessment.passingScore,
              maxAttempts: assessment.maxAttempts,
              questionCount: assessment._count.questions,
              attemptCount: assessment._count.attempts,
              questions: assessment.questions.map(question => ({
                id: question.id,
                type: question.type,
                content: (question as any).content,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation
              }))
            }))
          }))
        }))
      }))
    }));

    return NextResponse.json({
      success: true,
      subjects: transformedSubjects,
      total: transformedSubjects.length,
      includeContent
    });

  } catch (error) {
    console.error("Error fetching curriculum management data:", error);
    return NextResponse.json(
      { error: "Failed to fetch curriculum data" },
      { status: 500 }
    );
  }
}
