'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  TrendingUp, 
  Brain, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  BookOpen,
  Clock,
  RefreshCw,
  Eye,
  EyeOff,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { useTranslations } from '@/lib/useTranslations';

interface GuardianInsight {
  id: string;
  insightType: string;
  title: string;
  description: string;
  recommendations: string[];
  priority: string;
  isRead: boolean;
  actionTaken: boolean;
  actionNotes?: string;
  effectiveness?: number;
  generatedAt: string;
  expiresAt?: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
}

interface StudentSummary {
  studentId: string;
  studentName: string;
  totalInsights: number;
  unreadInsights: number;
  highPriorityInsights: number;
  recentInsights: GuardianInsight[];
}

export default function GuardianInsightsDashboard() {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  
  // Data states
  const [insights, setInsights] = useState<GuardianInsight[]>([]);
  const [studentSummaries, setStudentSummaries] = useState<StudentSummary[]>([]);
  const [actionNotes, setActionNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadGuardianInsights();
  }, [selectedStudent]);

  const loadGuardianInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/guardian-insights');
      const data = await response.json();
      
      if (data.success) {
        setInsights(data.data);
        
        // Create student summaries
        const summaries = createStudentSummaries(data.data);
        setStudentSummaries(summaries);
      }
    } catch (error) {
      console.error('Error loading guardian insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const createStudentSummaries = (insights: GuardianInsight[]): StudentSummary[] => {
    const studentMap = new Map<string, StudentSummary>();
    
    insights.forEach(insight => {
      const studentId = insight.student.id;
      
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          studentId,
          studentName: insight.student.name,
          totalInsights: 0,
          unreadInsights: 0,
          highPriorityInsights: 0,
          recentInsights: []
        });
      }
      
      const summary = studentMap.get(studentId)!;
      summary.totalInsights++;
      
      if (!insight.isRead) {
        summary.unreadInsights++;
      }
      
      if (insight.priority === 'HIGH' || insight.priority === 'URGENT') {
        summary.highPriorityInsights++;
      }
      
      summary.recentInsights.push(insight);
    });
    
    // Sort recent insights by date
    studentMap.forEach(summary => {
      summary.recentInsights.sort((a, b) => 
        new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
      );
    });
    
    return Array.from(studentMap.values());
  };

  const markAsRead = async (insightId: string) => {
    try {
      const response = await fetch('/api/analytics/guardian-insights', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          insightId,
          isRead: true
        })
      });
      
      if (response.ok) {
        setInsights(prev => 
          prev.map(insight => 
            insight.id === insightId ? { ...insight, isRead: true } : insight
          )
        );
      }
    } catch (error) {
      console.error('Error marking insight as read:', error);
    }
  };

  const markActionTaken = async (insightId: string, actionNotes?: string) => {
    try {
      const response = await fetch('/api/analytics/guardian-insights', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          insightId,
          actionTaken: true,
          actionNotes
        })
      });
      
      if (response.ok) {
        setInsights(prev => 
          prev.map(insight => 
            insight.id === insightId 
              ? { ...insight, actionTaken: true, actionNotes } 
              : insight
          )
        );
        setActionNotes(prev => ({ ...prev, [insightId]: '' }));
      }
    } catch (error) {
      console.error('Error marking action taken:', error);
    }
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
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case 'ACADEMIC_PROGRESS': return 'text-blue-600';
      case 'LEARNING_STYLE': return 'text-purple-600';
      case 'ENGAGEMENT_LEVEL': return 'text-green-600';
      case 'STRUGGLING_AREAS': return 'text-red-600';
      case 'STRENGTH_AREAS': return 'text-green-600';
      case 'STUDY_HABITS': return 'text-orange-600';
      case 'MOTIVATION_LEVEL': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const filteredInsights = selectedStudent === 'all' 
    ? insights 
    : insights.filter(insight => insight.student.id === selectedStudent);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading guardian insights...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Guardian Insights Dashboard</h1>
          <p className="text-muted-foreground">
            AI-powered insights and recommendations for supporting student learning
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={selectedStudent} 
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Students</option>
            {studentSummaries.map(summary => (
              <option key={summary.studentId} value={summary.studentId}>
                {summary.studentName}
              </option>
            ))}
          </select>
          <Button onClick={loadGuardianInsights}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.length}</div>
            <p className="text-xs text-muted-foreground">
              Generated insights
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Insights</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.filter(i => !i.isRead).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.filter(i => i.priority === 'HIGH' || i.priority === 'URGENT').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Urgent insights
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions Taken</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.filter(i => i.actionTaken).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed actions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">All Insights</TabsTrigger>
          <TabsTrigger value="students">By Student</TabsTrigger>
          <TabsTrigger value="actions">Action Items</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Insights</CardTitle>
                <CardDescription>
                  Latest AI-generated insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredInsights.slice(0, 5).map((insight) => (
                  <div key={insight.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={getInsightTypeColor(insight.insightType)}>
                          {getInsightTypeIcon(insight.insightType)}
                        </span>
                        <h4 className="font-medium">{insight.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(insight.priority)}>
                          {insight.priority}
                        </Badge>
                        {!insight.isRead && (
                          <Badge variant="outline">New</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      For {insight.student.name}
                    </p>
                    <p className="text-sm line-clamp-2">
                      {insight.description}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Student Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Student Summary</CardTitle>
                <CardDescription>
                  Insights by student
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {studentSummaries.map((summary) => (
                  <div key={summary.studentId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{summary.studentName}</h4>
                      <Badge variant="outline">
                        {summary.totalInsights} insights
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Unread</span>
                        <div className="font-medium">{summary.unreadInsights}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">High Priority</span>
                        <div className="font-medium">{summary.highPriorityInsights}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* All Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="space-y-4">
            {filteredInsights.map((insight) => (
              <Card key={insight.id} className={insight.isRead ? 'opacity-75' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <span className={getInsightTypeColor(insight.insightType)}>
                        {getInsightTypeIcon(insight.insightType)}
                      </span>
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
                  <CardDescription className="flex items-center gap-4">
                    <span>For {insight.student.name}</span>
                    <span>•</span>
                    <span>{new Date(insight.generatedAt).toLocaleDateString()}</span>
                    {insight.expiresAt && (
                      <>
                        <span>•</span>
                        <span>Expires {new Date(insight.expiresAt).toLocaleDateString()}</span>
                      </>
                    )}
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

                  {insight.actionNotes && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-1">Action Notes:</h4>
                      <p className="text-sm text-blue-800">{insight.actionNotes}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {!insight.isRead && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => markAsRead(insight.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Mark as Read
                      </Button>
                    )}
                    
                    {!insight.actionTaken && (
                      <Button 
                        size="sm"
                        onClick={() => markActionTaken(insight.id, actionNotes[insight.id])}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Action Taken
                      </Button>
                    )}
                  </div>

                  {!insight.actionTaken && (
                    <div className="mt-4">
                      <Textarea
                        placeholder="Add notes about actions taken..."
                        value={actionNotes[insight.id] || ''}
                        onChange={(e) => setActionNotes(prev => ({
                          ...prev,
                          [insight.id]: e.target.value
                        }))}
                        className="min-h-[80px]"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* By Student Tab */}
        <TabsContent value="students" className="space-y-6">
          <div className="space-y-6">
            {studentSummaries.map((summary) => (
              <Card key={summary.studentId}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{summary.studentName}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{summary.totalInsights} insights</Badge>
                      {summary.unreadInsights > 0 && (
                        <Badge variant="destructive">{summary.unreadInsights} unread</Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {summary.recentInsights.slice(0, 3).map((insight) => (
                    <div key={insight.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={getInsightTypeColor(insight.insightType)}>
                            {getInsightTypeIcon(insight.insightType)}
                          </span>
                          <h4 className="font-medium">{insight.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityColor(insight.priority)}>
                            {insight.priority}
                          </Badge>
                          {insight.actionTaken && (
                            <Badge variant="default">Action Taken</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(insight.generatedAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm line-clamp-2">
                        {insight.description}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Action Items Tab */}
        <TabsContent value="actions" className="space-y-6">
          <div className="space-y-4">
            {filteredInsights
              .filter(insight => !insight.actionTaken)
              .sort((a, b) => {
                const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
                return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                       (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
              })
              .map((insight) => (
                <Card key={insight.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <span className={getInsightTypeColor(insight.insightType)}>
                          {getInsightTypeIcon(insight.insightType)}
                        </span>
                        {insight.title}
                      </CardTitle>
                      <Badge variant={getPriorityColor(insight.priority)}>
                        {insight.priority}
                      </Badge>
                    </div>
                    <CardDescription>
                      For {insight.student.name} • {new Date(insight.generatedAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{insight.description}</p>
                    
                    {insight.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Action Items:</h4>
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

                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm"
                        onClick={() => markActionTaken(insight.id, actionNotes[insight.id])}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Action Taken
                      </Button>
                    </div>

                    <div>
                      <Textarea
                        placeholder="Add notes about actions taken..."
                        value={actionNotes[insight.id] || ''}
                        onChange={(e) => setActionNotes(prev => ({
                          ...prev,
                          [insight.id]: e.target.value
                        }))}
                        className="min-h-[80px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
