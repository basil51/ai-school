"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BookOpen, 
  Award,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Download,
  Filter,
  Calendar,
  PieChart,
  LineChart,
  Activity,
  GraduationCap,
  UserCheck,
  BookMarked,
  Star,
  Zap
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  // Mock data for school analytics
  const schoolStats = {
    totalStudents: 450,
    totalTeachers: 25,
    totalSubjects: 12,
    averageAttendance: 92,
    averagePerformance: 78,
    completionRate: 85,
    satisfactionScore: 4.2,
    activeUsers: 420
  };

  const performanceMetrics = [
    {
      metric: 'Student Performance',
      value: 78,
      change: 5.2,
      trend: 'up',
      target: 80,
      icon: TrendingUp
    },
    {
      metric: 'Attendance Rate',
      value: 92,
      change: 2.1,
      trend: 'up',
      target: 95,
      icon: UserCheck
    },
    {
      metric: 'Course Completion',
      value: 85,
      change: -1.5,
      trend: 'down',
      target: 90,
      icon: BookMarked
    },
    {
      metric: 'Teacher Satisfaction',
      value: 4.2,
      change: 0.3,
      trend: 'up',
      target: 4.5,
      icon: Star
    },
    {
      metric: 'System Uptime',
      value: 99.8,
      change: 0.1,
      trend: 'up',
      target: 99.9,
      icon: Zap
    },
    {
      metric: 'Parent Engagement',
      value: 76,
      change: 3.2,
      trend: 'up',
      target: 80,
      icon: Users
    }
  ];

  const subjectPerformance = [
    {
      subject: 'Mathematics',
      students: 150,
      averageScore: 82,
      completionRate: 88,
      trend: 'up',
      teachers: 3
    },
    {
      subject: 'Physics',
      students: 120,
      averageScore: 75,
      completionRate: 78,
      trend: 'up',
      teachers: 2
    },
    {
      subject: 'Chemistry',
      students: 100,
      averageScore: 71,
      completionRate: 74,
      trend: 'down',
      teachers: 2
    },
    {
      subject: 'Biology',
      students: 95,
      averageScore: 84,
      completionRate: 87,
      trend: 'up',
      teachers: 2
    },
    {
      subject: 'English',
      students: 200,
      averageScore: 79,
      completionRate: 82,
      trend: 'up',
      teachers: 4
    },
    {
      subject: 'Arabic',
      students: 200,
      averageScore: 86,
      completionRate: 91,
      trend: 'up',
      teachers: 4
    }
  ];

  const teacherPerformance = [
    {
      name: 'Dr. Ahmed Al-Rashid',
      subject: 'Mathematics',
      students: 50,
      averageScore: 88,
      satisfaction: 4.5,
      attendance: 95,
      trend: 'up'
    },
    {
      name: 'Prof. Layla Mahmoud',
      subject: 'Physics',
      students: 40,
      averageScore: 82,
      satisfaction: 4.3,
      attendance: 92,
      trend: 'up'
    },
    {
      name: 'Dr. Omar Khalil',
      subject: 'Chemistry',
      students: 35,
      averageScore: 75,
      satisfaction: 4.1,
      attendance: 88,
      trend: 'down'
    },
    {
      name: 'Dr. Fatima Hassan',
      subject: 'Biology',
      students: 38,
      averageScore: 85,
      satisfaction: 4.4,
      attendance: 94,
      trend: 'up'
    }
  ];

  const recentActivities = [
    {
      type: 'performance_improvement',
      description: 'Mathematics class showed 5% improvement in average scores',
      timestamp: '2 hours ago',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      type: 'attendance_alert',
      description: 'Chemistry class attendance dropped below 85%',
      timestamp: '4 hours ago',
      icon: AlertTriangle,
      color: 'text-yellow-600'
    },
    {
      type: 'completion_milestone',
      description: 'Biology course reached 90% completion rate',
      timestamp: '1 day ago',
      icon: CheckCircle,
      color: 'text-blue-600'
    },
    {
      type: 'teacher_feedback',
      description: 'New teacher onboarding completed successfully',
      timestamp: '2 days ago',
      icon: UserCheck,
      color: 'text-purple-600'
    }
  ];

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? 
      <TrendingUp className="w-4 h-4 text-green-500" /> : 
      <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getTrendColor = (trend: string) => {
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-orange-600" />
              School Analytics
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive analytics and insights for your school's performance
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
            <Button className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Schedule Report
            </Button>
          </div>
        </div>

        {/* Period and Metric Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex gap-2">
                <Button
                  variant={selectedPeriod === 'week' ? 'default' : 'outline'}
                  onClick={() => setSelectedPeriod('week')}
                >
                  This Week
                </Button>
                <Button
                  variant={selectedPeriod === 'month' ? 'default' : 'outline'}
                  onClick={() => setSelectedPeriod('month')}
                >
                  This Month
                </Button>
                <Button
                  variant={selectedPeriod === 'quarter' ? 'default' : 'outline'}
                  onClick={() => setSelectedPeriod('quarter')}
                >
                  This Quarter
                </Button>
                <Button
                  variant={selectedPeriod === 'year' ? 'default' : 'outline'}
                  onClick={() => setSelectedPeriod('year')}
                >
                  This Year
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedMetric === 'overview' ? 'default' : 'outline'}
                  onClick={() => setSelectedMetric('overview')}
                >
                  Overview
                </Button>
                <Button
                  variant={selectedMetric === 'performance' ? 'default' : 'outline'}
                  onClick={() => setSelectedMetric('performance')}
                >
                  Performance
                </Button>
                <Button
                  variant={selectedMetric === 'engagement' ? 'default' : 'outline'}
                  onClick={() => setSelectedMetric('engagement')}
                >
                  Engagement
                </Button>
                <Button
                  variant={selectedMetric === 'system' ? 'default' : 'outline'}
                  onClick={() => setSelectedMetric('system')}
                >
                  System Health
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{schoolStats.totalStudents}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Teachers</p>
                  <p className="text-2xl font-bold text-green-600">{schoolStats.totalTeachers}</p>
                </div>
                <GraduationCap className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Performance</p>
                  <p className="text-2xl font-bold text-purple-600">{schoolStats.averagePerformance}%</p>
                </div>
                <Target className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Satisfaction Score</p>
                  <p className="text-2xl font-bold text-orange-600">{schoolStats.satisfactionScore}/5</p>
                </div>
                <Star className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="subjects">By Subject</TabsTrigger>
            <TabsTrigger value="teachers">By Teacher</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Key Performance Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {performanceMetrics.map((metric, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <metric.icon className="w-5 h-5 text-blue-600" />
                          <span className="font-medium">{metric.metric}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">{metric.value}{metric.metric.includes('Score') ? '/5' : metric.metric.includes('Uptime') ? '%' : '%'}</span>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(metric.trend)}
                            <span className={`text-sm ${getTrendColor(metric.trend)}`}>
                              {metric.change > 0 ? '+' : ''}{metric.change}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <activity.icon className={`w-5 h-5 mt-0.5 ${activity.color}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="w-5 h-5" />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Performance trends chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Subject Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Subject distribution chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4">
              {performanceMetrics.map((metric, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <metric.icon className="w-6 h-6 text-blue-600" />
                        <div>
                          <h3 className="text-lg font-semibold">{metric.metric}</h3>
                          <p className="text-gray-600">Target: {metric.target}{metric.metric.includes('Score') ? '/5' : metric.metric.includes('Uptime') ? '%' : '%'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{metric.value}{metric.metric.includes('Score') ? '/5' : metric.metric.includes('Uptime') ? '%' : '%'}</span>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(metric.trend)}
                          <span className={`text-sm ${getTrendColor(metric.trend)}`}>
                            {metric.change > 0 ? '+' : ''}{metric.change}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(metric.value / metric.target) * 100}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-4">
            <div className="grid gap-4">
              {subjectPerformance.map((subject, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{subject.subject}</h3>
                        <p className="text-gray-600">{subject.students} students • {subject.teachers} teachers</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={subject.trend === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {subject.trend === 'up' ? 'Improving' : 'Declining'}
                        </Badge>
                        {getTrendIcon(subject.trend)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Avg. Score</p>
                        <p className="text-xl font-bold text-blue-600">{subject.averageScore}%</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Completion</p>
                        <p className="text-xl font-bold text-green-600">{subject.completionRate}%</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600">Students</p>
                        <p className="text-xl font-bold text-purple-600">{subject.students}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="teachers" className="space-y-4">
            <div className="grid gap-4">
              {teacherPerformance.map((teacher, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{teacher.name}</h3>
                        <p className="text-gray-600">{teacher.subject} • {teacher.students} students</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={teacher.trend === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {teacher.trend === 'up' ? 'Improving' : 'Declining'}
                        </Badge>
                        {getTrendIcon(teacher.trend)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Avg. Score</p>
                        <p className="text-xl font-bold text-blue-600">{teacher.averageScore}%</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Satisfaction</p>
                        <p className="text-xl font-bold text-green-600">{teacher.satisfaction}/5</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600">Attendance</p>
                        <p className="text-xl font-bold text-purple-600">{teacher.attendance}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
