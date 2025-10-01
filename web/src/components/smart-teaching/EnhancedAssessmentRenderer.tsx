"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Award, 
  BookOpen, 
  Lightbulb,
  Target,
  Brain
} from 'lucide-react';

interface AssessmentQuestion {
  id: string;
  type: 'multiple_choice' | 'short_answer' | 'essay' | 'code' | 'diagram';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

interface AssessmentContent {
  title: string;
  questions: AssessmentQuestion[];
}

interface EnhancedAssessmentRendererProps {
  content: AssessmentContent;
  learningStyle: 'visual' | 'audio' | 'kinesthetic' | 'analytical';
  onProgress?: (progress: number) => void;
}

const EnhancedAssessmentRenderer: React.FC<EnhancedAssessmentRendererProps> = ({
  content,
  learningStyle,
  onProgress
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQuestion = content.questions[currentQuestionIndex];
  const totalQuestions = content.questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Timer effect
  useEffect(() => {
    if (!isCompleted) {
      const timer = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isCompleted]);

  // Progress callback
  useEffect(() => {
    if (onProgress) {
      onProgress(progress);
    }
  }, [progress, onProgress]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setShowResults(true);
      setIsCompleted(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    content.questions.forEach(question => {
      totalPoints += question.points;
      const userAnswer = userAnswers[question.id];
      if (userAnswer && userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
        correctAnswers++;
        earnedPoints += question.points;
      }
    });

    return {
      correctAnswers,
      totalQuestions,
      earnedPoints,
      totalPoints,
      percentage: Math.round((earnedPoints / totalPoints) * 100)
    };
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return <CheckCircle className="w-4 h-4" />;
      case 'medium': return <Target className="w-4 h-4" />;
      case 'hard': return <Brain className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showResults) {
    const score = calculateScore();
    
    return (
      <div className="space-y-6">
        <Card className="border-2 border-blue-200">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Award className="w-6 h-6 text-yellow-500" />
              Assessment Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{score.percentage}%</div>
                <div className="text-sm text-blue-600">Score</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{score.correctAnswers}/{score.totalQuestions}</div>
                <div className="text-sm text-green-600">Correct</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700 mb-2">Time Spent</div>
              <div className="text-2xl font-bold text-purple-600">{formatTime(timeSpent)}</div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700 mb-2">Points Earned</div>
              <div className="text-2xl font-bold text-orange-600">{score.earnedPoints}/{score.totalPoints}</div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Review Your Answers</h3>
          {content.questions.map((question, index) => {
            const userAnswer = userAnswers[question.id];
            const isCorrect = userAnswer && userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
            
            return (
              <Card key={question.id} className={`border ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Question {index + 1}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getDifficultyColor(question.difficulty)}>
                        {getDifficultyIcon(question.difficulty)}
                        <span className="ml-1 capitalize">{question.difficulty}</span>
                      </Badge>
                      <Badge variant="outline">{question.points} pts</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="font-medium">{question.question}</p>
                  
                  {question.type === 'multiple_choice' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className={`p-2 rounded ${
                          option === question.correctAnswer ? 'bg-green-100 border border-green-300' :
                          option === userAnswer ? 'bg-red-100 border border-red-300' :
                          'bg-gray-50'
                        }`}>
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {question.type !== 'multiple_choice' && (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">Your Answer:</div>
                      <div className="p-2 bg-gray-100 rounded">{userAnswer || 'No answer provided'}</div>
                      <div className="text-sm text-gray-600">Correct Answer:</div>
                      <div className="p-2 bg-green-100 rounded">{question.correctAnswer}</div>
                    </div>
                  )}
                  
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-blue-800">Explanation:</div>
                        <div className="text-sm text-blue-700">{question.explanation}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">{content.title}</h2>
        <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatTime(timeSpent)}
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Question {currentQuestionIndex + 1}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                {getDifficultyIcon(currentQuestion.difficulty)}
                <span className="ml-1 capitalize">{currentQuestion.difficulty}</span>
              </Badge>
              <Badge variant="outline">{currentQuestion.points} points</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg font-medium">{currentQuestion.question}</p>
          
          {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
            <div className="space-y-2">
              {currentQuestion.options.map((option, index) => (
                <label key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={userAnswers[currentQuestion.id] === option}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}
          
          {currentQuestion.type !== 'multiple_choice' && (
            <div className="space-y-2">
              <textarea
                value={userAnswers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder="Enter your answer here..."
                className="w-full p-3 border rounded-lg resize-none"
                rows={4}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        
        <Button
          onClick={handleNextQuestion}
          disabled={!userAnswers[currentQuestion.id]}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {currentQuestionIndex === totalQuestions - 1 ? 'Finish Assessment' : 'Next Question'}
        </Button>
      </div>
    </div>
  );
};

export default EnhancedAssessmentRenderer;
