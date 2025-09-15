"use client";
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import PersonalizationDashboard from '@/components/PersonalizationDashboard';
import DemoStudentSelector from '@/components/DemoStudentSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Users,
  //User,
  Eye,
  BarChart3,
  Settings,
  Shield,
  Activity,
  Database
} from 'lucide-react';

export default function AdminPersonalizationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedStudentId, setSelectedStudentId] = useState<string>('demo-student-1');
  const [activeTab, setActiveTab] = useState('overview');

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
              Personalization Analytics - Admin Dashboard
            </h1>
            <p className="text-xl text-gray-600">
              Monitor and manage AI personalization across your organization
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              Phase 16 - Personalization Engine
            </Badge>
            <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
              ADMIN MODE
            </Badge>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Organization-wide Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156</div>
                <p className="text-xs text-muted-foreground">
                  +8% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Personalizations</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">142</div>
                <p className="text-xs text-muted-foreground">
                  91% coverage
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Learning Velocity</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78%</div>
                <p className="text-xs text-muted-foreground">
                  +5% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Interventions Active</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23</div>
                <p className="text-xs text-muted-foreground">
                  15% of students
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Learning Pattern Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                Learning Pattern Distribution
              </CardTitle>
              <CardDescription>Distribution of learning styles and patterns across your organization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { style: 'Visual', count: 45, percentage: 29 },
                  { style: 'Analytical', count: 38, percentage: 24 },
                  { style: 'Creative', count: 32, percentage: 21 },
                  { style: 'Collaborative', count: 25, percentage: 16 },
                  { style: 'Kinesthetic', count: 16, percentage: 10 }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{item.style} Learners</div>
                      <div className="text-sm text-gray-600">
                        {item.count} students
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {item.percentage}%
                      </div>
                      <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual" className="space-y-6">
          {/* Demo Student Selector */}
          <DemoStudentSelector 
            onStudentSelect={setSelectedStudentId}
            selectedStudentId={selectedStudentId}
          />

          {/* Individual Student Dashboard */}
          <PersonalizationDashboard studentId={selectedStudentId} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2 text-green-500" />
                Advanced Analytics
              </CardTitle>
              <CardDescription>Deep insights into personalization effectiveness and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Advanced analytics dashboard coming soon...</p>
                <p className="text-sm mt-2">This will include predictive analytics, trend analysis, and organizational insights.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2 text-orange-500" />
                Personalization Settings
              </CardTitle>
              <CardDescription>Configure AI personalization parameters and privacy settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Personalization settings panel coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Admin Features */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2 text-blue-500" />
                System Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Monitor personalization engine performance, data collection, 
                and AI model effectiveness across the organization.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-green-500" />
                Privacy & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Ensure compliance with data privacy regulations and manage 
                student data collection and processing policies.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-purple-500" />
                Performance Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Optimize personalization algorithms, adjust parameters, 
                and fine-tune AI models for better learning outcomes.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
