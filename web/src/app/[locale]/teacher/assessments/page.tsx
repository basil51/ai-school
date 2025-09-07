"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Play,
  FileText,
  Loader2,
  AlertCircle,
  Brain,
  Target
} from "lucide-react";
import { useTranslations } from "@/lib/useTranslations";
import { StudentAssessment } from "@/components/StudentAssessment";
import { AssessmentResults } from "@/components/AssessmentResults";

interface Assessment {
  id: string;
  title: string;
  type: 'quiz' | 'test' | 'assignment' | 'project';
  instructions: string;
  timeLimit?: number;
  passingScore: number;
  maxAttempts: number;
  createdAt: string;
  lesson: {
    id: string;
    title: string;
    topic: {
      name: string;
      subject: {
        name: string;
      };
    };
  };
  _count: {
    questions: number;
    attempts: number;
  };
}

interface AssessmentAttempt {
  id: string;
  startedAt: string;
  completedAt?: string;
  score?: number;
  passed?: boolean;
  assessment: Assessment;
}

export default function AssessmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { dict, loading: dictLoading } = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/login`);
    }
  }, [status, router, locale]);

  useEffect(() => {
    if (session) {
      fetchAssessments();
      fetchAttempts();
    }
  }, [session]);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        includeQuestions: 'false',
        includeAttempts: 'false'
      });
      
      // Add studentId if user is a student
      const userRole = (session as any)?.role;
      const userId = (session as any)?.user?.id;
      if (userRole === 'student' && userId) {
        params.append('studentId', userId);
      }
      
      const response = await fetch(`/api/assessments?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch assessments');
      }
      
      const data = await response.json();
      setAssessments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttempts = async () => {
    try {
      const response = await fetch('/api/assessments/attempts?includeResponses=false');
      
      if (!response.ok) {
        throw new Error('Failed to fetch attempts');
      }
      
      const data = await response.json();
      setAttempts(data);
    } catch (err) {
      console.error('Error fetching attempts:', err);
    }
  };

  const startAssessment = async (assessmentId: string) => {
    try {
      setCurrentAssessment(assessments.find(a => a.id === assessmentId) || null);
      setShowResults(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start assessment');
    }
  };

  const handleAssessmentComplete = (attemptId: string) => {
    setCurrentAttempt(attemptId);
    setShowResults(true);
    setCurrentAssessment(null);
    fetchAttempts(); // Refresh attempts list
  };

  const handleExitAssessment = () => {
    setCurrentAssessment(null);
    setCurrentAttempt(null);
    setShowResults(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'quiz': return 'bg-blue-100 text-blue-800';
      case 'test': return 'bg-red-100 text-red-800';
      case 'assignment': return 'bg-green-100 text-green-800';
      case 'project': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttemptStatus = (assessmentId: string) => {
    const assessmentAttempts = attempts.filter(a => a.assessment.id === assessmentId);
    const latestAttempt = assessmentAttempts[0];
    
    if (!latestAttempt) return { status: 'not_started', attempts: 0 };
    
    if (!latestAttempt.completedAt) {
      return { status: 'in_progress', attempts: assessmentAttempts.length };
    }
    
    return { 
      status: latestAttempt.passed ? 'passed' : 'failed', 
      attempts: assessmentAttempts.length,
      score: latestAttempt.score
    };
  };

  if (status === "loading" || dictLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{dict?.common?.loading || "Loading..."}</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Show assessment taking interface
  if (currentAssessment) {
    return (
      <StudentAssessment
        assessmentId={currentAssessment.id}
        onComplete={handleAssessmentComplete}
        onExit={handleExitAssessment}
        className="min-h-screen p-6"
      />
    );
  }

  // Show results
  if (showResults && currentAttempt) {
    return (
      <AssessmentResults
        attemptId={currentAttempt}
        onRetake={() => {
          const attempt = attempts.find(a => a.id === currentAttempt);
          if (attempt) {
            startAssessment(attempt.assessment.id);
          }
        }}
        onContinue={handleExitAssessment}
        className="min-h-screen p-6"
      />
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Assessments</h1>
            <p className="text-gray-600 mt-2">
              Take assessments to test your knowledge and track your progress
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available">Available Assessments</TabsTrigger>
            <TabsTrigger value="history">Attempt History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="available" className="space-y-4">
            {assessments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No assessments available</h3>
                  <p className="text-gray-500 text-center">
                    Check back later for new assessments or contact your teacher.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {assessments.map((assessment) => {
                  const attemptStatus = getAttemptStatus(assessment.id);
                  
                  return (
                    <Card key={assessment.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center space-x-2">
                              <span>{assessment.title}</span>
                              <Badge className={getTypeColor(assessment.type)}>
                                {assessment.type}
                              </Badge>
                            </CardTitle>
                            <CardDescription>
                              {assessment.lesson.topic.subject.name} • {assessment.lesson.topic.name}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            {attemptStatus.status === 'passed' && (
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            )}
                            {attemptStatus.status === 'failed' && (
                              <XCircle className="h-6 w-6 text-red-600" />
                            )}
                            {attemptStatus.status === 'in_progress' && (
                              <Clock className="h-6 w-6 text-yellow-600" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {assessment.instructions && (
                            <p className="text-sm text-gray-600">
                              {assessment.instructions}
                            </p>
                          )}
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span>{assessment._count.questions} questions</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Target className="h-4 w-4 text-gray-500" />
                              <span>{Math.round(assessment.passingScore * 100)}% passing</span>
                            </div>
                            {assessment.timeLimit && (
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span>{assessment.timeLimit} min</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-2">
                              <BookOpen className="h-4 w-4 text-gray-500" />
                              <span>{attemptStatus.attempts}/{assessment.maxAttempts} attempts</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                              {attemptStatus.status === 'not_started' && 'Not started'}
                              {attemptStatus.status === 'in_progress' && 'In progress'}
                              {attemptStatus.status === 'passed' && `Passed (${Math.round((attemptStatus.score || 0) * 100)}%)`}
                              {attemptStatus.status === 'failed' && `Failed (${Math.round((attemptStatus.score || 0) * 100)}%)`}
                            </div>
                            
                            <div className="space-x-2">
                              {attemptStatus.status === 'in_progress' && (
                                <Button 
                                  onClick={() => startAssessment(assessment.id)}
                                  variant="outline"
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Continue
                                </Button>
                              )}
                              
                              {(attemptStatus.status === 'not_started' || 
                                (attemptStatus.status === 'failed' && attemptStatus.attempts < assessment.maxAttempts)) && (
                                <Button onClick={() => startAssessment(assessment.id)}>
                                  <Play className="h-4 w-4 mr-2" />
                                  Start Assessment
                                </Button>
                              )}
                              
                              {attemptStatus.status === 'passed' && (
                                <Button 
                                  onClick={() => {
                                    const latestAttempt = attempts.find(a => a.assessment.id === assessment.id);
                                    if (latestAttempt) {
                                      setCurrentAttempt(latestAttempt.id);
                                      setShowResults(true);
                                    }
                                  }}
                                  variant="outline"
                                >
                                  <Brain className="h-4 w-4 mr-2" />
                                  View Results
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            {attempts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No attempts yet</h3>
                  <p className="text-gray-500 text-center">
                    Start taking assessments to see your attempt history here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {attempts.map((attempt) => (
                  <Card key={attempt.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <span>{attempt.assessment.title}</span>
                            <Badge className={getTypeColor(attempt.assessment.type)}>
                              {attempt.assessment.type}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {attempt.assessment.lesson.topic.subject.name} • {attempt.assessment.lesson.topic.name}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          {attempt.passed ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : (
                            <XCircle className="h-6 w-6 text-red-600" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          Completed: {new Date(attempt.completedAt || attempt.startedAt).toLocaleDateString()}
                          {attempt.score !== undefined && (
                            <span className="ml-2">
                              Score: {Math.round(attempt.score * 100)}%
                            </span>
                          )}
                        </div>
                        
                        <Button 
                          onClick={() => {
                            setCurrentAttempt(attempt.id);
                            setShowResults(true);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Brain className="h-4 w-4 mr-2" />
                          View Results
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
