import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdvancedAITeachingEngine } from "@/lib/advanced-teaching/advanced-ai-engine";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const engine = new AdvancedAITeachingEngine();
    const methods = engine.getAvailableMethods();

    return NextResponse.json({
      success: true,
      methods,
      count: methods.length
    });
  } catch (error) {
    console.error("Error fetching teaching methods:", error);
    return NextResponse.json(
      { error: "Failed to fetch teaching methods" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { context, content } = body;

    if (!context || !content) {
      return NextResponse.json(
        { error: "Context and content are required" },
        { status: 400 }
      );
    }

    const engine = new AdvancedAITeachingEngine();
    
    // Select optimal method
    const optimalMethod = await engine.selectOptimalMethod(context);
    
    // Generate advanced content
    const advancedContent = await engine.generateAdvancedContent(
      content,
      optimalMethod,
      context
    );

    return NextResponse.json({
      success: true,
      method: optimalMethod,
      content: advancedContent
    });
  } catch (error) {
    console.error("Error generating advanced content:", error);
    return NextResponse.json(
      { error: "Failed to generate advanced content" },
      { status: 500 }
    );
  }
}
