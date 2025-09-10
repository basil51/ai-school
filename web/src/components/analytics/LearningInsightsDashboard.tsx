'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  Brain, 
  Clock, 
  Target, 
  BookOpen,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { useTranslations } from '@/lib/useTranslations';

interface KnowledgeRetention {
  id: string;
  conceptId: string;
  conceptName: string;
  subjectId: string;
  initialMastery: number;
  retentionLevel: number;
  lastReviewed: string;
  nextReview: string;
  reviewCount: number;
  reinforcementNeeded: boolean;
  masteryThreshold: number;
  subject: {
    name: string;
  };
}

interface LearningCurve {
  id: string;
  studentId: string;
  subjectId: string;
  curveType: string;
  dataPoints: Array<{
    time: string;
    mastery: number;
    difficulty: string;
  }>;
  slope: number;
  plateauPoints: any[];
  accelerationZones: any[];
  difficultySpikes: any[];
  masteryThreshold: number;
  predictedCompletion?: string;
  confidence: number;
  subject: {
    name: string;
  };
  updatedAt: string;
}

interface EngagementOptimization {
  id: string;
  studentId: string;
  sessionId?: string;
  engagementLevel: number;
  engagementFactors: any;
  optimizationActions: any;
  effectiveness?: number;
  contentAdjustments: any;
  pacingAdjustments: any;
  interactionChanges: any;
  beforeEngagement: number;
  afterEngagement?: number;
  timestamp: string;
}

