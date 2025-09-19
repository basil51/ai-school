"use client";
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Clock,  
  Target, 
  CheckCircle, 
  PlayCircle, 
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Star,
  TrendingUp,
  Award
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  objectives: string[];
  difficulty: string;
  estimatedTime: number;
  order: number;
  progress: {
    status: string;
    progressPercentage: number;
    timeSpent: number;
  };
  hasAssessment: boolean;
  assessmentId: string | null;
}

interface Topic {
  id: string;
  name: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

interface Subject {
  subject: {
    id: string;
    name: string;
    description: string;
    level: string;
    enrolledAt: string;
  };
  topics: Topic[];
  progress: {
    totalLessons: number;
    completedLessons: number;
    totalTimeSpent: number;
  };
}

interface CurriculumData {
  curriculum: Subject[];
  overallProgress: {
    totalSubjects: number;
    totalLessons: number;
    completedLessons: number;
    totalTimeSpent: number;
    averageProgress: number;
  };
  recommendedLessons: Array<{
    lessonId: string;
    title: string;
    subject: string;
    topic: string;
    difficulty: string;
    estimatedTime: number;
    progress: any;
  }>;
}

interface LessonSelectorProps {
  onLessonSelect: (lessonId: string) => void;
  selectedLessonId?: string;
}

export default function LessonSelector({ onLessonSelect, selectedLessonId }: LessonSelectorProps) {
  const [curriculumData, setCurriculumData] = useState<CurriculumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'curriculum' | 'recommended'>('recommended');

  useEffect(() => {
    fetchCurriculumData();
  }, []);

  const fetchCurriculumData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/smart-teaching/curriculum/current-user');
      
      if (!response.ok) {
        throw new Error('Failed to fetch curriculum data');
      }
      
      const data = await response.json();
      setCurriculumData(data.data);
      
      // Auto-expand first subject and topic
      if (data.data.curriculum && data.data.curriculum.length > 0) {
        const firstSubject = data.data.curriculum[0];
        if (firstSubject && firstSubject.subject && firstSubject.subject.id) {
          setExpandedSubjects(new Set([firstSubject.subject.id]));
          
          if (firstSubject.topics && firstSubject.topics.length > 0) {
            const firstTopic = firstSubject.topics[0];
            if (firstTopic && firstTopic.id) {
              setExpandedTopics(new Set([firstTopic.id]));
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subjectId: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId);
    } else {
      newExpanded.add(subjectId);
    }
    setExpandedSubjects(newExpanded);
  };

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <PlayCircle className="w-4 h-4 text-blue-600" />;
      default: return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600 text-center">
          <p>Error loading curriculum: {error}</p>
          <button 
            onClick={fetchCurriculumData}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!curriculumData || !curriculumData.curriculum || curriculumData.curriculum.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No curriculum data available</p>
          <p className="text-sm text-gray-500 mt-2">
            You may not be enrolled in any subjects yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Progress Overview */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Smart Teaching</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('recommended')}
              className={`px-3 py-1 rounded-full text-sm ${
                activeTab === 'recommended' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Star className="w-4 h-4 inline mr-1" />
              Recommended
            </button>
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`px-3 py-1 rounded-full text-sm ${
                activeTab === 'curriculum' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-1" />
              All Lessons
            </button>
          </div>
        </div>
        
        {/* Overall Progress */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{curriculumData.overallProgress.completedLessons}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{curriculumData.overallProgress.totalLessons}</div>
            <div className="text-xs text-gray-600">Total Lessons</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{curriculumData.overallProgress.averageProgress}%</div>
            <div className="text-xs text-gray-600">Progress</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'recommended' ? (
          <div className="p-4">
            <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
              Recommended Next Lessons
            </h3>
            
            {curriculumData.recommendedLessons.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Award className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>All lessons completed! 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {curriculumData.recommendedLessons.filter(lesson => lesson && lesson.lessonId).map((lesson, index) => (
                  <div
                    key={`recommended-${lesson.lessonId || `recommended-${index}`}`}
                    onClick={() => onLessonSelect(lesson.lessonId)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      selectedLessonId === lesson.lessonId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 mb-1">{lesson.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center">
                            <BookOpen className="w-3 h-3 mr-1" />
                            {lesson.subject}
                          </span>
                          <span className="flex items-center">
                            <Target className="w-3 h-3 mr-1" />
                            {lesson.topic}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {lesson.estimatedTime} min
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(lesson.difficulty)}`}>
                            {lesson.difficulty}
                          </span>
                          {getStatusIcon(lesson.progress.status)}
                          <span className="text-xs text-gray-500">
                            {lesson.progress.progressPercentage}% complete
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
            <h3 className="text-md font-semibold text-gray-800 mb-3">All Subjects & Lessons</h3>
            
            <div className="space-y-4">
              {curriculumData.curriculum.filter(subject => subject && subject.subject && subject.subject.id).map((subject, index) => (
                <div key={`subject-${subject.subject.id || `subject-${index}`}`} className="border border-gray-200 rounded-lg">
                  {/* Subject Header */}
                  <div
                    onClick={() => toggleSubject(subject.subject.id)}
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {expandedSubjects.has(subject.subject.id) ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-800">{subject.subject.name}</h4>
                          <p className="text-sm text-gray-600">{subject.subject.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-800">
                          {subject.progress.completedLessons}/{subject.progress.totalLessons}
                        </div>
                        <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full ${getProgressColor(
                              (subject.progress.completedLessons / subject.progress.totalLessons) * 100
                            )}`}
                            style={{
                              width: `${(subject.progress.completedLessons / subject.progress.totalLessons) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Topics */}
                  {expandedSubjects.has(subject.subject.id) && (
                    <div className="border-t border-gray-200">
                      {subject.topics.map((topic, index) => (
                        <div key={`topic-${topic.id || `topic-${index}`}`}>
                          {/* Topic Header */}
                          <div
                            onClick={() => toggleTopic(topic.id)}
                            className="p-3 pl-8 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {expandedTopics.has(topic.id) ? (
                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-500" />
                                )}
                                <h5 className="font-medium text-gray-700">{topic.name}</h5>
                              </div>
                              <span className="text-sm text-gray-500">
                                {topic.lessons.length} lessons
                              </span>
                            </div>
                          </div>

                          {/* Lessons */}
                          {expandedTopics.has(topic.id) && (
                            <div className="bg-gray-50">
                              {topic.lessons.map((lesson, index) => (
                                <div
                                  key={`lesson-${lesson.id || `lesson-${index}`}`}
                                  onClick={() => onLessonSelect(lesson.id)}
                                  className={`p-3 pl-12 cursor-pointer hover:bg-white transition-colors border-b border-gray-100 last:border-b-0 ${
                                    selectedLessonId === lesson.id ? 'bg-blue-50 border-blue-200' : ''
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      {getStatusIcon(lesson.progress.status)}
                                      <div>
                                        <h6 className="font-medium text-gray-800">{lesson.title}</h6>
                                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                                          <span className="flex items-center">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {lesson.estimatedTime} min
                                          </span>
                                          <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(lesson.difficulty)}`}>
                                            {lesson.difficulty}
                                          </span>
                                          {lesson.hasAssessment && (
                                            <span className="flex items-center text-blue-600">
                                              <Award className="w-3 h-3 mr-1" />
                                              Assessment
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm text-gray-600">
                                        {lesson.progress.progressPercentage}%
                                      </div>
                                      <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                                        <div
                                          className={`h-1.5 rounded-full ${getProgressColor(lesson.progress.progressPercentage)}`}
                                          style={{ width: `${lesson.progress.progressPercentage}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
