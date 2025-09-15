"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Edit, 
  //Trash2, 
  Eye, 
  Download, 
  Upload,
  Users,
  //Clock,
  Target,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  BookMarked,
  GraduationCap,
  Calendar,
  BarChart3,
  Settings,
  Copy,
  Archive
} from 'lucide-react';

export default function AdminCurriculumPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Mock data for curriculum
  const subjects = [
    {
      id: 1,
      name: 'Mathematics',
      description: 'Comprehensive mathematics curriculum covering algebra, geometry, and calculus',
      level: 'high_school',
      status: 'active',
      students: 150,
      teachers: 3,
      lessons: 45,
      assessments: 12,
      completionRate: 85,
      lastUpdated: '2024-01-15',
      createdBy: 'Dr. Ahmed Al-Rashid',
      topics: ['Algebra', 'Geometry', 'Trigonometry', 'Calculus', 'Statistics']
    },
    {
      id: 2,
      name: 'Physics',
      description: 'Physics curriculum covering mechanics, thermodynamics, and modern physics',
      level: 'high_school',
      status: 'active',
      students: 120,
      teachers: 2,
      lessons: 38,
      assessments: 10,
      completionRate: 78,
      lastUpdated: '2024-01-10',
      createdBy: 'Prof. Layla Mahmoud',
      topics: ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Optics', 'Modern Physics']
    },
    {
      id: 3,
      name: 'Chemistry',
      description: 'Chemistry curriculum covering organic, inorganic, and physical chemistry',
      level: 'high_school',
      status: 'active',
      students: 100,
      teachers: 2,
      lessons: 42,
      assessments: 11,
      completionRate: 72,
      lastUpdated: '2024-01-08',
      createdBy: 'Dr. Omar Khalil',
      topics: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Analytical Chemistry']
    },
    {
      id: 4,
      name: 'Biology',
      description: 'Biology curriculum covering cell biology, genetics, and ecology',
      level: 'high_school',
      status: 'active',
      students: 95,
      teachers: 2,
      lessons: 40,
      assessments: 9,
      completionRate: 80,
      lastUpdated: '2024-01-12',
      createdBy: 'Dr. Fatima Hassan',
      topics: ['Cell Biology', 'Genetics', 'Ecology', 'Evolution', 'Human Biology']
    },
    {
      id: 5,
      name: 'English Literature',
      description: 'English literature curriculum covering classic and modern works',
      level: 'high_school',
      status: 'draft',
      students: 0,
      teachers: 1,
      lessons: 25,
      assessments: 6,
      completionRate: 0,
      lastUpdated: '2024-01-20',
      createdBy: 'Ms. Sarah Johnson',
      topics: ['Classic Literature', 'Modern Literature', 'Poetry', 'Drama', 'Literary Analysis']
    },
    {
      id: 6,
      name: 'Arabic Language',
      description: 'Arabic language curriculum covering grammar, literature, and composition',
      level: 'middle_school',
      status: 'active',
      students: 200,
      teachers: 4,
      lessons: 60,
      assessments: 15,
      completionRate: 88,
      lastUpdated: '2024-01-05',
      createdBy: 'Dr. Youssef Ibrahim',
      topics: ['Grammar', 'Literature', 'Composition', 'Poetry', 'Classical Arabic']
    }
  ];

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || subject.level === selectedLevel;
    const matchesStatus = selectedStatus === 'all' || subject.status === selectedStatus;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'elementary': return 'bg-green-100 text-green-800';
      case 'middle_school': return 'bg-blue-100 text-blue-800';
      case 'high_school': return 'bg-purple-100 text-purple-800';
      case 'college': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'draft': return <Edit className="w-4 h-4 text-yellow-500" />;
      case 'archived': return <Archive className="w-4 h-4 text-gray-500" />;
      case 'under_review': return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const curriculumStats = {
    totalSubjects: subjects.length,
    activeSubjects: subjects.filter(s => s.status === 'active').length,
    totalStudents: subjects.reduce((acc, s) => acc + s.students, 0),
    totalTeachers: subjects.reduce((acc, s) => acc + s.teachers, 0),
    totalLessons: subjects.reduce((acc, s) => acc + s.lessons, 0),
    averageCompletion: Math.round(subjects.reduce((acc, s) => acc + s.completionRate, 0) / subjects.length)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-violet-600" />
              Curriculum Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage and oversee all curriculum subjects, lessons, and educational content
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import Curriculum
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Data
            </Button>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Subject
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Subjects</p>
                  <p className="text-xl font-bold text-gray-900">{curriculumStats.totalSubjects}</p>
                </div>
                <BookOpen className="w-6 h-6 text-gray-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Subjects</p>
                  <p className="text-xl font-bold text-green-600">{curriculumStats.activeSubjects}</p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-xl font-bold text-blue-600">{curriculumStats.totalStudents}</p>
                </div>
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Teachers</p>
                  <p className="text-xl font-bold text-purple-600">{curriculumStats.totalTeachers}</p>
                </div>
                <GraduationCap className="w-6 h-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Lessons</p>
                  <p className="text-xl font-bold text-orange-600">{curriculumStats.totalLessons}</p>
                </div>
                <BookMarked className="w-6 h-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Completion</p>
                  <p className="text-xl font-bold text-indigo-600">{curriculumStats.averageCompletion}%</p>
                </div>
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search subjects by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedLevel === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedLevel('all')}
                >
                  All Levels
                </Button>
                <Button
                  variant={selectedLevel === 'elementary' ? 'default' : 'outline'}
                  onClick={() => setSelectedLevel('elementary')}
                >
                  Elementary
                </Button>
                <Button
                  variant={selectedLevel === 'middle_school' ? 'default' : 'outline'}
                  onClick={() => setSelectedLevel('middle_school')}
                >
                  Middle School
                </Button>
                <Button
                  variant={selectedLevel === 'high_school' ? 'default' : 'outline'}
                  onClick={() => setSelectedLevel('high_school')}
                >
                  High School
                </Button>
                <Button
                  variant={selectedLevel === 'college' ? 'default' : 'outline'}
                  onClick={() => setSelectedLevel('college')}
                >
                  College
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus('all')}
                >
                  All Status
                </Button>
                <Button
                  variant={selectedStatus === 'active' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus('active')}
                >
                  Active
                </Button>
                <Button
                  variant={selectedStatus === 'draft' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus('draft')}
                >
                  Draft
                </Button>
                <Button
                  variant={selectedStatus === 'under_review' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus('under_review')}
                >
                  Under Review
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Curriculum List */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed View</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="management">Management</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4">
              {filteredSubjects.map((subject) => (
                <Card key={subject.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-xl text-gray-900">{subject.name}</h3>
                          <Badge className={getLevelColor(subject.level)}>
                            {subject.level.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(subject.status)}>
                            {getStatusIcon(subject.status)}
                            <span className="ml-1 capitalize">{subject.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{subject.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Created by: {subject.createdBy}</span>
                          <span>Last updated: {subject.lastUpdated}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Students</p>
                          <p className="text-xl font-bold text-blue-600">{subject.students}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Teachers</p>
                          <p className="text-xl font-bold text-purple-600">{subject.teachers}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Lessons</p>
                          <p className="text-xl font-bold text-orange-600">{subject.lessons}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Completion</p>
                          <p className="text-xl font-bold text-green-600">{subject.completionRate}%</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {subject.topics.map((topic, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Target className="w-4 h-4" />
                          <span>{subject.assessments} assessments</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-4">
            <div className="grid gap-4">
              {filteredSubjects.map((subject) => (
                <Card key={subject.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{subject.name}</h3>
                        <p className="text-gray-600">{subject.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getLevelColor(subject.level)}>
                          {subject.level.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(subject.status)}>
                          {getStatusIcon(subject.status)}
                          <span className="ml-1 capitalize">{subject.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Students</p>
                        <p className="text-xl font-bold text-blue-600">{subject.students}</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600">Teachers</p>
                        <p className="text-xl font-bold text-purple-600">{subject.teachers}</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-sm text-gray-600">Lessons</p>
                        <p className="text-xl font-bold text-orange-600">{subject.lessons}</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Completion</p>
                        <p className="text-xl font-bold text-green-600">{subject.completionRate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Subject Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredSubjects.map((subject) => (
                      <div key={subject.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span className="font-medium">{subject.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{subject.completionRate}%</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${subject.completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Enrollment Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Enrollment trends chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="management" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Curriculum Management Tools</CardTitle>
                <CardDescription>
                  Tools for managing and maintaining curriculum content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Plus className="w-6 h-6" />
                    <span>Create Subject</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Copy className="w-6 h-6" />
                    <span>Duplicate Subject</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Upload className="w-6 h-6" />
                    <span>Import Content</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Download className="w-6 h-6" />
                    <span>Export All</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Calendar className="w-6 h-6" />
                    <span>Schedule Review</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Archive className="w-6 h-6" />
                    <span>Archive Old</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Settings className="w-6 h-6" />
                    <span>Bulk Settings</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <BarChart3 className="w-6 h-6" />
                    <span>Generate Report</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
