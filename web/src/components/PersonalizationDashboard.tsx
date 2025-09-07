"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Clock, 
  BookOpen, 
  Lightbulb,
  BarChart3,
  Users,
  Calendar,
  Star,
  AlertCircle,
  CheckCircle,
  Zap,
  Heart,
  Eye,
  Activity
} from 'lucide-react';

interface LearningPattern {
  conceptualStrengths: string[];
  proceduralStrengths: string[];
  commonMistakes: string[];
  effectiveStrategies: TeachingStrategy[];
  optimalStudyTimes: string[];
  preferredContentTypes: ContentType[];
  learningVelocity: number;
  retentionRate: number;
  engagementPatterns: EngagementPattern[];
}

interface TeachingStrategy {
  approach: string;
  modality: string;
  pacing: string;
  reinforcement: string;
  difficulty: string;
  effectiveness: number;
}

interface ContentType {
  type: string;
  preference: number;
  effectiveness: number;
}

interface EngagementPattern {
  timeOfDay: string;
  dayOfWeek: string;
  sessionLength: number;
  engagementLevel: number;
  optimalDuration: number;
}

interface PersonalizedRecommendations {
  nextLessons: any[];
  studySchedule: any[];
  contentPreferences: ContentType[];
  interventionSuggestions: any[];
}

interface LearningEffectiveness {
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: string[];
  personalizedStrategies: TeachingStrategy[];
}

