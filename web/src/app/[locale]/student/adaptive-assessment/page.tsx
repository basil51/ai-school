"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdaptiveAssessmentInterface from '@/components/AdaptiveAssessmentInterface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  BarChart3,
  BookOpen,
  Award
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

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }

    loadSubjects();
    loadRecentAssessments();
  }, [session, status]);

  const loadSubjects = async () => {
    try {
      const response = await fetch('/api/curriculum/generate');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadRecentAssessments = async () => {
    try {
      const response = await fetch(`/api/adaptive-assessment/session?studentId=${(session?.user as any)?.id}`);
      if (response.ok) {
        const data = await response.json();
        setRecentAssessments(data.data || []);
      }
    } catch (error) {
      console.error('Error loading recent assessments:', error);
    }
  };

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Show assessment interface if assessment is active
  if (currentAssessment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setCurrentAssessment(null)}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Adaptive Assessment</h1>
          <p className="text-gray-600 mt-2">
            {subjects.find(s => s.id === currentAssessment.subjectId)?.name} • 
            {sessionTypes.find(s => s.value === currentAssessment.sessionType)?.label}
          </p>
        </div>
        
        <AdaptiveAssessmentInterface
          session={currentAssessment}
          onComplete={handleAssessmentComplete}
        />
      </div>
    );
  }

  // Show assessment result if completed
  if (assessmentResult) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setAssessmentResult(null)}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Assessment Complete!</h1>
          <p className="text-gray-600 mt-2">Here are your results and recommendations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Results Summary */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  Assessment Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getPerformanceColor(assessmentResult.finalAnalytics.retentionRate)}`}>
                      {Math.round(assessmentResult.finalAnalytics.retentionRate * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getPerformanceColor(assessmentResult.finalAnalytics.learningVelocity)}`}>
                      {Math.round(assessmentResult.finalAnalytics.learningVelocity * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Learning Velocity</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getPerformanceColor(assessmentResult.finalAnalytics.confidenceLevel)}`}>
                      {Math.round(assessmentResult.finalAnalytics.confidenceLevel * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {assessmentResult.assessment.totalQuestions}
                    </div>
                    <div className="text-sm text-gray-600">Questions</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  Personalized Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assessmentResult.recommendations.map((rec, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={rec.priority === 'HIGH' ? 'destructive' : 'secondary'}>
                          {rec.priority}
                        </Badge>
                        <span className="font-medium">{rec.title}</span>
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
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" onClick={() => setAssessmentResult(null)}>
                  <Play className="w-4 h-4 mr-2" />
                  Take Another Assessment
                </Button>
                <Button variant="outline" className="w-full">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Detailed Analytics
                </Button>
                <Button variant="outline" className="w-full">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Review Study Materials
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          AI Assessment Center
        </h1>
        <p className="text-xl text-gray-600">
          AI-powered adaptive assessments that adjust to your learning level and provide personalized insights
        </p>
      </div>

      <Tabs defaultValue="start" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="start">Start Assessment</TabsTrigger>
          <TabsTrigger value="recent">Recent Assessments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="start" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" />
                Start New Assessment
              </CardTitle>
              <CardDescription>
                Choose a subject and assessment type to begin your adaptive learning journey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Subject Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Subject</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
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
                <label className="text-sm font-medium">Assessment Type</label>
                <Select value={selectedSessionType} onValueChange={setSelectedSessionType}>
                  <SelectTrigger>
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
                <p className="text-sm text-gray-600">
                  {sessionTypes.find(s => s.value === selectedSessionType)?.description}
                </p>
              </div>

              <Button 
                onClick={startAssessment} 
                disabled={!selectedSubject || !selectedSessionType || isLoading}
                className="w-full"
              >
                {isLoading ? 'Starting Assessment...' : 'Start Assessment'}
              </Button>
            </CardContent>
          </Card>

          {/* Assessment Types Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessionTypes.map((type) => (
              <Card key={type.value} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge className={getSessionTypeColor(type.value)}>
                      {type.label}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                Recent Assessments
              </CardTitle>
              <CardDescription>
                Your recent adaptive assessment history and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentAssessments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No assessments completed yet.</p>
                  <p className="text-sm mt-2">Start your first assessment to see your progress here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentAssessments.map((assessment) => (
                    <div key={assessment.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Badge className={getSessionTypeColor(assessment.sessionType)}>
                            {assessment.sessionType}
                          </Badge>
                          <span className="font-medium">{assessment.subject.name}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(assessment.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Questions: </span>
                          <span className="font-medium">{assessment.totalQuestions}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Accuracy: </span>
                          <span className={`font-medium ${getPerformanceColor(assessment.correctAnswers / assessment.totalQuestions)}`}>
                            {Math.round((assessment.correctAnswers / assessment.totalQuestions) * 100)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Status: </span>
                          <span className="font-medium">
                            {assessment.isActive ? 'In Progress' : 'Completed'}
                          </span>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Learning Analytics
              </CardTitle>
              <CardDescription>
                Detailed insights into your learning patterns and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Analytics dashboard coming soon...</p>
                <p className="text-sm mt-2">Complete more assessments to see detailed analytics.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
