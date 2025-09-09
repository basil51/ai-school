import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: token.sub }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');
    const topicId = searchParams.get('topicId');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Build where clause based on user role and parameters
    let whereClause: any = {};

    if (user.role === 'student') {
      // Students can only see lessons from subjects they're enrolled in
      const enrollments = await prisma.studentEnrollment.findMany({
        where: {
          studentId: user.id,
          isActive: true
        },
        select: { subjectId: true }
      });

      const enrolledSubjectIds = enrollments.map(e => e.subjectId);
      
      if (enrolledSubjectIds.length === 0) {
        return NextResponse.json([]);
      }

      whereClause.topic = {
        subject: {
          id: { in: enrolledSubjectIds },
          isActive: true
        }
      };
    } else if (user.role === 'teacher') {
      // Teachers can see all lessons from their organization
      whereClause.topic = {
        subject: {
          organizationId: user.organizationId,
          isActive: true
        }
      };
    } else if (user.role === 'admin' || user.role === 'super_admin') {
      // Admins can see all lessons
      whereClause.topic = {
        subject: {
          isActive: true
        }
      };
    } else {
      return NextResponse.json({ error: "Invalid user role" }, { status: 403 });
    }

    // Add subject filter if specified
    if (subjectId) {
      whereClause.topic.subject.id = subjectId;
    }

    // Add topic filter if specified
    if (topicId) {
      whereClause.topicId = topicId;
    }

    // Add active filter unless includeInactive is true
    if (!includeInactive) {
      whereClause.isActive = true;
    }

    // Fetch lessons with related data
    const lessons = await prisma.lesson.findMany({
      where: whereClause,
      include: {
        topic: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                description: true
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
      },
      orderBy: [
        { topic: { subject: { name: 'asc' } } },
        { topic: { order: 'asc' } },
        { order: 'asc' }
      ]
    });

    // Format the response
    const formattedLessons = lessons.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      content: lesson.content,
      objectives: lesson.objectives,
      difficulty: lesson.difficulty,
      estimatedTime: lesson.estimatedTime,
      order: lesson.order,
      isActive: lesson.isActive,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      topic: {
        id: lesson.topic.id,
        name: lesson.topic.name,
        description: lesson.topic.description,
        order: lesson.topic.order
      },
      subject: lesson.topic.subject,
      _count: lesson._count
    }));

    return NextResponse.json(formattedLessons);

  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: token.sub }
    });

    if (!user || !['teacher', 'admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: "Only teachers and admins can create lessons" },
        { status: 403 }
      );
    }

    const {
      topicId,
      title,
      content,
      objectives,
      difficulty,
      estimatedTime,
      order
    } = await req.json();

    if (!topicId || !title || !content) {
      return NextResponse.json(
        { error: "Topic ID, title, and content are required" },
        { status: 400 }
      );
    }

    // Verify the topic exists and user has access to it
    const topic = await prisma.topic.findFirst({
      where: {
        id: topicId,
        isActive: true,
        subject: {
          organizationId: user.organizationId,
          isActive: true
        }
      }
    });

    if (!topic) {
      return NextResponse.json(
        { error: "Topic not found or access denied" },
        { status: 404 }
      );
    }

    // Create the lesson
    const lesson = await prisma.lesson.create({
      data: {
        topicId,
        title,
        content,
        objectives: objectives || [],
        difficulty: difficulty || 'intermediate',
        estimatedTime: estimatedTime || 30,
        order: order || 0,
        isActive: true
      },
      include: {
        topic: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(lesson, { status: 201 });

  } catch (error) {
    console.error("Error creating lesson:", error);
    return NextResponse.json(
      { error: "Failed to create lesson" },
      { status: 500 }
    );
  }
}
