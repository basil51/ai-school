"use client";

import React, { useState, useEffect } from 'react';
//import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  //BookOpen, 
  //Target, 
  Clock, 
  Award,
  //Brain,
  Calendar,
  Activity,
  //Star,
  CheckCircle,
  //AlertCircle,
  Play,
  Zap,
  //Pause,
  //RotateCcw
} from 'lucide-react';

interface SubjectProgress {
  id: string;
  name: string;
  icon: string;
  color: string;
  overallProgress: number;
  lessonsCompleted: number;
  totalLessons: number;
  averageScore: number;
  timeSpent: number; // in minutes
  lastActivity: string;
  topics: TopicProgress[];
}

interface TopicProgress {
  id: string;
  name: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  averageScore: number;
  difficulty: 'easy' | 'medium' | 'hard';
  lastStudied: string;
}

interface LearningStreak {
  current: number;
  longest: number;
  lastActivity: string;
}

interface WeeklyActivity {
  day: string;
  lessons: number;
  timeSpent: number;
  assessments: number;
}

export default function ProgressPage() {
  //const params = useParams();
  //const locale = params.locale as string;
  
  const [subjects, setSubjects] = useState<SubjectProgress[]>([]);
  const [streak, setStreak] = useState<LearningStreak>({ current: 0, longest: 0, lastActivity: '' });
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const mockSubjects: SubjectProgress[] = [
      {
        id: '1',
        name: 'Mathematics',
        icon: '📊',
        color: 'from-blue-500 to-cyan-500',
        overallProgress: 78,
        lessonsCompleted: 23,
        totalLessons: 30,
        averageScore: 87,
        timeSpent: 1240,
        lastActivity: '2024-02-15T14:30:00Z',
        topics: [
          {
            id: '1-1',
            name: 'Algebra',
            progress: 85,
            lessonsCompleted: 8,
            totalLessons: 10,
            averageScore: 92,
            difficulty: 'medium',
            lastStudied: '2024-02-15T14:30:00Z'
          },
          {
            id: '1-2',
            name: 'Geometry',
            progress: 70,
            lessonsCompleted: 7,
            totalLessons: 10,
            averageScore: 85,
            difficulty: 'hard',
            lastStudied: '2024-02-14T16:20:00Z'
          },
          {
            id: '1-3',
            name: 'Statistics',
            progress: 80,
            lessonsCompleted: 8,
            totalLessons: 10,
            averageScore: 84,
            difficulty: 'easy',
            lastStudied: '2024-02-13T11:15:00Z'
          }
        ]
      },
      {
        id: '2',
        name: 'Physics',
        icon: '⚡',
        color: 'from-purple-500 to-pink-500',
        overallProgress: 65,
        lessonsCompleted: 13,
        totalLessons: 20,
        averageScore: 82,
        timeSpent: 980,
        lastActivity: '2024-02-14T16:45:00Z',
        topics: [
          {
            id: '2-1',
            name: 'Mechanics',
            progress: 75,
            lessonsCompleted: 6,
            totalLessons: 8,
            averageScore: 88,
            difficulty: 'medium',
            lastStudied: '2024-02-14T16:45:00Z'
          },
          {
            id: '2-2',
            name: 'Thermodynamics',
            progress: 50,
            lessonsCompleted: 4,
            totalLessons: 8,
            averageScore: 76,
            difficulty: 'hard',
            lastStudied: '2024-02-12T13:30:00Z'
          },
          {
            id: '2-3',
            name: 'Waves',
            progress: 75,
            lessonsCompleted: 3,
            totalLessons: 4,
            averageScore: 82,
            difficulty: 'easy',
            lastStudied: '2024-02-11T10:20:00Z'
          }
        ]
      },
      {
        id: '3',
        name: 'Chemistry',
        icon: '🧪',
        color: 'from-green-500 to-emerald-500',
        overallProgress: 90,
        lessonsCompleted: 18,
        totalLessons: 20,
        averageScore: 91,
        timeSpent: 1120,
        lastActivity: '2024-02-15T09:15:00Z',
        topics: [
          {
            id: '3-1',
            name: 'Organic Chemistry',
            progress: 100,
            lessonsCompleted: 10,
            totalLessons: 10,
            averageScore: 94,
            difficulty: 'hard',
            lastStudied: '2024-02-15T09:15:00Z'
          },
          {
            id: '3-2',
            name: 'Inorganic Chemistry',
            progress: 80,
            lessonsCompleted: 8,
            totalLessons: 10,
            averageScore: 88,
            difficulty: 'medium',
            lastStudied: '2024-02-14T15:30:00Z'
          }
        ]
      },
      {
        id: '4',
        name: 'English Literature',
        icon: '📚',
        color: 'from-amber-500 to-orange-500',
        overallProgress: 45,
        lessonsCompleted: 9,
        totalLessons: 20,
        averageScore: 79,
        timeSpent: 680,
        lastActivity: '2024-02-13T12:00:00Z',
        topics: [
          {
            id: '4-1',
            name: 'Poetry',
            progress: 60,
            lessonsCompleted: 6,
            totalLessons: 10,
            averageScore: 82,
            difficulty: 'medium',
            lastStudied: '2024-02-13T12:00:00Z'
          },
          {
            id: '4-2',
            name: 'Prose',
            progress: 30,
            lessonsCompleted: 3,
            totalLessons: 10,
            averageScore: 76,
            difficulty: 'easy',
            lastStudied: '2024-02-10T14:20:00Z'
          }
        ]
      }
    ];
  
    const mockStreak: LearningStreak = {
      current: 7,
      longest: 15,
      lastActivity: '2024-02-15T14:30:00Z'
    };
  
    const mockWeeklyActivity: WeeklyActivity[] = [
      { day: 'Mon', lessons: 3, timeSpent: 120, assessments: 1 },
      { day: 'Tue', lessons: 2, timeSpent: 90, assessments: 0 },
      { day: 'Wed', lessons: 4, timeSpent: 150, assessments: 2 },
      { day: 'Thu', lessons: 1, timeSpent: 60, assessments: 1 },
      { day: 'Fri', lessons: 3, timeSpent: 110, assessments: 0 },
      { day: 'Sat', lessons: 2, timeSpent: 80, assessments: 1 },
      { day: 'Sun', lessons: 0, timeSpent: 0, assessments: 0 }
    ];
    // Simulate loading
    setTimeout(() => {
      setSubjects(mockSubjects);
      setStreak(mockStreak);
      setWeeklyActivity(mockWeeklyActivity);
      setLoading(false);
    }, 1000);
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const totalLessonsCompleted = subjects.reduce((sum, s) => sum + s.lessonsCompleted, 0);
  const totalLessons = subjects.reduce((sum, s) => sum + s.totalLessons, 0);
  const overallProgress = totalLessons > 0 ? (totalLessonsCompleted / totalLessons) * 100 : 0;
  const averageScore = subjects.length > 0 
    ? subjects.reduce((sum, s) => sum + s.averageScore, 0) / subjects.length 
    : 0;
  const totalTimeSpent = subjects.reduce((sum, s) => sum + s.timeSpent, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  My Progress
                </h1>
                <p className="text-gray-600 mt-2">Track your learning journey and academic achievements</p>
              </div>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Overall Progress</p>
                    <p className="text-3xl font-bold text-cyan-600">{Math.round(overallProgress)}%</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
                <Progress value={overallProgress} className="mt-3 h-2" />
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Lessons Completed</p>
                    <p className="text-3xl font-bold text-green-600">{totalLessonsCompleted}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">of {totalLessons} total lessons</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Average Score</p>
                    <p className={`text-3xl font-bold ${getScoreColor(averageScore)}`}>
                      {Math.round(averageScore)}%
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">across all subjects</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Time Spent</p>
                    <p className="text-3xl font-bold text-purple-600">{formatTime(totalTimeSpent)}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">total study time</p>
              </CardContent>
            </Card>
          </div>

          {/* Learning Streak */}
          <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Learning Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-yellow-600 mb-2">{streak.current}</div>
                  <p className="text-sm text-gray-600">Current Streak</p>
                  <p className="text-xs text-gray-500">days in a row</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-600 mb-2">{streak.longest}</div>
                  <p className="text-sm text-gray-600">Longest Streak</p>
                  <p className="text-xs text-gray-500">personal best</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {streak.current >= 7 ? '🔥' : streak.current >= 3 ? '⚡' : '📚'}
                  </div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-xs text-gray-500">
                    {streak.current >= 7 ? 'On fire!' : streak.current >= 3 ? 'Great job!' : 'Keep going!'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Activity Chart */}
          <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                This Week&#39;s Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-4">
                {weeklyActivity.map((day, index) => {
                  const maxLessons = Math.max(...weeklyActivity.map(d => d.lessons));
                  const height = maxLessons > 0 ? (day.lessons / maxLessons) * 100 : 0;
                  
                  return (
                    <div key={index} className="text-center">
                      <div className="text-sm text-gray-600 mb-2">{day.day}</div>
                      <div className="relative h-24 flex items-end justify-center">
                        <div 
                          className={`w-8 rounded-t-lg transition-all duration-300 ${
                            day.lessons > 0 
                              ? 'bg-gradient-to-t from-blue-500 to-cyan-500' 
                              : 'bg-gray-200'
                          }`}
                          style={{ height: `${Math.max(height, 10)}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        <div>{day.lessons} lessons</div>
                        <div>{formatTime(day.timeSpent)}</div>
                        {day.assessments > 0 && (
                          <div className="text-amber-600">📝 {day.assessments}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Subject Progress */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-lg">
              <TabsTrigger value="overview">Subject Overview</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Progress</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {subjects.map((subject) => (
                  <Card key={subject.id} className="bg-white/90 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{subject.icon}</div>
                          <div>
                            <CardTitle className="text-xl font-semibold text-gray-800">
                              {subject.name}
                            </CardTitle>
                            <CardDescription>
                              {subject.lessonsCompleted}/{subject.totalLessons} lessons completed
                            </CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(subject.averageScore)}`}>
                            {subject.averageScore}%
                          </div>
                          <p className="text-sm text-gray-500">avg score</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Overall Progress</span>
                            <span>{subject.overallProgress}%</span>
                          </div>
                          <Progress value={subject.overallProgress} className="h-2" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span>{formatTime(subject.timeSpent)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-gray-500" />
                            <span>{new Date(subject.lastActivity).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="detailed" className="mt-6">
              <div className="space-y-6">
                {subjects.map((subject) => (
                  <Card key={subject.id} className="bg-white/90 backdrop-blur-lg border-0 shadow-lg">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{subject.icon}</div>
                        <div>
                          <CardTitle className="text-2xl font-semibold text-gray-800">
                            {subject.name}
                          </CardTitle>
                          <CardDescription>
                            Detailed progress breakdown by topic
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {subject.topics.map((topic) => (
                          <div key={topic.id} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-800">{topic.name}</h4>
                                <p className="text-sm text-gray-600">
                                  {topic.lessonsCompleted}/{topic.totalLessons} lessons
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge className={getDifficultyColor(topic.difficulty)}>
                                  {topic.difficulty}
                                </Badge>
                                <div className="text-right">
                                  <div className={`font-bold ${getScoreColor(topic.averageScore)}`}>
                                    {topic.averageScore}%
                                  </div>
                                  <p className="text-xs text-gray-500">avg score</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>Progress</span>
                                <span>{topic.progress}%</span>
                              </div>
                              <Progress value={topic.progress} className="h-2" />
                            </div>
                            
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>Last studied: {new Date(topic.lastStudied).toLocaleDateString()}</span>
                              <Button variant="outline" size="sm">
                                <Play className="w-4 h-4 mr-2" />
                                Continue
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
