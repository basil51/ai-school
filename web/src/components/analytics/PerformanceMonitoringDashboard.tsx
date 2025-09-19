"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Activity, 
  //TrendingUp, 
  //TrendingDown, 
  Clock, 
  //Target, 
  Brain, 
  //Users, 
  BookOpen,
  //BarChart3,
  //LineChart,
  //PieChart,
  AlertTriangle,
  //CheckCircle,
  Loader2,
  RefreshCw,
  Download,
  //Filter,
  //Calendar,
  Eye,
  EyeOff
} from "lucide-react";

interface RealTimeProgress {
  id: string;
  studentId: string;
  sessionId: string;
  lessonId?: string;
  activityType: string;
  activityId?: string;
  startTime: string;
  endTime?: string;
  duration: number;
  engagementLevel: number;
  interactionCount: number;
  focusTime: number;
  distractionCount: number;
  completionRate: number;
  accuracy?: number;
  difficulty?: string;
  learningStyle?: string;
  emotionalState?: string;
  metadata?: any;
  student: {
    id: string;
    name: string;
    email: string;
  };
  lesson?: {
    id: string;
    title: string;
    topic: { name: string };
  };
}

interface LearningAnalytics {
  id: string;
  studentId: string;
  subjectId?: string;
  timeframe: string;
  periodStart: string;
  periodEnd: string;
  totalLearningTime: number;
  totalSessions: number;
  averageSessionLength: number;
  averageEngagement: number;
  lessonsCompleted: number;
  assessmentsCompleted: number;
  averageAccuracy: number;
  improvementRate: number;
  learningVelocity: number;
  retentionRate: number;
  difficultyProgression: number;
  preferredLearningTime?: string;
  preferredLearningStyle?: string;
  strengths: string[];
  weaknesses: string[];
  goals: string[];
  achievements: string[];
  recommendations?: any;
  student: {
    id: string;
    name: string;
    email: string;
  };
  subject?: {
    id: string;
    name: string;
    level: string;
  };
}

