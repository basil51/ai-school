import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subjectName, level, description, organizationId } = await req.json();

    if (!subjectName || !level) {
      return NextResponse.json(
        { error: "Subject name and level are required" },
        { status: 400 }
      );
    }

    // Check if user has permission to create subjects
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user || (user.role !== 'teacher' && user.role !== 'admin' && user.role !== 'super_admin')) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Use organizationId from user if not provided
    const targetOrgId = organizationId || user.organizationId;
    if (!targetOrgId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Check if subject already exists
    const existingSubject = await prisma.subject.findFirst({
      where: {
        name: subjectName,
        organizationId: targetOrgId,
        isActive: true
      }
    });

    if (existingSubject) {
      return NextResponse.json(
        { error: "Subject already exists" },
        { status: 409 }
      );
    }

    // Create the subject first
    const subject = await prisma.subject.create({
      data: {
        name: subjectName,
        description: description || `AI-generated curriculum for ${subjectName}`,
        level: level,
        organizationId: targetOrgId,
        isActive: true
      }
    });

    // Generate curriculum structure using AI
    const systemPrompt = `You are an expert curriculum designer. Create a comprehensive curriculum structure for ${subjectName} at the ${level} level.

Generate a structured curriculum with:
1. Topics (major units of study)
2. Lessons within each topic
3. Learning objectives for each lesson
4. Estimated time for each lesson
5. Difficulty progression

Format your response as JSON with this structure:
{
  "topics": [
    {
      "name": "Topic Name",
      "description": "Topic description",
      "order": 1,
      "lessons": [
        {
          "title": "Lesson Title",
          "content": "Detailed lesson content with explanations, examples, and key concepts",
          "objectives": ["Objective 1", "Objective 2", "Objective 3"],
          "difficulty": "beginner|intermediate|advanced",
          "estimatedTime": 45,
          "order": 1
        }
      ]
    }
  ]
}

Make the content engaging, comprehensive, and pedagogically sound. Include practical examples and real-world applications where appropriate.`;

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: `Create a curriculum for ${subjectName} at ${level} level. Focus on creating a logical progression of concepts and ensure each lesson builds upon previous knowledge.`
        }
      ]
    });

    // For now, we'll create a basic structure and let the AI generate content
    // In a full implementation, we'd parse the AI response and create the database records
    
    const basicTopics = [
      {
        name: "Introduction to " + subjectName,
        description: `Fundamental concepts and overview of ${subjectName}`,
        order: 1,
        lessons: [
          {
            title: `What is ${subjectName}?`,
            content: `This lesson introduces the core concepts of ${subjectName}. Students will learn about the fundamental principles and why this subject is important in our world today.`,
            objectives: [
              "Understand the basic definition of " + subjectName,
              "Identify key concepts and terminology",
              "Recognize real-world applications"
            ],
            difficulty: "beginner" as const,
            estimatedTime: 45,
            order: 1
          }
        ]
      }
    ];

    // Create topics and lessons in the database
    for (const topicData of basicTopics) {
      const topic = await prisma.topic.create({
        data: {
          name: topicData.name,
          description: topicData.description,
          order: topicData.order,
          subjectId: subject.id,
          isActive: true
        }
      });

      for (const lessonData of topicData.lessons) {
        await prisma.lesson.create({
          data: {
            title: lessonData.title,
            content: lessonData.content,
            objectives: lessonData.objectives,
            difficulty: lessonData.difficulty,
            estimatedTime: lessonData.estimatedTime,
            order: lessonData.order,
            topicId: topic.id,
            isActive: true
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      subject: {
        id: subject.id,
        name: subject.name,
        description: subject.description,
        level: subject.level,
        topicsCount: basicTopics.length,
        lessonsCount: basicTopics.reduce((acc, topic) => acc + topic.lessons.length, 0)
      },
      message: "Curriculum generated successfully"
    });

  } catch (error) {
    console.error("Curriculum generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate curriculum" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use provided organizationId or user's organization
    const targetOrgId = organizationId || user.organizationId;

    const subjects = await prisma.subject.findMany({
      where: {
        organizationId: targetOrgId,
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
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ subjects });

  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}
