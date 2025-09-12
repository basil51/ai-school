import { NextRequest, NextResponse } from 'next/server';
import { getToken } from "next-auth/jwt";
import { prisma } from '@/lib/prisma';
import { toSerializable } from '@/lib/utils';
import { adaptiveTeachingIntegration } from '@/lib/smart-teaching/adaptive-teaching-integration';

export const runtime = "nodejs";

// POST - Initialize adaptive teaching session
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      lessonId, 
      sessionId,
      action = 'initialize'
    } = body;

    if (!lessonId || !sessionId) {
      return NextResponse.json(
        { error: "Lesson ID and session ID are required" },
        { status: 400 }
      );
    }

    // Verify the lesson exists and user has access
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        topic: {
          subject: {
            organizationId: token.organizationId as string
          }
        }
      },
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

    let result;

    switch (action) {
      case 'initialize':
        result = await adaptiveTeachingIntegration.initializeAdaptiveSession(
          token.sub,
          lessonId,
          sessionId
        );
        break;

      case 'update_metrics':
        const { metrics } = body;
        if (!metrics) {
          return NextResponse.json(
            { error: "Metrics are required for update_metrics action" },
            { status: 400 }
          );
        }
        
        result = await adaptiveTeachingIntegration.updatePerformanceMetrics(
          sessionId,
          metrics
        );
        break;

      case 'generate_content':
        const { originalContent, contentType } = body;
        if (!originalContent || !contentType) {
          return NextResponse.json(
            { error: "Original content and content type are required for generate_content action" },
            { status: 400 }
          );
        }
        
        result = await adaptiveTeachingIntegration.generateAdaptiveContent(
          sessionId,
          originalContent,
          contentType
        );
        break;

      case 'get_recommendations':
        result = await adaptiveTeachingIntegration.getAdaptationRecommendations(sessionId);
        break;

      case 'get_session':
        result = adaptiveTeachingIntegration.getAdaptiveSession(sessionId);
        if (!result) {
          return NextResponse.json(
            { error: "Adaptive session not found" },
            { status: 404 }
          );
        }
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: toSerializable(result),
      action,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in adaptive teaching API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get adaptive session or recommendations
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const action = searchParams.get('action') || 'get_session';

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'get_session':
        result = adaptiveTeachingIntegration.getAdaptiveSession(sessionId);
        if (!result) {
          return NextResponse.json(
            { error: "Adaptive session not found" },
            { status: 404 }
          );
        }
        break;

      case 'get_recommendations':
        result = await adaptiveTeachingIntegration.getAdaptationRecommendations(sessionId);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: toSerializable(result),
      action,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in adaptive teaching GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
