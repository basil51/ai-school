"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BarChart3, MessageSquare, BookOpen, Trophy, Calendar, Bell } from 'lucide-react';
import Link from 'next/link';

export default function GuardianDashboard() {
  const quickActions = [
    {
      title: 'My Children',
      description: 'View your children\'s profiles',
      icon: Users,
      href: '/guardian/children',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Progress Reports',
      description: 'Track academic progress',
      icon: BarChart3,
      href: '/guardian/reports',
      gradient: 'from-blue-500 to-purple-500'
    },
    {
      title: 'Teacher Chat',
      description: 'Communicate with teachers',
      icon: MessageSquare,
      href: '/guardian/chat',
      gradient: 'from-pink-500 to-rose-500'
    }
  ];

  const children = [
    {
      name: 'Emma Johnson',
      grade: 'Grade 5',
      avatar: '👧',
      progress: 87,
      recentActivity: 'Completed Math Quiz - 92%',
      nextEvent: 'Science Project Due: Tomorrow'
    },
    {
      name: 'Liam Johnson',
      grade: 'Grade 3',
      avatar: '👦',
      progress: 94,
      recentActivity: 'Finished Reading Assignment',
      nextEvent: 'Parent-Teacher Meeting: Friday'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
            Guardian Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Monitor your children&apos;s progress and stay connected with their education
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:scale-105 cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`relative p-3 rounded-xl bg-gradient-to-r ${action.gradient} group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-6 h-6 text-white relative z-10" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-800 group-hover:text-pink-700 transition-colors">
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

        {/* Children Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {children.map((child, index) => (
            <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{child.avatar}</div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-800">{child.name}</CardTitle>
                    <CardDescription>{child.grade}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <span className="font-medium text-gray-700">Overall Progress</span>
                    <span className="text-2xl font-bold text-blue-600">{child.progress}%</span>
                  </div>
                  
                  <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-gray-800">Recent Activity</span>
                    </div>
                    <p className="text-sm text-gray-600">{child.recentActivity}</p>
                  </div>
                  
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-gray-800">Upcoming</span>
                    </div>
                    <p className="text-sm text-gray-600">{child.nextEvent}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Notifications and Updates */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800">Recent Updates</CardTitle>
            <CardDescription>Latest news and notifications from school</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Emma&apos;s Achievement</p>
                  <p className="text-sm text-gray-600">Received &quot;Math Star&quot; badge for excellent performance</p>
                </div>
                <div className="ml-auto text-sm text-gray-500">2 hours ago</div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">School Announcement</p>
                  <p className="text-sm text-gray-600">Parent-Teacher conferences scheduled for next week</p>
                </div>
                <div className="ml-auto text-sm text-gray-500">1 day ago</div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Teacher Message</p>
                  <p className="text-sm text-gray-600">Mrs. Smith shared Liam&apos;s reading progress update</p>
                </div>
                <div className="ml-auto text-sm text-gray-500">3 days ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
