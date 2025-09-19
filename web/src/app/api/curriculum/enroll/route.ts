import { NextRequest, NextResponse } from "next/server";
//import { getServerSession } from "next-auth";
//import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { ProgressStatus } from "@prisma/client";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subjectId } = await req.json();

    if (!subjectId) {
      return NextResponse.json(
        { error: "Subject ID is required" },
        { status: 400 }
      );
    }

    // Verify user is a student
    const user = await prisma.user.findUnique({
      where: { id: token.sub }
    });

    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { error: "Only students can enroll in subjects" },
        { status: 403 }
      );
    }

    // Check if subject exists and is active
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
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found or inactive" },
        { status: 404 }
      );
    }

    // Check if student is already enrolled
    const existingEnrollment = await prisma.studentEnrollment.findFirst({
      where: {
        studentId: user.id,
        subjectId: subjectId,
        isActive: true
      }
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Student is already enrolled in this subject" },
        { status: 409 }
      );
    }

    // Create enrollment
    const enrollment = await prisma.studentEnrollment.create({
      data: {
        studentId: user.id,
        subjectId: subjectId,
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
                  orderBy: { order: 'asc' }
                }
              },
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    // Create initial progress records for all lessons
    const progressRecords = [];
    for (const topic of subject.topics) {
      for (const lesson of topic.lessons) {
        progressRecords.push({
          studentId: user.id,
          lessonId: lesson.id,
          status: ProgressStatus.not_started
        });
      }
    }

    if (progressRecords.length > 0) {
      await prisma.studentProgress.createMany({
        data: progressRecords
      });
    }

    // Create or update student profile
    await prisma.studentProfile.upsert({
      where: { studentId: user.id },
      update: {},
      create: {
        studentId: user.id,
        learningStyle: {
          visual: 0.5,
          auditory: 0.5,
          kinesthetic: 0.5,
          analytical: 0.5,
          intuitive: 0.5
        },
        preferredPace: 'moderate',
        strengthAreas: [],
        weaknessAreas: [],
        motivationLevel: 0.5
      }
    });

    return NextResponse.json({
      success: true,
      enrollment: {
        id: enrollment.id,
        subject: enrollment.subject,
        startedAt: enrollment.startedAt,
        progressRecords: progressRecords.length
      },
      message: "Successfully enrolled in subject"
    });

  } catch (error) {
    console.error("Enrollment error:", error);
    return NextResponse.json(
      { error: "Failed to enroll in subject" },
      { status: 500 }
    );
  }
}

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

    // Get user's enrollments with progress
    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        studentId: user.id,
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
                      where: { studentId: user.id }
                    }
                  },
                  orderBy: { order: 'asc' }
                }
              },
              orderBy: { order: 'asc' }
            }
          }
        }
      },
      orderBy: { startedAt: 'desc' }
    });

    // Calculate progress for each enrollment
    const enrollmentsWithProgress = enrollments.map(enrollment => {
      const totalLessons = enrollment.subject.topics.reduce(
        (acc, topic) => acc + topic.lessons.length, 0
      );
      
      const completedLessons = enrollment.subject.topics.reduce(
        (acc, topic) => acc + topic.lessons.filter(
          lesson => lesson.progress.some(p => p.status === 'completed')
        ).length, 0
      );

      const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

      return {
        ...enrollment,
        progress: {
          totalLessons,
          completedLessons,
          progressPercentage: Math.round(progressPercentage)
        }
      };
    });

    return NextResponse.json({ enrollments: enrollmentsWithProgress });

  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}
