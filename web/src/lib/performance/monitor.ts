import { cache } from '../cache';

// Performance metrics interface
export interface PerformanceMetrics {
  timestamp: number;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  cacheHit: boolean;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
  userAgent?: string;
  ip?: string;
}

export interface SystemHealth {
  timestamp: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cacheStats: {
    type: 'redis' | 'memory';
    healthy: boolean;
    size?: number;
    maxSize?: number;
  };
  activeConnections: number;
  errorRate: number;
  averageResponseTime: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'response_time' | 'memory_usage' | 'error_rate' | 'cache_miss_rate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: number;
  resolved: boolean;
}

// Performance monitoring class
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private thresholds = {
    responseTime: 2000, // 2 seconds
    memoryUsage: 0.8, // 80% of available memory
    errorRate: 0.05, // 5% error rate
    cacheMissRate: 0.3, // 30% cache miss rate
  };
  private maxMetricsHistory = 1000;
  private maxAlertsHistory = 100;

  // Track API request performance
  async trackRequest(
    endpoint: string,
    method: string,
    startTime: number,
    statusCode: number,
    cacheHit: boolean = false,
    userAgent?: string,
    ip?: string
  ): Promise<void> {
    const responseTime = Date.now() - startTime;
    
    const metric: PerformanceMetrics = {
      timestamp: Date.now(),
      endpoint,
      method,
      responseTime,
      statusCode,
      cacheHit,
      memoryUsage: process.memoryUsage(),
      userAgent,
      ip,
    };

    // Add to metrics history
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Check for performance issues
    await this.checkPerformanceThresholds(metric);

    // Cache the metric for real-time monitoring
    await cache.cacheWithConfig(
      { ttl: 60, prefix: 'perf:' },
      `metric:${Date.now()}`,
      metric
    );
  }

  // Check performance thresholds and create alerts
  private async checkPerformanceThresholds(metric: PerformanceMetrics): Promise<void> {
    // Response time alert
    if (metric.responseTime > this.thresholds.responseTime) {
      await this.createAlert({
        type: 'response_time',
        severity: metric.responseTime > this.thresholds.responseTime * 2 ? 'critical' : 'high',
        message: `High response time: ${metric.responseTime}ms for ${metric.endpoint}`,
        threshold: this.thresholds.responseTime,
        currentValue: metric.responseTime,
      });
    }

    // Memory usage alert
    const memoryUsagePercent = metric.memoryUsage.heapUsed / metric.memoryUsage.heapTotal;
    if (memoryUsagePercent > this.thresholds.memoryUsage) {
      await this.createAlert({
        type: 'memory_usage',
        severity: memoryUsagePercent > 0.9 ? 'critical' : 'high',
        message: `High memory usage: ${Math.round(memoryUsagePercent * 100)}%`,
        threshold: this.thresholds.memoryUsage,
        currentValue: memoryUsagePercent,
      });
    }

    // Error rate alert (based on status codes)
    if (metric.statusCode >= 400) {
      const recentMetrics = this.getRecentMetrics(300000); // Last 5 minutes
      const errorRate = recentMetrics.filter(m => m.statusCode >= 400).length / recentMetrics.length;
      
      if (errorRate > this.thresholds.errorRate) {
        await this.createAlert({
          type: 'error_rate',
          severity: errorRate > 0.1 ? 'critical' : 'high',
          message: `High error rate: ${Math.round(errorRate * 100)}%`,
          threshold: this.thresholds.errorRate,
          currentValue: errorRate,
        });
      }
    }
  }

  // Create performance alert
  private async createAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      resolved: false,
      ...alertData,
    };

    // Check if similar alert already exists
    const existingAlert = this.alerts.find(
      a => a.type === alert.type && 
           a.severity === alert.severity && 
           !a.resolved &&
           (Date.now() - a.timestamp) < 300000 // 5 minutes
    );

    if (!existingAlert) {
      this.alerts.push(alert);
      
      // Keep only recent alerts
      if (this.alerts.length > this.maxAlertsHistory) {
        this.alerts = this.alerts.slice(-this.maxAlertsHistory);
      }

      // Log critical alerts
      if (alert.severity === 'critical') {
        console.error('CRITICAL PERFORMANCE ALERT:', alert);
      }

      // Cache the alert
      await cache.cacheWithConfig(
        { ttl: 3600, prefix: 'alert:' },
        alert.id,
        alert
      );
    }
  }

  // Get system health status
  async getSystemHealth(): Promise<SystemHealth> {
    const now = Date.now();
    const recentMetrics = this.getRecentMetrics(300000); // Last 5 minutes
    
    const averageResponseTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
      : 0;

    const errorRate = recentMetrics.length > 0
      ? recentMetrics.filter(m => m.statusCode >= 400).length / recentMetrics.length
      : 0;

    const cacheStats = cache.getStats();

    // Determine overall health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (averageResponseTime > this.thresholds.responseTime * 1.5 || 
        errorRate > this.thresholds.errorRate * 1.5 ||
        !cacheStats.healthy) {
      status = 'unhealthy';
    } else if (averageResponseTime > this.thresholds.responseTime || 
               errorRate > this.thresholds.errorRate) {
      status = 'degraded';
    }

    const health: SystemHealth = {
      timestamp: now,
      status,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cacheStats,
      activeConnections: recentMetrics.length,
      errorRate,
      averageResponseTime,
    };

    // Cache system health
    await cache.cacheWithConfig(
      { ttl: 30, prefix: 'health:' },
      'system_health',
      health
    );

    return health;
  }

  // Get recent metrics
  private getRecentMetrics(timeWindow: number): PerformanceMetrics[] {
    const cutoff = Date.now() - timeWindow;
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  // Get performance statistics
  getPerformanceStats(timeWindow: number = 300000): {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    topSlowEndpoints: Array<{ endpoint: string; avgResponseTime: number; count: number }>;
    topErrorEndpoints: Array<{ endpoint: string; errorCount: number; errorRate: number }>;
  } {
    const recentMetrics = this.getRecentMetrics(timeWindow);
    
    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        cacheHitRate: 0,
        topSlowEndpoints: [],
        topErrorEndpoints: [],
      };
    }

    const totalRequests = recentMetrics.length;
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const errorRate = recentMetrics.filter(m => m.statusCode >= 400).length / totalRequests;
    const cacheHitRate = recentMetrics.filter(m => m.cacheHit).length / totalRequests;

    // Top slow endpoints
    const endpointStats = new Map<string, { totalTime: number; count: number }>();
    recentMetrics.forEach(m => {
      const existing = endpointStats.get(m.endpoint) || { totalTime: 0, count: 0 };
      endpointStats.set(m.endpoint, {
        totalTime: existing.totalTime + m.responseTime,
        count: existing.count + 1,
      });
    });

    const topSlowEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgResponseTime: stats.totalTime / stats.count,
        count: stats.count,
      }))
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, 10);

    // Top error endpoints
    const errorStats = new Map<string, { errorCount: number; totalCount: number }>();
    recentMetrics.forEach(m => {
      const existing = errorStats.get(m.endpoint) || { errorCount: 0, totalCount: 0 };
      errorStats.set(m.endpoint, {
        errorCount: existing.errorCount + (m.statusCode >= 400 ? 1 : 0),
        totalCount: existing.totalCount + 1,
      });
    });

    const topErrorEndpoints = Array.from(errorStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        errorCount: stats.errorCount,
        errorRate: stats.errorCount / stats.totalCount,
      }))
      .filter(e => e.errorCount > 0)
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 10);

    return {
      totalRequests,
      averageResponseTime,
      errorRate,
      cacheHitRate,
      topSlowEndpoints,
      topErrorEndpoints,
    };
  }

  // Get active alerts
  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  // Resolve alert
  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      await cache.cacheWithConfig(
        { ttl: 3600, prefix: 'alert:' },
        alert.id,
        alert
      );
      return true;
    }
    return false;
  }

  // Update thresholds
  updateThresholds(newThresholds: Partial<typeof this.thresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  // Clear old data
  cleanup(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);
    this.alerts = this.alerts.filter(a => a.timestamp >= cutoff);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Performance middleware for Next.js API routes
export function withPerformanceMonitoring<T extends any[]>(
  handler: (...args: T) => Promise<any>
) {
  return async (...args: T): Promise<any> => {
    const startTime = Date.now();
    let statusCode = 200;
    let cacheHit = false;

    try {
      const result = await handler(...args);
      return result;
    } catch (error) {
      statusCode = 500;
      throw error;
    } finally {
      // Extract request info from Next.js context
      const [request] = args;
      const endpoint = request?.url || 'unknown';
      const method = request?.method || 'GET';
      
      await performanceMonitor.trackRequest(
        endpoint,
        method,
        startTime,
        statusCode,
        cacheHit
      );
    }
  };
}

export default performanceMonitor;
