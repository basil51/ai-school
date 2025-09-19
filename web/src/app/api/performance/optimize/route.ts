import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PerformanceOptimizationEngine } from "@/lib/performance/optimization-engine";

export async function GET(request: NextRequest) {
  try {
    console.log("GET request received", request);
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const engine = new PerformanceOptimizationEngine();
    
    // Get performance metrics
    const metrics = await engine.getPerformanceMetrics();

    return NextResponse.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error("Error fetching performance metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance metrics" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const engine = new PerformanceOptimizationEngine();
    let result;

    switch (action) {
      case 'optimize_memory':
        await engine.optimizeMemory();
        result = { message: "Memory optimization completed" };
        break;
      case 'invalidate_cache':
        const { tags } = body;
        await engine.invalidateCache(tags || []);
        result = { message: "Cache invalidation completed" };
        break;
      case 'pre_generate_content':
        const { subjects, topics, difficulties } = body;
        await engine.preGenerateContent(subjects, topics, difficulties);
        result = { message: "Content pre-generation completed" };
        break;
      default:
        return NextResponse.json(
          { error: "Invalid optimization action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error("Error performing optimization:", error);
    return NextResponse.json(
      { error: "Failed to perform optimization" },
      { status: 500 }
    );
  }
}
