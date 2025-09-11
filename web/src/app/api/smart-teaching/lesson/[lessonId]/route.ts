import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lessonId } = await params;

    if (!lessonId) {
      return NextResponse.json(
        { error: "Lesson ID is required" },
        { status: 400 }
      );
    }

    // Get user and verify permissions
    const user = await prisma.user.findUnique({
      where: { id: token.sub }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch lesson with full curriculum context
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        topic: {
          include: {
            subject: {
              include: {
                organization: true
              }
            }
          }
        },
        prerequisites: {
          include: {
            prerequisite: true
          }
        },
        assessments: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this lesson
    if (user.role === 'student') {
      // Check if student is enrolled in the subject
      const enrollment = await prisma.studentEnrollment.findFirst({
        where: {
          studentId: user.id,
          subjectId: lesson.topic.subject.id,
          isActive: true
        }
      });

      if (!enrollment) {
        return NextResponse.json(
          { error: "Access denied: Not enrolled in this subject" },
          { status: 403 }
        );
      }
    } else if (user.role === 'teacher') {
      // Check if teacher belongs to the same organization
      if (user.organizationId !== lesson.topic.subject.organizationId) {
        return NextResponse.json(
          { error: "Access denied: Different organization" },
          { status: 403 }
        );
      }
    }

    // Get student progress for this lesson (if student)
    let studentProgress = null;
    if (user.role === 'student') {
      studentProgress = await prisma.studentProgress.findFirst({
        where: {
          studentId: user.id,
          lessonId: lessonId
        }
      });
    }

    // Get student profile for personalization (if student)
    let studentProfile = null;
    if (user.role === 'student') {
      studentProfile = await prisma.studentProfile.findUnique({
        where: { studentId: user.id }
      });
    }

    // Prepare lesson data for smart teaching
    const smartTeachingData = {
      lesson: {
        id: lesson.id,
        title: lesson.title,
        content: lesson.content,
        objectives: lesson.objectives,
        difficulty: lesson.difficulty,
        estimatedTime: lesson.estimatedTime,
        order: lesson.order,
        isActive: lesson.isActive
      },
      topic: {
        id: lesson.topic.id,
        name: lesson.topic.name,
        description: lesson.topic.description,
        order: lesson.topic.order
      },
      subject: {
        id: lesson.topic.subject.id,
        name: lesson.topic.subject.name,
        description: lesson.topic.subject.description,
        level: lesson.topic.subject.level
      },
      prerequisites: lesson.prerequisites.map(prereq => ({
        id: prereq.prerequisite.id,
        title: prereq.prerequisite.title,
        completed: studentProgress ? true : false // TODO: Check actual completion
      })),
      assessment: lesson.assessments[0] || null,
      studentProgress: studentProgress,
      studentProfile: studentProfile,
      metadata: {
        organizationId: lesson.topic.subject.organizationId,
        organizationName: lesson.topic.subject.organization?.name,
        lastUpdated: lesson.updatedAt
      }
    };

    return NextResponse.json({
      success: true,
      data: smartTeachingData
    });

  } catch (error) {
    console.error("Error fetching lesson for smart teaching:", error);
    return NextResponse.json(
      { error: "Failed to fetch lesson data" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lessonId } = await params;
    const body = await req.json();
    const { action, data } = body;

    if (!lessonId) {
      return NextResponse.json(
        { error: "Lesson ID is required" },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: token.sub }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    switch (action) {
      case 'start_session':
        // Create or update smart teaching session
        const session = await prisma.smartTeachingSession.upsert({
          where: {
            studentId_lessonId: {
              studentId: user.id,
              lessonId: lessonId
            }
          },
          update: {
            status: 'active',
            startedAt: new Date()
          },
          create: {
            studentId: user.id,
            lessonId: lessonId,
            status: 'active',
            startedAt: new Date()
          }
        });

        return NextResponse.json({
          success: true,
          session: session
        });

      case 'update_progress':
        // Update lesson progress
        if (user.role === 'student') {
          const progress = await prisma.studentProgress.upsert({
            where: {
              studentId_lessonId: {
                studentId: user.id,
                lessonId: lessonId
              }
            },
            update: {
              status: data.status || 'in_progress',
              timeSpent: data.timeSpent || 0,
              updatedAt: new Date()
            },
            create: {
              studentId: user.id,
              lessonId: lessonId,
              status: data.status || 'in_progress',
              timeSpent: data.timeSpent || 0
            }
          });

          return NextResponse.json({
            success: true,
            progress: progress
          });
        }
        break;

      case 'complete_lesson':
        // Mark lesson as completed
        if (user.role === 'student') {
          const progress = await prisma.studentProgress.upsert({
            where: {
              studentId_lessonId: {
                studentId: user.id,
                lessonId: lessonId
              }
            },
            update: {
              status: 'completed',
              completedAt: new Date(),
              timeSpent: data.timeSpent || 0
            },
            create: {
              studentId: user.id,
              lessonId: lessonId,
              status: 'completed',
              completedAt: new Date(),
              timeSpent: data.timeSpent || 0
            }
          });

          // Update smart teaching session
          await prisma.smartTeachingSession.updateMany({
            where: {
              studentId: user.id,
              lessonId: lessonId,
              status: 'active'
            },
            data: {
              status: 'completed',
              completedAt: new Date()
            }
          });

          return NextResponse.json({
            success: true,
            progress: progress
          });
        }
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json(
      { error: "Action not implemented" },
      { status: 501 }
    );

  } catch (error) {
    console.error("Error in lesson action:", error);
    return NextResponse.json(
      { error: "Failed to process lesson action" },
      { status: 500 }
    );
  }
}
