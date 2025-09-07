"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, BarChart3, Settings, MessageSquare, Sparkles, FileText, Shield } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const quickActions = [
    {
      title: 'Manage Users',
      description: 'Add, edit, and manage users',
      icon: Users,
      href: '/admin/users',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Curriculum',
      description: 'Manage school curriculum',
      icon: BookOpen,
      href: '/admin/curriculum',
      gradient: 'from-violet-500 to-purple-500'
    },
    {
      title: 'School Analytics',
      description: 'View performance metrics',
      icon: BarChart3,
      href: '/admin/analytics',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      title: 'School Settings',
      description: 'Configure school settings',
      icon: Settings,
      href: '/admin/settings',
      gradient: 'from-gray-500 to-gray-700'
    },
    {
      title: 'Documents',
      description: 'Manage school documents',
      icon: FileText,
      href: '/admin/documents',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      title: 'Guardians',
      description: 'Manage parent relationships',
      icon: Shield,
      href: '/admin/guardians',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Evaluations',
      description: 'Review and manage evaluations',
      icon: BarChart3,
      href: '/admin/evaluations',
      gradient: 'from-pink-500 to-rose-500'
    },
    {
      title: 'Chat Management',
      description: 'Monitor communications',
      icon: MessageSquare,
      href: '/admin/chat',
      gradient: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your school, users, and educational programs
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:scale-105 cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`relative p-3 rounded-xl bg-gradient-to-r ${action.gradient} group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-6 h-6 text-white relative z-10" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-800 group-hover:text-green-700 transition-colors">
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

        {/* School Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">School Statistics</CardTitle>
              <CardDescription>Current school metrics and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <span className="font-medium text-gray-700">Total Students</span>
                  <span className="text-2xl font-bold text-blue-600">156</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <span className="font-medium text-gray-700">Active Teachers</span>
                  <span className="text-2xl font-bold text-green-600">12</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <span className="font-medium text-gray-700">Active Classes</span>
                  <span className="text-2xl font-bold text-purple-600">24</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">Recent Activity</CardTitle>
              <CardDescription>Latest updates and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">New Student Registered</p>
                    <p className="text-sm text-gray-600">John Smith joined Grade 5</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Curriculum Updated</p>
                    <p className="text-sm text-gray-600">Mathematics Grade 6 revised</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Monthly Report Ready</p>
                    <p className="text-sm text-gray-600">Performance analytics available</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Add New User
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Update Curriculum
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  System Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}