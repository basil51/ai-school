"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
//import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
//import { Checkbox } from "@/components/ui/checkbox";
import { 
  Clock, 
  CheckCircle, 
  //XCircle, 
  //Play, 
  //Pause, 
  //RotateCcw,
  //Brain,
  FileText,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ArrowRight
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

interface Assessment {
  id: string;
  title: string;
  instructions: string;
  timeLimit?: number;
  passingScore: number;
  maxAttempts: number;
  lesson: {
    title: string;
    topic: {
      name: string;
      subject: {
        name: string;
      };
    };
  };
  questions: Question[];
}

interface StudentResponse {
  questionId: string;
  answer: string;
  timeSpent: number;
}

interface StudentAssessmentProps {
  assessmentId: string;
  onComplete?: (attemptId: string) => void;
  onExit?: () => void;
  className?: string;
}

export function StudentAssessment({ 
  assessmentId, 
  onComplete,
  onExit,
  className = "" 
}: StudentAssessmentProps) {
  //const { dict } = useTranslations();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<StudentResponse[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  //const [startTime, setStartTime] = useState<Date | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updateQuestionTimeSpent = useCallback((questionIndex: number, timeSpent: number) => {
    setResponses(prev => {
      const newResponses = [...prev];
      if (newResponses[questionIndex]) {
        newResponses[questionIndex].timeSpent = timeSpent;
      }
      return newResponses;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!attemptId) return;

    try {
      setIsSubmitting(true);
      
      // Record final time for current question
      if (questionStartTime) {
        const timeSpent = Math.floor((Date.now() - questionStartTime.getTime()) / 1000);
        updateQuestionTimeSpent(currentQuestionIndex, timeSpent);
      }

      const response = await fetch('/api/assessments/attempts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attemptId,
          responses
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit assessment');
      }

      //const result = await response.json();
      
      if (onComplete) {
        onComplete(attemptId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  }, [attemptId, questionStartTime, currentQuestionIndex, updateQuestionTimeSpent, responses, onComplete]);

  const handleTimeUp = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeRemaining, handleTimeUp]);

  useEffect(() => {
    if (questionStartTime) {
      questionTimerRef.current = setInterval(() => {
        // Update time spent for current question
        const timeSpent = Math.floor((Date.now() - questionStartTime.getTime()) / 1000);
        updateQuestionTimeSpent(currentQuestionIndex, timeSpent);
      }, 1000);
    }

    return () => {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, [questionStartTime, currentQuestionIndex, updateQuestionTimeSpent]);

  const startAssessment = useCallback(async () => {
    try {
      setLoading(true);
      
      // Start a new attempt
      const attemptResponse = await fetch('/api/assessments/attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assessmentId }),
      });

      if (!attemptResponse.ok) {
        const errorData = await attemptResponse.json();
        throw new Error(errorData.error || 'Failed to start assessment');
      }

      const attemptData = await attemptResponse.json();
      setAttemptId(attemptData.id);
      setAssessment(attemptData.assessment);
      setQuestionStartTime(new Date());

      // Initialize responses array
      const initialResponses = attemptData.assessment.questions.map((question: Question) => ({
        questionId: question.id,
        answer: '',
        timeSpent: 0
      }));
      setResponses(initialResponses);

      // Set timer if time limit exists
      if (attemptData.assessment.timeLimit) {
        setTimeRemaining(attemptData.assessment.timeLimit * 60); // Convert minutes to seconds
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start assessment');
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    startAssessment();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, [assessmentId, startAssessment]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setResponses(prev => {
      const newResponses = [...prev];
      const responseIndex = newResponses.findIndex(r => r.questionId === questionId);
      if (responseIndex !== -1) {
        newResponses[responseIndex].answer = answer;
      }
      return newResponses;
    });
  };

  const handleNextQuestion = () => {
    if (assessment && currentQuestionIndex < assessment.questions.length - 1) {
      // Record time spent on current question
      if (questionStartTime) {
        const timeSpent = Math.floor((Date.now() - questionStartTime.getTime()) / 1000);
        updateQuestionTimeSpent(currentQuestionIndex, timeSpent);
      }
      
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionStartTime(new Date());
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      // Record time spent on current question
      if (questionStartTime) {
        const timeSpent = Math.floor((Date.now() - questionStartTime.getTime()) / 1000);
        updateQuestionTimeSpent(currentQuestionIndex, timeSpent);
      }
      
      setCurrentQuestionIndex(prev => prev - 1);
      setQuestionStartTime(new Date());
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!assessment) return 0;
    return ((currentQuestionIndex + 1) / assessment.questions.length) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading assessment...</span>
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

  if (!assessment || !attemptId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Assessment not found</AlertDescription>
      </Alert>
    );
  }

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const currentResponse = responses.find(r => r.questionId === currentQuestion.id);

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{assessment.title}</CardTitle>
              <CardDescription>
                {assessment.lesson.topic.subject.name} • {assessment.lesson.topic.name}
              </CardDescription>
            </div>
            <div className="text-right">
              {timeRemaining !== null && (
                <div className="flex items-center space-x-2 text-lg font-semibold">
                  <Clock className="h-5 w-5" />
                  <span className={timeRemaining < 300 ? 'text-red-600' : ''}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
              <div className="text-sm text-gray-500 mt-1">
                Question {currentQuestionIndex + 1} of {assessment.questions.length}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(getProgress())}%</span>
            </div>
            <Progress value={getProgress()} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      {assessment.instructions && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>{assessment.instructions}</AlertDescription>
        </Alert>
      )}

      {/* Question */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">
                Question {currentQuestionIndex + 1}
              </CardTitle>
              <CardDescription>
                {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''} • 
                {currentQuestion.type.replace('_', ' ')}
              </CardDescription>
            </div>
            <Badge variant="outline">{currentQuestion.type}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-lg">
            {currentQuestion.content}
          </div>

          {/* Answer Input */}
          <div className="space-y-4">
            {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
              <RadioGroup
                value={currentResponse?.answer || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                {currentQuestion.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                      {option.content}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === 'true_false' && (
              <RadioGroup
                value={currentResponse?.answer || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
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
            )}

            {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'essay') && (
              <Textarea
                value={currentResponse?.answer || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder={currentQuestion.type === 'essay' ? 'Write your essay here...' : 'Enter your answer...'}
                rows={currentQuestion.type === 'essay' ? 6 : 3}
                className="w-full"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex space-x-2">
          {onExit && (
            <Button variant="outline" onClick={onExit}>
              Exit
            </Button>
          )}
          
          {currentQuestionIndex === assessment.questions.length - 1 ? (
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Assessment
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNextQuestion}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Question Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {assessment.questions.map((_, index) => (
              <Button
                key={index}
                variant={index === currentQuestionIndex ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (questionStartTime) {
                    const timeSpent = Math.floor((Date.now() - questionStartTime.getTime()) / 1000);
                    updateQuestionTimeSpent(currentQuestionIndex, timeSpent);
                  }
                  setCurrentQuestionIndex(index);
                  setQuestionStartTime(new Date());
                }}
                className="aspect-square"
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
