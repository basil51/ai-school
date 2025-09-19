'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Brain, 
  Target, 
  Users, 
  BookOpen,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { useTranslations } from '@/lib/useTranslations';

interface LearningPattern {
  id: string;
  patternType: string;
  conceptualStrengths: string[];
  proceduralStrengths: string[];
  commonMistakes: string[];
  effectiveStrategies: any[];
  optimalStudyTimes: string[];
  preferredContentTypes: any[];
  learningVelocity: number;
  retentionRate: number;
  engagementPattern: any;
  difficultyPreference: number;
  socialLearningStyle: any;
  updatedAt: string;
}

interface LearningCurve {
  id: string;
  curveType: string;
  dataPoints: any[];
  slope: number;
  plateauPoints: any[];
  accelerationZones: any[];
  difficultySpikes: any[];
  confidence: number;
  subject: {
    name: string;
  };
  updatedAt: string;
}

interface PerformanceKPI {
  id: string;
  kpiType: string;
  period: string;
  masteryRate: number;
  completionRate: number;
  assessmentScore: number;
  learningVelocity: number;
  engagementScore: number;
  retentionRate: number;
  improvementRate: number;
  startDate: string;
  endDate: string;
  subject?: {
    name: string;
  };
}

interface GuardianInsight {
  id: string;
  insightType: string;
  title: string;
  description: string;
  recommendations: string[];
  priority: string;
  isRead: boolean;
  actionTaken: boolean;
  generatedAt: string;
  student: {
    name: string;
  };
}

