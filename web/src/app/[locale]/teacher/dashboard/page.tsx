"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
//import { Button } from '@/components/ui/button';
import { BookOpen, ClipboardCheck, Users, BarChart3, FileText, MessageSquare, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function TeacherDashboard() {
  const params = useParams();
  const locale = params.locale as string;
  const quickActions = [
    {
      title: 'My Subjects',
      description: 'Manage your curriculum and lessons',
      icon: BookOpen,
      href: `/${locale}/teacher/curriculum`,
      gradient: 'from-violet-500 to-purple-500'
    },
    {
      title: 'Assessments',
      description: 'Create and manage tests',
      icon: ClipboardCheck,
      href: `/${locale}/teacher/assessments`,
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      title: 'My Students',
      description: 'View and manage your students',
      icon: Users,
      href: `/${locale}/teacher/students`,
      gradient: 'from-green-500 to-teal-500'
    },
    {
      title: 'Class Progress',
      description: 'Monitor student performance',
      icon: BarChart3,
      href: `/${locale}/teacher/progress`,
      gradient: 'from-pink-500 to-rose-500'
    },
    {
      title: 'Upload Content',
      description: 'Add materials to RAG system',
      icon: FileText,
      href: `/${locale}/teacher/rag`,
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      title: 'Student Chat',
      description: 'Communicate with students',
      icon: MessageSquare,
      href: `/${locale}/teacher/chat`,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Adaptive Teaching',
      description: 'AI-powered teaching insights',
      icon: Sparkles,
      href: `/${locale}/teacher/adaptive-teaching`,
      gradient: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Teacher Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your classes, students, and teaching materials
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
                      <CardTitle className="text-lg font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
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

        {/* Class Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">Class Overview</CardTitle>
              <CardDescription>Current class statistics and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <span className="font-medium text-gray-700">Total Students</span>
                  <span className="text-2xl font-bold text-blue-600">24</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <span className="font-medium text-gray-700">Active Assignments</span>
                  <span className="text-2xl font-bold text-green-600">8</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <span className="font-medium text-gray-700">Average Score</span>
                  <span className="text-2xl font-bold text-purple-600">87%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">Recent Activity</CardTitle>
              <CardDescription>Latest updates from your classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                    <ClipboardCheck className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">New Assessment Submitted</p>
                    <p className="text-sm text-gray-600">Math Quiz - 15 students completed</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Student Question</p>
                    <p className="text-sm text-gray-600">Sarah asked about algebra problem</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">AI Teaching Insight</p>
                    <p className="text-sm text-gray-600">New adaptive learning recommendation</p>
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
