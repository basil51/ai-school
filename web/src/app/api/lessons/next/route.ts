import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');

    if (!subjectId) {
      return NextResponse.json(
        { error: "Subject ID is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { error: "Only students can access lessons" },
        { status: 403 }
      );
    }

    // Check if student is enrolled in the subject
    const enrollment = await prisma.studentEnrollment.findFirst({
      where: {
        studentId: user.id,
        subjectId: subjectId,
        isActive: true
      }
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Student is not enrolled in this subject" },
        { status: 404 }
      );
    }

    // Get all lessons in the subject with student's progress
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        isActive: true
      },
      include: {
        topics: {
          where: { isActive: true },
          include: {
            lessons: {
              where: { isActive: true },
              include: {
                progress: {
                  where: { studentId: user.id }
                },
                prerequisites: {
                  include: {
                    prerequisite: {
                      include: {
                        progress: {
                          where: { studentId: user.id }
                        }
                      }
                    }
                  }
                }
              },
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    // Find the next lesson for the student
    let nextLesson = null;
    let currentTopic = null;

    for (const topic of subject.topics) {
      for (const lesson of topic.lessons) {
        const progress = lesson.progress[0];
        
        // If lesson is not started or in progress, check if prerequisites are met
        if (!progress || progress.status === 'not_started' || progress.status === 'in_progress') {
          // Check prerequisites
          const prerequisitesMet = lesson.prerequisites.every(prereq => {
            const prereqProgress = prereq.prerequisite.progress[0];
            return prereqProgress && prereqProgress.status === 'completed';
          });

          if (prerequisitesMet) {
            nextLesson = lesson;
            currentTopic = topic;
            break;
          }
        }
      }
      if (nextLesson) break;
    }

    if (!nextLesson) {
      // All lessons completed or no lessons available
      return NextResponse.json({
        completed: true,
        message: "All lessons in this subject have been completed!",
        subject: {
          id: subject.id,
          name: subject.name
        }
      });
    }

    // Get student profile for personalization
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { studentId: user.id }
    });

    // Check if there's an adaptation for this lesson
    const adaptation = await prisma.lessonAdaptation.findFirst({
      where: {
        studentId: user.id,
        lessonId: nextLesson.id
      },
      orderBy: { createdAt: 'desc' }
    });

    // Prepare lesson content (use adaptation if available)
    const lessonContent = adaptation ? adaptation.adaptedContent : nextLesson.content;

    // Get related lessons for context
    const relatedLessons = await prisma.lesson.findMany({
      where: {
        topicId: currentTopic.id,
        id: { not: nextLesson.id },
        isActive: true
      },
      include: {
        progress: {
          where: { studentId: user.id }
        }
      },
      orderBy: { order: 'asc' },
      take: 3
    });

    return NextResponse.json({
      lesson: {
        id: nextLesson.id,
        title: nextLesson.title,
        content: lessonContent,
        objectives: nextLesson.objectives,
        difficulty: nextLesson.difficulty,
        estimatedTime: nextLesson.estimatedTime,
        order: nextLesson.order,
        topic: {
          id: currentTopic.id,
          name: currentTopic.name,
          description: currentTopic.description
        },
        progress: nextLesson.progress[0] || {
          status: 'not_started',
          timeSpent: 0,
          attempts: 0
        },
        isAdapted: !!adaptation,
        adaptationReason: adaptation?.adaptationReason
      },
      relatedLessons: relatedLessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        status: lesson.progress[0]?.status || 'not_started'
      })),
      studentProfile: studentProfile ? {
        learningStyle: studentProfile.learningStyle,
        preferredPace: studentProfile.preferredPace,
        strengthAreas: studentProfile.strengthAreas,
        weaknessAreas: studentProfile.weaknessAreas
      } : null,
      subject: {
        id: subject.id,
        name: subject.name,
        description: subject.description
      }
    });

  } catch (error) {
    console.error("Error getting next lesson:", error);
    return NextResponse.json(
      { error: "Failed to get next lesson" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lessonId, action, timeSpent, feedback } = await req.json();

    if (!lessonId || !action) {
      return NextResponse.json(
        { error: "Lesson ID and action are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { error: "Only students can update lesson progress" },
        { status: 403 }
      );
    }

    // Get or create progress record
    let progress = await prisma.studentProgress.findFirst({
      where: {
        studentId: user.id,
        lessonId: lessonId
      }
    });

    if (!progress) {
      progress = await prisma.studentProgress.create({
        data: {
          studentId: user.id,
          lessonId: lessonId,
          status: 'not_started'
        }
      });
    }

    // Update progress based on action
    const updateData: any = {
      attempts: progress.attempts + 1
    };

    switch (action) {
      case 'start':
        updateData.status = 'in_progress';
        updateData.startedAt = new Date();
        break;
      
      case 'complete':
        updateData.status = 'completed';
        updateData.completedAt = new Date();
        if (timeSpent) {
          updateData.timeSpent = (progress.timeSpent || 0) + timeSpent;
        }
        break;
      
      case 'fail':
        updateData.status = 'failed';
        if (timeSpent) {
          updateData.timeSpent = (progress.timeSpent || 0) + timeSpent;
        }
        break;
      
      case 'retry':
        updateData.status = 'retry_needed';
        if (timeSpent) {
          updateData.timeSpent = (progress.timeSpent || 0) + timeSpent;
        }
        break;
      
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    const updatedProgress = await prisma.studentProgress.update({
      where: { id: progress.id },
      data: updateData,
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
    });

    // If lesson was completed, check if we need to create an adaptation for future students
    if (action === 'complete' && feedback) {
      // Store feedback for potential adaptation
      await prisma.lessonAdaptation.create({
        data: {
          studentId: user.id,
          lessonId: lessonId,
          originalContent: updatedProgress.lesson.content,
          adaptedContent: updatedProgress.lesson.content, // For now, same content
          adaptationReason: `Student feedback: ${feedback}`,
          effectiveness: 1.0 // Assuming completion means it was effective
        }
      });
    }

    return NextResponse.json({
      success: true,
      progress: updatedProgress,
      message: `Lesson ${action}ed successfully`
    });

  } catch (error) {
    console.error("Error updating lesson progress:", error);
    return NextResponse.json(
      { error: "Failed to update lesson progress" },
      { status: 500 }
    );
  }
}
