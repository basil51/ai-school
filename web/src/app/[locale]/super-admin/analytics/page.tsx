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
  //BookOpen, 
  //Award,
  Clock,
  //Target,
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
  Zap,
  Building2,
  //Globe,
  //Crown,
  //Shield
} from 'lucide-react';

export default function SuperAdminAnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  // Mock data for global analytics
  const globalStats = {
    totalOrganizations: 3,
    totalUsers: 1250,
    totalStudents: 800,
    totalTeachers: 150,
    totalAdmins: 25,
    totalGuardians: 275,
    activeUsers: 1150,
    systemUptime: 99.9,
    averagePerformance: 82,
    globalSatisfaction: 4.3
  };

  const organizationMetrics = [
    {
      organization: 'Al-Noor School',
      users: 450,
      students: 300,
      teachers: 25,
      admins: 5,
      performance: 85,
      satisfaction: 4.4,
      uptime: 99.8,
      location: 'Riyadh',
      trend: 'up'
    },
    {
      organization: 'International School',
      users: 400,
      students: 250,
      teachers: 20,
      admins: 4,
      performance: 78,
      satisfaction: 4.2,
      uptime: 99.9,
      location: 'Jeddah',
      trend: 'up'
    },
    {
      organization: 'Premium Academy',
      users: 400,
      students: 250,
      teachers: 20,
      admins: 3,
      performance: 83,
      satisfaction: 4.3,
      uptime: 99.7,
      location: 'Dammam',
      trend: 'down'
    }
  ];

  const performanceMetrics = [
    {
      metric: 'Global Performance',
      value: 82,
      change: 3.2,
      trend: 'up',
      target: 85,
      icon: TrendingUp
    },
    {
      metric: 'System Uptime',
      value: 99.9,
      change: 0.1,
      trend: 'up',
      target: 99.9,
      icon: Zap
    },
    {
      metric: 'User Satisfaction',
      value: 4.3,
      change: 0.2,
      trend: 'up',
      target: 4.5,
      icon: Star
    },
    {
      metric: 'Active Users',
      value: 92,
      change: 2.5,
      trend: 'up',
      target: 95,
      icon: UserCheck
    },
    {
      metric: 'Course Completion',
      value: 87,
      change: -1.2,
      trend: 'down',
      target: 90,
      icon: BookMarked
    },
    {
      metric: 'Teacher Engagement',
      value: 89,
      change: 1.8,
      trend: 'up',
      target: 90,
      icon: GraduationCap
    }
  ];

  const systemHealth = [
    {
      component: 'Database',
      status: 'healthy',
      uptime: 99.9,
      responseTime: 45,
      lastCheck: '2 minutes ago'
    },
    {
      component: 'API Services',
      status: 'healthy',
      uptime: 99.8,
      responseTime: 120,
      lastCheck: '1 minute ago'
    },
    {
      component: 'File Storage',
      status: 'warning',
      uptime: 99.5,
      responseTime: 200,
      lastCheck: '3 minutes ago'
    },
    {
      component: 'Email Service',
      status: 'healthy',
      uptime: 99.7,
      responseTime: 800,
      lastCheck: '5 minutes ago'
    },
    {
      component: 'AI Services',
      status: 'healthy',
      uptime: 99.6,
      responseTime: 1500,
      lastCheck: '1 minute ago'
    }
  ];

  const recentActivities = [
    {
      type: 'system_alert',
      description: 'File storage response time increased to 200ms',
      timestamp: '5 minutes ago',
      icon: AlertTriangle,
      color: 'text-yellow-600',
      organization: 'System'
    },
    {
      type: 'performance_improvement',
      description: 'Al-Noor School showed 5% improvement in student performance',
      timestamp: '1 hour ago',
      icon: TrendingUp,
      color: 'text-green-600',
      organization: 'Al-Noor School'
    },
    {
      type: 'new_organization',
      description: 'New organization "Elite Academy" registered',
      timestamp: '2 hours ago',
      icon: Building2,
      color: 'text-blue-600',
      organization: 'Elite Academy'
    },
    {
      type: 'maintenance_complete',
      description: 'Scheduled maintenance completed successfully',
      timestamp: '4 hours ago',
      icon: CheckCircle,
      color: 'text-green-600',
      organization: 'System'
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-orange-600" />
              Global Analytics
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive analytics and insights across all organizations
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
                  variant={selectedMetric === 'organizations' ? 'default' : 'outline'}
                  onClick={() => setSelectedMetric('organizations')}
                >
                  Organizations
                </Button>
                <Button
                  variant={selectedMetric === 'system' ? 'default' : 'outline'}
                  onClick={() => setSelectedMetric('system')}
                >
                  System Health
                </Button>
                <Button
                  variant={selectedMetric === 'performance' ? 'default' : 'outline'}
                  onClick={() => setSelectedMetric('performance')}
                >
                  Performance
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Organizations</p>
                  <p className="text-2xl font-bold text-gray-900">{globalStats.totalOrganizations}</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-green-600">{globalStats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-purple-600">{globalStats.activeUsers}</p>
                </div>
                <UserCheck className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Uptime</p>
                  <p className="text-2xl font-bold text-orange-600">{globalStats.systemUptime}%</p>
                </div>
                <Zap className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                  <p className="text-2xl font-bold text-indigo-600">{globalStats.globalSatisfaction}/5</p>
                </div>
                <Star className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="system">System Health</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
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
                          <span className="text-lg font-bold">{metric.value}{metric.metric.includes('Satisfaction') ? '/5' : metric.metric.includes('Uptime') ? '%' : '%'}</span>
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
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">{activity.timestamp}</span>
                            <Badge variant="outline" className="text-xs">
                              {activity.organization}
                            </Badge>
                          </div>
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
                    Global Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Global performance trends chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Organization Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Organization distribution chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="organizations" className="space-y-4">
            <div className="grid gap-4">
              {organizationMetrics.map((org, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{org.organization}</h3>
                        <p className="text-gray-600">{org.location} • {org.users} total users</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={org.trend === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {org.trend === 'up' ? 'Improving' : 'Declining'}
                        </Badge>
                        {getTrendIcon(org.trend)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Performance</p>
                        <p className="text-xl font-bold text-blue-600">{org.performance}%</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Satisfaction</p>
                        <p className="text-xl font-bold text-green-600">{org.satisfaction}/5</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600">Uptime</p>
                        <p className="text-xl font-bold text-purple-600">{org.uptime}%</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-sm text-gray-600">Teachers</p>
                        <p className="text-xl font-bold text-orange-600">{org.teachers}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="grid gap-4">
              {systemHealth.map((component, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{component.component}</h3>
                        <p className="text-gray-600">Last check: {component.lastCheck}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(component.status)}>
                          {getStatusIcon(component.status)}
                          <span className="ml-1 capitalize">{component.status}</span>
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Uptime</p>
                        <p className="text-xl font-bold text-blue-600">{component.uptime}%</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Response Time</p>
                        <p className="text-xl font-bold text-green-600">{component.responseTime}ms</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                          <p className="text-gray-600">Target: {metric.target}{metric.metric.includes('Satisfaction') ? '/5' : metric.metric.includes('Uptime') ? '%' : '%'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{metric.value}{metric.metric.includes('Satisfaction') ? '/5' : metric.metric.includes('Uptime') ? '%' : '%'}</span>
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
        </Tabs>
      </div>
    </div>
  );
}
