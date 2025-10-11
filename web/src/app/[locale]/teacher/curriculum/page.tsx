"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
//import { Progress } from "@/components/ui/progress";
//import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BookOpen, 
  Plus, 
  //Users, 
  //TrendingUp, 
  Clock,
  //CheckCircle,
  //AlertCircle,
  Loader2,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Target
} from "lucide-react";
import { useTranslations } from "@/lib/useTranslations";
import { AssessmentManager } from "@/components/AssessmentManager";

interface Subject {
  id: string;
  name: string;
  description: string;
  level: string;
  isActive: boolean;
  createdAt: string;
  topics?: Topic[];
  _count: {
    enrollments: number;
  };
}

interface Topic {
  id: string;
  name: string;
  description: string;
  order: number;
  lessons?: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  content?: string;
  objectives: string[];
  difficulty: string;
  estimatedTime: number;
  order: number;
}

export default function TeacherCurriculumPage() {
  const { dict } = useTranslations();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showAssessmentManager, setShowAssessmentManager] = useState(false);
  const [showLessonEditor, setShowLessonEditor] = useState(false);
  const [lessonEditorLoading, setLessonEditorLoading] = useState(false);
  const [lessonEditor, setLessonEditor] = useState<{ id: string; title: string; content: string; estimatedTime: number; difficulty: string } | null>(null);
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({});
  const [subjectFilter, setSubjectFilter] = useState<string>("__all__");

  // Form state
  const [formData, setFormData] = useState({
    subjectName: '',
    description: '',
    level: 'high'
  });

  // Topic form state
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [selectedSubjectForTopic, setSelectedSubjectForTopic] = useState<string>('');
  const [topicFormData, setTopicFormData] = useState({
    name: '',
    description: ''
  });
  const [creatingTopic, setCreatingTopic] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async (subjectId?: string) => {
    try {
      const qs = new URLSearchParams();
      qs.set('includeContent', 'false');
      if (subjectId) qs.set('subjectId', subjectId);
      const response = await fetch(`/api/curriculum/manage?${qs.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const openLessonEditor = async (lessonId: string) => {
    try {
      setLessonEditorLoading(true);
      const res = await fetch(`/api/curriculum/lessons/${lessonId}`);
      if (!res.ok) throw new Error('Failed to load lesson');
      const data = await res.json();
      const l = data.lesson;
      setLessonEditor({ id: l.id, title: l.title, content: l.content || '', estimatedTime: l.estimatedTime, difficulty: l.difficulty });
      setShowLessonEditor(true);
    } catch (e) {
      console.error(e);
      alert('Failed to load lesson');
    } finally {
      setLessonEditorLoading(false);
    }
  };

  const saveLessonEditor = async () => {
    if (!lessonEditor) return;
    try {
      setLessonEditorLoading(true);
      const res = await fetch(`/api/curriculum/lessons/${lessonEditor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: lessonEditor.content })
      });
      if (!res.ok) throw new Error('Failed to save');
      setShowLessonEditor(false);
      setLessonEditor(null);
      // Refresh subjects to reflect any previews/counts
      fetchSubjects();
    } catch (e) {
      console.error(e);
      alert('Failed to save lesson');
    } finally {
      setLessonEditorLoading(false);
    }
  };

  const deleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/curriculum/lessons/${lessonId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to delete lesson');
        return;
      }
      // Optimistic refresh
      fetchSubjects();
    } catch (e) {
      console.error(e);
      alert('Failed to delete lesson');
    }
  };

  const moveLesson = async (topicId: string, lessonId: string, direction: 'up' | 'down') => {
    // Find topic and lessons
    const subjectIndex = subjects.findIndex(s => s.topics?.some(t => t.id === topicId));
    if (subjectIndex === -1) return;
    const subject = subjects[subjectIndex];
    const topic = subject.topics?.find(t => t.id === topicId);
    if (!topic || !topic.lessons) return;
    const idx = topic.lessons.findIndex(l => l.id === lessonId);
    if (idx === -1) return;
    const swapWith = direction === 'up' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= topic.lessons.length) return;
    // Compute new orders
    const l1 = topic.lessons[idx];
    const l2 = topic.lessons[swapWith];
    const payload = [
      { id: l1.id, order: l2.order },
      { id: l2.id, order: l1.order }
    ];
    try {
      const res = await fetch('/api/curriculum/lessons/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessons: payload })
      });
      if (!res.ok) throw new Error('Failed to reorder');
      fetchSubjects();
    } catch (e) {
      console.error(e);
      alert('Failed to reorder lessons');
    }
  };

  const toggleLessonPreview = (lessonId: string) => {
    setExpandedLessons(prev => ({ ...prev, [lessonId]: !prev[lessonId] }));
  };

  const createSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch('/api/curriculum/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        // Ensure the new subject has an empty topics array
        const newSubject = { ...data.subject, topics: [] };
        setSubjects(prev => [...prev, newSubject]);
        setShowCreateForm(false);
        setFormData({ subjectName: '', description: '', level: 'high' });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create subject');
      }
    } catch (error) {
      console.error('Error creating subject:', error);
      alert('Failed to create subject');
    } finally {
      setCreating(false);
    }
  };

  const createTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectForTopic || !topicFormData.name) {
      alert('Please select a subject and enter a topic name');
      return;
    }

    setCreatingTopic(true);

    try {
      const response = await fetch('/api/curriculum/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: selectedSubjectForTopic,
          name: topicFormData.name,
          description: topicFormData.description
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh subjects to show the new topic
        fetchSubjects();
        setShowTopicForm(false);
        setSelectedSubjectForTopic('');
        setTopicFormData({ name: '', description: '' });
        alert('Topic created successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create topic');
      }
    } catch (error) {
      console.error('Error creating topic:', error);
      alert('Failed to create topic');
    } finally {
      setCreatingTopic(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'elementary': return 'bg-green-100 text-green-800';
      case 'middle': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-purple-100 text-purple-800';
      case 'college': return 'bg-orange-100 text-orange-800';
      case 'university': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTotalLessons = (subject: Subject) => {
    return subject.topics?.reduce((acc, topic) => acc + (topic.lessons?.length || 0), 0) || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading curriculum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            {dict?.teacher?.curriculum || "Curriculum Management"}
          </h1>
          <p className="text-gray-600 mt-2">
            {dict?.teacher?.curriculumDescription || "Create and manage subjects and topics for your students"}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 items-center">
            <div className="w-72">
              <Label className="mb-1 block">Subject Filter</Label>
              <Select value={subjectFilter} onValueChange={(v) => setSubjectFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All subjects</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setLoading(true);
                fetchSubjects(subjectFilter === "__all__" ? undefined : subjectFilter);
              }}
            >
              Apply
            </Button>
            {subjectFilter && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSubjectFilter("__all__");
                  setLoading(true);
                  fetchSubjects();
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Subject
            </Button>
            <Button 
              onClick={() => setShowTopicForm(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Topic
            </Button>
          </div>

          {/* Create Subject Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  {dict?.teacher?.createNewSubject || "Create New Subject"}
                </CardTitle>
                <CardDescription>
                  {dict?.teacher?.createNewSubjectDescription || "Create a new subject with AI-generated curriculum"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createSubject} className="space-y-4">
                  <div>
                    <Label htmlFor="subjectName">
                      {dict?.teacher?.subjectName || "Subject Name"}
                    </Label>
                    <Input
                      id="subjectName"
                      value={formData.subjectName}
                      onChange={(e) => setFormData(prev => ({ ...prev, subjectName: e.target.value }))}
                      placeholder={dict?.teacher?.subjectNamePlaceholder || "e.g., Mathematics, Physics, History"}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">
                      {dict?.teacher?.description || "Description"}
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder={dict?.teacher?.descriptionPlaceholder || "Brief description of the subject"}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="level">
                      {dict?.teacher?.level || "Level"}
                    </Label>
                    <Select 
                      value={formData.level} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="elementary">Elementary</SelectItem>
                        <SelectItem value="middle">Middle School</SelectItem>
                        <SelectItem value="high">High School</SelectItem>
                        <SelectItem value="college">College</SelectItem>
                        <SelectItem value="university">University</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="submit" 
                      disabled={creating}
                      className="flex-1"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {dict?.teacher?.creating || "Creating..."}
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          {dict?.teacher?.createSubject || "Create Subject"}
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                    >
                      {dict?.teacher?.cancel || "Cancel"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Create Topic Form */}
          {showTopicForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Topic
                </CardTitle>
                <CardDescription>
                  Add a new topic to an existing subject
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createTopic} className="space-y-4">
                  <div>
                    <Label htmlFor="subjectSelect">
                      Select Subject *
                    </Label>
                    <Select 
                      value={selectedSubjectForTopic} 
                      onValueChange={setSelectedSubjectForTopic}
                    >
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

                  <div>
                    <Label htmlFor="topicName">
                      Topic Name *
                    </Label>
                    <Input
                      id="topicName"
                      value={topicFormData.name}
                      onChange={(e) => setTopicFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Linear Equations, World War II, Photosynthesis"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="topicDescription">
                      Description
                    </Label>
                    <Textarea
                      id="topicDescription"
                      value={topicFormData.description}
                      onChange={(e) => setTopicFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the topic"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="submit" 
                      disabled={creatingTopic}
                      className="flex-1"
                    >
                      {creatingTopic ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Topic
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        setShowTopicForm(false);
                        setSelectedSubjectForTopic('');
                        setTopicFormData({ name: '', description: '' });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Subjects List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {dict?.teacher?.subjects || "Subjects"}
              </CardTitle>
              <CardDescription>
                {dict?.teacher?.subjectsDescription || "Manage your created subjects and view student progress"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subjects.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    {dict?.teacher?.noSubjectsYet || "No subjects created yet."}
                  </p>
                  <Button 
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {dict?.teacher?.createFirstSubject || "Create Your First Subject"}
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {subjects.map((subject) => (
                    <Card key={subject.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-lg">{subject.name}</h3>
                          <Badge className={getLevelColor(subject.level)}>
                            {subject.level}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {subject.description}
                        </p>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              {dict?.teacher?.totalLessons || "Total Lessons"}
                            </span>
                            <span className="font-medium">{getTotalLessons(subject)}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              {dict?.teacher?.topics || "Topics"}
                            </span>
                            <span className="font-medium">{subject.topics?.length || 0}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              {dict?.teacher?.enrolledStudents || "Enrolled Students"}
                            </span>
                            <span className="font-medium">{(subject as any)._count?.enrollments ?? 0}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            onClick={() => setSelectedSubject(subject)}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {dict?.teacher?.view || "View"}
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm"
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            {dict?.teacher?.analytics || "Analytics"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subject Details */}
          {selectedSubject && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {selectedSubject.name}
                    </CardTitle>
                    <CardDescription>
                      {selectedSubject.description}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSubject(null)}
                  >
                    {dict?.teacher?.close || "Close"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Subject Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{selectedSubject.topics?.length || 0}</div>
                      <div className="text-sm text-gray-600">{dict?.teacher?.topics || "Topics"}</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{getTotalLessons(selectedSubject)}</div>
                      <div className="text-sm text-gray-600">{dict?.teacher?.lessons || "Lessons"}</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{(selectedSubject as any)._count?.enrollments ?? 0}</div>
                      <div className="text-sm text-gray-600">{dict?.teacher?.students || "Students"}</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {new Date(selectedSubject.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600">{dict?.teacher?.created || "Created"}</div>
                    </div>
                  </div>

                  {/* Topics and Lessons */}
                  <div>
                    <h3 className="font-semibold mb-4">
                      {dict?.teacher?.curriculumStructure || "Curriculum Structure"}
                    </h3>
                    <div className="space-y-4">
                      {selectedSubject.topics?.map((topic) => (
                        <Card key={topic.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold">{topic.name}</h4>
                                <p className="text-sm text-gray-600">{topic.description}</p>
                              </div>
                              <Badge variant="outline">
                                {topic.lessons?.length || 0} {dict?.teacher?.lessons || "lessons"}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2">
                              {topic.lessons?.map((lesson, i) => (
                                <div key={lesson.id} className="p-3 bg-gray-50 rounded">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      <span className="text-sm font-medium">{lesson.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {((lesson as any).source?.type === 'book') ? (
                                        <Badge variant="outline" className="text-xs">Book</Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-xs">Manual</Badge>
                                      )}
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Clock className="h-3 w-3" />
                                        <span>{lesson.estimatedTime} {dict?.teacher?.min || "min"}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {lesson.difficulty}
                                        </Badge>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => toggleLessonPreview(lesson.id)}
                                      >
                                        <Eye className="h-3 w-3 mr-1" />
                                        {expandedLessons[lesson.id] ? 'Hide' : 'Preview'}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openLessonEditor(lesson.id)}
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deleteLesson(lesson.id)}
                                      >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Delete
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedLesson(lesson);
                                          setShowAssessmentManager(true);
                                        }}
                                      >
                                        <Target className="h-3 w-3 mr-1" />
                                        Assessments
                                      </Button>
                                      <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="sm" disabled={i === 0} onClick={() => moveLesson(topic.id, lesson.id, 'up')}>↑</Button>
                                        <Button variant="ghost" size="sm" disabled={i === (topic.lessons!.length - 1)} onClick={() => moveLesson(topic.id, lesson.id, 'down')}>↓</Button>
                                      </div>
                                    </div>
                                  </div>
                                  {expandedLessons[lesson.id] && (
                                    <div className="mt-3 text-sm text-gray-700 bg-white border rounded p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="text-xs text-gray-500">
                                          {((lesson as any).source?.type === 'book') && (
                                            <span>
                                              {(lesson as any).source?.bookTitle} • {(lesson as any).source?.bookUnit}
                                              {(lesson as any).source?.pageRange ? ` • ${((lesson as any).source?.pageRange)}` : ''}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="whitespace-pre-wrap">
                                        {((lesson as any).contentPreview) ? (
                                          <>{(lesson as any).contentPreview}</>
                                        ) : (
                                          <span className="text-gray-400">No preview available.</span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Assessment Manager Modal */}
      {showAssessmentManager && selectedLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Assessment Manager</h2>
                  <p className="text-gray-600">Manage assessments for: {selectedLesson.title}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAssessmentManager(false);
                    setSelectedLesson(null);
                  }}
                >
                  Close
                </Button>
              </div>
              <AssessmentManager
                lessonId={selectedLesson.id}
                onAssessmentCreated={() => {
                  // Refresh data if needed
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Lesson Editor Modal */}
      {showLessonEditor && lessonEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Edit Lesson</h2>
                  <p className="text-gray-600">{lessonEditor.title}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setShowLessonEditor(false); setLessonEditor(null); }}>Close</Button>
                  <Button onClick={saveLessonEditor} disabled={lessonEditorLoading}>
                    {lessonEditorLoading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>) : 'Save'}
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Content</Label>
                  <Textarea
                    rows={14}
                    value={lessonEditor.content}
                    onChange={(e) => setLessonEditor(prev => prev ? { ...prev, content: e.target.value } : prev)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
