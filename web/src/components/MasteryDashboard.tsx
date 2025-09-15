"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
//import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  Target, 
  BookOpen, 
  CheckCircle, 
  XCircle,
  Clock,
  Brain,
  AlertTriangle,
  Loader2,
  BarChart3,
  Award,
  Lightbulb
} from "lucide-react";
import { useTranslations } from "@/lib/useTranslations";

interface MasteryData {
  overallProgress: {
    lessonCompletionRate: number;
    assessmentPassRate: number;
    overallScore: number;
  };
  subjectProgress: Array<{
    subjectId: string;
    subjectName: string;
    lessonCompletionRate: number;
    assessmentPassRate: number;
    averageScore: number;
  }>;
  lessonMastery: Array<{
    lessonId: string;
    lessonTitle: string;
    status: string;
    attempts: number;
    masteryLevel: string;
    lastScore: number;
    timeSpent: number;
  }>;
  assessmentPerformance: {
    recentAverage: number;
    improvementTrend: string;
    strongestAreas: string[];
    weakestAreas: string[];
  };
  learningVelocity: {
    lessonsPerWeek: number;
    averageTimePerLesson: number;
    acceleration: number;
  };
  strengthsAndWeaknesses: {
    strengths: string[];
    weaknesses: string[];
    topicPerformance: { [key: string]: { correct: number; total: number; score: number } };
  };
  recommendations: Array<{
    type: string;
    message: string;
    lessons?: string[];
    severity?: string;
  }>;
}

interface MasteryDashboardProps {
  studentId?: string;
  subjectId?: string;
  className?: string;
}

export function MasteryDashboard({ 
  studentId, 
  subjectId,
  className = "" 
}: MasteryDashboardProps) {
  //const { dict } = useTranslations();
  const [masteryData, setMasteryData] = useState<MasteryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMasteryData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (studentId) params.append('studentId', studentId);
      if (subjectId) params.append('subjectId', subjectId);
      params.append('period', 'weekly');

      const response = await fetch(`/api/assessments/mastery?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch mastery data');
      }
      
      const data = await response.json();
      setMasteryData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasteryData();
  }, [studentId, subjectId, fetchMasteryData]);

  const getMasteryLevelColor = (level: string) => {
    switch (level) {
      case 'mastered': return 'text-green-600 bg-green-100';
      case 'struggling': return 'text-yellow-600 bg-yellow-100';
      case 'not_attempted': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      case 'stable': return <BarChart3 className="h-4 w-4 text-blue-600" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'improving': return 'Improving';
      case 'declining': return 'Declining';
      case 'stable': return 'Stable';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading mastery data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!masteryData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No mastery data available</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Progress Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lesson Completion</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(masteryData.overallProgress.lessonCompletionRate)}%
            </div>
            <Progress 
              value={masteryData.overallProgress.lessonCompletionRate} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessment Pass Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(masteryData.overallProgress.assessmentPassRate)}%
            </div>
            <Progress 
              value={masteryData.overallProgress.assessmentPassRate} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(masteryData.overallProgress.overallScore * 100)}%
            </div>
            <Progress 
              value={masteryData.overallProgress.overallScore * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Performance Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(masteryData.assessmentPerformance.improvementTrend)}
                    <span className="font-medium">Assessment Trend</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {getTrendText(masteryData.assessmentPerformance.improvementTrend)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Learning Velocity</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {masteryData.learningVelocity.lessonsPerWeek.toFixed(1)} lessons per week
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Recent Performance</h4>
                <div className="text-2xl font-bold">
                  {Math.round(masteryData.assessmentPerformance.recentAverage * 100)}%
                </div>
                <Progress 
                  value={masteryData.assessmentPerformance.recentAverage * 100} 
                  className="w-full" 
                />
              </div>
            </CardContent>
          </Card>

          {/* Strengths and Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Strengths</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {masteryData.strengthsAndWeaknesses.strengths.length > 0 ? (
                  <div className="space-y-2">
                    {masteryData.strengthsAndWeaknesses.strengths.map((strength, index) => (
                      <Badge key={index} variant="default" className="mr-2 mb-2">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No strengths identified yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span>Areas for Improvement</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {masteryData.strengthsAndWeaknesses.weaknesses.length > 0 ? (
                  <div className="space-y-2">
                    {masteryData.strengthsAndWeaknesses.weaknesses.map((weakness, index) => (
                      <Badge key={index} variant="destructive" className="mr-2 mb-2">
                        {weakness}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No areas for improvement identified</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          {masteryData.subjectProgress.map((subject) => (
            <Card key={subject.subjectId}>
              <CardHeader>
                <CardTitle>{subject.subjectName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Lessons</span>
                      <span>{Math.round(subject.lessonCompletionRate)}%</span>
                    </div>
                    <Progress value={subject.lessonCompletionRate} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Assessments</span>
                      <span>{Math.round(subject.assessmentPassRate)}%</span>
                    </div>
                    <Progress value={subject.assessmentPassRate} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Average Score</span>
                      <span>{Math.round(subject.averageScore * 100)}%</span>
                    </div>
                    <Progress value={subject.averageScore * 100} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="lessons" className="space-y-4">
          <div className="grid gap-4">
            {masteryData.lessonMastery.map((lesson) => (
              <Card key={lesson.lessonId}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{lesson.lessonTitle}</CardTitle>
                      <CardDescription>
                        {lesson.attempts} attempt{lesson.attempts !== 1 ? 's' : ''} • 
                        {Math.round(lesson.timeSpent)} minutes
                      </CardDescription>
                    </div>
                    <Badge className={getMasteryLevelColor(lesson.masteryLevel)}>
                      {lesson.masteryLevel.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {lesson.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm">{lesson.status}</span>
                    </div>
                    
                    {lesson.lastScore > 0 && (
                      <div className="text-sm">
                        Last Score: {Math.round(lesson.lastScore * 100)}%
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {masteryData.recommendations.length > 0 ? (
            <div className="space-y-4">
              {masteryData.recommendations.map((recommendation, index) => (
                <Alert key={index} variant={recommendation.severity === 'warning' ? 'destructive' : 'default'}>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">{recommendation.message}</p>
                      {recommendation.lessons && (
                        <div className="text-sm">
                          <p>Related lessons:</p>
                          <ul className="list-disc list-inside mt-1">
                            {recommendation.lessons.map((lesson, lessonIndex) => (
                              <li key={lessonIndex}>{lesson}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Brain className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No recommendations</h3>
                <p className="text-gray-500 text-center">
                  Keep up the great work! Continue learning to get personalized recommendations.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
