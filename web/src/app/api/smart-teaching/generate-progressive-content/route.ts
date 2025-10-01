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
      contentType = 'text', // Start with text content only
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
      where: { id: token.sub },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get lesson with related data
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

    let generatedContent;

    if (contentType === 'text') {
      // Generate only text content first (fast, no expensive API calls)
      console.log('🎯 Generating text content only for progressive loading...');
      
      // Generate base content with text only
      generatedContent = await smartTeachingContentGenerator.generateContent(
        lesson.content,
        lesson.title,
        lesson.objectives,
        lesson.topic.subject.name,
        lesson.topic.name,
        lesson.difficulty,
        learningStyle as any,
        lesson.id,
        forceRegenerate
      );

      // Return only the base content for immediate display
      const textOnlyContent = {
        baseContent: generatedContent.baseContent,
        metadata: generatedContent.metadata,
        constraints: generatedContent.constraints
      };

      return NextResponse.json({
        success: true,
        data: textOnlyContent,
        contentType: 'text',
        progressive: true,
        nextContentTypes: ['video', 'math', 'diagram', 'interactive'], // Available next
        generatedAt: new Date().toISOString()
      });

    } else {
      // Generate specific content type with caching
      console.log(`🎯 Generating ${contentType} content for progressive loading...`);
      
      generatedContent = await smartTeachingContentGenerator.generateAdditionalContentType(
        lesson.content,
        lesson.topic.subject.name,
        lesson.topic.name,
        lesson.title,
        lesson.objectives,
        lesson.difficulty,
        learningStyle,
        contentType,
        lesson.id
      );

      return NextResponse.json({
        success: true,
        data: generatedContent,
        contentType: contentType,
        progressive: true,
        generatedAt: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error("Error generating progressive content:", error);
    
    let errorMessage = "Failed to generate content";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
