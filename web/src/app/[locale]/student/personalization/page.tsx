"use client";
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import PersonalizationDashboard from '@/components/PersonalizationDashboard';
import DemoStudentSelector from '@/components/DemoStudentSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Target, TrendingUp, Users } from 'lucide-react';

export default function PersonalizationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedStudentId, setSelectedStudentId] = useState<string>('demo-student-1');

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
              AI Learning Personalization
            </h1>
            <p className="text-xl text-gray-600">
              Discover your unique learning patterns and get personalized recommendations
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            Phase 16 - Personalization Engine
          </Badge>
        </div>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neural Pathways</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Cognitive processing patterns identified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Strategies</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Personalized teaching approaches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">
              Average learning effectiveness
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interventions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Active learning interventions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Demo Student Selector */}
      <DemoStudentSelector 
        onStudentSelect={setSelectedStudentId}
        selectedStudentId={selectedStudentId}
      />

      {/* Main Dashboard */}
      <PersonalizationDashboard studentId={selectedStudentId} />

      {/* How It Works */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">How AI Personalization Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="w-5 h-5 mr-2 text-blue-500" />
                Pattern Recognition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Our AI analyzes your learning behavior, performance patterns, and cognitive preferences 
                to identify your unique neural pathways and learning style.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-green-500" />
                Adaptive Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Based on your learning patterns, we automatically adapt content difficulty, pacing, 
                modality, and teaching approach to maximize your learning effectiveness.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-purple-500" />
                Continuous Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                The system continuously learns from your progress, updating your learning profile 
                and refining recommendations to ensure optimal learning outcomes.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
