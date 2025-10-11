"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
//import { Button } from '@/components/ui/button';
import { School, Users, BarChart3, Settings, Shield, Globe, Database, Activity, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface DashboardStats {
  totalOrganizations: {
    value: string;
    change: string;
    trend: string;
  };
  totalUsers: {
    value: string;
    change: string;
    trend: string;
  };
  activeSessions: {
    value: string;
    change: string;
    trend: string;
  };
  systemHealth: {
    value: string;
    change: string;
    trend: string;
  };
}

export default function SuperAdminDashboard() {
  const params = useParams();
  const locale = params.locale as string;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/super-admin/dashboard-stats');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    {
      title: 'Organizations',
      description: 'Manage all schools and organizations',
      icon: School,
      href: `/${locale}/super-admin/organizations`,
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      title: 'All Users',
      description: 'System-wide user management',
      icon: Users,
      href: `/${locale}/super-admin/users`,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Global Analytics',
      description: 'System-wide performance metrics',
      icon: BarChart3,
      href: `/${locale}/super-admin/analytics`,
      gradient: 'from-orange-500 to-red-500'
    },
    {
      title: 'System Settings',
      description: 'Configure global system settings',
      icon: Settings,
      href: `/${locale}/super-admin/settings`,
      gradient: 'from-gray-500 to-gray-700'
    }
  ];

  const systemStats = stats ? [
    {
      title: 'Total Organizations',
      value: stats.totalOrganizations.value,
      icon: School,
      gradient: 'from-purple-500 to-pink-500',
      change: stats.totalOrganizations.change,
      trend: stats.totalOrganizations.trend
    },
    {
      title: 'Total Users',
      value: stats.totalUsers.value,
      icon: Users,
      gradient: 'from-green-500 to-emerald-500',
      change: stats.totalUsers.change,
      trend: stats.totalUsers.trend
    },
    {
      title: 'Active Sessions',
      value: stats.activeSessions.value,
      icon: Activity,
      gradient: 'from-blue-500 to-cyan-500',
      change: stats.activeSessions.change,
      trend: stats.activeSessions.trend
    },
    {
      title: 'System Health',
      value: stats.systemHealth.value,
      icon: Shield,
      gradient: 'from-emerald-500 to-green-500',
      change: stats.systemHealth.change,
      trend: stats.systemHealth.trend
    }
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            System-wide management and oversight
          </p>
        </div>

        {/* System Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading ? (
            // Loading state
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-200 animate-pulse">
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : error ? (
            // Error state
            <div className="col-span-full">
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Shield className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-800">Error Loading Dashboard</p>
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Success state with real data
            systemStats.map((stat, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      <p className={`text-xs mt-1 ${
                        stat.trend === 'up' ? 'text-green-600' : 
                        stat.trend === 'excellent' ? 'text-green-600' : 
                        stat.trend === 'good' ? 'text-blue-600' : 
                        'text-gray-600'
                      }`}>
                        {stat.change}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient}`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:scale-105 cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`relative p-3 rounded-xl bg-gradient-to-r ${action.gradient} group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-6 h-6 text-white relative z-10" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">
                        {action.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-gray-600 group-hover:text-gray-700 transition-colors">
                    {action.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">System Overview</CardTitle>
              <CardDescription>Global system status and health metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                      <Database className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Database Status</p>
                      <p className="text-sm text-gray-600">All systems operational</p>
                    </div>
                  </div>
                  <div className="text-green-600 font-bold">✓</div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">API Services</p>
                      <p className="text-sm text-gray-600">Response time: 45ms</p>
                    </div>
                  </div>
                  <div className="text-green-600 font-bold">✓</div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Security Status</p>
                      <p className="text-sm text-gray-600">All security checks passed</p>
                    </div>
                  </div>
                  <div className="text-green-600 font-bold">✓</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">Recent Activity</CardTitle>
              <CardDescription>Latest system-wide events and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                    <School className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">New Organization Added</p>
                    <p className="text-sm text-gray-600">Springfield Elementary School</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Bulk User Import</p>
                    <p className="text-sm text-gray-600">127 users imported successfully</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Monthly Report Generated</p>
                    <p className="text-sm text-gray-600">System performance analytics ready</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}