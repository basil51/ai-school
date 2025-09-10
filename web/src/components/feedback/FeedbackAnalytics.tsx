'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  AlertTriangle,
  Star,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react';

interface FeedbackAnalytics {
  totalFeedback: number;
  averageRating: number;
  feedbackByType: Record<string, number>;
  feedbackByStatus: Record<string, number>;
  feedbackByPriority: Record<string, number>;
  feedbackByCategory: Record<string, number>;
  feedbackTrend: Array<{
    date: string;
    count: number;
    averageRating: number;
  }>;
  topIssues: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  responseTime: {
    average: number;
    median: number;
  };
}

const feedbackTypeColors = {
  bug_report: 'bg-red-100 text-red-800',
  feature_request: 'bg-blue-100 text-blue-800',
  improvement_suggestion: 'bg-green-100 text-green-800',
  general_feedback: 'bg-gray-100 text-gray-800',
  usability_issue: 'bg-yellow-100 text-yellow-800',
  accessibility_concern: 'bg-purple-100 text-purple-800',
  performance_issue: 'bg-orange-100 text-orange-800',
  content_feedback: 'bg-indigo-100 text-indigo-800',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_review: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  duplicate: 'bg-orange-100 text-orange-800',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export function FeedbackAnalytics() {
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      // This would typically call an analytics API endpoint
      // For now, we'll simulate the data
      const mockAnalytics: FeedbackAnalytics = {
        totalFeedback: 1247,
        averageRating: 4.2,
        feedbackByType: {
          bug_report: 156,
          feature_request: 234,
          improvement_suggestion: 189,
          general_feedback: 445,
          usability_issue: 123,
          accessibility_concern: 45,
          performance_issue: 34,
          content_feedback: 21,
        },
        feedbackByStatus: {
          pending: 89,
          in_review: 45,
          in_progress: 67,
          resolved: 892,
          closed: 123,
          duplicate: 31,
        },
        feedbackByPriority: {
          low: 234,
          medium: 567,
          high: 345,
          critical: 101,
        },
        feedbackByCategory: {
          'User Interface': 234,
          'Learning Experience': 345,
          'Assessment System': 123,
          'AI Teacher': 189,
          'Navigation': 67,
          'Performance': 89,
          'Accessibility': 45,
          'Content Quality': 78,
          'Mobile Experience': 56,
          'Other': 21,
        },
        feedbackTrend: [
          { date: '2024-01-01', count: 45, averageRating: 4.1 },
          { date: '2024-01-02', count: 52, averageRating: 4.2 },
          { date: '2024-01-03', count: 38, averageRating: 4.0 },
          { date: '2024-01-04', count: 61, averageRating: 4.3 },
          { date: '2024-01-05', count: 47, averageRating: 4.1 },
          { date: '2024-01-06', count: 55, averageRating: 4.4 },
          { date: '2024-01-07', count: 43, averageRating: 4.2 },
        ],
        topIssues: [
          { category: 'User Interface', count: 234, percentage: 18.8 },
          { category: 'Learning Experience', count: 345, percentage: 27.7 },
          { category: 'Assessment System', count: 123, percentage: 9.9 },
          { category: 'AI Teacher', count: 189, percentage: 15.2 },
          { category: 'Navigation', count: 67, percentage: 5.4 },
        ],
        responseTime: {
          average: 2.3,
          median: 1.8,
        },
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Feedback Analytics
          </CardTitle>
          <CardDescription>
            Insights and trends from user feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Time Range:</label>
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
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Feedback</p>
                <p className="text-2xl font-bold">{analytics.totalFeedback.toLocaleString()}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  {analytics.averageRating.toFixed(1)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold">{analytics.responseTime.average.toFixed(1)}d</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                <p className="text-2xl font-bold">
                  {((analytics.feedbackByStatus.resolved / analytics.totalFeedback) * 100).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(analytics.feedbackByType).map(([type, count]) => {
              const percentage = (count / analytics.totalFeedback) * 100;
              return (
                <div key={type} className="text-center">
                  <div className="text-2xl font-bold mb-1">{count}</div>
                  <Badge className={feedbackTypeColors[type as keyof typeof feedbackTypeColors]}>
                    {type.replace('_', ' ')}
                  </Badge>
                  <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Feedback by Status */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(analytics.feedbackByStatus).map(([status, count]) => {
              const percentage = (count / analytics.totalFeedback) * 100;
              return (
                <div key={status} className="text-center">
                  <div className="text-2xl font-bold mb-1">{count}</div>
                  <Badge className={statusColors[status as keyof typeof statusColors]}>
                    {status.replace('_', ' ')}
                  </Badge>
                  <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Top Issues by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topIssues.map((issue, index) => (
              <div key={issue.category} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{issue.category}</p>
                    <p className="text-sm text-gray-500">{issue.count} feedback items</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{issue.percentage.toFixed(1)}%</div>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${issue.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.feedbackTrend.map((day, index) => (
              <div key={day.date} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                    {new Date(day.date).getDate()}
                  </div>
                  <div>
                    <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-500">{day.count} feedback items</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {day.averageRating.toFixed(1)}
                  </div>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${(day.averageRating / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
