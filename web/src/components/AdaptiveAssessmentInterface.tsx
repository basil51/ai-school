"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Target, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  AlertCircle,
  Lightbulb,
  BarChart3,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface AdaptiveQuestion {
  id: string;
  questionType: string;
  content: any;
  difficulty: number;
  estimatedTime: number;
  learningObjective?: string;
  cognitiveLevel: string;
  order: number;
}

interface AssessmentSession {
  assessmentId: string;
  studentId: string;
  subjectId: string;
  sessionType: string;
}

interface AssessmentResult {
  feedback: string;
  nextAction: string;
  analytics: any;
}

export default function AdaptiveAssessmentInterface({ 
  session, 
  onComplete 
}: { 
  session: AssessmentSession;
  onComplete: (result: any) => void;
}) {
  const [currentQuestion, setCurrentQuestion] = useState<AdaptiveQuestion | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [attempts, setAttempts] = useState(1);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);

  // Timer effect
  useEffect(() => {
    if (!isPaused && currentQuestion && questionStartTime > 0) {
      const timer = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - questionStartTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isPaused, currentQuestion, questionStartTime]);

  // Load first question when component mounts
  useEffect(() => {
    loadNextQuestion();
  }, []);

  // Initialize timer on client side only
  useEffect(() => {
    if (typeof window !== 'undefined' && currentQuestion && questionStartTime === 0) {
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestion, questionStartTime]);

  const loadNextQuestion = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/adaptive-assessment/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId: session.assessmentId })
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        setCurrentQuestion(data.data);
        setCurrentAnswer(null);
        setTimeSpent(0);
        setHintsUsed(0);
        setAttempts(1);
        setQuestionStartTime(Date.now());
        setShowFeedback(false);
        setAssessmentResult(null);
      } else if (data.message?.includes('completed')) {
        // Assessment completed
        completeAssessment();
      }
    } catch (error) {
      console.error('Error loading question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !currentAnswer) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/adaptive-assessment/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: session.assessmentId,
          response: {
            questionId: currentQuestion.id,
            answer: currentAnswer,
            timeSpent,
            hintsUsed,
            attempts,
            confidence: 0.8 // Could be made interactive
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setAssessmentResult(data.data);
        setShowFeedback(true);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeAssessment = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/adaptive-assessment/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId: session.assessmentId })
      });

      const data = await response.json();
      
      if (data.success) {
        onComplete(data.data);
      }
    } catch (error) {
      console.error('Error completing assessment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextAction = () => {
    if (!assessmentResult) return;

    switch (assessmentResult.nextAction) {
      case 'CONTINUE':
        loadNextQuestion();
        break;
      case 'COMPLETE':
        completeAssessment();
        break;
      case 'REMEDIATION':
        // Could show remediation content
        loadNextQuestion();
        break;
      default:
        loadNextQuestion();
    }
  };

  const renderQuestionContent = () => {
    if (!currentQuestion) return null;

    const { content, questionType } = currentQuestion;

    switch (questionType) {
      case 'MULTIPLE_CHOICE':
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium">{content.question || content.text || 'Question not available'}</p>
            <div className="space-y-2">
              {(content.options || []).map((option: string, index: number) => (
                <label key={index} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="answer"
                    value={option}
                    checked={currentAnswer === option}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'SHORT_ANSWER':
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium">{content.question || content.text || 'Question not available'}</p>
            <textarea
              value={currentAnswer || ''}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Enter your answer here..."
              className="w-full p-3 border rounded-lg resize-none"
              rows={4}
            />
          </div>
        );

      case 'MATHEMATICAL':
        return (
          <div className="space-y-4">
            <div className="text-lg font-medium" dangerouslySetInnerHTML={{ __html: content.question || content.text || 'Question not available' }} />
            <div className="space-y-2">
              <input
                type="text"
                value={currentAnswer || ''}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Enter your answer..."
                className="w-full p-3 border rounded-lg"
              />
              {content.steps && (
                <div className="text-sm text-gray-600">
                  <p>Show your work:</p>
                  <textarea
                    placeholder="Show your steps..."
                    className="w-full p-2 border rounded mt-1"
                    rows={3}
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 'TRUE_FALSE':
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium">{content.question || content.text || 'Question not available'}</p>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="answer"
                  value="true"
                  checked={currentAnswer === 'true'}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span>True</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="answer"
                  value="false"
                  checked={currentAnswer === 'false'}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span>False</span>
              </label>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium">{content.question || content.text || 'Question content not available'}</p>
            <textarea
              value={currentAnswer || ''}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Enter your answer here..."
              className="w-full p-3 border rounded-lg resize-none"
              rows={4}
            />
          </div>
        );
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 0.3) return 'bg-green-100 text-green-800';
    if (difficulty < 0.7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty < 0.3) return 'Easy';
    if (difficulty < 0.7) return 'Medium';
    return 'Hard';
  };

  if (isLoading && !currentQuestion) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentQuestion && !assessmentResult) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>No questions available for this assessment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Assessment Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" />
                Adaptive Assessment
              </CardTitle>
              <CardDescription>
                {session.sessionType} • {currentQuestion?.learningObjective || 'General Assessment'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getDifficultyColor(currentQuestion?.difficulty || 0.5)}>
                {getDifficultyLabel(currentQuestion?.difficulty || 0.5)}
              </Badge>
              <Badge variant="secondary">
                {currentQuestion?.cognitiveLevel}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{timeSpent}s</span>
              </div>
              <div className="flex items-center gap-1">
                <Lightbulb className="w-4 h-4" />
                <span>{hintsUsed} hints</span>
              </div>
              <div className="flex items-center gap-1">
                <RotateCcw className="w-4 h-4" />
                <span>{attempts} attempts</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Content */}
      {currentQuestion && !showFeedback && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Question {currentQuestion.order}</span>
              <Badge variant="outline">
                {currentQuestion.questionType.replace('_', ' ')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderQuestionContent()}
            
            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setHintsUsed(hintsUsed + 1)}
                disabled={isLoading}
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Get Hint
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAttempts(attempts + 1);
                    setCurrentAnswer(null);
                  }}
                  disabled={isLoading}
                >
                  Reset
                </Button>
                <Button
                  onClick={submitAnswer}
                  disabled={!currentAnswer || isLoading}
                >
                  {isLoading ? 'Submitting...' : 'Submit Answer'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback */}
      {showFeedback && assessmentResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {assessmentResult.analytics?.retentionRate > 0.7 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-800">{assessmentResult.feedback}</p>
            </div>
            
            {/* Analytics Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((assessmentResult.analytics?.retentionRate || 0) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((assessmentResult.analytics?.learningVelocity || 0) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Velocity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round((assessmentResult.analytics?.confidenceLevel || 0) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {timeSpent}s
                </div>
                <div className="text-sm text-gray-600">Time</div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleNextAction} disabled={isLoading}>
                {assessmentResult.nextAction === 'COMPLETE' ? 'Complete Assessment' : 'Next Question'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
