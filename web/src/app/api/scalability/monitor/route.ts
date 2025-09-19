import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ScalabilityEngine, ScalabilityConfig } from "@/lib/scalability/scalability-engine";

export async function GET(request: NextRequest) {
  try {
    console.log("GET request received", request);
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scalabilityConfig: ScalabilityConfig = {
      enableHorizontalScaling: true,
      enableDatabaseSharding: true,
      enableCDN: true,
      enableLoadBalancing: true,
      enableAutoScaling: true,
      maxConcurrentUsers: 1000,
      maxRequestsPerSecond: 100,
      cacheStrategy: 'lru',
      databasePoolSize: 20,
      redisClusterNodes: ['redis://localhost:6379']
    };

    const engine = new ScalabilityEngine(scalabilityConfig);
    
    // Monitor performance and get metrics
    const metrics = await engine.monitorPerformance();
    
    // Generate scaling recommendations
    const recommendations = await engine.generateScalingRecommendations();
    
    // Get scalability report
    const report = await engine.getScalabilityReport();

    return NextResponse.json({
      success: true,
      metrics,
      recommendations,
      report
    });
  } catch (error) {
    console.error("Error monitoring scalability:", error);
    return NextResponse.json(
      { error: "Failed to monitor scalability" },
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
    const { action, ...params } = body;

    const scalabilityConfig: ScalabilityConfig = {
      enableHorizontalScaling: true,
      enableDatabaseSharding: true,
      enableCDN: true,
      enableLoadBalancing: true,
      enableAutoScaling: true,
      maxConcurrentUsers: 1000,
      maxRequestsPerSecond: 100,
      cacheStrategy: 'lru',
      databasePoolSize: 20,
      redisClusterNodes: ['redis://localhost:6379']
    };

    const engine = new ScalabilityEngine(scalabilityConfig);
    let result;

    switch (action) {
      case 'horizontal_scaling':
        const { instances } = params;
        result = await engine.implementHorizontalScaling(instances || 2);
        break;
      case 'database_sharding':
        result = await engine.implementDatabaseSharding();
        break;
      case 'optimize_caching':
        result = await engine.optimizeCachingStrategy();
        break;
      case 'cdn_optimization':
        result = await engine.implementCDNOptimization();
        break;
      default:
        return NextResponse.json(
          { error: "Invalid scalability action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error("Error performing scalability action:", error);
    return NextResponse.json(
      { error: "Failed to perform scalability action" },
      { status: 500 }
    );
  }
}
