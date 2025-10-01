"use client";
import React, { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import UnifiedSmartTeachingInterface from '@/components/UnifiedSmartTeachingInterface';
import LessonSelector from '@/components/smart-teaching/LessonSelector';

// Module-level lock to prevent duplicate operations in React StrictMode
const pageLocks = new Set<string>();
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from  "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, GraduationCap, Brain, Play, Loader2, ArrowRight, BookMarked, Users} from "lucide-react";

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

export default function UnifiedSmartTeachingPage() {
  // Generate unique component instance ID to prevent duplicate operations in StrictMode
  const componentId = useRef<string>(`page-${Date.now()}-${Math.random()}`).current;
  const [activeTab, setActiveTab] = useState<'learning' | 'courses'>('learning');
  const [showLessonSelector, setShowLessonSelector] = useState(true);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  
  // Only log once per render cycle to reduce StrictMode noise
  const logLockKey = `page-log-${componentId}`;
  if (!pageLocks.has(logLockKey)) {
    console.log('🎯 [DEBUG] Page component state:', { activeTab, showLessonSelector, selectedLessonId });
    pageLocks.add(logLockKey);
    setTimeout(() => pageLocks.delete(logLockKey), 100);
  }
  
  // Enrollment state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  
  // GeoGebra API state
  const [geogebraLoaded, setGeogebraLoaded] = useState(false);

  useEffect(() => {
    if (activeTab === 'courses') {
      fetchSubjects();
      fetchEnrollments();
    }
  }, [activeTab]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/curriculum/generate');
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

  const fetchEnrollments = async () => {
    try {
      const response = await fetch('/api/curriculum/enroll');
      if (response.ok) {
        const data = await response.json();
        setEnrollments(data.enrollments || []);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
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

  const handleLessonSelect = (lessonId: string) => {
    const lockKey = `lesson-select-${lessonId}-${componentId}`;
    
    // Check if this lesson selection is already in progress
    if (pageLocks.has(lockKey)) {
      console.log('🎯 [DEBUG] Lesson selection already in progress, skipping duplicate');
      return;
    }
    
    console.log('🎯 [DEBUG] Lesson selected in page.tsx:', lessonId);
    pageLocks.add(lockKey);
    
    // Clear previous lesson selection and reset state
    if (selectedLessonId && selectedLessonId !== lessonId) {
      console.log('🎯 [DEBUG] Switching from lesson', selectedLessonId, 'to', lessonId);
    }
    
    setSelectedLessonId(lessonId);
    setShowLessonSelector(false);
    setActiveTab('learning'); // Switch to learning tab when lesson is selected
    console.log('🎯 [DEBUG] Page state updated - selectedLessonId:', lessonId, 'activeTab: learning');
    
    // Clear the lock after a short delay
    setTimeout(() => pageLocks.delete(lockKey), 1000);
  };

  return (
    <>
      {/* Load GeoGebra API */}
      <Script
        src="https://www.geogebra.org/apps/deployggb.js"
        onLoad={() => {
          setGeogebraLoaded(true);
          console.log('GeoGebra API loaded successfully');
          console.log('GGBApplet available:', !!window.GGBApplet);
        }}
        onError={(e) => {
          console.error('Failed to load GeoGebra API:', e);
        }}
        strategy="afterInteractive"
      />
      
      <div className="flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
              AI Learning Hub
            </h1>
            {!geogebraLoaded && (
              <span className="px-2 sm:px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs sm:text-sm flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="hidden sm:inline">Loading GeoGebra...</span>
                <span className="sm:hidden">Loading...</span>
              </span>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Tab Navigation */}
            <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('learning')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'learning'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Brain className="w-4 h-4 inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Learning</span>
                <span className="sm:hidden">Learn</span>
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'courses'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BookOpen className="w-4 h-4 inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Courses</span>
                <span className="sm:hidden">Courses</span>
              </button>
            </div>
            
            {activeTab === 'learning' && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowLessonSelector(!showLessonSelector)}
                  className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                >
                  <span className="hidden sm:inline">{showLessonSelector ? 'Hide' : 'Show'} Lessons</span>
                  <span className="sm:hidden">{showLessonSelector ? 'Hide' : 'Show'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {activeTab === 'learning' ? (
          <>
            {/* Lesson Selector Sidebar */}
            {showLessonSelector && (
            <div className="w-full lg:w-80 xl:w-96 bg-white border-r border-gray-200 flex-shrink-0 h-64 lg:h-auto overflow-y-auto">
                <LessonSelector 
                  onLessonSelect={handleLessonSelect}
                  selectedLessonId={selectedLessonId || undefined}
                />
            </div>
            )}

            {/* Unified Interface */}
            <div className="flex-1 min-h-0">
              <UnifiedSmartTeachingInterface
                studentId="demo-student"
                initialTab="smart-teaching"
                showLessonSelector={false}
                mode="student"
                onLessonSelect={handleLessonSelect}
                selectedLessonId={selectedLessonId || undefined}
              />
            </div>
          </>
        ) : (
          /* Courses Tab Content */
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
            <div className="mx-auto max-w-fit">
              {/* Current Enrollments */}
              {enrollments.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      My Enrolled Courses
                    </CardTitle>
                    <CardDescription>
                      Continue your learning journey
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
                                <span>Progress</span>
                                <span>{enrollment.progress.progressPercentage}%</span>
                              </div>
                              <Progress value={enrollment.progress.progressPercentage} className="h-2" />
                              <div className="text-xs text-gray-500 mt-1">
                                {enrollment.progress.completedLessons} / {enrollment.progress.totalLessons} lessons
                              </div>
                            </div>

                            <Button 
                              onClick={() => {
                                setActiveTab('learning');
                                setShowLessonSelector(true);
                              }}
                              className="w-full"
                              size="sm"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Continue Learning
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
                    Available Courses
                  </CardTitle>
                  <CardDescription>
                    Explore and enroll in new subjects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p className="text-gray-600">Loading available courses...</p>
                    </div>
                  ) : subjects.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        No courses available yet. Teachers can create new subjects.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
                                  <span>{totalLessons} lessons</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  <span>{subject._count.enrollments} students</span>
                                </div>
                              </div>

                              {isEnrolled ? (
                                <Button 
                                  onClick={() => {
                                    setActiveTab('learning');
                                    setShowLessonSelector(true);
                                  }}
                                  className="w-full"
                                  size="sm"
                                  variant="outline"
                                >
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  Start Learning
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
                                  {enrolling === subject.id ? 'Enrolling...' : 'Enroll'}
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
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
