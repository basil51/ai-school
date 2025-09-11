'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Brain, 
  Target, 
  Lightbulb,
  BookOpen,
  Trophy
} from 'lucide-react';

interface Question {
  id: string;
  type: 'multiple_choice' | 'short_answer' | 'true_false' | 'essay';
  content: string;
  points: number;
  difficulty?: 'easy' | 'intermediate' | 'hard';
  correctAnswer?: string;
  explanation?: string;
  options?: Array<{
    id: string;
    content: string;
    isCorrect: boolean;
  }>;
}

interface SmartAssessmentInterfaceProps {
  sessionId: string;
  lessonId: string;
  onAssessmentComplete?: (result: any) => void;
  onAssessmentStart?: () => void;
  adaptiveMode?: boolean;
  triggerType?: 'periodic_check' | 'confusion_detected' | 'concept_mastery' | 'lesson_complete';
}

export default function SmartAssessmentInterface({
  sessionId,
  lessonId,
  onAssessmentComplete,
  onAssessmentStart,
  adaptiveMode = false,
  triggerType = 'periodic_check'
}: SmartAssessmentInterfaceProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  // Generate adaptive questions
  const generateAdaptiveQuestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/smart-teaching/assessments/adaptive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          triggerType,
          context: `Smart teaching assessment for lesson ${lessonId}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate adaptive questions');
      }

      const data = await response.json();
      setQuestions(data.questions || []);
      setAssessmentStarted(true);
      onAssessmentStart?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate questions');
    } finally {
      setIsLoading(false);
    }
  };

  // Start assessment with existing questions
  const startAssessment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/smart-teaching/assessments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assessments');
      }

      const data = await response.json();
      const assessments = data.filter((assessment: any) => 
        assessment.lessonId === lessonId && assessment.isActive
      );

      if (assessments.length > 0) {
        const assessment = assessments[0];
        setQuestions(assessment.questions || []);
        setAssessmentStarted(true);
        onAssessmentStart?.();
      } else {
        throw new Error('No assessments available for this lesson');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start assessment');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit assessment
  const submitAssessment = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const responseData = questions.map(question => ({
        questionId: question.id,
        answer: responses[question.id] || '',
        timeSpent: timeSpent[question.id] || 0
      }));

      const response = await fetch('/api/smart-teaching/assessments/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          smartTeachingAssessmentId: sessionId, // Using sessionId as assessment ID for now
          responses: responseData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit assessment');
      }

      const result = await response.json();
      setResult(result);
      setAssessmentCompleted(true);
      onAssessmentComplete?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle response change
  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Handle time tracking
  useEffect(() => {
    if (!assessmentStarted || assessmentCompleted) return;

    const interval = setInterval(() => {
      if (currentQuestion) {
        setTimeSpent(prev => ({
          ...prev,
          [currentQuestion.id]: (prev[currentQuestion.id] || 0) + 1
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestion, assessmentStarted, assessmentCompleted]);

  // Render question based on type
  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case 'multiple_choice':
        return (
          <RadioGroup
            value={responses[question.id] || ''}
            onValueChange={(value) => handleResponseChange(question.id, value)}
            className="space-y-3"
          >
            {question.options?.map((option, index) => (
              <div key={option.id || index} className="flex items-center space-x-2">
                <RadioGroupItem value={option.id || index.toString()} id={option.id || index.toString()} />
                <Label htmlFor={option.id || index.toString()} className="flex-1 cursor-pointer">
                  {option.content}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'true_false':
        return (
          <RadioGroup
            value={responses[question.id] || ''}
            onValueChange={(value) => handleResponseChange(question.id, value)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="true" />
              <Label htmlFor="true" className="cursor-pointer">True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="false" />
              <Label htmlFor="false" className="cursor-pointer">False</Label>
            </div>
          </RadioGroup>
        );

      case 'short_answer':
      case 'essay':
        return (
          <Textarea
            value={responses[question.id] || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder={question.type === 'essay' ? 'Write your detailed answer here...' : 'Enter your answer...'}
            className="min-h-[100px]"
          />
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  // Render assessment result
  const renderResult = () => {
    if (!result) return null;

    const percentage = result.feedback?.percentage || 0;
    const passed = result.feedback?.passed || false;

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {passed ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {passed ? 'Great Job!' : 'Keep Learning!'}
          </CardTitle>
          <div className="text-3xl font-bold text-blue-600">
            {(percentage * 100).toFixed(1)}%
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.feedback?.aiFeedback && (
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                {result.feedback.aiFeedback}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <h4 className="font-semibold">Question Review:</h4>
            {result.responses?.map((response: any, index: number) => {
              const question = questions.find(q => q.id === response.questionId);
              if (!question) return null;

              return (
                <div key={response.questionId} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Question {index + 1}</span>
                    {response.isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{question.content}</p>
                  <p className="text-sm">
                    <strong>Your answer:</strong> {response.answer}
                  </p>
                  {!response.isCorrect && question.explanation && (
                    <p className="text-sm text-blue-600 mt-1">
                      <strong>Explanation:</strong> {question.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (assessmentCompleted) {
    return renderResult();
  }

  if (!assessmentStarted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Brain className="h-12 w-12 text-blue-500" />
          </div>
          <CardTitle>
            {adaptiveMode ? 'Adaptive Knowledge Check' : 'Lesson Assessment'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-gray-600">
            {adaptiveMode ? (
              <p>Let's check your understanding with some adaptive questions!</p>
            ) : (
              <p>Test your knowledge of this lesson with a quick assessment.</p>
            )}
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={adaptiveMode ? generateAdaptiveQuestions : startAssessment}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Preparing...' : 'Start Assessment'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="text-center py-8">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No questions available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Question {currentQuestionIndex + 1} of {questions.length}
          </CardTitle>
          <Badge variant={currentQuestion?.difficulty === 'hard' ? 'destructive' : 
                          currentQuestion?.difficulty === 'easy' ? 'secondary' : 'default'}>
            {currentQuestion?.difficulty || 'intermediate'}
          </Badge>
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm text-gray-600">
              Time spent: {Math.floor((timeSpent[currentQuestion.id] || 0) / 60)}:{(timeSpent[currentQuestion.id] || 0) % 60 < 10 ? '0' : ''}{(timeSpent[currentQuestion.id] || 0) % 60}s
            </span>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">{currentQuestion.content}</h3>
            <div className="text-sm text-gray-600 mb-4">
              {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
            </div>
            {renderQuestion(currentQuestion)}
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={submitAssessment}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
            >
              Next
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