interface PerformanceMetrics {
  id: string;
  studentId?: string;
  teacherId?: string;
  organizationId?: string;
  metricType: string;
  metricName: string;
  metricValue: number;
  metricUnit?: string;
  context?: any;
  timestamp: string;
  sessionId?: string;
  lessonId?: string;
  assessmentId?: string;
  student?: {
    id: string;
    name: string;
    email: string;
  };
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface PerformanceMonitoringDashboardProps {
  studentId?: string;
  organizationId?: string;
  timeframe?: 'daily' | 'weekly' | 'monthly';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function PerformanceMonitoringDashboard({
  studentId,
  organizationId,
  timeframe = 'weekly',
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: PerformanceMonitoringDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [realTimeProgress, setRealTimeProgress] = useState<RealTimeProgress[]>([]);
  const [learningAnalytics, setLearningAnalytics] = useState<LearningAnalytics[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showDetails, setShowDetails] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (studentId) params.append('studentId', studentId);
      if (organizationId) params.append('organizationId', organizationId);
      if (timeframe) params.append('timeframe', timeframe);

      // Fetch real-time progress
      const progressResponse = await fetch(`/api/progress/real-time?${params}`);
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        setRealTimeProgress(progressData.progress || []);
      }

      // Fetch learning analytics
      const analyticsResponse = await fetch(`/api/analytics/learning?${params}`);
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setLearningAnalytics(analyticsData.analytics || []);
      }

      // Fetch performance metrics
      const metricsResponse = await fetch(`/api/metrics/performance?${params}`);
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setPerformanceMetrics(metricsData.metrics || []);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching monitoring data:', err);
      setError('Failed to fetch monitoring data');
    } finally {
      setLoading(false);
    }
  }, [studentId, organizationId, timeframe]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchData]);

  /*const getEngagementColor = (level: number) => {
    if (level >= 0.8) return 'text-green-600';
    if (level >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };*/

  const getEngagementBadge = (level: number) => {
    if (level >= 0.8) return <Badge className="bg-green-100 text-green-800">High</Badge>;
    if (level >= 0.6) return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    return <Badge className="bg-red-100 text-red-800">Low</Badge>;
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getEmotionalStateColor = (state?: string) => {
    switch (state) {
      case 'engaged': return 'text-green-600';
      case 'excited': return 'text-blue-600';
      case 'confused': return 'text-yellow-600';
      case 'frustrated': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const calculateSummaryStats = () => {
    const totalSessions = realTimeProgress.length;
    const totalLearningTime = realTimeProgress.reduce((sum, p) => sum + p.duration, 0) / 60; // minutes
    const averageEngagement = realTimeProgress.reduce((sum, p) => sum + p.engagementLevel, 0) / Math.max(1, totalSessions);
    const totalFocusTime = realTimeProgress.reduce((sum, p) => sum + p.focusTime, 0) / 60; // minutes
    const totalDistractions = realTimeProgress.reduce((sum, p) => sum + p.distractionCount, 0);
    const lessonsCompleted = realTimeProgress.filter(p => p.completionRate === 1).length;
    const averageAccuracy = realTimeProgress.reduce((sum, p) => sum + (p.accuracy || 0), 0) / Math.max(1, realTimeProgress.filter(p => p.accuracy !== null).length);

    return {
      totalSessions,
      totalLearningTime: Math.round(totalLearningTime),
      averageEngagement: Math.round(averageEngagement * 100) / 100,
      totalFocusTime: Math.round(totalFocusTime),
      totalDistractions,
      lessonsCompleted,
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
    };
  };

  const summaryStats = calculateSummaryStats();

  if (loading && realTimeProgress.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading performance monitoring data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Monitoring Dashboard</h2>
          <p className="text-gray-600">
            Real-time tracking of learning performance and engagement
            {lastUpdated && (
              <span className="ml-2 text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.totalLearningTime} minutes total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Engagement</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(summaryStats.averageEngagement * 100)}%</div>
            <Progress value={summaryStats.averageEngagement * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lessons Completed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.lessonsCompleted}</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.averageAccuracy}% average accuracy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalFocusTime}m</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.totalDistractions} distractions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="realtime">Real-time Progress</TabsTrigger>
          <TabsTrigger value="analytics">Learning Analytics</TabsTrigger>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Engagement Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Trends</CardTitle>
                <CardDescription>Recent engagement levels over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {realTimeProgress.slice(0, 5).map((progress) => (
                    <div key={progress.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          progress.engagementLevel >= 0.8 ? 'bg-green-500' :
                          progress.engagementLevel >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{progress.activityType}</p>
                          <p className="text-xs text-gray-500">
                            {progress.lesson?.title || 'General Activity'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {Math.round(progress.engagementLevel * 100)}%
                        </p>
                        <p className="text-xs text-gray-500">
                          {Math.round(progress.duration / 60)}m
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Learning Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Insights</CardTitle>
                <CardDescription>Key insights from recent activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Preferred Learning Time</span>
                    <Badge variant="outline">
                      {learningAnalytics[0]?.preferredLearningTime || 'Not detected'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Learning Style</span>
                    <Badge variant="outline">
                      {learningAnalytics[0]?.preferredLearningStyle || 'Not detected'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Learning Velocity</span>
                    <Badge variant="outline">
                      {learningAnalytics[0]?.learningVelocity?.toFixed(1) || '0.0'} lessons/hour
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Retention Rate</span>
                    <Badge variant="outline">
                      {Math.round((learningAnalytics[0]?.retentionRate || 0) * 100)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Progress</CardTitle>
              <CardDescription>Live tracking of current learning sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {realTimeProgress.map((progress) => (
                  <div key={progress.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium">{progress.activityType}</h4>
                        {getEngagementBadge(progress.engagementLevel)}
                        {progress.difficulty && (
                          <Badge variant="outline" className={getDifficultyColor(progress.difficulty)}>
                            {progress.difficulty}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(progress.startTime).toLocaleTimeString()}
                      </div>
                    </div>
                    
                    {progress.lesson && (
                      <p className="text-sm text-gray-600 mb-2">
                        {progress.lesson.title} - {progress.lesson.topic.name}
                      </p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <span className="ml-1 font-medium">{Math.round(progress.duration / 60)}m</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Interactions:</span>
                        <span className="ml-1 font-medium">{progress.interactionCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Focus Time:</span>
                        <span className="ml-1 font-medium">{Math.round(progress.focusTime / 60)}m</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Distractions:</span>
                        <span className="ml-1 font-medium">{progress.distractionCount}</span>
                      </div>
                    </div>

                    {showDetails && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Completion:</span>
                            <Progress value={progress.completionRate * 100} className="mt-1" />
                          </div>
                          {progress.accuracy && (
                            <div>
                              <span className="text-gray-500">Accuracy:</span>
                              <span className="ml-1 font-medium">{Math.round(progress.accuracy * 100)}%</span>
                            </div>
                          )}
                          {progress.emotionalState && (
                            <div>
                              <span className="text-gray-500">Emotional State:</span>
                              <span className={`ml-1 font-medium ${getEmotionalStateColor(progress.emotionalState)}`}>
                                {progress.emotionalState}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Learning Analytics</CardTitle>
              <CardDescription>Comprehensive learning performance analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {learningAnalytics.map((analytics) => (
                  <div key={analytics.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">
                          {analytics.subject?.name || 'Overall'} - {analytics.timeframe}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {new Date(analytics.periodStart).toLocaleDateString()} - {new Date(analytics.periodEnd).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">{analytics.subject?.level || 'All Levels'}</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{analytics.totalSessions}</div>
                        <div className="text-sm text-gray-500">Sessions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{analytics.lessonsCompleted}</div>
                        <div className="text-sm text-gray-500">Lessons</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{Math.round(analytics.averageEngagement * 100)}%</div>
                        <div className="text-sm text-gray-500">Engagement</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{Math.round(analytics.averageAccuracy * 100)}%</div>
                        <div className="text-sm text-gray-500">Accuracy</div>
                      </div>
                    </div>

                    {showDetails && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Learning Time:</span>
                            <span className="ml-1 font-medium">{analytics.totalLearningTime}m</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Avg Session:</span>
                            <span className="ml-1 font-medium">{analytics.averageSessionLength.toFixed(1)}m</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Velocity:</span>
                            <span className="ml-1 font-medium">{analytics.learningVelocity.toFixed(1)}/hr</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Improvement:</span>
                            <span className="ml-1 font-medium">{analytics.improvementRate.toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Retention:</span>
                            <span className="ml-1 font-medium">{Math.round(analytics.retentionRate * 100)}%</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Progression:</span>
                            <span className="ml-1 font-medium">{Math.round(analytics.difficultyProgression * 100)}%</span>
                          </div>
                        </div>

                        {analytics.strengths.length > 0 && (
                          <div>
                            <span className="text-sm text-gray-500">Strengths:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {analytics.strengths.map((strength, index) => (
                                <Badge key={index} variant="outline" className="bg-green-50 text-green-700">
                                  {strength}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {analytics.weaknesses.length > 0 && (
                          <div>
                            <span className="text-sm text-gray-500">Areas for Improvement:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {analytics.weaknesses.map((weakness, index) => (
                                <Badge key={index} variant="outline" className="bg-yellow-50 text-yellow-700">
                                  {weakness}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {analytics.achievements.length > 0 && (
                          <div>
                            <span className="text-sm text-gray-500">Achievements:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {analytics.achievements.map((achievement, index) => (
                                <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                                  {achievement}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>System and user performance measurements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceMetrics.map((metric) => (
                  <div key={metric.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium">{metric.metricName}</h4>
                        <Badge variant="outline">{metric.metricType}</Badge>
                        {metric.metricUnit && (
                          <span className="text-sm text-gray-500">{metric.metricUnit}</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(metric.timestamp).toLocaleTimeString()}
                      </div>
                    </div>

                    <div className="text-2xl font-bold mb-2">
                      {metric.metricValue}
                      {metric.metricUnit && <span className="text-sm text-gray-500 ml-1">{metric.metricUnit}</span>}
                    </div>

                    {showDetails && metric.context && (
                      <div className="mt-3 pt-3 border-t">
                        <span className="text-sm text-gray-500">Context:</span>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(metric.context, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
