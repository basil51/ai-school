"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  XCircle, 
  //Clock, 
  Brain,
  //FileText,
  Loader2,
  AlertCircle,
  RotateCcw,
  TrendingUp,
  Target
} from "lucide-react";
//import { useTranslations } from "@/lib/useTranslations";

interface QuestionOption {
  id: string;
  content: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  type: 'multiple_choice' | 'short_answer' | 'essay' | 'true_false';
  content: string;
  points: number;
  correctAnswer?: string;
  explanation?: string;
  options?: QuestionOption[];
}

interface StudentResponse {
  id: string;
  questionId: string;
  answer: string;
  isCorrect?: boolean;
  pointsEarned: number;
  feedback?: string;
  timeSpent: number;
  question: Question;
}

interface AssessmentAttempt {
  id: string;
  startedAt: string;
  completedAt: string;
  score: number;
  passed: boolean;
  feedback?: string;
  assessment: {
    id: string;
    title: string;
    passingScore: number;
    lesson: {
      title: string;
      topic: {
        name: string;
        subject: {
          name: string;
        };
      };
    };
  };
  responses: StudentResponse[];
}

interface AssessmentResultsProps {
  attemptId: string;
  onRetake?: () => void;
  onContinue?: () => void;
  className?: string;
}

export function AssessmentResults({ 
  attemptId, 
  onRetake,
  onContinue,
  className = "" 
}: AssessmentResultsProps) {
  //const { dict } = useTranslations();
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assessments/attempts?attemptId=${attemptId}&includeResponses=true`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch assessment results');
      }
      
      const data = await response.json();
      if (data.length > 0) {
        setAttempt(data[0]);
      } else {
        throw new Error('Assessment attempt not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [attemptId, fetchResults]);

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (percentage: number) => {
    if (percentage >= 90) return 'default';
    if (percentage >= 80) return 'secondary';
    if (percentage >= 70) return 'outline';
    return 'destructive';
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTotalTimeSpent = () => {
    if (!attempt) return 0;
    return attempt.responses.reduce((total, response) => total + response.timeSpent, 0);
  };

  const getTotalPoints = () => {
    if (!attempt) return 0;
    return attempt.responses.reduce((total, response) => total + response.question.points, 0);
  };

  const getCorrectAnswers = () => {
    if (!attempt) return 0;
    return attempt.responses.filter(response => response.isCorrect).length;
  };

  const getPercentage = () => {
    const totalPoints = getTotalPoints();
    return totalPoints > 0 ? (attempt?.score || 0) / totalPoints * 100 : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading results...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!attempt) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No results found</AlertDescription>
      </Alert>
    );
  }

  const percentage = getPercentage();
  const totalTimeSpent = getTotalTimeSpent();
  const correctAnswers = getCorrectAnswers();
  const totalQuestions = attempt.responses.length;

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>Assessment Results</span>
                {attempt.passed ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
              </CardTitle>
              <CardDescription>
                {attempt.assessment.title}
              </CardDescription>
              <div className="text-sm text-gray-500 mt-1">
                {attempt.assessment.lesson.topic.subject.name} • {attempt.assessment.lesson.topic.name}
              </div>
            </div>
            <Badge variant={getScoreBadgeVariant(percentage)} className="text-lg px-3 py-1">
              {Math.round(percentage)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
              <div className="text-sm text-gray-500">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{totalQuestions - correctAnswers}</div>
              <div className="text-sm text-gray-500">Incorrect</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{attempt.score.toFixed(1)}</div>
              <div className="text-sm text-gray-500">Points Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatTime(totalTimeSpent)}</div>
              <div className="text-sm text-gray-500">Time Spent</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Overall Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Score</span>
              <span className={getScoreColor(percentage)}>{Math.round(percentage)}%</span>
            </div>
            <Progress value={percentage} className="w-full" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Passing Score</span>
              <span>{Math.round(attempt.assessment.passingScore * 100)}%</span>
            </div>
            <Progress value={attempt.assessment.passingScore * 100} className="w-full" />
          </div>

          <div className="flex items-center space-x-2">
            {attempt.passed ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-600 font-semibold">Congratulations! You passed!</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-600 font-semibold">You need to retake this assessment</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Tabs defaultValue="questions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="questions">Question Review</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        
        <TabsContent value="questions" className="space-y-4">
          {attempt.responses.map((response, index) => (
            <Card key={response.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Question {index + 1}
                    </CardTitle>
                    <CardDescription>
                      {response.question.points} point{response.question.points !== 1 ? 's' : ''} • 
                      {response.question.type.replace('_', ' ')} • 
                      {formatTime(response.timeSpent)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {response.isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <Badge variant={response.isCorrect ? "default" : "destructive"}>
                      {response.pointsEarned}/{response.question.points}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-lg">
                  {response.question.content}
                </div>

                {/* Student's Answer */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Your Answer:</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {response.question.type === 'multiple_choice' && response.question.options ? (
                      <div>
                        {response.question.options.find(opt => opt.id === response.answer)?.content || 'No answer selected'}
                      </div>
                    ) : (
                      <div>{response.answer || 'No answer provided'}</div>
                    )}
                  </div>
                </div>

                {/* Correct Answer */}
                {!response.isCorrect && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Correct Answer:</h4>
                    <div className="p-3 bg-green-50 rounded-lg">
                      {response.question.type === 'multiple_choice' && response.question.options ? (
                        <div>
                          {response.question.options.find(opt => opt.isCorrect)?.content}
                        </div>
                      ) : (
                        <div>{response.question.correctAnswer}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Explanation */}
                {response.question.explanation && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Explanation:</h4>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      {response.question.explanation}
                    </div>
                  </div>
                )}

                {/* AI Feedback */}
                {response.feedback && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center space-x-2">
                      <Brain className="h-4 w-4" />
                      <span>AI Feedback:</span>
                    </h4>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      {response.feedback}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Performance Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Strengths</h4>
                  <div className="space-y-1">
                    {attempt.responses.filter(r => r.isCorrect).map((response, index) => (
                      <div key={index} className="text-sm text-green-600">
                        ✓ Question {attempt.responses.indexOf(response) + 1}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Areas for Improvement</h4>
                  <div className="space-y-1">
                    {attempt.responses.filter(r => !r.isCorrect).map((response, index) => (
                      <div key={index} className="text-sm text-red-600">
                        ✗ Question {attempt.responses.indexOf(response) + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {attempt.feedback && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Overall Feedback</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {attempt.feedback}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-center space-x-4">
        {onRetake && !attempt.passed && (
          <Button onClick={onRetake} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Retake Assessment
          </Button>
        )}
        
        {onContinue && (
          <Button onClick={onContinue}>
            Continue Learning
          </Button>
        )}
      </div>
    </div>
  );
}
