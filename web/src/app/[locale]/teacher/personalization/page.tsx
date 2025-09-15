"use client";
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import PersonalizationDashboard from '@/components/PersonalizationDashboard';
import DemoStudentSelector from '@/components/DemoStudentSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
//import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Users,
  User,
  Eye,
  BarChart3,
  Settings
} from 'lucide-react';

export default function TeacherPersonalizationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedStudentId, setSelectedStudentId] = useState<string>('demo-student-1');
  const [viewMode, setViewMode] = useState<'individual' | 'class'>('individual');

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Student Personalization - Teacher View
            </h1>
            <p className="text-xl text-gray-600">
              Monitor and analyze student learning patterns to optimize teaching strategies
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              Phase 16 - Personalization Engine
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
              TEACHER MODE
            </Badge>
          </div>
        </div>
      </div>

      {/* View Mode Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2 text-gray-600" />
            View Mode
          </CardTitle>
          <CardDescription>Choose how to view personalization data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="individual"
                name="viewMode"
                value="individual"
                checked={viewMode === 'individual'}
                onChange={(e) => setViewMode(e.target.value as 'individual' | 'class')}
                className="w-4 h-4 text-blue-600"
              />
              <label htmlFor="individual" className="flex items-center gap-2 cursor-pointer">
                <User className="w-4 h-4" />
                Individual Student
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="class"
                name="viewMode"
                value="class"
                checked={viewMode === 'class'}
                onChange={(e) => setViewMode(e.target.value as 'individual' | 'class')}
                className="w-4 h-4 text-blue-600"
              />
              <label htmlFor="class" className="flex items-center gap-2 cursor-pointer">
                <Users className="w-4 h-4" />
                Class Overview
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'individual' ? (
        <>
          {/* Demo Student Selector */}
          <DemoStudentSelector 
            onStudentSelect={setSelectedStudentId}
            selectedStudentId={selectedStudentId}
          />

          {/* Individual Student Dashboard */}
          <PersonalizationDashboard studentId={selectedStudentId} />
        </>
      ) : (
        <>
          {/* Class Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-500" />
                Class Personalization Overview
              </CardTitle>
              <CardDescription>Aggregate learning patterns and insights for your entire class</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Class overview analytics coming soon...</p>
                <p className="text-sm mt-2">This will show aggregated learning patterns, common challenges, and class-wide recommendations.</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Teacher Insights */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Teacher Insights & Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2 text-blue-500" />
                Student Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Monitor individual student learning patterns, identify struggling areas, 
                and track progress over time to provide targeted support.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-green-500" />
                Intervention Planning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Use AI-generated intervention suggestions to create personalized 
                learning plans and address specific student needs.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
                Teaching Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Analyze which teaching strategies work best for different students 
                and optimize your approach based on learning effectiveness data.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How It Works for Teachers */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">How Personalization Helps Teachers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="w-5 h-5 mr-2 text-blue-500" />
                Individual Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Identify each student&#39;s unique learning style, strengths, and challenges 
                to provide personalized attention and support.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                Data-Driven Decisions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Make informed teaching decisions based on real learning data and 
                AI-powered insights about student progress and engagement.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-500" />
                Class Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Understand class-wide learning patterns to optimize lesson planning, 
                group activities, and overall classroom management strategies.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
