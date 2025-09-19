import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SystemIntegrationEngine, SystemIntegrationConfig } from "@/lib/integration/system-integration-engine";

export async function GET(request: NextRequest) {
  try {
    console.log("GET request received", request);
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    
    // Get integration metrics
    const metrics = await engine.getIntegrationMetrics();

    return NextResponse.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error("Error fetching integration metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch integration metrics" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST request received", request);
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    
    // Optimize system performance
    const optimization = await engine.optimizeSystemPerformance();

    return NextResponse.json({
      success: true,
      optimization
    });
  } catch (error) {
    console.error("Error optimizing system performance:", error);
    return NextResponse.json(
      { error: "Failed to optimize system performance" },
      { status: 500 }
    );
  }
}
