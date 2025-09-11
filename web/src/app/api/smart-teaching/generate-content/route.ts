import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { smartTeachingContentGenerator } from "@/lib/smart-teaching/ai-content-generator";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      lessonId, 
      contentType, 
      learningStyle = 'visual',
      forceRegenerate = false 
    } = body;

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

    // Get lesson with full context
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
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
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this lesson
    if (user.role === 'student') {
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
    }

    // Check if content already exists and is recent (unless force regenerate)
    if (!forceRegenerate) {
      const existingContent = await prisma.generatedContent.findFirst({
        where: {
          lessonId: lessonId,
          contentType: contentType as any,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
          }
        }
      });

      if (existingContent) {
        return NextResponse.json({
          success: true,
          data: existingContent.content,
          cached: true,
          generatedAt: existingContent.createdAt
        });
      }
    }

    // Generate new content
    let generatedContent;
    
    if (contentType === 'full') {
      // Generate comprehensive content for all modalities
      generatedContent = await smartTeachingContentGenerator.generateContent(
        lesson.content,
        lesson.title,
        lesson.objectives,
        lesson.topic.subject.name,
        lesson.topic.name,
        lesson.difficulty,
        learningStyle as any
      );
    } else {
      // Generate specific content type
      generatedContent = await smartTeachingContentGenerator.generateSpecificContentType(
        lesson.content,
        contentType as any,
        {
          subject: lesson.topic.subject.name,
          topic: lesson.topic.name,
          difficulty: lesson.difficulty,
          learningStyle: learningStyle
        }
      );
    }

    // Save generated content to database
    const savedContent = await prisma.generatedContent.create({
      data: {
        lessonId: lessonId,
        contentType: contentType as any,
        content: generatedContent,
        metadata: {
          learningStyle: learningStyle,
          generatedBy: user.id,
          subject: lesson.topic.subject.name,
          topic: lesson.topic.name,
          difficulty: lesson.difficulty
        },
        quality: calculateContentQuality(generatedContent)
      }
    });

    return NextResponse.json({
      success: true,
      data: generatedContent,
      cached: false,
      generatedAt: savedContent.createdAt,
      contentId: savedContent.id
    });

  } catch (error) {
    console.error("Error generating smart teaching content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
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

    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get('lessonId');
    const contentType = searchParams.get('contentType');

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

    // Get existing generated content
    const whereClause: any = { lessonId };
    if (contentType) {
      whereClause.contentType = contentType;
    }

    const existingContent = await prisma.generatedContent.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: existingContent.map(content => ({
        id: content.id,
        contentType: content.contentType,
        content: content.content,
        quality: content.quality,
        createdAt: content.createdAt,
        metadata: content.metadata
      }))
    });

  } catch (error) {
    console.error("Error fetching generated content:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

function calculateContentQuality(content: any): number {
  // Simple quality scoring based on content richness
  let score = 0.5; // Base score

  if (content.baseContent) {
    score += 0.1;
    if (content.baseContent.objectives && content.baseContent.objectives.length > 0) {
      score += 0.1;
    }
    if (content.baseContent.keyConcepts && content.baseContent.keyConcepts.length > 0) {
      score += 0.1;
    }
  }

  // Check for different content types
  const contentTypes = ['math', 'diagram', 'simulation', 'video', 'interactive', 'threeD', 'assessment'];
  const presentTypes = contentTypes.filter(type => content[type]);
  score += presentTypes.length * 0.05;

  // Check for narration
  if (content.narration || (content.baseContent && content.baseContent.narration)) {
    score += 0.1;
  }

  return Math.min(1.0, score);
}
