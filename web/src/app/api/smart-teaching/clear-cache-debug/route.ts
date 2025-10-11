import { NextRequest, NextResponse } from "next/server";
import { smartTeachingContentGenerator } from "@/lib/smart-teaching/ai-content-generator";

export const runtime = "nodejs";

// This is a debug endpoint that doesn't require authentication
// Only use this for development/testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clearAll, clearAllCache } = body;

    if (clearAllCache) {
      // Clear all cache (including video and general content)
      smartTeachingContentGenerator.clearAllCache();
      return NextResponse.json({
        success: true,
        message: "All cache cleared successfully (debug mode)"
      });
    } else if (clearAll) {
      // Clear all video cache
      smartTeachingContentGenerator.clearVideoCache();
      return NextResponse.json({
        success: true,
        message: "All video cache cleared successfully (debug mode)"
      });
    } else {
      return NextResponse.json(
        { error: "Either clearAll=true or clearAllCache=true is required" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Error clearing cache:", error);
    return NextResponse.json(
      { error: "Failed to clear cache" },
      { status: 500 }
    );
  }
}
