import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SystemIntegrationEngine, SystemIntegrationConfig } from "@/lib/integration/system-integration-engine";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, subject, topic, config } = body;

    if (!studentId || !subject || !topic) {
      return NextResponse.json(
        { error: "Student ID, subject, and topic are required" },
        { status: 400 }
      );
    }

    // Default integration config
    const integrationConfig: SystemIntegrationConfig = {
      enableAdvancedTeaching: true,
      enablePerformanceOptimization: true,
      enablePersonalization: true,
      enablePredictiveAnalytics: true,
      enableNeuralPathways: true,
      enableContentGeneration: true,
      cacheEnabled: true,
      realTimeAdaptation: true,
      ...config
    };

    const engine = new SystemIntegrationEngine(integrationConfig);
    
    // Create integrated learning session
    const learningSession = await engine.createIntegratedSession(
      studentId,
      subject,
      topic
    );

    return NextResponse.json({
      success: true,
      session: learningSession
    });
  } catch (error) {
    console.error("Error creating integrated session:", error);
    return NextResponse.json(
      { error: "Failed to create integrated session" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, interaction } = body;

    if (!sessionId || !interaction) {
      return NextResponse.json(
        { error: "Session ID and interaction are required" },
        { status: 400 }
      );
    }

    // Default integration config
    const integrationConfig: SystemIntegrationConfig = {
      enableAdvancedTeaching: true,
      enablePerformanceOptimization: true,
      enablePersonalization: true,
      enablePredictiveAnalytics: true,
      enableNeuralPathways: true,
      enableContentGeneration: true,
      cacheEnabled: true,
      realTimeAdaptation: true
    };

    const engine = new SystemIntegrationEngine(integrationConfig);
    
    // Process student interaction
    const result = await engine.processStudentInteraction(sessionId, interaction);

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error("Error processing student interaction:", error);
    return NextResponse.json(
      { error: "Failed to process student interaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const completionData = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Default integration config
    const integrationConfig: SystemIntegrationConfig = {
      enableAdvancedTeaching: true,
      enablePerformanceOptimization: true,
      enablePersonalization: true,
      enablePredictiveAnalytics: true,
      enableNeuralPathways: true,
      enableContentGeneration: true,
      cacheEnabled: true,
      realTimeAdaptation: true
    };

    const engine = new SystemIntegrationEngine(integrationConfig);
    
    // Complete learning session
    const result = await engine.completeSession(sessionId, completionData);

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error("Error completing session:", error);
    return NextResponse.json(
      { error: "Failed to complete session" },
      { status: 500 }
    );
  }
}