export default function PersonalizationDashboard({ studentId }: { studentId: string }) {
  const [learningPattern, setLearningPattern] = useState<LearningPattern | null>(null);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendations | null>(null);
  const [effectiveness, setEffectiveness] = useState<LearningEffectiveness | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    loadPersonalizationData();
  }, [studentId]);

  const loadPersonalizationData = async () => {
    try {
      setLoading(true);
      
      // Load learning pattern
      const patternResponse = await fetch('/api/personalization/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      });
      
      if (patternResponse.ok) {
        const patternData = await patternResponse.json();
        setLearningPattern(patternData.data);
        setDemoMode(patternData.demoMode || false);
      }

      // Load recommendations
      const recommendationsResponse = await fetch(`/api/personalization/recommendations?studentId=${studentId}`);
      
      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json();
        setRecommendations(recommendationsData.data);
        setDemoMode(recommendationsData.demoMode || demoMode);
      }

      // Load effectiveness analysis
      const effectivenessResponse = await fetch(`/api/personalization/effectiveness?studentId=${studentId}`);
      
      if (effectivenessResponse.ok) {
        const effectivenessData = await effectivenessResponse.json();
        setEffectiveness(effectivenessData.data);
        setDemoMode(effectivenessData.demoMode || demoMode);
      }

    } catch (error) {
      console.error('Error loading personalization data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Personalization Dashboard</h1>
            {demoMode && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                DEMO MODE
              </Badge>
            )}
          </div>
          <p className="text-gray-600 mt-2">
            {demoMode 
              ? "Demo data - Learning insights and recommendations are simulated for demonstration purposes"
              : "AI-powered learning insights and personalized recommendations"
            }
          </p>
        </div>
        <Button onClick={loadPersonalizationData} variant="outline">
          <Activity className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="patterns">Learning Patterns</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="effectiveness">Effectiveness</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Learning Velocity */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Learning Velocity</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {learningPattern ? Math.round((learningPattern.learningVelocity || 0) * 100) : 0}%
                </div>
                <Progress 
                  value={(learningPattern?.learningVelocity || 0) * 100} 
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Speed of concept mastery
                </p>
              </CardContent>
            </Card>

            {/* Retention Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {learningPattern ? Math.round((learningPattern.retentionRate || 0) * 100) : 0}%
                </div>
                <Progress 
                  value={(learningPattern?.retentionRate || 0) * 100} 
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Long-term knowledge retention
                </p>
              </CardContent>
            </Card>

            {/* Optimal Study Times */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Optimal Study Times</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {learningPattern?.optimalStudyTimes.length || 0}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {learningPattern?.optimalStudyTimes.slice(0, 2).map((time, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {time}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Peak learning periods
                </p>
              </CardContent>
            </Card>

            {/* Content Preferences */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Content Type</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {learningPattern?.preferredContentTypes[0]?.type || 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {learningPattern?.preferredContentTypes[0] ? 
                    Math.round(learningPattern.preferredContentTypes[0].effectiveness * 100) + '% effective' : 
                    'No data'
                  }
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Most effective learning modality
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  Strengths
                </CardTitle>
                <CardDescription>Areas where you excel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {effectiveness?.strengths.slice(0, 3).map((strength, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm">{strength}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                  Areas for Improvement
                </CardTitle>
                <CardDescription>Focus areas for growth</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {effectiveness?.weaknesses.slice(0, 3).map((weakness, index) => (
                    <div key={index} className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-orange-500 mr-2" />
                      <span className="text-sm">{weakness}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Learning Strategies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-blue-500" />
                  Effective Learning Strategies
                </CardTitle>
                <CardDescription>Teaching approaches that work best for you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {learningPattern?.effectiveStrategies.slice(0, 3).map((strategy, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{strategy.approach}</Badge>
                        <span className="text-sm font-medium">
                          {Math.round(strategy.effectiveness * 100)}% effective
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Modality: {strategy.modality}</div>
                        <div>Pacing: {strategy.pacing}</div>
                        <div>Reinforcement: {strategy.reinforcement}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Engagement Patterns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-red-500" />
                  Engagement Patterns
                </CardTitle>
                <CardDescription>When and how you learn best</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {learningPattern?.engagementPatterns.slice(0, 3).map((pattern, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{pattern.timeOfDay}</Badge>
                        <span className="text-sm font-medium">
                          {Math.round(pattern.engagementLevel * 100)}% engaged
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Day: {pattern.dayOfWeek}</div>
                        <div>Optimal Duration: {pattern.optimalDuration} minutes</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2 text-purple-500" />
                Content Type Preferences
              </CardTitle>
              <CardDescription>Your preferred learning modalities and their effectiveness</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {learningPattern?.preferredContentTypes.map((contentType, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">{contentType.type}</Badge>
                      <span className="text-sm font-medium">
                        {Math.round(contentType.effectiveness * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={contentType.preference * 100} 
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Preference: {Math.round(contentType.preference * 100)}%
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Study Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-green-500" />
                  Recommended Study Schedule
                </CardTitle>
                <CardDescription>Optimal times for learning based on your patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations?.studySchedule.map((schedule, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{schedule.timeOfDay}</div>
                        <div className="text-sm text-gray-600">
                          {schedule.duration} minutes
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {Math.round(schedule.engagementLevel * 100)}% engaged
                        </div>
                        {schedule.recommended && (
                          <Badge variant="default" className="text-xs">Recommended</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Next Lessons */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
                  Recommended Next Lessons
                </CardTitle>
                <CardDescription>Personalized lesson recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations?.nextLessons.slice(0, 5).map((lesson, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{lesson.title}</div>
                        <div className="text-sm text-gray-600">
                          {lesson.topic.subject.name} - {lesson.topic.name}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {lesson.difficulty}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Intervention Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                Intervention Suggestions
              </CardTitle>
              <CardDescription>AI-recommended learning interventions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations?.interventionSuggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start p-3 border rounded-lg">
                    <div className="flex-shrink-0 mr-3">
                      {suggestion.priority === 'high' ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <Lightbulb className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant={suggestion.priority === 'high' ? 'destructive' : 'secondary'}>
                          {suggestion.type}
                        </Badge>
                        <Badge variant="outline">
                          {suggestion.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">{suggestion.suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="effectiveness" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strengths and Weaknesses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-green-500" />
                  Learning Analysis
                </CardTitle>
                <CardDescription>Comprehensive learning effectiveness analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-green-700 mb-2">Strengths</h4>
                    <div className="space-y-1">
                      {effectiveness?.strengths.map((strength, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          {strength}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-orange-700 mb-2">Areas for Improvement</h4>
                    <div className="space-y-1">
                      {effectiveness?.weaknesses.map((weakness, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <AlertCircle className="w-4 h-4 text-orange-500 mr-2" />
                          {weakness}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Improvement Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                  Improvement Suggestions
                </CardTitle>
                <CardDescription>Personalized recommendations for better learning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {effectiveness?.improvementSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Lightbulb className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-yellow-800">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Personalized Strategies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-500" />
                Personalized Learning Strategies
              </CardTitle>
              <CardDescription>Strategies tailored specifically for your learning style</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {effectiveness?.personalizedStrategies.map((strategy, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline">{strategy.approach}</Badge>
                      <span className="text-sm font-medium">
                        {Math.round(strategy.effectiveness * 100)}% effective
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div><strong>Modality:</strong> {strategy.modality}</div>
                      <div><strong>Pacing:</strong> {strategy.pacing}</div>
                      <div><strong>Reinforcement:</strong> {strategy.reinforcement}</div>
                      <div><strong>Difficulty:</strong> {strategy.difficulty}</div>
                    </div>
                    <Progress 
                      value={strategy.effectiveness * 100} 
                      className="mt-3"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
