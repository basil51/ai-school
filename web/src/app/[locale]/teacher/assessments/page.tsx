"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  //BookOpen, 
  Clock, 
  //CheckCircle, 
  //XCircle, 
  //Play,
  FileText,
  Loader2,
  AlertCircle,
  //Brain,
  Target,
  Users,
  BarChart3,
  Plus,
  Eye,
  Edit,
  //Trash2
} from "lucide-react";
import { useTranslations } from "@/lib/useTranslations";
import { AssessmentManager } from "@/components/AssessmentManager";

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

interface Lesson {
  id: string;
  title: string;
  content: string;
  objectives: string[];
  difficulty: string;
  estimatedTime: number;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  topic: {
    id: string;
    name: string;
    description: string | null;
    order: number;
  };
  subject: {
    id: string;
    name: string;
    description: string | null;
  };
  _count: {
    assessments: number;
    progress: number;
  };
}

export default function TeacherAssessmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { loading: dictLoading } = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/login`);
    }
  }, [status, router, locale]);

  const fetchLessons = async () => {
    try {
      const response = await fetch('/api/lessons');
      
      if (!response.ok) {
        throw new Error('Failed to fetch lessons');
      }
      
      const data = await response.json();
      setLessons(data);
      
      // Set the first lesson as selected by default
      if (data.length > 0 && !selectedLessonId) {
        setSelectedLessonId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching lessons:', err);
    }
  };

  const fetchAllAssessments = async () => {
    try {
      setLoading(true);
      setError(null);
      
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

  useEffect(() => {
    if (session && status === "authenticated") {
      fetchLessons();
      fetchAllAssessments();
    }
  }, [session, status, fetchLessons, fetchAllAssessments ]);

  const handleAssessmentCreated = (newAssessment: Assessment) => {
    setAssessments(prev => [newAssessment, ...prev]);
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

  const getSelectedLesson = () => {
    return lessons.find(lesson => lesson.id === selectedLessonId);
  };

  if (status === "loading" || dictLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assessment Management</h1>
            <p className="text-gray-600 mt-2">
              Create, manage, and monitor assessments for your students
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">Create Assessments</TabsTrigger>
            <TabsTrigger value="manage">Manage Assessments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Create New Assessment</span>
                </CardTitle>
                <CardDescription>
                  Select a lesson to create assessments for your students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Select Lesson
                    </label>
                    <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a lesson to create assessments for" />
                      </SelectTrigger>
                      <SelectContent>
                        {lessons.map((lesson) => (
                          <SelectItem key={lesson.id} value={lesson.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{lesson.title}</span>
                              <span className="text-xs text-gray-500">
                                {lesson.subject?.name} • {lesson.topic?.name}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedLessonId && (
                    <div className="mt-6">
                      <AssessmentManager
                        lessonId={selectedLessonId}
                        onAssessmentCreated={handleAssessmentCreated}
                        className="border rounded-lg p-4 bg-white"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="manage" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-violet-600" />
                  <p className="text-gray-600">Loading assessments...</p>
                </div>
              </div>
            ) : assessments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No assessments created yet</h3>
                  <p className="text-gray-500 text-center">
                    Create your first assessment using the &#34;Create Assessments&#34; tab.
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
                            {assessment.isActive ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-600 border-gray-600">
                                Inactive
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {assessment.lesson.topic.subject.name} • {assessment.lesson.topic.name}
                          </CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <BarChart3 className="h-4 w-4" />
                          </Button>
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
                            <Users className="h-4 w-4 text-gray-500" />
                            <span>{assessment._count.attempts} attempts</span>
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
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Assessment Analytics</span>
                </CardTitle>
                <CardDescription>
                  View detailed analytics and reports for your assessments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                  <p className="text-gray-500">
                    Detailed analytics and reporting features will be available soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
