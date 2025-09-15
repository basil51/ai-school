"use client";
import React, { useMemo, useState, useEffect } from 'react';
import SmartLearningCanvas from '@/components/SmartLearningCanvas';
import EnhancedSmartLearningCanvas from '@/components/smart-teaching/EnhancedSmartLearningCanvas';
import LessonSelector from '@/components/smart-teaching/LessonSelector';
import SmartAssessmentInterface from '@/components/smart-teaching/SmartAssessmentInterface';
import AdaptiveQuestionTrigger from '@/components/smart-teaching/AdaptiveQuestionTrigger';
import AdaptiveTeachingInterface from '@/components/smart-teaching/AdaptiveTeachingInterface';
import { BookOpen, Brain, Target, Sparkles, Zap, ClipboardCheck, Users } from 'lucide-react';

type ContentType = 'text' | 'math' | 'diagram' | 'simulation' | 'video' | 'interactive' | '3d' | 'advanced-3d' | 'd3-advanced';

interface LessonData {
  lesson: {
    id: string;
    title: string;
    content: string;
    objectives: string[];
    difficulty: string;
    estimatedTime: number;
  };
  topic: {
    id: string;
    name: string;
    description: string;
  };
  subject: {
    id: string;
    name: string;
    description: string;
    level: string;
  };
  studentProfile?: any;
}

