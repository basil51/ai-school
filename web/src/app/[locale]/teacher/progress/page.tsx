"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  LineChart
} from 'lucide-react';

export default function TeacherProgressPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Mock data for class progress
  const classStats = {
    totalStudents: 25,
    averageProgress: 78,
    completionRate: 85,
    averageScore: 82,
    attendanceRate: 92,
    strugglingStudents: 3,
    excellingStudents: 8
  };

  const subjectProgress = [
    {
      subject: 'Mathematics',
      progress: 85,
      averageScore: 88,
      completionRate: 92,
      students: 25,
      trend: 'up'
    },
    {
      subject: 'Physics',
      progress: 72,
      averageScore: 75,
      completionRate: 78,
      students: 20,
      trend: 'up'
    },
    {
      subject: 'Chemistry',
      progress: 68,
      averageScore: 71,
      completionRate: 74,
      students: 18,
      trend: 'down'
    },
    {
      subject: 'Biology',
      progress: 81,
      averageScore: 84,
      completionRate: 87,
      students: 22,
      trend: 'up'
    }
  ];

  const studentProgress = [
    {
      name: 'Ahmed Al-Rashid',
      overallProgress: 92,
      mathematics: 95,
      physics: 88,
      chemistry: 90,
      biology: 94,
      attendance: 98,
      status: 'excelling',
      lastActive: '2 hours ago'
    },
    {
      name: 'Fatima Hassan',
      overallProgress: 78,
      mathematics: 82,
      physics: 75,
      chemistry: 76,
      biology: 80,
      attendance: 88,
      status: 'good',
      lastActive: '1 day ago'
    },
    {
      name: 'Omar Khalil',
      overallProgress: 45,
      mathematics: 50,
      physics: 40,
      chemistry: 45,
      biology: 48,
      attendance: 75,
      status: 'struggling',
      lastActive: '3 days ago'
    },
    {
      name: 'Layla Mahmoud',
      overallProgress: 89,
      mathematics: 92,
      physics: 85,
      chemistry: 88,
      biology: 91,
      attendance: 96,
      status: 'excelling',
      lastActive: '30 minutes ago'
    },
    {
      name: 'Youssef Ibrahim',
      overallProgress: 65,
      mathematics: 70,
      physics: 60,
      chemistry: 65,
      biology: 68,
      attendance: 82,
      status: 'average',
      lastActive: '1 day ago'
    }
  ];

  const recentActivities = [
    {
      type: 'assessment_completed',
      student: 'Ahmed Al-Rashid',
      subject: 'Mathematics',
      score: 95,
      timestamp: '2 hours ago',
      icon: CheckCircle
    },
    {
      type: 'lesson_completed',
      student: 'Layla Mahmoud',
      subject: 'Physics',
      score: null,
      timestamp: '3 hours ago',
      icon: BookOpen
    },
    {
      type: 'struggling_alert',
      student: 'Omar Khalil',
      subject: 'Chemistry',
      score: 45,
      timestamp: '1 day ago',
      icon: AlertTriangle
    },
    {
      type: 'achievement_unlocked',
      student: 'Fatima Hassan',
      subject: 'Biology',
      score: null,
      timestamp: '2 days ago',
      icon: Award
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excelling': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'average': return 'text-yellow-600 bg-yellow-50';
      case 'struggling': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? 
      <TrendingUp className="w-4 h-4 text-green-500" /> : 
      <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              Class Progress
            </h1>
            <p className="text-gray-600 mt-2">
              Monitor and analyze your students&#39; academic progress and performance
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
              Schedule Review
            </Button>
          </div>
        </div>

        {/* Period and Subject Filters */}
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
                  variant={selectedPeriod === 'semester' ? 'default' : 'outline'}
                  onClick={() => setSelectedPeriod('semester')}
                >
                  This Semester
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedSubject === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedSubject('all')}
                >
                  All Subjects
                </Button>
                <Button
                  variant={selectedSubject === 'mathematics' ? 'default' : 'outline'}
                  onClick={() => setSelectedSubject('mathematics')}
                >
                  Mathematics
                </Button>
                <Button
                  variant={selectedSubject === 'physics' ? 'default' : 'outline'}
                  onClick={() => setSelectedSubject('physics')}
                >
                  Physics
                </Button>
                <Button
                  variant={selectedSubject === 'chemistry' ? 'default' : 'outline'}
                  onClick={() => setSelectedSubject('chemistry')}
                >
                  Chemistry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{classStats.totalStudents}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Progress</p>
                  <p className="text-2xl font-bold text-green-600">{classStats.averageProgress}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{classStats.completionRate}%</p>
                </div>
                <Target className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-orange-600">{classStats.averageScore}%</p>
                </div>
                <Award className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subjects">By Subject</TabsTrigger>
            <TabsTrigger value="students">By Student</TabsTrigger>
            <TabsTrigger value="activities">Recent Activities</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Class Performance Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="w-5 h-5" />
                    Class Performance Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Performance chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subject Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Subject Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {subjectProgress.map((subject, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span className="font-medium">{subject.subject}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{subject.progress}%</span>
                          {getTrendIcon(subject.trend)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">Excelling Students</p>
                  <p className="text-2xl font-bold text-green-600">{classStats.excellingStudents}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <p className="text-sm text-gray-600">Need Attention</p>
                  <p className="text-2xl font-bold text-yellow-600">{classStats.strugglingStudents}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600">Attendance Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{classStats.attendanceRate}%</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-4">
            <div className="grid gap-4">
              {subjectProgress.map((subject, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{subject.subject}</h3>
                        <p className="text-gray-600">{subject.students} students enrolled</p>
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
                        <p className="text-sm text-gray-600">Progress</p>
                        <p className="text-xl font-bold text-blue-600">{subject.progress}%</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Avg. Score</p>
                        <p className="text-xl font-bold text-green-600">{subject.averageScore}%</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600">Completion</p>
                        <p className="text-xl font-bold text-purple-600">{subject.completionRate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <div className="grid gap-4">
              {studentProgress.map((student, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{student.name}</h3>
                        <p className="text-gray-600">Last active: {student.lastActive}</p>
                      </div>
                      <Badge className={getStatusColor(student.status)}>
                        {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Overall</p>
                        <p className="text-xl font-bold text-blue-600">{student.overallProgress}%</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Math</p>
                        <p className="text-xl font-bold text-green-600">{student.mathematics}%</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600">Physics</p>
                        <p className="text-xl font-bold text-purple-600">{student.physics}%</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-sm text-gray-600">Chemistry</p>
                        <p className="text-xl font-bold text-orange-600">{student.chemistry}%</p>
                      </div>
                      <div className="text-center p-3 bg-pink-50 rounded-lg">
                        <p className="text-sm text-gray-600">Biology</p>
                        <p className="text-xl font-bold text-pink-600">{student.biology}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <div className="grid gap-4">
              {recentActivities.map((activity, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <activity.icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {activity.student} {activity.type.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {activity.subject} {activity.score && `• Score: ${activity.score}%`}
                        </p>
                      </div>
                      <span className="text-sm text-gray-500">{activity.timestamp}</span>
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
