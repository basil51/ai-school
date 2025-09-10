import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdvancedAITeachingEngine } from "@/lib/advanced-teaching/advanced-ai-engine";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, method, outcomes } = body;

    if (!studentId || !method || !outcomes) {
      return NextResponse.json(
        { error: "Student ID, method, and outcomes are required" },
        { status: 400 }
      );
    }

    const engine = new AdvancedAITeachingEngine();
    
    // Analyze teaching effectiveness
    const analysis = await engine.analyzeTeachingEffectiveness(
      studentId,
      method,
      outcomes
    );

    return NextResponse.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error("Error analyzing teaching effectiveness:", error);
    return NextResponse.json(
      { error: "Failed to analyze teaching effectiveness" },
      { status: 500 }
    );
  }
}
