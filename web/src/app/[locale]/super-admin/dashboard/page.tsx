"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
//import { Button } from '@/components/ui/button';
import { School, Users, BarChart3, Settings, Shield, Globe, Database, Activity } from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminDashboard() {
  const quickActions = [
    {
      title: 'Organizations',
      description: 'Manage all schools and organizations',
      icon: School,
      href: '/super-admin/organizations',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      title: 'All Users',
      description: 'System-wide user management',
      icon: Users,
      href: '/super-admin/users',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Global Analytics',
      description: 'System-wide performance metrics',
      icon: BarChart3,
      href: '/super-admin/analytics',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      title: 'System Settings',
      description: 'Configure global system settings',
      icon: Settings,
      href: '/super-admin/settings',
      gradient: 'from-gray-500 to-gray-700'
    }
  ];

  const systemStats = [
    {
      title: 'Total Organizations',
      value: '24',
      icon: School,
      gradient: 'from-purple-500 to-pink-500',
      change: '+2 this month'
    },
    {
      title: 'Total Users',
      value: '1,247',
      icon: Users,
      gradient: 'from-green-500 to-emerald-500',
      change: '+89 this week'
    },
    {
      title: 'Active Sessions',
      value: '342',
      icon: Activity,
      gradient: 'from-blue-500 to-cyan-500',
      change: '+12 today'
    },
    {
      title: 'System Health',
      value: '99.9%',
      icon: Shield,
      gradient: 'from-emerald-500 to-green-500',
      change: 'Excellent'
    }
  ];

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
          {systemStats.map((stat, index) => (
            <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient}`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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