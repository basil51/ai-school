"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Search, 
  //Filter, 
  Mail, 
  MessageCircle, 
  //BookOpen, 
  TrendingUp, 
  Clock,
  //Star,
  //Award,
  AlertCircle,
  CheckCircle,
  UserPlus,
  Download
} from 'lucide-react';

export default function TeacherStudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Mock data for students
  const students = [
    {
      id: 1,
      name: 'Ahmed Al-Rashid',
      email: 'ahmed.rashid@school.edu',
      avatar: '/avatars/ahmed.jpg',
      grade: 'Grade 10',
      subjects: ['Mathematics', 'Physics', 'Chemistry'],
      progress: 85,
      lastActive: '2 hours ago',
      status: 'active',
      performance: 'excellent',
      achievements: 12,
      upcomingAssessments: 2,
      attendance: 95
    },
    {
      id: 2,
      name: 'Fatima Hassan',
      email: 'fatima.hassan@school.edu',
      avatar: '/avatars/fatima.jpg',
      grade: 'Grade 10',
      subjects: ['Mathematics', 'Biology', 'English'],
      progress: 72,
      lastActive: '1 day ago',
      status: 'active',
      performance: 'good',
      achievements: 8,
      upcomingAssessments: 1,
      attendance: 88
    },
    {
      id: 3,
      name: 'Omar Khalil',
      email: 'omar.khalil@school.edu',
      avatar: '/avatars/omar.jpg',
      grade: 'Grade 9',
      subjects: ['Mathematics', 'Physics'],
      progress: 45,
      lastActive: '3 days ago',
      status: 'needs_attention',
      performance: 'struggling',
      achievements: 3,
      upcomingAssessments: 3,
      attendance: 75
    },
    {
      id: 4,
      name: 'Layla Mahmoud',
      email: 'layla.mahmoud@school.edu',
      avatar: '/avatars/layla.jpg',
      grade: 'Grade 10',
      subjects: ['Mathematics', 'Chemistry', 'Biology'],
      progress: 91,
      lastActive: '30 minutes ago',
      status: 'active',
      performance: 'excellent',
      achievements: 15,
      upcomingAssessments: 1,
      attendance: 98
    },
    {
      id: 5,
      name: 'Youssef Ibrahim',
      email: 'youssef.ibrahim@school.edu',
      avatar: '/avatars/youssef.jpg',
      grade: 'Grade 9',
      subjects: ['Mathematics', 'Physics', 'Chemistry'],
      progress: 68,
      lastActive: '1 day ago',
      status: 'active',
      performance: 'average',
      achievements: 6,
      upcomingAssessments: 2,
      attendance: 82
    }
  ];

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || student.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'average': return 'text-yellow-600 bg-yellow-50';
      case 'struggling': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'needs_attention': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              My Students
            </h1>
            <p className="text-gray-600 mt-2">
              Manage and monitor your students&#39; progress and performance
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Data
            </Button>
            <Button className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Add Student
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Students</p>
                  <p className="text-2xl font-bold text-green-600">
                    {students.filter(s => s.status === 'active').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Needs Attention</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {students.filter(s => s.status === 'needs_attention').length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Progress</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(students.reduce((acc, s) => acc + s.progress, 0) / students.length)}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search students by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={selectedFilter === 'active' ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter('active')}
                >
                  Active
                </Button>
                <Button
                  variant={selectedFilter === 'needs_attention' ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter('needs_attention')}
                >
                  Needs Attention
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={student.avatar} alt={student.name} />
                          <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{student.name}</h3>
                          <p className="text-gray-600">{student.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{student.grade}</Badge>
                            {getStatusIcon(student.status)}
                            <span className="text-sm text-gray-500">Last active: {student.lastActive}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Progress</p>
                          <p className="text-xl font-bold text-blue-600">{student.progress}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Attendance</p>
                          <p className="text-xl font-bold text-green-600">{student.attendance}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Achievements</p>
                          <p className="text-xl font-bold text-purple-600">{student.achievements}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {student.subjects.map((subject, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                        <Badge className={getPerformanceColor(student.performance)}>
                          {student.performance.charAt(0).toUpperCase() + student.performance.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4">
              {filteredStudents.map((student) => (
                <Card key={student.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={student.avatar} alt={student.name} />
                          <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{student.name}</h3>
                          <p className="text-sm text-gray-600">{student.grade}</p>
                        </div>
                      </div>
                      <Badge className={getPerformanceColor(student.performance)}>
                        {student.performance.charAt(0).toUpperCase() + student.performance.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Overall Progress</p>
                        <p className="text-2xl font-bold text-blue-600">{student.progress}%</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Attendance</p>
                        <p className="text-2xl font-bold text-green-600">{student.attendance}%</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600">Achievements</p>
                        <p className="text-2xl font-bold text-purple-600">{student.achievements}</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-sm text-gray-600">Upcoming Tests</p>
                        <p className="text-2xl font-bold text-orange-600">{student.upcomingAssessments}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="communication" className="space-y-4">
            <div className="grid gap-4">
              {filteredStudents.map((student) => (
                <Card key={student.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={student.avatar} alt={student.name} />
                          <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{student.name}</h3>
                          <p className="text-sm text-gray-600">{student.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Mail className="w-4 h-4 mr-2" />
                          Email
                        </Button>
                        <Button variant="outline" size="sm">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Chat
                        </Button>
                        <Button size="sm">
                          Schedule Meeting
                        </Button>
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
