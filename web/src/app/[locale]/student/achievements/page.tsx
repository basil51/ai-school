"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Star, 
  Target, 
  BookOpen, 
  Brain, 
  Zap, 
  Award, 
  Crown,
  Medal,
  Flame,
  Sparkles,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'academic' | 'participation' | 'milestone' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
  requirements: string[];
}

interface AchievementCategory {
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  totalAchievements: number;
  unlockedAchievements: number;
}

export default function AchievementsPage() {
  const params = useParams();
  const locale = params.locale as string;
  
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for achievements
  const mockAchievements: Achievement[] = [
    {
      id: '1',
      title: 'First Steps',
      description: 'Complete your first lesson',
      icon: '🎯',
      category: 'milestone',
      rarity: 'common',
      points: 10,
      unlockedAt: '2024-01-15T10:30:00Z',
      requirements: ['Complete 1 lesson']
    },
    {
      id: '2',
      title: 'Quick Learner',
      description: 'Complete 5 lessons in a single day',
      icon: '⚡',
      category: 'academic',
      rarity: 'rare',
      points: 50,
      unlockedAt: '2024-01-20T16:45:00Z',
      requirements: ['Complete 5 lessons in one day']
    },
    {
      id: '3',
      title: 'Perfect Score',
      description: 'Achieve 100% on any assessment',
      icon: '🏆',
      category: 'academic',
      rarity: 'epic',
      points: 100,
      unlockedAt: '2024-01-25T14:20:00Z',
      requirements: ['Score 100% on any assessment']
    },
    {
      id: '4',
      title: 'Streak Master',
      description: 'Maintain a 7-day learning streak',
      icon: '🔥',
      category: 'participation',
      rarity: 'rare',
      points: 75,
      unlockedAt: '2024-02-01T09:15:00Z',
      requirements: ['Learn for 7 consecutive days']
    },
    {
      id: '5',
      title: 'AI Collaborator',
      description: 'Have 50 conversations with your AI teacher',
      icon: '🤖',
      category: 'participation',
      rarity: 'epic',
      points: 150,
      unlockedAt: '2024-02-10T11:30:00Z',
      requirements: ['Chat with AI teacher 50 times']
    },
    {
      id: '6',
      title: 'Subject Master',
      description: 'Complete all lessons in a subject',
      icon: '👑',
      category: 'academic',
      rarity: 'legendary',
      points: 300,
      unlockedAt: '2024-02-15T13:45:00Z',
      requirements: ['Complete all lessons in Mathematics']
    },
    {
      id: '7',
      title: 'Helpful Student',
      description: 'Help 10 classmates with their questions',
      icon: '🤝',
      category: 'participation',
      rarity: 'rare',
      points: 80,
      progress: 7,
      maxProgress: 10,
      requirements: ['Help 10 classmates']
    },
    {
      id: '8',
      title: 'Early Bird',
      description: 'Complete lessons before 8 AM for 5 days',
      icon: '🌅',
      category: 'participation',
      rarity: 'common',
      points: 25,
      progress: 3,
      maxProgress: 5,
      requirements: ['Study before 8 AM for 5 days']
    },
    {
      id: '9',
      title: 'Quiz Champion',
      description: 'Score above 90% on 10 consecutive quizzes',
      icon: '🎖️',
      category: 'academic',
      rarity: 'epic',
      points: 200,
      progress: 6,
      maxProgress: 10,
      requirements: ['Score 90%+ on 10 consecutive quizzes']
    },
    {
      id: '10',
      title: 'Knowledge Seeker',
      description: 'Ask 100 questions to your AI teacher',
      icon: '❓',
      category: 'participation',
      rarity: 'rare',
      points: 120,
      progress: 45,
      maxProgress: 100,
      requirements: ['Ask 100 questions to AI teacher']
    }
  ];

  const categories: AchievementCategory[] = [
    {
      name: 'Academic',
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-500',
      totalAchievements: 4,
      unlockedAchievements: 3
    },
    {
      name: 'Participation',
      icon: Target,
      color: 'from-green-500 to-emerald-500',
      totalAchievements: 4,
      unlockedAchievements: 2
    },
    {
      name: 'Milestone',
      icon: Trophy,
      color: 'from-amber-500 to-yellow-500',
      totalAchievements: 1,
      unlockedAchievements: 1
    },
    {
      name: 'Special',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-500',
      totalAchievements: 1,
      unlockedAchievements: 0
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setAchievements(mockAchievements);
      setLoading(false);
    }, 1000);
  }, []);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic': return BookOpen;
      case 'participation': return Target;
      case 'milestone': return Trophy;
      case 'special': return Sparkles;
      default: return Award;
    }
  };

  const unlockedAchievements = achievements.filter(a => a.unlockedAt);
  const lockedAchievements = achievements.filter(a => !a.unlockedAt);
  const totalPoints = unlockedAchievements.reduce((sum, a) => sum + a.points, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  My Achievements
                </h1>
                <p className="text-gray-600 mt-2">Celebrate your learning milestones and track your progress</p>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Points</p>
                    <p className="text-3xl font-bold text-amber-600">{totalPoints}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Unlocked</p>
                    <p className="text-3xl font-bold text-green-600">{unlockedAchievements.length}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">In Progress</p>
                    <p className="text-3xl font-bold text-blue-600">{lockedAchievements.filter(a => a.progress && a.progress > 0).length}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completion</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {Math.round((unlockedAchievements.length / achievements.length) * 100)}%
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {categories.map((category, index) => {
              const Icon = category.icon;
              const progress = (category.unlockedAchievements / category.totalAchievements) * 100;
              
              return (
                <Card key={index} className="bg-white/80 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 bg-gradient-to-r ${category.color} rounded-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{category.name}</h3>
                        <p className="text-sm text-gray-600">
                          {category.unlockedAchievements}/{category.totalAchievements}
                        </p>
                      </div>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Achievements Tabs */}
          <Tabs defaultValue="unlocked" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-lg">
              <TabsTrigger value="unlocked">Unlocked ({unlockedAchievements.length})</TabsTrigger>
              <TabsTrigger value="progress">In Progress ({lockedAchievements.filter(a => a.progress && a.progress > 0).length})</TabsTrigger>
              <TabsTrigger value="all">All Achievements ({achievements.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="unlocked" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {unlockedAchievements.map((achievement) => {
                  const CategoryIcon = getCategoryIcon(achievement.category);
                  
                  return (
                    <Card key={achievement.id} className="bg-white/90 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-4xl">{achievement.icon}</div>
                            <div>
                              <CardTitle className="text-lg font-semibold text-gray-800 group-hover:text-amber-700 transition-colors">
                                {achievement.title}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={getRarityColor(achievement.rarity)}>
                                  {achievement.rarity}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-amber-500" />
                                  <span className="text-sm font-medium text-amber-600">{achievement.points}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-gray-600 mb-4">
                          {achievement.description}
                        </CardDescription>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <CategoryIcon className="w-4 h-4" />
                          <span className="capitalize">{achievement.category}</span>
                          {achievement.unlockedAt && (
                            <>
                              <span>•</span>
                              <span>Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="progress" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lockedAchievements
                  .filter(a => a.progress && a.progress > 0)
                  .map((achievement) => {
                    const CategoryIcon = getCategoryIcon(achievement.category);
                    const progressPercent = achievement.progress && achievement.maxProgress 
                      ? (achievement.progress / achievement.maxProgress) * 100 
                      : 0;
                    
                    return (
                      <Card key={achievement.id} className="bg-white/90 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-4xl opacity-60">{achievement.icon}</div>
                              <div>
                                <CardTitle className="text-lg font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                                  {achievement.title}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={getRarityColor(achievement.rarity)}>
                                    {achievement.rarity}
                                  </Badge>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-amber-500" />
                                    <span className="text-sm font-medium text-amber-600">{achievement.points}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Clock className="w-5 h-5 text-blue-600" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-gray-600 mb-4">
                            {achievement.description}
                          </CardDescription>
                          
                          {achievement.progress && achievement.maxProgress && (
                            <div className="mb-4">
                              <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>Progress</span>
                                <span>{achievement.progress}/{achievement.maxProgress}</span>
                              </div>
                              <Progress value={progressPercent} className="h-2" />
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <CategoryIcon className="w-4 h-4" />
                            <span className="capitalize">{achievement.category}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </TabsContent>

            <TabsContent value="all" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement) => {
                  const CategoryIcon = getCategoryIcon(achievement.category);
                  const isUnlocked = !!achievement.unlockedAt;
                  const hasProgress = achievement.progress && achievement.progress > 0;
                  const progressPercent = achievement.progress && achievement.maxProgress 
                    ? (achievement.progress / achievement.maxProgress) * 100 
                    : 0;
                  
                  return (
                    <Card key={achievement.id} className={`bg-white/90 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300 group ${
                      !isUnlocked && !hasProgress ? 'opacity-60' : ''
                    }`}>
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`text-4xl ${!isUnlocked && !hasProgress ? 'grayscale' : ''}`}>
                              {achievement.icon}
                            </div>
                            <div>
                              <CardTitle className={`text-lg font-semibold transition-colors ${
                                isUnlocked 
                                  ? 'text-gray-800 group-hover:text-amber-700' 
                                  : hasProgress 
                                    ? 'text-gray-800 group-hover:text-blue-700'
                                    : 'text-gray-600'
                              }`}>
                                {achievement.title}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={getRarityColor(achievement.rarity)}>
                                  {achievement.rarity}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-amber-500" />
                                  <span className="text-sm font-medium text-amber-600">{achievement.points}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className={`p-2 rounded-lg ${
                            isUnlocked 
                              ? 'bg-green-100' 
                              : hasProgress 
                                ? 'bg-blue-100'
                                : 'bg-gray-100'
                          }`}>
                            {isUnlocked ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : hasProgress ? (
                              <Clock className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Clock className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-gray-600 mb-4">
                          {achievement.description}
                        </CardDescription>
                        
                        {hasProgress && (
                          <div className="mb-4">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                              <span>Progress</span>
                              <span>{achievement.progress}/{achievement.maxProgress}</span>
                            </div>
                            <Progress value={progressPercent} className="h-2" />
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <CategoryIcon className="w-4 h-4" />
                          <span className="capitalize">{achievement.category}</span>
                          {achievement.unlockedAt && (
                            <>
                              <span>•</span>
                              <span>Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
