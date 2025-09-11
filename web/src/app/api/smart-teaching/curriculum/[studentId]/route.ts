import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId } = await params;

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
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

    // Check if user has permission to access this student's data
    if (user.role !== 'admin' && user.role !== 'teacher' && user.role !== 'super_admin' && user.id !== studentId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get student's enrolled subjects with full curriculum structure
    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        studentId: studentId,
        isActive: true
      },
      include: {
        subject: {
          include: {
            topics: {
              where: { isActive: true },
              include: {
                lessons: {
                  where: { isActive: true },
                  include: {
                    progress: {
                      where: { studentId: studentId }
                    },
                    assessments: {
                      where: { isActive: true },
                      take: 1
                    }
                  },
                  orderBy: { order: 'asc' }
                }
              },
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    // Get student profile for personalization
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { studentId: studentId }
    });

    // Get student's learning analytics
    const learningAnalytics = await prisma.learningAnalytics.findMany({
      where: { studentId: studentId },
      orderBy: { dateRange: 'desc' },
      take: 5
    });

    // Get recent smart teaching sessions
    const recentSessions = await prisma.smartTeachingSession.findMany({
      where: { studentId: studentId },
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
      },
      orderBy: { startedAt: 'desc' },
      take: 10
    });

    // Transform data for smart teaching interface
    const smartTeachingCurriculum = enrollments.map(enrollment => ({
      subject: {
        id: enrollment.subject.id,
        name: enrollment.subject.name,
        description: enrollment.subject.description,
        level: enrollment.subject.level,
        enrolledAt: enrollment.startedAt
      },
      topics: enrollment.subject.topics.map(topic => ({
        id: topic.id,
        name: topic.name,
        description: topic.description,
        order: topic.order,
        lessons: topic.lessons.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          objectives: lesson.objectives,
          difficulty: lesson.difficulty,
          estimatedTime: lesson.estimatedTime,
          order: lesson.order,
          progress: lesson.progress[0] || {
            status: 'not_started',
            progressPercentage: 0,
            timeSpent: 0
          },
          hasAssessment: lesson.assessments.length > 0,
          assessmentId: lesson.assessments[0]?.id || null
        }))
      })),
      progress: {
        totalLessons: enrollment.subject.topics.reduce((sum, topic) => sum + topic.lessons.length, 0),
        completedLessons: enrollment.subject.topics.reduce((sum, topic) => 
          sum + topic.lessons.filter(lesson => lesson.progress[0]?.status === 'completed').length, 0
        ),
        totalTimeSpent: enrollment.subject.topics.reduce((sum, topic) => 
          sum + topic.lessons.reduce((lessonSum, lesson) => 
            lessonSum + (lesson.progress[0]?.timeSpent || 0), 0
          ), 0
        )
      }
    }));

    // Calculate overall progress
    const overallProgress = {
      totalSubjects: enrollments.length,
      totalLessons: smartTeachingCurriculum.reduce((sum, subject) => sum + subject.progress.totalLessons, 0),
      completedLessons: smartTeachingCurriculum.reduce((sum, subject) => sum + subject.progress.completedLessons, 0),
      totalTimeSpent: smartTeachingCurriculum.reduce((sum, subject) => sum + subject.progress.totalTimeSpent, 0),
      averageProgress: 0
    };

    if (overallProgress.totalLessons > 0) {
      overallProgress.averageProgress = Math.round(
        (overallProgress.completedLessons / overallProgress.totalLessons) * 100
      );
    }

    // Get recommended next lessons
    const recommendedLessons = [];
    for (const subject of smartTeachingCurriculum) {
      for (const topic of subject.topics) {
        for (const lesson of topic.lessons) {
          if (lesson.progress.status === 'not_started' || lesson.progress.status === 'in_progress') {
            recommendedLessons.push({
              lessonId: lesson.id,
              title: lesson.title,
              subject: subject.subject.name,
              topic: topic.name,
              difficulty: lesson.difficulty,
              estimatedTime: lesson.estimatedTime,
              progress: lesson.progress
            });
            break; // Only recommend the next lesson in each topic
          }
        }
      }
    }

    // Sort recommended lessons by priority (incomplete lessons first, then by order)
    recommendedLessons.sort((a, b) => {
      if (a.progress.status !== b.progress.status) {
        if (a.progress.status === 'in_progress') return -1;
        if (b.progress.status === 'in_progress') return 1;
      }
      return 0;
    });

    return NextResponse.json({
      success: true,
      data: {
        curriculum: smartTeachingCurriculum,
        overallProgress: overallProgress,
        recommendedLessons: recommendedLessons.slice(0, 5), // Top 5 recommendations
        studentProfile: studentProfile,
        learningAnalytics: learningAnalytics,
        recentSessions: recentSessions.map(session => ({
          id: session.id,
          lessonTitle: session.lesson.title,
          subject: session.lesson.topic.subject.name,
          topic: session.lesson.topic.name,
          status: session.status,
          startedAt: session.startedAt,
          completedAt: session.completedAt
        }))
      }
    });

  } catch (error) {
    console.error("Error fetching student curriculum for smart teaching:", error);
    return NextResponse.json(
      { error: "Failed to fetch curriculum data" },
      { status: 500 }
    );
  }
}
