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
      const recentContent = await prisma.generatedContent.findMany({
        where: {
          lessonId: lessonId,
          contentType: contentType as any,
          createdAt: {
            gte: new Date(Date.now() - 2 * 60 * 60 * 1000) // Only use cache from last 2 hours
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      // Choose an entry that matches learning style and has good quality content
      const suitable = recentContent.find((entry: any) => {
        const metaStyle = (entry.metadata as any)?.learningStyle;
        const contentData: any = entry.content as any;
        const quality = entry.quality || 0;
        
        // Check for topic relevance in the content
        const isTopicRelevant = isContentTopicRelevant(contentData, lesson.topic.name);
        
        return metaStyle === learningStyle && quality > 0.7 && isTopicRelevant;
      });

      if (suitable) {
        console.log(`Using cached content for lesson ${lessonId}, content type ${contentType}`);
        return NextResponse.json({
          success: true,
          data: suitable.content,
          cached: true,
          generatedAt: suitable.createdAt
        });
      }
    }

    // Clear cache for this lesson if force regenerate
    if (forceRegenerate) {
      smartTeachingContentGenerator.clearCacheForLesson(lessonId);
      
      // Also clear database cache for this lesson and content type
      await prisma.generatedContent.deleteMany({
        where: {
          lessonId: lessonId,
          contentType: contentType as any
        }
      });
      console.log(`Cleared database cache for lesson ${lessonId}, content type ${contentType}`);
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
        learningStyle as any,
        lesson.id,
        forceRegenerate
      );
    } else {
      // Generate specific content type
      generatedContent = await smartTeachingContentGenerator.generateSpecificContentType(
        lesson.content,
        contentType as any,
        {
          title: lesson.title,
          subject: lesson.topic.subject.name,
          topic: lesson.topic.name,
          difficulty: lesson.difficulty,
          learningStyle: learningStyle
        },
        //forceRegenerate
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
    
    // Provide more specific error information
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

export async function DELETE(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get('lessonId');

    if (!lessonId) {
      return NextResponse.json(
        { error: "Lesson ID is required" },
        { status: 400 }
      );
    }

    // Clear in-memory cache
    smartTeachingContentGenerator.clearCacheForLesson(lessonId);
    
    // Clear database cache
    const deletedCount = await prisma.generatedContent.deleteMany({
      where: {
        lessonId: lessonId
      }
    });

    return NextResponse.json({
      success: true,
      message: `Cleared cache for lesson ${lessonId}`,
      deletedEntries: deletedCount.count
    });

  } catch (error) {
    console.error("Error clearing cache:", error);
    return NextResponse.json(
      { error: "Failed to clear cache" },
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

function isContentTopicRelevant(contentData: any, topicName: string): boolean {
  if (!contentData || !topicName) return false;
  
  const topicLower = topicName.toLowerCase();
  
  // Check math content for topic relevance
  if (contentData.math) {
    const equation = contentData.math.equation || '';
    const explanation = contentData.math.explanation || '';
    //const graphExpression = contentData.math.graphExpression || '';
    
    // For linear equations, check if content contains linear equation patterns
    if (topicLower.includes('linear')) {
      const hasLinearPattern = /[0-9]+x\s*[+\-]\s*[0-9]+/.test(equation) || 
                              /linear|equation|solve|variable/.test(explanation.toLowerCase());
      return hasLinearPattern;
    }
    
    // For geometry, check for geometric terms
    if (topicLower.includes('geometry') || topicLower.includes('triangle') || topicLower.includes('circle')) {
      const hasGeometricTerms = /triangle|circle|square|rectangle|angle|area|perimeter/.test(explanation.toLowerCase());
      return hasGeometricTerms;
    }
  }
  
  // Check diagram content
  if (contentData.diagram) {
    const chart = contentData.diagram.chart || '';
    const explanation = contentData.diagram.explanation || '';
    return chart.toLowerCase().includes(topicLower) || explanation.toLowerCase().includes(topicLower);
  }
  
  // Default: consider relevant if topic name appears in any text content
  const allText = JSON.stringify(contentData).toLowerCase();
  return allText.includes(topicLower);
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

  // Check for different content types (broader set)
  const contentTypes = ['math', 'diagram', 'simulation', 'video', 'interactive', 'threeD', 'model3D', 'particleEffects', 'assessment'];
  const presentTypes = contentTypes.filter(type => content[type]);
  score += presentTypes.length * 0.07;

  // Check for narration
  if (content.narration || (content.baseContent && (content.baseContent.narration || content.baseContent.summary))) {
    score += 0.1;
  }

  return Math.min(1.0, score);
}
