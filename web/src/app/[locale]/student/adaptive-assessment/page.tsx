"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import AdaptiveAssessmentInterface from '@/components/AdaptiveAssessmentInterface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
//import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Clock,
  CheckCircle,
  //AlertCircle,
  Play,
  BarChart3,
  BookOpen,
  Award,
  //Sparkles,
  Zap,
  //Star,
  //Activity,
  ArrowLeft,
  BrainCircuit
} from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  description?: string;
}

interface AssessmentSession {
  assessmentId: string;
  studentId: string;
  subjectId: string;
  sessionType: string;
}

interface AssessmentResult {
  assessment: any;
  finalAnalytics: any;
  recommendations: any[];
}

export default function StudentAdaptiveAssessmentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSessionType, setSelectedSessionType] = useState<string>('DIAGNOSTIC');
  const [currentAssessment, setCurrentAssessment] = useState<AssessmentSession | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [recentAssessments, setRecentAssessments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sessionTypes = [
    { value: 'DIAGNOSTIC', label: 'Diagnostic Assessment', description: 'Initial assessment to determine your starting level' },
    { value: 'FORMATIVE', label: 'Formative Assessment', description: 'Ongoing assessment during learning' },
    { value: 'SUMMATIVE', label: 'Summative Assessment', description: 'Final assessment of learning outcomes' },
    { value: 'REMEDIATION', label: 'Remediation Assessment', description: 'Assessment focused on weak areas' },
    { value: 'ENRICHMENT', label: 'Enrichment Assessment', description: 'Assessment for advanced learners' },
  ];

  const loadSubjects = useCallback(async () => {
    try {
      const response = await fetch('/api/curriculum/generate');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  }, []);

  const loadRecentAssessments = useCallback(async () => {
    try {
      const response = await fetch(`/api/adaptive-assessment/session?studentId=${(session?.user as any)?.id}`);
      if (response.ok) {
        const data = await response.json();
        setRecentAssessments(data.data || []);
      }
    } catch (error) {
      console.error('Error loading recent assessments:', error);
    }
  }, [session?.user]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push(`/${locale}/login`);
      return;
    }

    loadSubjects();
    loadRecentAssessments();
  }, [session, status, router, locale, loadSubjects, loadRecentAssessments]);

  const startAssessment = async () => {
    if (!selectedSubject || !selectedSessionType) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/adaptive-assessment/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: (session?.user as any)?.id,
          subjectId: selectedSubject,
          sessionType: selectedSessionType
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setCurrentAssessment({
          assessmentId: data.data.assessmentId,
          studentId: data.data.studentId,
          subjectId: data.data.subjectId,
          sessionType: data.data.sessionType
        });
      }
    } catch (error) {
      console.error('Error starting assessment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssessmentComplete = (result: AssessmentResult) => {
    setAssessmentResult(result);
    setCurrentAssessment(null);
    loadRecentAssessments(); // Refresh recent assessments
  };

  const getSessionTypeColor = (type: string) => {
    const colors = {
      DIAGNOSTIC: 'bg-blue-100 text-blue-800',
      FORMATIVE: 'bg-green-100 text-green-800',
      SUMMATIVE: 'bg-purple-100 text-purple-800',
      REMEDIATION: 'bg-orange-100 text-orange-800',
      ENRICHMENT: 'bg-pink-100 text-pink-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI Assessment Center...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Show assessment interface if assessment is active
  if (currentAssessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => setCurrentAssessment(null)}
                className="mb-4 bg-white/80 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl">
                  <BrainCircuit className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Adaptive Assessment
                  </h1>
                  <p className="text-gray-600 mt-2">
                    {subjects.find(s => s.id === currentAssessment.subjectId)?.name} • 
                    {sessionTypes.find(s => s.value === currentAssessment.sessionType)?.label}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-white/20 shadow-lg">
              <AdaptiveAssessmentInterface
                session={currentAssessment}
                onComplete={handleAssessmentComplete}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show assessment result if completed
  if (assessmentResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <Button
                variant="outline"
                onClick={() => setAssessmentResult(null)}
                className="mb-4 bg-white/80 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Assessment Complete! 🎉
                  </h1>
                  <p className="text-gray-600 mt-2">Here are your results and personalized recommendations</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Results Summary */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-600" />
                      Assessment Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                        <div className={`text-3xl font-bold ${getPerformanceColor(assessmentResult.finalAnalytics.retentionRate)}`}>
                          {Math.round(assessmentResult.finalAnalytics.retentionRate * 100)}%
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Accuracy</div>
                        <div className="text-xs text-green-600 font-medium">Excellent!</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                        <div className={`text-3xl font-bold ${getPerformanceColor(assessmentResult.finalAnalytics.learningVelocity)}`}>
                          {Math.round(assessmentResult.finalAnalytics.learningVelocity * 100)}%
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Learning Velocity</div>
                        <div className="text-xs text-blue-600 font-medium">Great pace!</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                        <div className={`text-3xl font-bold ${getPerformanceColor(assessmentResult.finalAnalytics.confidenceLevel)}`}>
                          {Math.round(assessmentResult.finalAnalytics.confidenceLevel * 100)}%
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Confidence</div>
                        <div className="text-xs text-purple-600 font-medium">Strong!</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl">
                        <div className="text-3xl font-bold text-amber-600">
                          {assessmentResult.assessment.totalQuestions}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Questions</div>
                          <div className="text-xs text-amber-600 font-medium">Completed</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-600" />
                      Personalized Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {assessmentResult.recommendations.map((rec, index) => (
                        <div key={index} className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={rec.priority === 'HIGH' ? 'destructive' : 'secondary'} className="font-medium">
                              {rec.priority}
                            </Badge>
                            <span className="font-semibold text-gray-800">{rec.title}</span>
                          </div>
                          <p className="text-gray-600">{rec.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-600" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl" onClick={() => setAssessmentResult(null)}>
                      <Play className="w-4 h-4 mr-2" />
                      Take Another Assessment
                    </Button>
                    <Button variant="outline" className="w-full bg-white/80 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Detailed Analytics
                    </Button>
                    <Button variant="outline" className="w-full bg-white/80 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Review Study Materials
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl">
                <BrainCircuit className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  AI Assessment Center
                </h1>
                <p className="text-gray-600 mt-2">
                  AI-powered adaptive assessments that adjust to your learning level and provide personalized insights
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="start" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-lg">
              <TabsTrigger value="start">Start Assessment</TabsTrigger>
              <TabsTrigger value="recent">Recent Assessments</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="start" className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-emerald-600" />
                    Start New Assessment
                  </CardTitle>
                  <CardDescription>
                    Choose a subject and assessment type to begin your adaptive learning journey
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Subject Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Select Subject</label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger className="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
                        <SelectValue placeholder="Choose a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Session Type Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Assessment Type</label>
                    <Select value={selectedSessionType} onValueChange={setSelectedSessionType}>
                      <SelectTrigger className="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
                        <SelectValue placeholder="Choose assessment type" />
                      </SelectTrigger>
                      <SelectContent>
                        {sessionTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-600 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                      {sessionTypes.find(s => s.value === selectedSessionType)?.description}
                    </p>
                  </div>

                  <Button 
                    onClick={startAssessment} 
                    disabled={!selectedSubject || !selectedSessionType || isLoading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Starting Assessment...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Assessment
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Assessment Types Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessionTypes.map((type) => (
                  <Card key={type.value} className="bg-white/80 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Badge className={`${getSessionTypeColor(type.value)} font-medium`}>
                          {type.label}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">{type.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="recent" className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    Recent Assessments
                  </CardTitle>
                  <CardDescription>
                    Your recent adaptive assessment history and performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentAssessments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="p-4 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                        <Brain className="w-10 h-10 text-emerald-600" />
                      </div>
                      <p className="text-lg font-medium mb-2">No assessments completed yet</p>
                      <p className="text-sm">Start your first assessment to see your progress here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentAssessments.map((assessment) => (
                        <div key={assessment.id} className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Badge className={`${getSessionTypeColor(assessment.sessionType)} font-medium`}>
                                {assessment.sessionType}
                              </Badge>
                              <span className="font-semibold text-gray-800">{assessment.subject.name}</span>
                            </div>
                            <div className="text-sm text-gray-600 bg-white/80 px-3 py-1 rounded-lg">
                              {new Date(assessment.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-white/80 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">{assessment.totalQuestions}</div>
                              <div className="text-sm text-gray-600">Questions</div>
                            </div>
                            <div className="text-center p-3 bg-white/80 rounded-lg">
                              <div className={`text-2xl font-bold ${getPerformanceColor(assessment.correctAnswers / assessment.totalQuestions)}`}>
                                {Math.round((assessment.correctAnswers / assessment.totalQuestions) * 100)}%
                              </div>
                              <div className="text-sm text-gray-600">Accuracy</div>
                            </div>
                            <div className="text-center p-3 bg-white/80 rounded-lg">
                              <div className={`text-2xl font-bold ${assessment.isActive ? 'text-yellow-600' : 'text-green-600'}`}>
                                {assessment.isActive ? '⏳' : '✅'}
                              </div>
                              <div className="text-sm text-gray-600">
                                {assessment.isActive ? 'In Progress' : 'Completed'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Learning Analytics
                  </CardTitle>
                  <CardDescription>
                    Detailed insights into your learning patterns and progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-500">
                    <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <BarChart3 className="w-10 h-10 text-purple-600" />
                    </div>
                    <p className="text-lg font-medium mb-2">Analytics dashboard coming soon...</p>
                    <p className="text-sm">Complete more assessments to see detailed analytics</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
