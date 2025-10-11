import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { smartTeachingContentGenerator } from "@/lib/smart-teaching/ai-content-generator";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { lessonId, clearAll, clearAllCache } = body;

    if (clearAllCache) {
      // Clear all cache (including video and general content)
      smartTeachingContentGenerator.clearAllCache();
      return NextResponse.json({
        success: true,
        message: "All cache cleared successfully"
      });
    } else if (clearAll) {
      // Clear all video cache
      smartTeachingContentGenerator.clearVideoCache();
      return NextResponse.json({
        success: true,
        message: "All video cache cleared successfully"
      });
    } else if (lessonId) {
      // Clear cache for specific lesson
      smartTeachingContentGenerator.clearCacheForLesson(lessonId);
      return NextResponse.json({
        success: true,
        message: `Cache cleared for lesson ${lessonId}`
      });
    } else {
      return NextResponse.json(
        { error: "Either lessonId, clearAll=true, or clearAllCache=true is required" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Error clearing video cache:", error);
    return NextResponse.json(
      { error: "Failed to clear video cache" },
      { status: 500 }
    );
  }
}