export default function Page() {
  const [contentType, setContentType] = useState<ContentType>('text');
  const [learningStyle, setLearningStyle] = useState<'visual' | 'audio' | 'kinesthetic' | 'analytical'>('visual');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLessonSelector, setShowLessonSelector] = useState(true);
  const [useEnhancedCanvas, setUseEnhancedCanvas] = useState(true);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentMode, setAssessmentMode] = useState<'adaptive' | 'standard'>('adaptive');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [studentEngagement, setStudentEngagement] = useState(0.7);
  const [timeSpent, setTimeSpent] = useState(0);
  const [confusionDetected, setConfusionDetected] = useState(false);
  const [showAdaptiveTeaching, setShowAdaptiveTeaching] = useState(false);
  const [adaptiveSession, setAdaptiveSession] = useState<any>(null);

  // Load lesson data when a lesson is selected
  const loadLessonData = async (lessonId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/smart-teaching/lesson/${lessonId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load lesson data');
      }
      
      const data = await response.json();
      setLessonData(data.data);
      
      // Start smart teaching session
      await startSmartTeachingSession(lessonId);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLessonId) {
      loadLessonData(selectedLessonId);
    }
  }, [selectedLessonId, loadLessonData]);

  const startSmartTeachingSession = async (lessonId: string) => {
    try {
      const response = await fetch(`/api/smart-teaching/lesson/${lessonId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start_session'
        })
      });
      
      if (!response.ok) {
        console.error('Failed to start smart teaching session');
      }
    } catch (err) {
      console.error('Error starting smart teaching session:', err);
    }
  };

  const handleLessonSelect = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setShowLessonSelector(false);
  };

  // Handle assessment trigger
  const handleAssessmentTrigger = (triggerType: string) => {
    setAssessmentMode('adaptive');
    setShowAssessment(true);
  };

  // Handle assessment completion
  const handleAssessmentComplete = (result: any) => {
    console.log('Assessment completed:', result);
    setShowAssessment(false);
    // Update student engagement based on assessment result
    if (result.feedback?.percentage > 0.8) {
      setStudentEngagement(Math.min(1, studentEngagement + 0.1));
    } else if (result.feedback?.percentage < 0.5) {
      setStudentEngagement(Math.max(0, studentEngagement - 0.1));
      setConfusionDetected(true);
    }
  };

  // Handle adaptive teaching changes
  const handleAdaptiveTeachingChange = (adaptation: any) => {
    console.log('Adaptive teaching change:', adaptation);
    setAdaptiveSession(adaptation);
    // Update learning style based on adaptation
    if (adaptation.teachingMethod) {
      const methodType = adaptation.teachingMethod.type;
      if (methodType === 'visual') setLearningStyle('visual');
      else if (methodType === 'auditory') setLearningStyle('audio');
      else if (methodType === 'kinesthetic') setLearningStyle('kinesthetic');
      else if (methodType === 'analytical') setLearningStyle('analytical');
    }
  };

  const handleMethodChange = (method: any) => {
    console.log('Teaching method changed:', method);
    setAdaptiveSession((prev: any) => prev ? { ...prev, currentMethod: method } : null);
  };

  // Simulate time tracking
  useEffect(() => {
    if (lessonData && !showAssessment) {
      const interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lessonData, showAssessment]);

  const content = useMemo(() => {
    // If we have real lesson data, use it
    if (lessonData) {
      return {
        title: lessonData.lesson.title,
        text: lessonData.lesson.content,
        objectives: lessonData.lesson.objectives,
        subject: lessonData.subject.name,
        topic: lessonData.topic.name,
        difficulty: lessonData.lesson.difficulty,
        estimatedTime: lessonData.lesson.estimatedTime,
        narration: `Let's learn about ${lessonData.lesson.title}. This lesson covers ${lessonData.topic.name} in ${lessonData.subject.name}.`
      };
    }

    // Fallback to demo content
    switch (contentType) {
      case 'math':
        return {
          equation: String('\\int_0^{\\pi} \\sin(x)\\,dx = 2'),
          explanation: 'The integral of sin(x) from 0 to π equals 2. This follows from the antiderivative −cos(x) evaluated at the bounds.',
          graphExpression: 'Math.sin(x)',
          graphTitle: 'y = sin(x) on [-10, 10]',
          narration: 'Let us understand the area under the sine curve from zero to pi. The positive lobe integrates to two.'
        };
      case 'diagram':
        return {
          title: 'Photosynthesis Overview',
          chart: `graph TD\n  A[Sunlight] --> B[Chlorophyll]\n  B --> C[Light Reactions]\n  C --> D[ATP + NADPH]\n  D --> E[Calvin Cycle]\n  E --> F[Glucose]`,
          theme: 'neutral',
          narration: 'This diagram illustrates the flow of energy in photosynthesis from sunlight to glucose.'
        };
      case 'simulation':
        return {
          title: 'Projectile Motion',
          g: 9.81,
          initialSpeed: 22,
          angleDeg: 45,
          narration: 'Adjust speed and angle to see how range and height change in projectile motion.'
        };
      case 'video':
        return {
          title: 'Short Concept Video',
          src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
          poster: '/vercel.svg',
          captions: undefined,
          narration: 'Watch a short video, then we will summarize the key points.'
        };
      case 'interactive':
        return {
          title: 'Explore the Code and Visualization',
          initialCode: "const arr = [1,2,3,4];\nconsole.log('Sum:', arr.reduce((a,b)=>a+b,0));",
          graphExpression: '0.2 * (x*x - 10*x + 16)',
          narration: 'Experiment with the code playground and observe the plotted function on the right.'
        };
      case '3d':
        return {
          title: '3D Geometry Visualization',
          visualizationType: 'geometry',
          config: {
            geometry: {
              shape: 'sphere',
              color: '#3b82f6',
              wireframe: false
            }
          },
          narration: 'Explore 3D geometric shapes with Three.js. Rotate and interact with the visualization.'
        };
      case 'advanced-3d':
        return {
          title: 'Advanced 3D Physics Engine',
          visualizationType: 'physics-engine',
          config: {
            scene: {
              backgroundColor: '#f8fafc',
              gravity: true
            },
            physics: {
              enabled: true,
              gravity: -9.81
            }
          },
          narration: 'Experience advanced 3D physics simulations with Babylon.js engine.'
        };
      case 'd3-advanced':
        return {
          title: 'Advanced Data Visualization',
          visualizationType: 'network',
          config: {
            network: {
              nodes: 25,
              links: 40
            }
          },
          narration: 'Explore complex data relationships with advanced D3.js visualizations.'
        };
      default:
        return {
          title: 'Welcome to Smart Learning Canvas',
          text: 'Choose a lesson from the sidebar to start learning, or select a modality above to experience multi-modal learning content.'
        };
    }
  }, [contentType, lessonData]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Brain className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                {lessonData ? `${lessonData.subject.name} - ${lessonData.topic.name}` : 'Smart Learning Canvas'}
              </h1>
            </div>
            {lessonData && (
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <Target className="w-4 h-4 mr-1" />
                  {lessonData.lesson.title}
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {lessonData.lesson.difficulty}
                </span>
                <span className="flex items-center">
                  <BookOpen className="w-4 h-4 mr-1" />
                  {lessonData.lesson.estimatedTime} min
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Learning style:</label>
              <select
                value={learningStyle}
                onChange={(e) => setLearningStyle(e.target.value as any)}
                className="border border-gray-200 rounded-md px-2 py-1 text-sm"
              >
                <option value="visual">Visual</option>
                <option value="audio">Audio</option>
                <option value="kinesthetic">Kinesthetic</option>
                <option value="analytical">Analytical</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setUseEnhancedCanvas(!useEnhancedCanvas)}
                className={`px-3 py-2 rounded-md transition-colors ${
                  useEnhancedCanvas 
                    ? 'bg-purple-600 text-white hover:bg-purple-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <div className="flex items-center space-x-1">
                  {useEnhancedCanvas ? <Sparkles className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                  <span>{useEnhancedCanvas ? 'AI Enhanced' : 'Standard'}</span>
                </div>
              </button>
              
              {lessonData && currentSessionId && (
                <button
                  onClick={() => setShowAssessment(!showAssessment)}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    showAssessment 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <ClipboardCheck className="w-4 h-4" />
                    <span>{showAssessment ? 'Hide Assessment' : 'Start Assessment'}</span>
                  </div>
                </button>
              )}

              {lessonData && currentSessionId && (
                <button
                  onClick={() => setShowAdaptiveTeaching(!showAdaptiveTeaching)}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    showAdaptiveTeaching 
                      ? 'bg-purple-600 text-white hover:bg-purple-700' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{showAdaptiveTeaching ? 'Hide Adaptive' : 'Show Adaptive'}</span>
                  </div>
                </button>
              )}
              
              <button
                onClick={() => setShowLessonSelector(!showLessonSelector)}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {showLessonSelector ? 'Hide' : 'Show'} Lessons
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Lesson Selector Sidebar */}
        {showLessonSelector && (
          <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0">
            <LessonSelector 
              onLessonSelect={handleLessonSelect}
              selectedLessonId={selectedLessonId || undefined}
            />
          </div>
        )}

        {/* Smart Learning Canvas */}
        <div className="flex-1 flex flex-col">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading lesson...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-600">
                <p className="mb-4">Error: {error}</p>
                <button 
                  onClick={() => selectedLessonId && loadLessonData(selectedLessonId)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Content Type Selector (only show for demo mode) */}
              {!lessonData && (
                <div className="p-4 bg-white border-b border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {(['text','math','diagram','simulation','video','interactive','3d','advanced-3d','d3-advanced'] as ContentType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setContentType(t)}
                        className={`px-3 py-1 rounded-md text-sm border ${contentType === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Assessment Interface */}
              {showAssessment && lessonData && currentSessionId && (
                <div className="p-6 bg-gray-50">
                  <SmartAssessmentInterface
                    sessionId={currentSessionId}
                    lessonId={lessonData.lesson.id}
                    onAssessmentComplete={handleAssessmentComplete}
                    adaptiveMode={assessmentMode === 'adaptive'}
                    triggerType="periodic_check"
                  />
                </div>
              )}

              {/* Adaptive Question Trigger */}
              {!showAssessment && lessonData && currentSessionId && (
                <AdaptiveQuestionTrigger
                  sessionId={currentSessionId}
                  lessonId={lessonData.lesson.id}
                  onTriggerAssessment={handleAssessmentTrigger}
                  studentEngagement={studentEngagement}
                  timeSpent={timeSpent}
                  confusionDetected={confusionDetected}
                />
              )}

              {/* Adaptive Teaching Interface */}
              {showAdaptiveTeaching && lessonData && currentSessionId && (
                <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50">
                  <AdaptiveTeachingInterface
                    sessionId={currentSessionId}
                    lessonId={lessonData.lesson.id}
                    onAdaptation={handleAdaptiveTeachingChange}
                    onMethodChange={handleMethodChange}
                  />
                </div>
              )}

              {/* Smart Learning Canvas */}
              {!showAssessment && (
                <div className="flex-1">
                  {lessonData && useEnhancedCanvas ? (
                    <EnhancedSmartLearningCanvas
                      lessonData={lessonData}
                      learningStyle={learningStyle}
                      onContentGenerated={setGeneratedContent}
                    />
                  ) : (
                    <div className="p-6">
                      <SmartLearningCanvas 
                        content={content} 
                        contentType={lessonData ? 'text' : contentType} 
                        learningStyle={learningStyle} 
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="text-sm text-gray-600 text-center">
                  {lessonData ? (
                    <div className="flex items-center justify-center space-x-6">
                      <span>📚 Real lesson content loaded</span>
                      <span>🎯 {lessonData.lesson.objectives.length} learning objectives</span>
                      {useEnhancedCanvas ? (
                        <>
                          <span>🧠 AI-enhanced teaching enabled</span>
                          {generatedContent && (
                            <span>✨ {Object.keys(generatedContent).filter(key => key !== 'baseContent' && key !== 'metadata').length} content modalities</span>
                          )}
                        </>
                      ) : (
                        <span>🧠 Standard teaching mode</span>
                      )}
                    </div>
                  ) : (
                    <span>Tip: Select a lesson from the sidebar to start learning, or try different modalities above.</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


