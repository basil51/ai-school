"use client";

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Award, TrendingUp, BookOpen, Brain, Trophy, Target, Sparkles
} from 'lucide-react';

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export default function DashboardPage({ params }: DashboardPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [locale, setLocale] = React.useState<string>('');

  React.useEffect(() => {
    const initializeDashboard = async () => {
      const resolvedParams = await params;
      setLocale(resolvedParams.locale);
    };

    initializeDashboard();
  }, [params]);

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/login`);
    }
  }, [status, router, locale]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-violet-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null; // Will redirect via useEffect
  }

  const user = session.user;
  const userRole = (session as any).role || 'student'; // Default to student if role not available

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-violet-50">
      {/* Main Content Area */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
              Welcome back, {user.name || 'User'}!
            </h1>
            <p className="text-gray-600 mt-2">Let&apos;s continue your learning journey</p>
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
          {userRole === 'student' && (
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
                      <button className="px-6 py-3 bg-white text-violet-600 font-semibold rounded-xl hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                        Start Learning Now
                      </button>
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
          )}

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
                <Award className="w-5 h-5 text-amber-500" />
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover:from-green-100 hover:to-emerald-100 transition-all cursor-pointer">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-700">Practice Session: Physics Problems</p>
                  <p className="text-sm text-gray-500">5 hours ago • 12 problems solved</p>
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
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