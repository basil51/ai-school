"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Globe, 
  Image, 
  Monitor, 
  Settings, 
  TrendingUp,
  Zap,
  Server,
  HardDrive,
  Cpu,
  MemoryStick
} from 'lucide-react';

interface PerformanceMetrics {
  timestamp: number;
  systemHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cacheStats: any;
    activeConnections: number;
    errorRate: number;
    averageResponseTime: number;
  };
  performance: {
    stats: {
      totalRequests: number;
      averageResponseTime: number;
      errorRate: number;
      cacheHitRate: number;
      topSlowEndpoints: Array<{ endpoint: string; avgResponseTime: number; count: number }>;
      topErrorEndpoints: Array<{ endpoint: string; errorCount: number; errorRate: number }>;
    };
    alerts: Array<{
      id: string;
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      timestamp: number;
    }>;
    threeD: {
      current: {
        fps: number;
        frameTime: number;
        drawCalls: number;
        triangles: number;
        memoryUsage: number;
      };
      recommendations: string[];
      acceptable: boolean;
    };
  };
  optimization: {
    cache: {
      type: 'redis' | 'memory';
      healthy: boolean;
      size?: number;
      maxSize?: number;
    };
    cdn: {
      totalAssets: number;
      totalSize: number;
      optimizedAssets: number;
      cacheHitRate: number;
      averageCompressionRatio: number;
    };
    media: {
      cacheSize: number;
      totalOptimizations: number;
      averageCompressionRatio: number;
      totalSpaceSaved: number;
    };
    loading: {
      activeSessions: number;
      totalChunks: number;
      loadedChunks: number;
      activeLoads: number;
      queueLength: number;
      averageLoadTime: number;
    };
  };
  recommendations: string[];
}

export default function PerformanceOptimizationDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Fetch performance metrics
  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/performance/monitor?details=true');
      if (!response.ok) {
        throw new Error('Failed to fetch performance metrics');
      }
      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Resolve alert
  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/performance/monitor?alertId=${alertId}`, {
        method: 'PUT',
      });
      if (response.ok) {
        fetchMetrics(); // Refresh metrics
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  // Format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format uptime
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading performance metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load performance metrics: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!metrics) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No performance metrics available.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Optimization Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time system performance monitoring and optimization
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Pause' : 'Resume'} Auto-refresh
          </Button>
          <Button variant="outline" size="sm" onClick={fetchMetrics}>
            Refresh Now
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Monitor className="h-5 w-5" />
            <span>System Health</span>
            <Badge className={getStatusColor(metrics.systemHealth.status)}>
              {metrics.systemHealth.status.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatUptime(metrics.systemHealth.uptime)}</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatBytes(metrics.systemHealth.memoryUsage.heapUsed)}</div>
              <div className="text-sm text-muted-foreground">Memory Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.systemHealth.activeConnections}</div>
              <div className="text-sm text-muted-foreground">Active Connections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{(metrics.systemHealth.errorRate * 100).toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Error Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Alerts */}
      {metrics.performance.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Active Alerts</span>
              <Badge variant="destructive">{metrics.performance.alerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.performance.alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <div>
                      <div className="font-medium">{alert.message}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolveAlert(alert.id)}
                  >
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="3d">3D Rendering</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="cdn">CDN</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="loading">Progressive Loading</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.performance.stats.totalRequests}</div>
                <p className="text-xs text-muted-foreground">
                  Last 5 minutes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.performance.stats.averageResponseTime.toFixed(0)}ms</div>
                <p className="text-xs text-muted-foreground">
                  Target: &lt;2000ms
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(metrics.performance.stats.cacheHitRate * 100).toFixed(1)}%</div>
                <Progress value={metrics.performance.stats.cacheHitRate * 100} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(metrics.performance.stats.errorRate * 100).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Target: &lt;5%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Slow Endpoints */}
          {metrics.performance.stats.topSlowEndpoints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Slowest Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.performance.stats.topSlowEndpoints.slice(0, 5).map((endpoint, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="font-mono text-sm">{endpoint.endpoint}</div>
                      <div className="text-sm text-muted-foreground">
                        {endpoint.avgResponseTime.toFixed(0)}ms ({endpoint.count} requests)
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 3D Rendering Tab */}
        <TabsContent value="3d" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">FPS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.performance.threeD.current.fps}</div>
                <Badge variant={metrics.performance.threeD.acceptable ? "default" : "destructive"}>
                  {metrics.performance.threeD.acceptable ? "Good" : "Poor"}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Frame Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.performance.threeD.current.frameTime.toFixed(1)}ms</div>
                <p className="text-xs text-muted-foreground">
                  Target: &lt;16.67ms
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Draw Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.performance.threeD.current.drawCalls}</div>
                <p className="text-xs text-muted-foreground">
                  Target: &lt;1000
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Triangles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.performance.threeD.current.triangles.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Target: &lt;1M
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 3D Recommendations */}
          {metrics.performance.threeD.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>3D Optimization Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {metrics.performance.threeD.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Zap className="h-4 w-4 mt-0.5 text-yellow-500" />
                      <span className="text-sm">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Cache Tab */}
        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Cache Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <Badge variant={metrics.optimization.cache.type === 'redis' ? 'default' : 'secondary'}>
                      {metrics.optimization.cache.type.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={metrics.optimization.cache.healthy ? 'default' : 'destructive'}>
                      {metrics.optimization.cache.healthy ? 'Healthy' : 'Unhealthy'}
                    </Badge>
                  </div>
                  {metrics.optimization.cache.size && (
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{metrics.optimization.cache.size} items</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Cache Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Hit Rate:</span>
                    <span>{(metrics.performance.stats.cacheHitRate * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.performance.stats.cacheHitRate * 100} className="mt-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CDN Tab */}
        <TabsContent value="cdn" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.optimization.cdn.totalAssets}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytes(metrics.optimization.cdn.totalSize)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Optimized Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.optimization.cdn.optimizedAssets}</div>
                <p className="text-xs text-muted-foreground">
                  {((metrics.optimization.cdn.optimizedAssets / metrics.optimization.cdn.totalAssets) * 100).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(metrics.optimization.cdn.cacheHitRate * 100).toFixed(1)}%</div>
                <Progress value={metrics.optimization.cdn.cacheHitRate * 100} className="mt-2" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Cache Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.optimization.media.cacheSize}</div>
                <p className="text-xs text-muted-foreground">Optimized items</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Optimizations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.optimization.media.totalOptimizations}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Compression</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(metrics.optimization.media.averageCompressionRatio * 100).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Size reduction</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Space Saved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytes(metrics.optimization.media.totalSpaceSaved)}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Progressive Loading Tab */}
        <TabsContent value="loading" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.optimization.loading.activeSessions}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Chunks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.optimization.loading.totalChunks}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.optimization.loading.loadedChunks} loaded
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Load Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.optimization.loading.averageLoadTime.toFixed(0)}ms</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recommendations */}
      {metrics.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Optimization Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {metrics.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                  <span className="text-sm">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
