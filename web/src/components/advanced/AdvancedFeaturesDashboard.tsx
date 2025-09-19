'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Zap, 
  //Target, 
  TrendingUp, 
  Settings, 
  BarChart3, 
  //Users, 
  //BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react';

interface AdvancedFeaturesDashboardProps {
  userRole: string;
}

interface SystemMetrics {
  systemHealth: number;
  responseTime: number;
  cacheHitRate: number;
  adaptationAccuracy: number;
  studentSatisfaction: number;
  learningOutcomes: number;
  systemUptime: number;
}

interface TeachingMethod {
  id: string;
  name: string;
  description: string;
  effectiveness: number;
  usage: number;
  retentionRate: number;
}

interface PerformanceOptimization {
  optimizations: any[];
  improvements: any[];
  recommendations: string[];
}

export default function AdvancedFeaturesDashboard({ userRole }: AdvancedFeaturesDashboardProps) {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [teachingMethods, setTeachingMethods] = useState<TeachingMethod[]>([]);
  const [performanceOptimization, setPerformanceOptimization] = useState<PerformanceOptimization | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  console.log("userRole", userRole);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load system metrics
      const metricsResponse = await fetch('/api/integration/metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setSystemMetrics(metricsData.metrics);
      }

      // Load teaching methods
      const methodsResponse = await fetch('/api/advanced-teaching/methods');
      if (methodsResponse.ok) {
        const methodsData = await methodsResponse.json();
        setTeachingMethods(methodsData.methods || []);
      }

      // Load performance optimization data
      const optimizationResponse = await fetch('/api/integration/metrics', {
        method: 'POST'
      });
      if (optimizationResponse.ok) {
        const optimizationData = await optimizationResponse.json();
        setPerformanceOptimization(optimizationData.optimization);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runSystemOptimization = async () => {
    try {
      const response = await fetch('/api/performance/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'optimize_memory'
        })
      });

      if (response.ok) {
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Error running optimization:', error);
    }
  };

  const getHealthColor = (value: number) => {
    if (value >= 0.9) return 'text-green-600';
    if (value >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBadge = (value: number) => {
    if (value >= 0.9) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (value >= 0.7) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Attention</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Features & Optimization</h1>
          <p className="text-gray-600">Phase 19: System-wide optimization and advanced AI teaching methods</p>
        </div>
        <Button onClick={runSystemOptimization} className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Optimize System
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teaching">Teaching Methods</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemMetrics ? Math.round(systemMetrics.systemHealth * 100) : 0}%
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {systemMetrics ? getHealthBadge(systemMetrics.systemHealth) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemMetrics ? `${systemMetrics.responseTime.toFixed(1)}ms` : '0ms'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average response time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemMetrics ? Math.round(systemMetrics.cacheHitRate * 100) : 0}%
                </div>
                <Progress 
                  value={systemMetrics ? systemMetrics.cacheHitRate * 100 : 0} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Learning Outcomes</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemMetrics ? Math.round(systemMetrics.learningOutcomes * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Student success rate
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Advanced AI Teaching Methods
                </CardTitle>
                <CardDescription>
                  Sophisticated teaching algorithms and methodologies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teachingMethods.slice(0, 4).map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{method.name}</h4>
                        <p className="text-sm text-gray-600">{method.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {Math.round(method.retentionRate * 100)}% retention
                        </div>
                        <Badge variant="secondary">
                          {method.usage}% usage
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Real-time system performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Adaptation Accuracy</span>
                    <span className={`text-sm font-bold ${getHealthColor(systemMetrics?.adaptationAccuracy || 0)}`}>
                      {systemMetrics ? Math.round(systemMetrics.adaptationAccuracy * 100) : 0}%
                    </span>
                  </div>
                  <Progress value={systemMetrics ? systemMetrics.adaptationAccuracy * 100 : 0} />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Student Satisfaction</span>
                    <span className={`text-sm font-bold ${getHealthColor(systemMetrics?.studentSatisfaction || 0)}`}>
                      {systemMetrics ? Math.round(systemMetrics.studentSatisfaction * 100) : 0}%
                    </span>
                  </div>
                  <Progress value={systemMetrics ? systemMetrics.studentSatisfaction * 100 : 0} />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">System Uptime</span>
                    <span className={`text-sm font-bold ${getHealthColor(systemMetrics?.systemUptime || 0)}`}>
                      {systemMetrics ? Math.round(systemMetrics.systemUptime * 100) : 0}%
                    </span>
                  </div>
                  <Progress value={systemMetrics ? systemMetrics.systemUptime * 100 : 0} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="teaching" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Teaching Methods</CardTitle>
              <CardDescription>
                AI-powered teaching methodologies with proven effectiveness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teachingMethods.map((method) => (
                  <div key={method.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{method.name}</h3>
                      <Badge variant="outline">
                        {Math.round(method.retentionRate * 100)}% retention
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{method.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span>Usage: {method.usage}%</span>
                      <span>Effectiveness: {Math.round(method.effectiveness * 100)}%</span>
                    </div>
                    <Progress value={method.effectiveness * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>
                  Real-time performance monitoring and optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Response Time</span>
                    <span className="text-sm font-bold">
                      {systemMetrics ? `${systemMetrics.responseTime.toFixed(1)}ms` : '0ms'}
                    </span>
                  </div>
                  <Progress value={Math.max(0, 100 - (systemMetrics?.responseTime || 0))} />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cache Hit Rate</span>
                    <span className="text-sm font-bold">
                      {systemMetrics ? Math.round(systemMetrics.cacheHitRate * 100) : 0}%
                    </span>
                  </div>
                  <Progress value={systemMetrics ? systemMetrics.cacheHitRate * 100 : 0} />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-sm font-bold">Optimized</span>
                  </div>
                  <Progress value={85} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Analytics</CardTitle>
                <CardDescription>
                  Student engagement and learning outcome metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Adaptation Accuracy</span>
                    <span className="text-sm font-bold">
                      {systemMetrics ? Math.round(systemMetrics.adaptationAccuracy * 100) : 0}%
                    </span>
                  </div>
                  <Progress value={systemMetrics ? systemMetrics.adaptationAccuracy * 100 : 0} />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Student Satisfaction</span>
                    <span className="text-sm font-bold">
                      {systemMetrics ? Math.round(systemMetrics.studentSatisfaction * 100) : 0}%
                    </span>
                  </div>
                  <Progress value={systemMetrics ? systemMetrics.studentSatisfaction * 100 : 0} />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Learning Outcomes</span>
                    <span className="text-sm font-bold">
                      {systemMetrics ? Math.round(systemMetrics.learningOutcomes * 100) : 0}%
                    </span>
                  </div>
                  <Progress value={systemMetrics ? systemMetrics.learningOutcomes * 100 : 0} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Optimization</CardTitle>
              <CardDescription>
                Performance improvements and optimization recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {performanceOptimization ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Recent Optimizations</h3>
                    <div className="space-y-2">
                      {performanceOptimization.optimizations.map((opt, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{opt.action}: {opt.impact}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Improvements</h3>
                    <div className="space-y-2">
                      {performanceOptimization.improvements.map((improvement, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">{improvement}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Recommendations</h3>
                    <div className="space-y-2">
                      {performanceOptimization.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No optimization data available</p>
                  <Button onClick={runSystemOptimization} className="mt-4">
                    Run System Optimization
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
