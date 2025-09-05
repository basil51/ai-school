// components/dashboard/StudentDashboard.tsx
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  BrainCircuit,
  BookOpen,
  Target,
  Trophy,
  Clock,
  ArrowRight,
  Flame,
  Star,
  TrendingUp,
  Calendar,
  MessageSquare,
  Play
} from 'lucide-react'
import Link from 'next/link'

interface StudentDashboardProps {
  user?: any
}

export default function StudentDashboard({ user }: StudentDashboardProps) {
  // Mock data - replace with real API calls
  const stats = {
    totalSubjects: 6,
    completedLessons: 47,
    currentStreak: 12,
    totalPoints: 2840,
    weeklyGoal: 85,
    weeklyProgress: 67
  }

  const subjects = [
    { id: 1, name: 'Mathematics', progress: 78, nextLesson: 'Quadratic Equations', color: 'bg-blue-500' },
    { id: 2, name: 'Physics', progress: 65, nextLesson: 'Wave Motion', color: 'bg-green-500' },
    { id: 3, name: 'Chemistry', progress: 82, nextLesson: 'Organic Compounds', color: 'bg-purple-500' },
    { id: 4, name: 'Biology', progress: 71, nextLesson: 'Cell Division', color: 'bg-orange-500' },
  ]

  const recentAchievements = [
    { title: 'Math Master', description: 'Completed 50 math lessons', icon: Trophy, color: 'text-yellow-500' },
    { title: 'Streak Champion', description: '10 day learning streak', icon: Flame, color: 'text-red-500' },
    { title: 'Quick Learner', description: 'Completed lesson in record time', icon: Star, color: 'text-blue-500' },
  ]

  const upcomingAssessments = [
    { subject: 'Mathematics', title: 'Algebra Quiz', dueDate: 'Tomorrow', difficulty: 'Medium' },
    { subject: 'Physics', title: 'Mechanics Test', dueDate: 'Friday', difficulty: 'Hard' },
    { subject: 'Chemistry', title: 'Periodic Table', dueDate: 'Next Week', difficulty: 'Easy' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
        
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="text-blue-100 mb-6">
            You&apos;re doing great! Keep up the momentum and continue learning.
          </p>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="font-semibold">{stats.currentStreak} day streak</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="font-semibold">{stats.totalPoints} points</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button asChild className="h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-left justify-start">
          <Link href="/ai-teacher" className="flex items-center gap-3">
            <BrainCircuit className="w-6 h-6" />
            <div>
              <div className="font-semibold">Continue with AI Teacher</div>
              <div className="text-xs opacity-90">Resume your personalized lesson</div>
            </div>
          </Link>
        </Button>

        <Button asChild variant="outline" className="h-16 text-left justify-start border-2">
          <Link href="/student/assessments" className="flex items-center gap-3">
            <Target className="w-6 h-6 text-orange-500" />
            <div>
              <div className="font-semibold">Take Assessment</div>
              <div className="text-xs text-gray-500">3 pending assessments</div>
            </div>
          </Link>
        </Button>

        <Button asChild variant="outline" className="h-16 text-left justify-start border-2">
          <Link href="/student/chat" className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-green-500" />
            <div>
              <div className="font-semibold">Ask Questions</div>
              <div className="text-xs text-gray-500">Chat with AI tutor</div>
            </div>
          </Link>
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Subjects & Progress */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Weekly Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Weekly Progress
              </CardTitle>
              <CardDescription>
                You&apos;ve completed {stats.weeklyProgress}% of your weekly goal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Weekly Goal: {stats.weeklyGoal}%</span>
                  <span className="text-sm text-gray-500">{stats.weeklyProgress}% completed</span>
                </div>
                <Progress value={stats.weeklyProgress} className="h-3" />
                <p className="text-sm text-gray-600">
                  Great job! You&apos;re {stats.weeklyProgress >= stats.weeklyGoal ? 'ahead of' : 'on track for'} your weekly target.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* My Subjects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Subjects</CardTitle>
                <CardDescription>Continue learning from where you left off</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/student/subjects">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjects.map((subject) => (
                  <Card key={subject.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-3 h-3 rounded-full ${subject.color}`} />
                        <h3 className="font-semibold">{subject.name}</h3>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {subject.progress}%
                        </Badge>
                      </div>
                      <Progress value={subject.progress} className="mb-3 h-2" />
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">Next: {subject.nextLesson}</p>
                        <Button size="sm" variant="ghost" className="h-6 px-2">
                          <Play className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          
          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Achievements
              </CardTitle>
              <CardDescription>Your recent accomplishments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentAchievements.map((achievement, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <achievement.icon className={`w-8 h-8 ${achievement.color}`} />
                  <div>
                    <p className="font-medium text-sm">{achievement.title}</p>
                    <p className="text-xs text-gray-500">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Assessments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Upcoming Assessments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingAssessments.map((assessment, index) => (
                <div key={index} className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{assessment.title}</h4>
                    <Badge 
                      variant={assessment.difficulty === 'Hard' ? 'destructive' : 
                              assessment.difficulty === 'Medium' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {assessment.difficulty}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">{assessment.subject}</p>
                  <p className="text-xs text-orange-600 font-medium">Due: {assessment.dueDate}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Study Streak */}
          <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5" />
                Study Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{stats.currentStreak}</div>
                <p className="text-orange-100">Days in a row</p>
                <p className="text-xs text-orange-200 mt-2">
                  Keep it up! Your longest streak was 18 days.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}