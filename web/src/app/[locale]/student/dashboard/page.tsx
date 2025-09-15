"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
//import { Button } from '@/components/ui/button';
import { Brain, BookOpen, Target, Trophy, MessageSquare, BarChart3, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function StudentDashboard() {
  const params = useParams();
  const locale = params.locale as string;
  const quickActions = [
    {
      title: 'AI Teacher',
      description: 'Start learning with your AI tutor',
      icon: Brain,
      href: `/${locale}/student/ai-teacher`,
      gradient: 'from-violet-600 to-indigo-600',
      glow: true
    },
    {
      title: 'My Courses',
      description: 'Continue your learning journey',
      icon: BookOpen,
      href: `/${locale}/student/courses`,
      gradient: 'from-blue-500 to-purple-500'
    },
    {
      title: 'Assessments',
      description: 'Take tests and quizzes',
      icon: Target,
      href: `/${locale}/student/assessments`,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Achievements',
      description: 'View your progress and badges',
      icon: Trophy,
      href: `/${locale}/student/achievements`,
      gradient: 'from-amber-500 to-yellow-500'
    },
    {
      title: 'Study Chat',
      description: 'Chat with teachers and peers',
      icon: MessageSquare,
      href: `/${locale}/student/chat`,
      gradient: 'from-pink-500 to-rose-500'
    },
    {
      title: 'My Progress',
      description: 'Track your learning analytics',
      icon: BarChart3,
      href: `/${locale}/student/progress`,
      gradient: 'from-cyan-500 to-blue-500'
    },
    {
      title: 'Adaptive Teaching',
      description: 'Personalized learning experience',
      icon: Sparkles,
      href: `/${locale}/student/adaptive-teaching`,
      gradient: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-violet-50">
      {/* Main Content Area */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
              Welcome to Your Learning Hub
            </h1>
            <p className="text-gray-600 mt-2">Continue your educational journey with personalized AI-powered learning</p>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-800">12</span>
              </div>
              <p className="text-sm text-gray-600">Active Courses</p>
              <div className="mt-2 flex items-center gap-1">
                <div className="text-xs text-green-600 font-semibold">+2 this week</div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-800">89%</span>
              </div>
              <p className="text-sm text-gray-600">AI Adaptation Score</p>
              <div className="mt-2 flex items-center gap-1">
                <div className="text-xs text-violet-600 font-semibold">Personalized for you</div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-800">28</span>
              </div>
              <p className="text-sm text-gray-600">Achievements</p>
              <div className="mt-2 flex items-center gap-1">
                <div className="text-xs text-amber-600 font-semibold">3 new badges!</div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-800">156</span>
              </div>
              <p className="text-sm text-gray-600">Practice Sessions</p>
              <div className="mt-2 flex items-center gap-1">
                <div className="text-xs text-green-600 font-semibold">Keep it up!</div>
              </div>
            </div>
          </div>

          {/* AI Teacher Card - Special Highlight for Students */}
          <div className="mb-6 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
              
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-white/20 backdrop-blur-lg rounded-xl">
                      <Brain className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Your AI Teacher is Ready!</h2>
                      <p className="text-white/80">Adaptive learning tailored just for you</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Link href={`/${locale}/student/ai-teacher`}>
                      <button className="px-6 py-3 bg-white text-violet-600 font-semibold rounded-xl hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                        Start Learning Now
                      </button>
                    </Link>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                      <span className="text-sm">AI adapts to your learning style</span>
                    </div>
                  </div>
                </div>
                
                <div className="hidden lg:block">
                  <div className="text-8xl animate-bounce">🤖</div>
                </div>
              </div>
            </div>
          </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:scale-105 cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`relative p-3 rounded-xl bg-gradient-to-r ${action.gradient} group-hover:scale-110 transition-transform`}>
                      {action.glow && (
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 rounded-xl animate-pulse"></div>
                      )}
                      <action.icon className="w-6 h-6 text-white relative z-10" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-800 group-hover:text-violet-700 transition-colors">
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

          {/* Recent Activity Section */}
          <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Learning Activity</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-violet-50 rounded-lg hover:from-blue-100 hover:to-violet-100 transition-all cursor-pointer">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-700">Completed: Introduction to Algebra</p>
                  <p className="text-sm text-gray-500">2 hours ago • Score: 95%</p>
                </div>
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover:from-green-100 hover:to-emerald-100 transition-all cursor-pointer">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-700">Practice Session: Physics Problems</p>
                  <p className="text-sm text-gray-500">5 hours ago • 12 problems solved</p>
                </div>
                <BarChart3 className="w-5 h-5 text-green-500" />
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-all cursor-pointer">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-700">AI Tutor Session: Chemistry Concepts</p>
                  <p className="text-sm text-gray-500">Yesterday • Mastery achieved!</p>
                </div>
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
