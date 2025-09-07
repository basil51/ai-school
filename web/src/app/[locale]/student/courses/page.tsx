"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BookOpen, 
  GraduationCap, 
  Brain, 
  CheckCircle,
  Play,
  Clock,
  Target,
  TrendingUp,
  Loader2,
  AlertCircle,
  ArrowRight,
  BookMarked,
  Users,
  Calendar
} from "lucide-react";
import { useTranslations } from "@/lib/useTranslations";

interface Subject {
  id: string;
  name: string;
  description: string;
  level: string;
  topics: Topic[];
  _count: {
    enrollments: number;
  };
}

interface Topic {
  id: string;
  name: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  objectives: string[];
  difficulty: string;
  estimatedTime: number;
  order: number;
  progress?: Progress[];
}

interface Progress {
  id: string;
  status: string;
  timeSpent: number;
  attempts: number;
}

interface Enrollment {
  id: string;
  subject: Subject;
  startedAt: string;
  progress: {
    totalLessons: number;
    completedLessons: number;
    progressPercentage: number;
  };
}

export default function AITeacherPage() {
  const { dict } = useTranslations();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [lessonLoading, setLessonLoading] = useState(false);

  useEffect(() => {
    fetchSubjects();
    fetchEnrollments();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/curriculum/generate');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const response = await fetch('/api/curriculum/enroll');
      if (response.ok) {
        const data = await response.json();
        setEnrollments(data.enrollments || []);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const enrollInSubject = async (subjectId: string) => {
    setEnrolling(subjectId);
    try {
      const response = await fetch('/api/curriculum/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId })
      });

      if (response.ok) {
        await fetchEnrollments();
        await fetchSubjects();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to enroll');
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      alert('Failed to enroll in subject');
    } finally {
      setEnrolling(null);
    }
  };

  const startLearning = async (subjectId: string) => {
    setSelectedSubject(subjects.find(s => s.id === subjectId) || null);
    await getNextLesson(subjectId);
  };

  const getNextLesson = async (subjectId: string) => {
    setLessonLoading(true);
    try {
      const response = await fetch(`/api/lessons/next?subjectId=${subjectId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.completed) {
          setCurrentLesson({ completed: true, message: data.message });
        } else {
          setCurrentLesson(data);
        }
      }
    } catch (error) {
      console.error('Error getting next lesson:', error);
    } finally {
      setLessonLoading(false);
    }
  };

  const updateLessonProgress = async (lessonId: string, action: string, timeSpent?: number) => {
    try {
      const response = await fetch('/api/lessons/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, action, timeSpent })
      });

      if (response.ok) {
        // Get the next lesson
        if (selectedSubject) {
          await getNextLesson(selectedSubject.id);
        }
      }
    } catch (error) {
      console.error('Error updating lesson progress:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Play className="h-4 w-4 text-blue-600" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <BookMarked className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your AI Teacher...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="h-8 w-8 text-blue-600" />
              {dict?.aiTeacher?.title || "AI Teacher"}
            </h1>
            <p className="text-gray-600 mt-2">
              {dict?.aiTeacher?.subtitle || "Your personalized learning journey starts here"}
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <GraduationCap className="h-4 w-4" />
            {dict?.aiTeacher?.adaptiveLearning || "Adaptive Learning"}
          </Badge>
        </div>

        <div className="grid gap-6">
          {/* Current Enrollments */}
          {enrollments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {dict?.aiTeacher?.myCourses || "My Courses"}
                </CardTitle>
                <CardDescription>
                  {dict?.aiTeacher?.myCoursesDescription || "Continue your learning journey"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {enrollments.map((enrollment) => (
                    <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-lg">{enrollment.subject.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {enrollment.subject.level}
                          </Badge>
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                            <span>{dict?.aiTeacher?.progress || "Progress"}</span>
                            <span>{enrollment.progress.progressPercentage}%</span>
                          </div>
                          <Progress value={enrollment.progress.progressPercentage} className="h-2" />
                          <div className="text-xs text-gray-500 mt-1">
                            {enrollment.progress.completedLessons} / {enrollment.progress.totalLessons} {dict?.aiTeacher?.lessons || "lessons"}
                          </div>
                        </div>

                        <Button 
                          onClick={() => startLearning(enrollment.subject.id)}
                          className="w-full"
                          size="sm"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {dict?.aiTeacher?.continueLearning || "Continue Learning"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Subjects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                {dict?.aiTeacher?.availableSubjects || "Available Subjects"}
              </CardTitle>
              <CardDescription>
                {dict?.aiTeacher?.availableSubjectsDescription || "Explore and enroll in new subjects"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subjects.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {dict?.aiTeacher?.noSubjectsAvailable || "No subjects available yet. Teachers can create new subjects."}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {subjects.map((subject) => {
                    const isEnrolled = enrollments.some(e => e.subject.id === subject.id);
                    const totalLessons = subject.topics.reduce((acc, topic) => acc + topic.lessons.length, 0);
                    
                    return (
                      <Card key={subject.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-lg">{subject.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {subject.level}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {subject.description}
                          </p>

                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                            <div className="flex items-center gap-1">
                              <BookMarked className="h-4 w-4" />
                              <span>{totalLessons} {dict?.aiTeacher?.lessons || "lessons"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{subject._count.enrollments} {dict?.aiTeacher?.students || "students"}</span>
                            </div>
                          </div>

                          {isEnrolled ? (
                            <Button 
                              onClick={() => startLearning(subject.id)}
                              className="w-full"
                              size="sm"
                              variant="outline"
                            >
                              <ArrowRight className="h-4 w-4 mr-2" />
                              {dict?.aiTeacher?.startLearning || "Start Learning"}
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => enrollInSubject(subject.id)}
                              disabled={enrolling === subject.id}
                              className="w-full"
                              size="sm"
                            >
                              {enrolling === subject.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <BookOpen className="h-4 w-4 mr-2" />
                              )}
                              {enrolling === subject.id 
                                ? (dict?.aiTeacher?.enrolling || "Enrolling...")
                                : (dict?.aiTeacher?.enroll || "Enroll")
                              }
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Lesson */}
          {currentLesson && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {currentLesson.completed 
                    ? (dict?.aiTeacher?.courseCompleted || "Course Completed!")
                    : (dict?.aiTeacher?.currentLesson || "Current Lesson")
                  }
                </CardTitle>
                {!currentLesson.completed && currentLesson.lesson && (
                  <CardDescription>
                    {currentLesson.lesson.topic.name} • {currentLesson.lesson.title}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {lessonLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">
                      {dict?.aiTeacher?.loadingLesson || "Loading your lesson..."}
                    </p>
                  </div>
                ) : currentLesson.completed ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      {currentLesson.message}
                    </AlertDescription>
                  </Alert>
                ) : currentLesson.lesson ? (
                  <div className="space-y-6">
                    {/* Lesson Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{currentLesson.lesson.estimatedTime} {dict?.aiTeacher?.minutes || "minutes"}</span>
                      </div>
                      <Badge className={getDifficultyColor(currentLesson.lesson.difficulty)}>
                        {currentLesson.lesson.difficulty}
                      </Badge>
                      {currentLesson.lesson.isAdapted && (
                        <Badge variant="outline" className="text-xs">
                          {dict?.aiTeacher?.adapted || "Adapted"}
                        </Badge>
                      )}
                    </div>

                    {/* Learning Objectives */}
                    <div>
                      <h4 className="font-semibold mb-2">
                        {dict?.aiTeacher?.learningObjectives || "Learning Objectives"}
                      </h4>
                      <ul className="space-y-1">
                        {currentLesson.lesson.objectives.map((objective: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                            {objective}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Lesson Content */}
                    <div>
                      <h4 className="font-semibold mb-2">
                        {dict?.aiTeacher?.lessonContent || "Lesson Content"}
                      </h4>
                      <div className="prose max-w-none">
                        <div className="whitespace-pre-wrap text-gray-800 leading-relaxed bg-gray-50 p-4 rounded-md border">
                          {currentLesson.lesson.content}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => updateLessonProgress(currentLesson.lesson.id, 'complete')}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {dict?.aiTeacher?.markComplete || "Mark Complete"}
                      </Button>
                      <Button 
                        onClick={() => updateLessonProgress(currentLesson.lesson.id, 'fail')}
                        variant="outline"
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {dict?.aiTeacher?.needHelp || "Need Help"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
