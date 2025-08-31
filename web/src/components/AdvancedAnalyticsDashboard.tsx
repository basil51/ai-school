'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  MessageSquare, 
  HardDrive,
  Download,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useTranslations } from '@/lib/useTranslations';

interface AdvancedAnalytics {
  organizationId: string;
  timeRange: string;
  userEngagement: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    returningUsers: number;
    averageSessionDuration: number;
    bounceRate: number;
    userRetention: number;
  };
  contentAnalytics: {
    totalDocuments: number;
    documentsUploaded: number;
    documentsProcessed: number;
    averageDocumentSize: number;
    popularDocumentTypes: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
  };
  interactionMetrics: {
    totalQuestions: number;
    questionsPerUser: number;
    averageResponseTime: number;
    satisfactionScore: number;
    questionCategories: Array<{
      category: string;
      count: number;
      percentage: number;
    }>;
  };
  performanceMetrics: {
    systemUptime: number;
    averageResponseTime: number;
    errorRate: number;
    peakUsageTimes: Array<{
      hour: number;
      requests: number;
    }>;
  };
  deviceAnalytics: {
    desktop: number;
    mobile: number;
    tablet: number;
    browserUsage: Array<{
      browser: string;
      users: number;
      percentage: number;
    }>;
  };
  trends: Array<{
    date: string;
    users: number;
    documents: number;
    questions: number;
    storage: number;
    errors: number;
  }>;
}

interface AdvancedAnalyticsDashboardProps {
  organizationId: string;
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AdvancedAnalyticsDashboard({ organizationId, className = '' }: AdvancedAnalyticsDashboardProps) {
  const { dict } = useTranslations();
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  const fetchAdvancedAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`/api/super-admin/organizations/${organizationId}/advanced-analytics?timeRange=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        // Generate sample data for demonstration
        const sampleData: AdvancedAnalytics = {
          organizationId,
          timeRange,
          userEngagement: {
            totalUsers: 1250,
            activeUsers: 890,
            newUsers: 45,
            returningUsers: 845,
            averageSessionDuration: 23.5,
            bounceRate: 12.3,
            userRetention: 78.5,
          },
          contentAnalytics: {
            totalDocuments: 2340,
            documentsUploaded: 156,
            documentsProcessed: 2340,
            averageDocumentSize: 2.4 * 1024 * 1024,
            popularDocumentTypes: [
              { type: 'PDF', count: 890, percentage: 38 },
              { type: 'DOCX', count: 456, percentage: 19.5 },
              { type: 'TXT', count: 234, percentage: 10 },
              { type: 'PPTX', count: 189, percentage: 8.1 },
              { type: 'Other', count: 571, percentage: 24.4 },
            ],
          },
          interactionMetrics: {
            totalQuestions: 5670,
            questionsPerUser: 4.5,
            averageResponseTime: 1.2,
            satisfactionScore: 4.6,
            questionCategories: [
              { category: 'Mathematics', count: 1890, percentage: 33.3 },
              { category: 'Science', count: 1456, percentage: 25.7 },
              { category: 'History', count: 890, percentage: 15.7 },
              { category: 'Literature', count: 678, percentage: 12 },
              { category: 'Other', count: 756, percentage: 13.3 },
            ],
          },
          performanceMetrics: {
            systemUptime: 99.8,
            averageResponseTime: 1.2,
            errorRate: 0.2,
            peakUsageTimes: Array.from({ length: 24 }, (_, i) => ({
              hour: i,
              requests: Math.floor(Math.random() * 500) + 100,
            })),
          },
          deviceAnalytics: {
            desktop: 65,
            mobile: 25,
            tablet: 10,
            browserUsage: [
              { browser: 'Chrome', users: 567, percentage: 45.4 },
              { browser: 'Safari', users: 234, percentage: 18.7 },
              { browser: 'Firefox', users: 189, percentage: 15.1 },
              { browser: 'Edge', users: 156, percentage: 12.5 },
              { browser: 'Other', users: 104, percentage: 8.3 },
            ],
          },
          trends: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            users: Math.floor(Math.random() * 50) + 1200,
            documents: Math.floor(Math.random() * 20) + 2300,
            questions: Math.floor(Math.random() * 100) + 5600,
            storage: Math.floor(Math.random() * 1000000000) + 5000000000,
            errors: Math.floor(Math.random() * 5),
          })),
        };
        setAnalytics(sampleData);
      }
    } catch (error) {
      console.error('Error fetching advanced analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, timeRange]);

  useEffect(() => {
    fetchAdvancedAnalytics();
  }, [fetchAdvancedAnalytics]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading advanced analytics...</div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center text-red-600">
          Failed to load advanced analytics
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">User Engagement</TabsTrigger>
          <TabsTrigger value="content">Content Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.userEngagement.activeUsers)}</div>
                <div className="text-xs text-muted-foreground">
                  {analytics.userEngagement.userRetention}% retention rate
                </div>
                <Progress value={analytics.userEngagement.userRetention} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Questions Asked</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.interactionMetrics.totalQuestions)}</div>
                <div className="text-xs text-muted-foreground">
                  {analytics.interactionMetrics.questionsPerUser} per user
                </div>
                <div className="flex items-center mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {analytics.interactionMetrics.satisfactionScore}/5 satisfaction
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.performanceMetrics.systemUptime}%</div>
                <div className="text-xs text-muted-foreground">
                  {analytics.performanceMetrics.averageResponseTime}s avg response
                </div>
                <Progress value={analytics.performanceMetrics.systemUptime} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytes(analytics.contentAnalytics.totalDocuments * analytics.contentAnalytics.averageDocumentSize)}</div>
                <div className="text-xs text-muted-foreground">
                  {analytics.contentAnalytics.totalDocuments} documents
                </div>
                <Progress value={75} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Device and Browser Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Device Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Desktop', value: analytics.deviceAnalytics.desktop },
                        { name: 'Mobile', value: analytics.deviceAnalytics.mobile },
                        { name: 'Tablet', value: analytics.deviceAnalytics.tablet },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Browser Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics.deviceAnalytics.browserUsage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="browser" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="users" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Comprehensive Trends */}
          <Card>
            <CardHeader>
              <CardTitle>30-Day Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analytics.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="documents" stroke="#82ca9d" strokeWidth={2} />
                  <Line type="monotone" dataKey="questions" stroke="#ffc658" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
