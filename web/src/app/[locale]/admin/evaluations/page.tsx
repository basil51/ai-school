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
  Users,
  FileText,
  Loader2,
  AlertCircle,
  Brain,
  Target,
  BarChart3,
  Plus
} from "lucide-react";
import { useTranslations } from "@/lib/useTranslations";
import { AssessmentManager } from "@/components/AssessmentManager";
import { MasteryDashboard } from "@/components/MasteryDashboard";

interface Assessment {
  id: string;
  title: string;
  type: 'quiz' | 'test' | 'assignment' | 'project';
  instructions: string;
  timeLimit?: number;
  passingScore: number;
  maxAttempts: number;
  isActive: boolean;
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
  student: {
    id: string;
    name: string;
    email: string;
  };
  assessment: Assessment;
}

export default function AdminEvaluationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { dict, loading: dictLoading } = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/login`);
    }
  }, [status, router, locale]);

  useEffect(() => {
    if (session) {
      const userRole = (session as any).role;
      if (!['teacher', 'admin', 'super_admin'].includes(userRole)) {
        router.push(`/${locale}/dashboard`);
      } else {
        fetchAssessments();
        fetchAttempts();
      }
    }
  }, [session, router, locale]);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/assessments?includeQuestions=false&includeAttempts=true');
      
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'quiz': return 'bg-blue-100 text-blue-800';
      case 'test': return 'bg-red-100 text-red-800';
      case 'assignment': return 'bg-green-100 text-green-800';
      case 'project': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPassRate = (assessmentId: string) => {
    const assessmentAttempts = attempts.filter(a => a.assessment.id === assessmentId);
    if (assessmentAttempts.length === 0) return 0;
    const passedAttempts = assessmentAttempts.filter(a => a.passed).length;
    return (passedAttempts / assessmentAttempts.length) * 100;
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

  const userRole = (session as any).role;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Assessment Management</h1>
            <p className="text-gray-600 mt-2">
              Create, manage, and monitor assessments and student performance
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="assessments" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="attempts">Student Attempts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="assessments" className="space-y-4">
            {selectedLesson ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Assessment Manager</h2>
                    <p className="text-gray-600">Manage assessments for the selected lesson</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedLesson(null)}
                  >
                    Back to All Assessments
                  </Button>
                </div>
                <AssessmentManager 
                  lessonId={selectedLesson}
                  onAssessmentCreated={() => {
                    fetchAssessments();
                    fetchAttempts();
                  }}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">All Assessments</h2>
                </div>

                {assessments.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No assessments created yet</h3>
                      <p className="text-gray-500 text-center">
                        Create your first assessment to start evaluating student progress.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {assessments.map((assessment) => (
                      <Card key={assessment.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="flex items-center space-x-2">
                                <span>{assessment.title}</span>
                                <Badge className={getTypeColor(assessment.type)}>
                                  {assessment.type}
                                </Badge>
                                {!assessment.isActive && (
                                  <Badge variant="outline">Inactive</Badge>
                                )}
                              </CardTitle>
                              <CardDescription>
                                {assessment.lesson.topic.subject.name} • {assessment.lesson.topic.name}
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">
                                {assessment._count.attempts} attempts
                              </div>
                              <div className="text-sm font-medium">
                                {Math.round(getPassRate(assessment.id))}% pass rate
                              </div>
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
                                <Users className="h-4 w-4 text-gray-500" />
                                <span>{assessment.maxAttempts} max attempts</span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <div className="text-sm text-gray-500">
                                Created: {new Date(assessment.createdAt).toLocaleDateString()}
                              </div>
                              
                              <div className="space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedLesson(assessment.lesson.id)}
                                >
                                  Manage
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="attempts" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Student Assessment Attempts</h2>
            </div>

            {attempts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No attempts yet</h3>
                  <p className="text-gray-500 text-center">
                    Students haven&apos;t taken any assessments yet.
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
                            {attempt.student.name} ({attempt.student.email})
                          </CardDescription>
                          <div className="text-sm text-gray-500 mt-1">
                            {attempt.assessment.lesson.topic.subject.name} • {attempt.assessment.lesson.topic.name}
                          </div>
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
                          Started: {new Date(attempt.startedAt).toLocaleDateString()}
                          {attempt.completedAt && (
                            <span className="ml-2">
                              Completed: {new Date(attempt.completedAt).toLocaleDateString()}
                            </span>
                          )}
                          {attempt.score !== undefined && (
                            <span className="ml-2 font-medium">
                              Score: {Math.round(attempt.score * 100)}%
                            </span>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Badge variant={attempt.passed ? "default" : "destructive"}>
                            {attempt.passed ? "Passed" : "Failed"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Learning Analytics</h2>
            </div>
            
            <MasteryDashboard className="w-full" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}