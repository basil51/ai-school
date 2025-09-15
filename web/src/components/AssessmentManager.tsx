"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
//import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
//import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Brain, 
  CheckCircle, 
  //XCircle, 
  Clock, 
  Users,
  //BarChart3,
  FileText,
  Loader2,
  AlertCircle
} from "lucide-react";
//import { useTranslations } from "@/lib/useTranslations";

interface Question {
  id?: string;
  type: 'multiple_choice' | 'short_answer' | 'essay' | 'true_false';
  content: string;
  points: number;
  correctAnswer?: string;
  explanation?: string;
  options?: QuestionOption[];
}

interface QuestionOption {
  id?: string;
  content: string;
  isCorrect: boolean;
}

interface Assessment {
  id: string;
  lessonId: string;
  type: 'quiz' | 'test' | 'assignment' | 'project';
  title: string;
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
  questions: Question[];
  _count: {
    questions: number;
    attempts: number;
  };
}

interface AssessmentManagerProps {
  lessonId: string;
  onAssessmentCreated?: (assessment: Assessment) => void;
  className?: string;
}

export function AssessmentManager({ 
  lessonId, 
  onAssessmentCreated,
  className = "" 
}: AssessmentManagerProps) {
  //const { dict } = useTranslations();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);

  // Form state for creating assessment

  const [formData, setFormData] = useState({
    type: 'quiz' as const,
    title: '',
    instructions: '',
    timeLimit: '',
    passingScore: 70,
    maxAttempts: 3,
    questions: [] as Question[]
  });

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assessments?lessonId=${lessonId}&includeQuestions=true&includeAttempts=true`);
      
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
    fetchAssessments();
  }, [lessonId, fetchAssessments]);

  const generateQuestions = async () => {
    try {
      setGeneratingQuestions(true);
      const response = await fetch('/api/assessments/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId,
          questionTypes: ['multiple_choice', 'short_answer'],
          numQuestions: 5,
          difficulty: 'intermediate'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const data = await response.json();
      setGeneratedQuestions(data.questions);
      setFormData(prev => ({ ...prev, questions: data.questions }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate questions');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const createAssessment = async () => {
    try {
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId,
          type: formData.type,
          title: formData.title,
          instructions: formData.instructions,
          timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : null,
          passingScore: formData.passingScore / 100,
          maxAttempts: formData.maxAttempts,
          questions: formData.questions
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create assessment');
      }

      const newAssessment = await response.json();
      setAssessments(prev => [newAssessment, ...prev]);
      setShowCreateDialog(false);
      setShowGenerateDialog(false);
      setFormData({
        type: 'quiz',
        title: '',
        instructions: '',
        timeLimit: '',
        passingScore: 70,
        maxAttempts: 3,
        questions: []
      });
      setGeneratedQuestions([]);
      
      if (onAssessmentCreated) {
        onAssessmentCreated(newAssessment);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assessment');
    }
  };

  const deleteAssessment = async (assessmentId: string) => {
    if (!confirm('Are you sure you want to delete this assessment?')) {
      return;
    }

    try {
      const response = await fetch(`/api/assessments?id=${assessmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete assessment');
      }

      setAssessments(prev => prev.filter(a => a.id !== assessmentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete assessment');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading assessments...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Assessments</h2>
        <div className="space-x-2">
          <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Brain className="h-4 w-4 mr-2" />
                Generate with AI
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Generate Assessment with AI</DialogTitle>
                <DialogDescription>
                  AI will generate questions based on the lesson content
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Button 
                    onClick={generateQuestions}
                    disabled={generatingQuestions}
                  >
                    {generatingQuestions ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Generate Questions
                      </>
                    )}
                  </Button>
                </div>

                {generatedQuestions.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Generated Questions</h3>
                    {generatedQuestions.map((question, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-sm">
                                Question {index + 1} ({question.type.replace('_', ' ')})
                              </CardTitle>
                              <CardDescription>{question.points} points</CardDescription>
                            </div>
                            <Badge variant="outline">{question.type}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm mb-2">{question.content}</p>
                          {question.type === 'multiple_choice' && question.options && (
                            <div className="space-y-1">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex} className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">
                                    {String.fromCharCode(65 + optIndex)}.
                                  </span>
                                  <span className={`text-xs ${option.isCorrect ? 'font-semibold text-green-600' : ''}`}>
                                    {option.content}
                                  </span>
                                  {option.isCorrect && <CheckCircle className="h-3 w-3 text-green-600" />}
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => {
                        setShowCreateDialog(true);
                        setShowGenerateDialog(false);
                      }}>
                        Use These Questions
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Assessment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Assessment</DialogTitle>
                <DialogDescription>
                  Create a new assessment for this lesson
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="test">Test</SelectItem>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      value={formData.timeLimit}
                      onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: e.target.value }))}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Assessment title"
                  />
                </div>

                <div>
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={formData.instructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                    placeholder="Assessment instructions"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="passingScore">Passing Score (%)</Label>
                    <Input
                      id="passingScore"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.passingScore}
                      onChange={(e) => setFormData(prev => ({ ...prev, passingScore: parseInt(e.target.value) }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maxAttempts">Max Attempts</Label>
                    <Input
                      id="maxAttempts"
                      type="number"
                      min="1"
                      value={formData.maxAttempts}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createAssessment}>
                    Create Assessment
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {assessments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No assessments yet</h3>
            <p className="text-gray-500 text-center mb-4">
              Create your first assessment or use AI to generate questions automatically.
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteAssessment(assessment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
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
                    <CheckCircle className="h-4 w-4 text-gray-500" />
                    <span>{Math.round(assessment.passingScore * 100)}% passing</span>
                  </div>
                  {assessment.timeLimit && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{assessment.timeLimit} min</span>
                    </div>
                  )}
                </div>
                
                {assessment.instructions && (
                  <p className="text-sm text-gray-600 mt-3">
                    {assessment.instructions}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