export default function LearningInsightsDashboard() {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState('retention');
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30');
  
  // Data states
  const [knowledgeRetention, setKnowledgeRetention] = useState<KnowledgeRetention[]>([]);
  const [learningCurves, setLearningCurves] = useState<LearningCurve[]>([]);
  const [engagementOptimizations, setEngagementOptimizations] = useState<EngagementOptimization[]>([]);

  useEffect(() => {
    loadLearningInsights();
  }, [selectedSubject, selectedTimeframe]);

  const loadLearningInsights = async () => {
    setLoading(true);
    try {
      // Load knowledge retention data
      const retentionResponse = await fetch('/api/analytics/retention');
      const retentionData = await retentionResponse.json();
      if (retentionData.success) {
        setKnowledgeRetention(retentionData.data);
      }

      // Load learning curves
      const curvesResponse = await fetch('/api/analytics/curves');
      const curvesData = await curvesResponse.json();
      if (curvesData.success) {
        setLearningCurves(curvesData.data);
      }

      // Load engagement optimizations
      const engagementResponse = await fetch('/api/analytics/engagement');
      const engagementData = await engagementResponse.json();
      if (engagementData.success) {
        setEngagementOptimizations(engagementData.data);
      }

    } catch (error) {
      console.error('Error loading learning insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRetentionStatus = (retention: KnowledgeRetention) => {
    if (retention.retentionLevel >= retention.masteryThreshold) {
      return { status: 'excellent', color: 'text-green-600' };
    } else if (retention.retentionLevel >= retention.masteryThreshold * 0.8) {
      return { status: 'good', color: 'text-blue-600' };
    } else if (retention.retentionLevel >= retention.masteryThreshold * 0.6) {
      return { status: 'fair', color: 'text-yellow-600' };
    } else {
      return { status: 'needs_review', color: 'text-red-600' };
    }
  };

  const getEngagementTrend = (optimizations: EngagementOptimization[]) => {
    if (optimizations.length < 2) return 'stable';
    
    const recent = optimizations.slice(-5);
    const avgRecent = recent.reduce((sum, opt) => sum + opt.engagementLevel, 0) / recent.length;
    const avgOlder = optimizations.slice(0, -5).reduce((sum, opt) => sum + opt.engagementLevel, 0) / Math.max(1, optimizations.length - 5);
    
    if (avgRecent > avgOlder + 0.1) return 'improving';
    if (avgRecent < avgOlder - 0.1) return 'declining';
    return 'stable';
  };

  const getCurveInsights = (curve: LearningCurve) => {
    const insights = [];
    
    if (curve.slope > 0.1) {
      insights.push('Rapid learning progress');
    } else if (curve.slope < -0.05) {
      insights.push('Learning regression detected');
    }
    
    if (curve.plateauPoints.length > 2) {
      insights.push('Multiple learning plateaus');
    }
    
    if (curve.accelerationZones.length > 0) {
      insights.push('Acceleration zones identified');
    }
    
    if (curve.difficultySpikes.length > 0) {
      insights.push('Difficulty spikes detected');
    }
    
    return insights;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading learning insights...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Learning Insights Dashboard</h1>
          <p className="text-muted-foreground">
            Deep analysis of learning patterns, retention, and engagement optimization
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              <SelectItem value="mathematics">Mathematics</SelectItem>
              <SelectItem value="physics">Physics</SelectItem>
              <SelectItem value="chemistry">Chemistry</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadLearningInsights}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Knowledge Retention</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{knowledgeRetention.length}</div>
            <p className="text-xs text-muted-foreground">
              Tracked concepts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Curves</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learningCurves.length}</div>
            <p className="text-xs text-muted-foreground">
              Active curves
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagementOptimizations.length}</div>
            <p className="text-xs text-muted-foreground">
              Optimized sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {engagementOptimizations.length > 0 
                ? (engagementOptimizations.reduce((sum, opt) => sum + opt.engagementLevel, 0) / engagementOptimizations.length * 100).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Recent sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="retention">Knowledge Retention</TabsTrigger>
          <TabsTrigger value="curves">Learning Curves</TabsTrigger>
          <TabsTrigger value="engagement">Engagement Optimization</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Knowledge Retention Tab */}
        <TabsContent value="retention" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {knowledgeRetention.map((retention) => {
              const status = getRetentionStatus(retention);
              return (
                <Card key={retention.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{retention.conceptName}</span>
                      <Badge variant={retention.reinforcementNeeded ? "destructive" : "default"}>
                        {status.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {retention.subject.name} • {retention.reviewCount} reviews
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Retention Level</span>
                        <span className={`font-medium ${status.color}`}>
                          {(retention.retentionLevel * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={retention.retentionLevel * 100} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Initial Mastery</span>
                        <span className="font-medium">
                          {(retention.initialMastery * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={retention.initialMastery * 100} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Last Reviewed</span>
                        <div className="font-medium">
                          {new Date(retention.lastReviewed).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Next Review</span>
                        <div className="font-medium">
                          {new Date(retention.nextReview).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {retention.reinforcementNeeded && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-medium">Reinforcement Needed</span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">
                          This concept needs additional review to maintain mastery.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Learning Curves Tab */}
        <TabsContent value="curves" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {learningCurves.map((curve) => {
              const insights = getCurveInsights(curve);
              return (
                <Card key={curve.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{curve.subject.name}</span>
                      <Badge variant="outline">
                        {curve.curveType}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Confidence: {(curve.confidence * 100).toFixed(1)}% • 
                      Updated {new Date(curve.updatedAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Learning Slope</div>
                        <div className="text-lg font-semibold">
                          {curve.slope.toFixed(3)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Data Points</div>
                        <div className="text-lg font-semibold">
                          {curve.dataPoints.length}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Plateau Points</span>
                        <Badge variant="outline">{curve.plateauPoints.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Acceleration Zones</span>
                        <Badge variant="outline">{curve.accelerationZones.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Difficulty Spikes</span>
                        <Badge variant="outline">{curve.difficultySpikes.length}</Badge>
                      </div>
                    </div>

                    {curve.predictedCompletion && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-800">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm font-medium">Predicted Completion</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          {new Date(curve.predictedCompletion).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {insights.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">AI Insights</h4>
                        <div className="space-y-1">
                          {insights.map((insight, index) => (
                            <div key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary">•</span>
                              {insight}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Engagement Optimization Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {engagementOptimizations.map((optimization) => {
              const trend = getEngagementTrend(engagementOptimizations.slice(0, engagementOptimizations.indexOf(optimization) + 1));
              return (
                <Card key={optimization.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Session {optimization.sessionId || 'Unknown'}</span>
                      <Badge variant={trend === 'improving' ? 'default' : trend === 'declining' ? 'destructive' : 'outline'}>
                        {trend}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {new Date(optimization.timestamp).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Engagement Level</span>
                        <span className="font-medium">
                          {(optimization.engagementLevel * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={optimization.engagementLevel * 100} className="h-2" />
                    </div>

                    {optimization.afterEngagement && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>After Optimization</span>
                          <span className="font-medium">
                            {(optimization.afterEngagement * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={optimization.afterEngagement * 100} className="h-2" />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Before</span>
                        <div className="font-medium">
                          {(optimization.beforeEngagement * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Effectiveness</span>
                        <div className="font-medium">
                          {optimization.effectiveness ? (optimization.effectiveness * 100).toFixed(1) + '%' : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {optimization.optimizationActions && (
                      <div>
                        <h4 className="font-medium mb-2">Optimization Actions</h4>
                        <div className="text-sm text-muted-foreground">
                          {JSON.stringify(optimization.optimizationActions)}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Retention Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Knowledge Retention Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Concepts needing reinforcement: {knowledgeRetention.filter(r => r.reinforcementNeeded).length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Average retention level: {(knowledgeRetention.reduce((sum, r) => sum + r.retentionLevel, 0) / Math.max(1, knowledgeRetention.length) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total concepts tracked: {knowledgeRetention.length}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Learning Curve Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Learning Curve Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Average learning slope: {(learningCurves.reduce((sum, c) => sum + c.slope, 0) / Math.max(1, learningCurves.length)).toFixed(3)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total plateau points: {learningCurves.reduce((sum, c) => sum + c.plateauPoints.length, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Acceleration zones: {learningCurves.reduce((sum, c) => sum + c.accelerationZones.length, 0)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Engagement Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Average engagement: {(engagementOptimizations.reduce((sum, e) => sum + e.engagementLevel, 0) / Math.max(1, engagementOptimizations.length) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Optimization sessions: {engagementOptimizations.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Average effectiveness: {(engagementOptimizations.filter(e => e.effectiveness).reduce((sum, e) => sum + (e.effectiveness || 0), 0) / Math.max(1, engagementOptimizations.filter(e => e.effectiveness).length) * 100).toFixed(1)}%
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    • Focus on concepts with low retention levels
                  </div>
                  <div className="text-sm text-muted-foreground">
                    • Implement spaced repetition for struggling topics
                  </div>
                  <div className="text-sm text-muted-foreground">
                    • Optimize engagement during low-performance periods
                  </div>
                  <div className="text-sm text-muted-foreground">
                    • Review learning plateaus and adjust difficulty
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