export default function AdvancedAnalyticsDashboard() {
  const _t = useTranslations();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [learningPatterns, setLearningPatterns] = useState<LearningPattern[]>([]);
  const [learningCurves, setLearningCurves] = useState<LearningCurve[]>([]);
  const [performanceKPIs, setPerformanceKPIs] = useState<PerformanceKPI[]>([]);
  const [guardianInsights, setGuardianInsights] = useState<GuardianInsight[]>([]);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Load all analytics data in parallel
      const [
        patternsResponse,
        curvesResponse,
        kpisResponse,
        insightsResponse
      ] = await Promise.all([
        fetch('/api/analytics/patterns'),
        fetch('/api/analytics/curves'),
        fetch('/api/analytics/kpis'),
        fetch('/api/analytics/guardian-insights')
      ]);

      const [patternsData, curvesData, kpisData, insightsData] = await Promise.all([
        patternsResponse.json(),
        curvesResponse.json(),
        kpisResponse.json(),
        insightsResponse.json()
      ]);

      if (patternsData.success) setLearningPatterns(patternsData.data);
      if (curvesData.success) setLearningCurves(curvesData.data);
      if (kpisData.success) setPerformanceKPIs(kpisData.data);
      if (insightsData.success) setGuardianInsights(insightsData.data);

    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'default';
    }
  };

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case 'ACADEMIC_PROGRESS': return <TrendingUp className="h-4 w-4" />;
      case 'LEARNING_STYLE': return <Brain className="h-4 w-4" />;
      case 'ENGAGEMENT_LEVEL': return <Target className="h-4 w-4" />;
      case 'STRUGGLING_AREAS': return <AlertTriangle className="h-4 w-4" />;
      case 'STRENGTH_AREAS': return <CheckCircle className="h-4 w-4" />;
      case 'STUDY_HABITS': return <BookOpen className="h-4 w-4" />;
      case 'MOTIVATION_LEVEL': return <Lightbulb className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics & Reporting</h1>
          <p className="text-muted-foreground">
            Comprehensive learning insights and performance analytics
          </p>
        </div>
        <Button onClick={refreshData} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Patterns</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learningPatterns.length}</div>
            <p className="text-xs text-muted-foreground">
              Active pattern analyses
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
              Subject progress curves
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance KPIs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceKPIs.length}</div>
            <p className="text-xs text-muted-foreground">
              Tracked metrics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guardian Insights</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guardianInsights.length}</div>
            <p className="text-xs text-muted-foreground">
              Generated insights
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="patterns">Learning Patterns</TabsTrigger>
          <TabsTrigger value="curves">Learning Curves</TabsTrigger>
          <TabsTrigger value="kpis">Performance KPIs</TabsTrigger>
          <TabsTrigger value="insights">Guardian Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {learningPatterns.length === 0 && performanceKPIs.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-20 w-20 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-600 mb-4">Welcome to Advanced Analytics!</h2>
              <p className="text-gray-500 mb-6 max-w-2xl mx-auto">
                This dashboard will show comprehensive learning analytics once students start using the AI Teacher system. 
                The analytics will include learning patterns, performance metrics, and AI-generated insights.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Brain className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-blue-900 mb-1">Learning Patterns</h3>
                  <p className="text-sm text-blue-700">AI analysis of individual learning styles and preferences</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-green-900 mb-1">Learning Curves</h3>
                  <p className="text-sm text-green-700">Progress tracking and plateau identification</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <Target className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-orange-900 mb-1">Performance KPIs</h3>
                  <p className="text-sm text-orange-700">Comprehensive metrics and success indicators</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-purple-900 mb-1">Guardian Insights</h3>
                  <p className="text-sm text-purple-700">AI recommendations for parents and guardians</p>
                </div>
              </div>
              
              {/* Getting Started Section */}
              <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🚀 Getting Started with Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">For Teachers:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Create lessons and assessments for your students</li>
                      <li>• Have students complete AI Teacher sessions</li>
                      <li>• Review student assessment results</li>
                      <li>• Analytics will automatically populate</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">For Admins:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Monitor school-wide learning patterns</li>
                      <li>• Track teacher and student performance</li>
                      <li>• Generate guardian insights for parents</li>
                      <li>• View comprehensive analytics reports</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Learning Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Learning Patterns</CardTitle>
                  <CardDescription>
                    Latest cognitive processing patterns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {learningPatterns.slice(0, 3).map((pattern) => (
                  <div key={pattern.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{pattern.patternType}</h4>
                      <Badge variant="outline">
                        {new Date(pattern.updatedAt).toLocaleDateString()}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Learning Velocity</span>
                        <span className="font-medium">
                          {(pattern.learningVelocity * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={pattern.learningVelocity * 100} className="h-2" />
                      <div className="flex items-center justify-between text-sm">
                        <span>Retention Rate</span>
                        <span className="font-medium">
                          {(pattern.retentionRate * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={pattern.retentionRate * 100} className="h-2" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
                <CardDescription>
                  Key performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {performanceKPIs.slice(0, 3).map((kpi) => (
                  <div key={kpi.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{kpi.kpiType}</h4>
                      <Badge variant="outline">{kpi.period}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Mastery Rate</span>
                        <div className="font-medium">
                          {(kpi.masteryRate * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Engagement</span>
                        <div className="font-medium">
                          {(kpi.engagementScore * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            </div>
          )}
        </TabsContent>

        {/* Learning Patterns Tab */}
        <TabsContent value="patterns" className="space-y-6">
          {learningPatterns.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Learning Patterns Yet</h3>
              <p className="text-gray-500 mb-4">
                Learning patterns will appear here once students start using the AI Teacher and generating learning data.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <h4 className="font-medium text-blue-900 mb-2">What are Learning Patterns?</h4>
                <ul className="text-sm text-blue-800 space-y-1 text-left">
                  <li>• AI analysis of individual learning styles</li>
                  <li>• Conceptual and procedural strengths</li>
                  <li>• Effective teaching strategies</li>
                  <li>• Optimal study times and content preferences</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {learningPatterns.map((pattern) => (
              <Card key={pattern.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    {pattern.patternType}
                  </CardTitle>
                  <CardDescription>
                    Updated {new Date(pattern.updatedAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Conceptual Strengths */}
                  <div>
                    <h4 className="font-medium mb-2">Conceptual Strengths</h4>
                    <div className="flex flex-wrap gap-1">
                      {pattern.conceptualStrengths.slice(0, 3).map((strength, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Effective Strategies */}
                  <div>
                    <h4 className="font-medium mb-2">Effective Strategies</h4>
                    <div className="space-y-1">
                      {pattern.effectiveStrategies.slice(0, 2).map((strategy, index) => (
                        <div key={index} className="text-sm text-muted-foreground">
                          • {strategy.approach || strategy.type}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Learning Velocity</div>
                      <div className="text-lg font-semibold">
                        {(pattern.learningVelocity * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Retention Rate</div>
                      <div className="text-lg font-semibold">
                        {(pattern.retentionRate * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </TabsContent>

        {/* Learning Curves Tab */}
        <TabsContent value="curves" className="space-y-6">
          {learningCurves.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Learning Curves Yet</h3>
              <p className="text-gray-500 mb-4">
                Learning curves will appear here once students complete lessons and assessments.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                <h4 className="font-medium text-green-900 mb-2">What are Learning Curves?</h4>
                <ul className="text-sm text-green-800 space-y-1 text-left">
                  <li>• Visual representation of learning progress over time</li>
                  <li>• Identification of learning plateaus and acceleration zones</li>
                  <li>• Difficulty spike detection and analysis</li>
                  <li>• Predictive completion time estimation</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {learningCurves.map((curve) => (
              <Card key={curve.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {curve.subject?.name} - {curve.curveType}
                  </CardTitle>
                  <CardDescription>
                    Confidence: {(curve.confidence * 100).toFixed(1)}%
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
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </TabsContent>

        {/* Performance KPIs Tab */}
        <TabsContent value="kpis" className="space-y-6">
          {performanceKPIs.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Performance KPIs Yet</h3>
              <p className="text-gray-500 mb-4">
                Performance KPIs will appear here once students start completing lessons and assessments.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-md mx-auto">
                <h4 className="font-medium text-orange-900 mb-2">What are Performance KPIs?</h4>
                <ul className="text-sm text-orange-800 space-y-1 text-left">
                  <li>• Mastery rates and completion percentages</li>
                  <li>• Engagement scores and time on task</li>
                  <li>• Retention rates and knowledge transfer</li>
                  <li>• Behavioral insights and growth tracking</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {performanceKPIs.map((kpi) => (
              <Card key={kpi.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {kpi.kpiType}
                  </CardTitle>
                  <CardDescription>
                    {kpi.subject?.name} • {kpi.period} • {new Date(kpi.startDate).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Mastery Rate</div>
                      <div className="text-lg font-semibold">
                        {(kpi.masteryRate * 100).toFixed(1)}%
                      </div>
                      <Progress value={kpi.masteryRate * 100} className="h-2 mt-1" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Completion Rate</div>
                      <div className="text-lg font-semibold">
                        {(kpi.completionRate * 100).toFixed(1)}%
                      </div>
                      <Progress value={kpi.completionRate * 100} className="h-2 mt-1" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Engagement</div>
                      <div className="text-lg font-semibold">
                        {(kpi.engagementScore * 100).toFixed(1)}%
                      </div>
                      <Progress value={kpi.engagementScore * 100} className="h-2 mt-1" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Retention</div>
                      <div className="text-lg font-semibold">
                        {(kpi.retentionRate * 100).toFixed(1)}%
                      </div>
                      <Progress value={kpi.retentionRate * 100} className="h-2 mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </TabsContent>

        {/* Guardian Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {guardianInsights.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Guardian Insights Yet</h3>
              <p className="text-gray-500 mb-4">
                Guardian insights will appear here once AI generates recommendations based on student learning data.
              </p>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 max-w-md mx-auto">
                <h4 className="font-medium text-purple-900 mb-2">What are Guardian Insights?</h4>
                <ul className="text-sm text-purple-800 space-y-1 text-left">
                  <li>• AI-generated actionable recommendations for parents</li>
                  <li>• Learning progress insights and early warning signals</li>
                  <li>• Study habit recommendations and home support strategies</li>
                  <li>• Priority-based insights with action tracking</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {guardianInsights.map((insight) => (
              <Card key={insight.id} className={insight.isRead ? 'opacity-75' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getInsightTypeIcon(insight.insightType)}
                      {insight.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(insight.priority)}>
                        {insight.priority}
                      </Badge>
                      {insight.isRead && (
                        <Badge variant="outline">Read</Badge>
                      )}
                      {insight.actionTaken && (
                        <Badge variant="default">Action Taken</Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>
                    For {insight.student.name} • {new Date(insight.generatedAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{insight.description}</p>
                  
                  {insight.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Recommendations:</h4>
                      <ul className="space-y-1">
                        {insight.recommendations.map((recommendation, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
