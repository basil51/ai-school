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
  Target,
  ClipboardCheck,
  //Award,
  //TrendingUp,
  //BarChart3,
  //Sparkles
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
  const { loading: dictLoading } = useTranslations();
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

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
      
      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`/api/assessments?${params.toString()}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch assessments: ${response.status}`);
      }
      
      const data = await response.json();
      setAssessments(data || []);
    } catch (err) {
      console.error('Error fetching assessments:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred while loading assessments');
      }
      // Set empty array as fallback
      setAssessments([]);
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

  useEffect(() => {
    if (session && status === "authenticated") {
      fetchAssessments();
      fetchAttempts();
    }
  }, [session, status, fetchAssessments, fetchAttempts]);

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

  if (status === "loading" || dictLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessments...</p>
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl">
                <ClipboardCheck className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  My Assessments
                </h1>
                <p className="text-gray-600 mt-2">
                  Take teacher-created assessments to test your knowledge and track your progress
                </p>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-green-600" />
                </div>
                <p className="text-gray-600">Loading assessments...</p>
              </div>
            </div>
          )}

          <Tabs defaultValue="available" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-lg">
              <TabsTrigger value="available">Available Assessments</TabsTrigger>
              <TabsTrigger value="history">Attempt History</TabsTrigger>
            </TabsList>
          
            <TabsContent value="available" className="space-y-4">
              {assessments.length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <FileText className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No assessments available</h3>
                    <p className="text-gray-500 text-center">
                      Check back later for new assessments or contact your teacher.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {assessments.map((assessment) => {
                    const attemptStatus = getAttemptStatus(assessment.id);
                    
                    return (
                      <Card key={assessment.id} className="bg-white/80 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="flex items-center space-x-2">
                                <span className="group-hover:text-green-700 transition-colors">{assessment.title}</span>
                                <Badge className={`${getTypeColor(assessment.type)} font-medium`}>
                                  {assessment.type}
                                </Badge>
                              </CardTitle>
                              <CardDescription>
                                {assessment.lesson.topic.subject.name} • {assessment.lesson.topic.name}
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              {attemptStatus.status === 'passed' && (
                                <div className="p-2 bg-green-100 rounded-lg">
                                  <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                              )}
                              {attemptStatus.status === 'failed' && (
                                <div className="p-2 bg-red-100 rounded-lg">
                                  <XCircle className="h-6 w-6 text-red-600" />
                                </div>
                              )}
                              {attemptStatus.status === 'in_progress' && (
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                  <Clock className="h-6 w-6 text-yellow-600" />
                                </div>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {assessment.instructions && (
                              <p className="text-sm text-gray-600 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                                {assessment.instructions}
                              </p>
                            )}
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                                <FileText className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                                <div className="text-sm font-medium text-gray-800">{assessment._count.questions}</div>
                                <div className="text-xs text-gray-600">questions</div>
                              </div>
                              <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                                <Target className="h-5 w-5 text-green-600 mx-auto mb-1" />
                                <div className="text-sm font-medium text-gray-800">{Math.round(assessment.passingScore * 100)}%</div>
                                <div className="text-xs text-gray-600">passing</div>
                              </div>
                              {assessment.timeLimit && (
                                <div className="text-center p-3 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg">
                                  <Clock className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                                  <div className="text-sm font-medium text-gray-800">{assessment.timeLimit}</div>
                                  <div className="text-xs text-gray-600">minutes</div>
                                </div>
                              )}
                              <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                                <BookOpen className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                                <div className="text-sm font-medium text-gray-800">{attemptStatus.attempts}/{assessment.maxAttempts}</div>
                                <div className="text-xs text-gray-600">attempts</div>
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <div className="text-sm text-gray-500 bg-white/80 px-3 py-1 rounded-lg">
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
                                    className="bg-white/80 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                                  >
                                    <Play className="h-4 w-4 mr-2" />
                                    Continue
                                  </Button>
                                )}
                                
                                {(attemptStatus.status === 'not_started' || 
                                  (attemptStatus.status === 'failed' && attemptStatus.attempts < assessment.maxAttempts)) && (
                                  <Button 
                                    onClick={() => startAssessment(assessment.id)}
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                                  >
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
                                    className="bg-white/80 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300"
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
                <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No attempts yet</h3>
                    <p className="text-gray-500 text-center">
                      Start taking assessments to see your attempt history here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {attempts.map((attempt) => (
                    <Card key={attempt.id} className="bg-white/80 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center space-x-2">
                              <span className="group-hover:text-green-700 transition-colors">{attempt.assessment.title}</span>
                              <Badge className={`${getTypeColor(attempt.assessment.type)} font-medium`}>
                                {attempt.assessment.type}
                              </Badge>
                            </CardTitle>
                            <CardDescription>
                              {attempt.assessment.lesson.topic.subject.name} • {attempt.assessment.lesson.topic.name}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            {attempt.passed ? (
                              <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                              </div>
                            ) : (
                              <div className="p-2 bg-red-100 rounded-lg">
                                <XCircle className="h-6 w-6 text-red-600" />
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500 bg-white/80 px-3 py-1 rounded-lg">
                            Completed: {new Date(attempt.completedAt || attempt.startedAt).toLocaleDateString()}
                            {attempt.score !== undefined && (
                              <span className="ml-2 font-medium">
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
                            className="bg-white/80 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300"
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
    </div>
  );
}
