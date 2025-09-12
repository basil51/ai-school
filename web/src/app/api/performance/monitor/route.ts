import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { performanceMonitor } from '@/lib/performance/monitor';
import { cache } from '@/lib/cache';
import { threeDOptimizer } from '@/lib/performance/3d-optimization';
import { cdnManager } from '@/lib/performance/cdn-integration';
import { mediaOptimizer } from '@/lib/performance/media-optimization';
import { progressiveLoader } from '@/lib/performance/progressive-loading';

// GET /api/performance/monitor - Get performance metrics and system health
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions (admin, super_admin, or teacher)
    const userRole = (session as any)?.role;
    if (!['admin', 'super_admin', 'teacher'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '5m'; // 5 minutes default
    const includeDetails = searchParams.get('details') === 'true';

    // Get system health
    const systemHealth = await performanceMonitor.getSystemHealth();
    
    // Get performance statistics
    const timeWindow = parseTimeframe(timeframe);
    const performanceStats = performanceMonitor.getPerformanceStats(timeWindow);
    
    // Get active alerts
    const activeAlerts = performanceMonitor.getActiveAlerts();
    
    // Get cache statistics
    const cacheStats = cache.getStats();
    
    // Get 3D optimization metrics
    const threeDMetrics = threeDOptimizer.getPerformanceMetrics();
    const threeDHistory = threeDOptimizer.getPerformanceHistory();
    const threeDRecommendations = threeDOptimizer.getOptimizationRecommendations();
    
    // Get CDN statistics
    const cdnStats = cdnManager.getCDNStats();
    
    // Get media optimization statistics
    const mediaStats = mediaOptimizer.getOptimizationStats();
    
    // Get progressive loading statistics
    const loadingStats = progressiveLoader.getLoadingStats();

    const response = {
      timestamp: Date.now(),
      systemHealth,
      performance: {
        stats: performanceStats,
        alerts: activeAlerts,
        threeD: {
          current: threeDMetrics,
          history: includeDetails ? threeDHistory : undefined,
          recommendations: threeDRecommendations,
          acceptable: threeDOptimizer.isPerformanceAcceptable(),
        },
      },
      optimization: {
        cache: cacheStats,
        cdn: cdnStats,
        media: mediaStats,
        loading: loadingStats,
      },
      recommendations: generateRecommendations(
        systemHealth,
        performanceStats,
        threeDMetrics,
        cacheStats,
        cdnStats
      ),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to get performance metrics' },
      { status: 500 }
    );
  }
}

// POST /api/performance/monitor - Update performance monitoring configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions (admin or super_admin only)
    const userRole = (session as any)?.role;
    if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      thresholds, 
      threeDConfig, 
      cdnConfig, 
      mediaConfig,
      enableMonitoring,
      alertSettings 
    } = body;

    // Update performance monitoring thresholds
    if (thresholds) {
      performanceMonitor.updateThresholds(thresholds);
    }

    // Update 3D optimization configuration
    if (threeDConfig) {
      if (threeDConfig.lod) {
        threeDOptimizer.updateLODConfig(threeDConfig.lod);
      }
      if (threeDConfig.rendering) {
        threeDOptimizer.updateRenderingConfig(threeDConfig.rendering);
      }
    }

    // Update CDN configuration
    if (cdnConfig) {
      cdnManager.updateConfig(cdnConfig);
    }

    // Update media optimization configuration
    if (mediaConfig) {
      mediaOptimizer.updateConfig(mediaConfig);
    }

    // Update monitoring settings
    if (enableMonitoring !== undefined) {
      // This would enable/disable monitoring features
      console.log('Monitoring enabled:', enableMonitoring);
    }

    // Update alert settings
    if (alertSettings) {
      // This would update alert thresholds and notifications
      console.log('Alert settings updated:', alertSettings);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Performance monitoring configuration updated' 
    });
  } catch (error) {
    console.error('Error updating performance monitoring:', error);
    return NextResponse.json(
      { error: 'Failed to update performance monitoring' },
      { status: 500 }
    );
  }
}

// PUT /api/performance/monitor/alerts/[id]/resolve - Resolve a performance alert
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions (admin, super_admin, or teacher)
    const userRole = (session as any)?.role;
    if (!['admin', 'super_admin', 'teacher'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('alertId');

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    const resolved = await performanceMonitor.resolveAlert(alertId);
    
    if (resolved) {
      return NextResponse.json({ 
        success: true, 
        message: 'Alert resolved successfully' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Alert not found or already resolved' 
      }, { status: 404 });
    }
  } catch (error) {
    console.error('Error resolving alert:', error);
    return NextResponse.json(
      { error: 'Failed to resolve alert' },
      { status: 500 }
    );
  }
}

// Helper function to parse timeframe
function parseTimeframe(timeframe: string): number {
  const unit = timeframe.slice(-1);
  const value = parseInt(timeframe.slice(0, -1));
  
  switch (unit) {
    case 's': return value * 1000; // seconds
    case 'm': return value * 60 * 1000; // minutes
    case 'h': return value * 60 * 60 * 1000; // hours
    case 'd': return value * 24 * 60 * 60 * 1000; // days
    default: return 5 * 60 * 1000; // default 5 minutes
  }
}

// Helper function to generate optimization recommendations
function generateRecommendations(
  systemHealth: any,
  performanceStats: any,
  threeDMetrics: any,
  cacheStats: any,
  cdnStats: any
): string[] {
  const recommendations: string[] = [];

  // System health recommendations
  if (systemHealth.status === 'unhealthy') {
    recommendations.push('System health is critical - immediate attention required');
  } else if (systemHealth.status === 'degraded') {
    recommendations.push('System performance is degraded - consider optimization');
  }

  // Performance recommendations
  if (performanceStats.averageResponseTime > 2000) {
    recommendations.push('High response times detected - consider caching optimization');
  }

  if (performanceStats.errorRate > 0.05) {
    recommendations.push('High error rate detected - investigate system stability');
  }

  if (performanceStats.cacheHitRate < 0.7) {
    recommendations.push('Low cache hit rate - consider cache warming strategies');
  }

  // 3D performance recommendations
  if (threeDMetrics.fps < 30) {
    recommendations.push('3D rendering performance is poor - reduce quality settings');
  }

  if (threeDMetrics.drawCalls > 1000) {
    recommendations.push('High draw call count - consider instanced rendering');
  }

  // Cache recommendations
  if (cacheStats.type === 'memory' && cacheStats.size > 500) {
    recommendations.push('Memory cache is large - consider Redis implementation');
  }

  // CDN recommendations
  if (cdnStats.cacheHitRate < 0.8) {
    recommendations.push('CDN cache hit rate is low - check cache configuration');
  }

  if (cdnStats.totalSize > 100 * 1024 * 1024) { // 100MB
    recommendations.push('Large CDN storage usage - consider asset optimization');
  }

  return recommendations;
}
