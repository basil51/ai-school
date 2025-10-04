"use client"; 
import React, { useState, useRef, useEffect, useCallback } from 'react'; 
import ProgressiveContentLoader from './smart-teaching/ProgressiveContentLoader';
import EnhancedVideoPlayer from './smart-teaching/EnhancedVideoPlayer';
import SmartAssessmentInterface from './smart-teaching/SmartAssessmentInterface';
import EnhancedMathRenderer from './smart-teaching/EnhancedMathRenderer';
import EnhancedDiagramRenderer from './smart-teaching/EnhancedDiagramRenderer';
import EnhancedInteractiveRenderer from './smart-teaching/EnhancedInteractiveRenderer';
import EnhancedAssessmentRenderer from './smart-teaching/EnhancedAssessmentRenderer';

// Module-level lock to prevent duplicate operations in React StrictMode
const componentLocks = new Set<string>();
import { 
  Brain, Target, Settings, Users, MessageCircle, FileText, Image, Calculator, Globe, Play, 
  Video, VideoOff, Mic, MicOff, Camera, Award, Zap, Plus, Minus, RotateCcw,
  Download, Save, MousePointer, TrendingUp, Clock, BarChart3, Loader2
} from 'lucide-react';


interface UnifiedInterfaceProps {
  studentId?: string;
  initialTab?: string;
  showLessonSelector?: boolean;
  mode?: 'student' | 'teacher'; // Add mode prop to distinguish between student and teacher interfaces
  onLessonSelect?: (lessonId: string) => void; // Callback for lesson selection
  selectedLessonId?: string; // Currently selected lesson ID
} 

type UnifiedTab = 'smart-teaching' | 'whiteboard' | 'media' | 'interactive' | 'assessment' | 'ai-tools';
//type CanvasMode = 'smart' | 'whiteboard' | 'overlay';
 
const UnifiedSmartTeachingInterface: React.FC<UnifiedInterfaceProps> = ({
  //studentId,
  initialTab = 'smart-teaching',
  //showLessonSelector = true,
  mode = 'student', // Default to student mode
  onLessonSelect,
  selectedLessonId
}) => {
  // Generate unique component instance ID to prevent duplicate operations in StrictMode
  const componentId = useRef<string>(`component-${Date.now()}-${Math.random()}`).current;
  
  // Core state management
  const [activeTab, setActiveTab] = useState<UnifiedTab>(initialTab as UnifiedTab);
  //const [canvasMode, setCanvasMode] = useState<CanvasMode>('smart');
  
  // Smart Teaching state
  const [lessonData, setLessonData] = useState<any>(null);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [learningStyle, setLearningStyle] = useState<'visual' | 'audio' | 'kinesthetic' | 'analytical'>('visual');
  
  // Content generation state (parent-owned to prevent duplicates)
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<number | null>(null);
  const [contentStatuses, setContentStatuses] = useState<Record<string, any>>({});
  const generationLocks = useRef<Set<string>>(new Set());
  
  // Parent-owned content generation to prevent duplicates
  const generateContent = useCallback(async (contentType: string, options?: { force?: boolean }) => {
    if (!lessonData?.lesson?.id) {
      console.log('🎯 [DEBUG] No lesson data available for content generation');
      return;
    }

    const lessonId = lessonData.lesson.id;
    const lockKey = `${lessonId}-${contentType}`;
    
    // Check if generation is already in progress (prevents duplicates)
    if (generationLocks.current.has(lockKey)) {
      console.log('🎯 [DEBUG] Generation already in progress for', lockKey, '- skipping duplicate');
      return;
    }

    // Acquire lock
    generationLocks.current.add(lockKey);
    console.log('🎯 [DEBUG] Starting content generation for', contentType, 'with lock:', lockKey);

    try {
      setIsGenerating(true);
      setGenerationProgress(0);
      
      setContentStatuses(prev => ({
        ...prev,
        [contentType]: { status: 'loading' }
      }));

      const response = await fetch('/api/smart-teaching/generate-progressive-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId: lessonId,
          contentType: contentType,
          learningStyle: learningStyle,
          forceRegenerate: options?.force || false
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate ${contentType} content`);
      }

      const result = await response.json();
      console.log('🎯 [DEBUG] Content generation response for', contentType, ':', result);
      
      if (result.success) {
        setContentStatuses(prev => ({
          ...prev,
          [contentType]: { 
            status: 'loaded', 
            content: result.data 
          }
        }));

        // Update generated content
        setGeneratedContent((prevContent: any) => {
          if (contentType === 'text' && result.data.baseContent) {
            console.log('🎯 [DEBUG] Setting base content (text)');
            return result.data;
          } else {
            const newContent = { ...prevContent, [contentType]: result.data };
            console.log('🎯 [DEBUG] Merging', contentType, 'content with existing content');
            return newContent;
          }
        });

        setGenerationProgress(100);
        console.log('✅ [DEBUG] Content generation completed for', contentType);
      } else {
        throw new Error(result.error || `Failed to generate ${contentType} content`);
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error generating', contentType, 'content:', error);
      setContentStatuses(prev => ({
        ...prev,
        [contentType]: { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    } finally {
      // Release lock
      generationLocks.current.delete(lockKey);
      setIsGenerating(false);
      setGenerationProgress(null);
      console.log('🎯 [DEBUG] Released lock for', lockKey);
    }
  }, [lessonData?.lesson?.id, learningStyle]);

  // Generate all content types progressively
  const generateAllContent = useCallback(async (options?: { force?: boolean }) => {
    if (!lessonData?.lesson?.id) return;
    
    console.log('🎯 [DEBUG] Starting progressive content generation for all types');
    console.log('🎯 [DEBUG] Available content types to generate: text, video, math, diagram, interactive, assessment');
    
    try {
      setIsGenerating(true);
      setGenerationProgress(0);
      
      // Generate text content first (fast)
      console.log('🎯 [DEBUG] Generating text content...');
      await generateContent('text', options);
      setGenerationProgress(20);
      
      // Then generate other content types with small delays
      console.log('🎯 [DEBUG] Scheduling video content generation...');
      setTimeout(() => generateContent('video', options), 500);
      setGenerationProgress(40);
      
      console.log('🎯 [DEBUG] Scheduling math content generation...');
      setTimeout(() => generateContent('math', options), 1000);
      setGenerationProgress(60);
      
      console.log('🎯 [DEBUG] Scheduling diagram content generation...');
      setTimeout(() => generateContent('diagram', options), 1500);
      setGenerationProgress(80);
      
      console.log('🎯 [DEBUG] Scheduling interactive content generation...');
      setTimeout(() => generateContent('interactive', options), 2000);
      setGenerationProgress(90);
      
      console.log('🎯 [DEBUG] Scheduling assessment content generation...');
      setTimeout(() => generateContent('assessment', options), 2500);
      setGenerationProgress(100);
      
    } catch (error) {
      console.error('🎯 [DEBUG] Error in generateAllContent:', error);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  }, [lessonData?.lesson?.id, generateContent]);
  //const [showAssessment, setShowAssessment] = useState(false);
  //const [showAdaptiveTeaching, setShowAdaptiveTeaching] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Whiteboard state
  const [selectedTool, setSelectedTool] = useState('pen');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [brushSize, setBrushSize] = useState(3);
  const [canvasBackground, setCanvasBackground] = useState('#ffffff');
  const [showGrid, setShowGrid] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showBackgroundDropdown, setShowBackgroundDropdown] = useState(false);
  
  // Session state (only for teacher mode)
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [showStudentPanel, setShowStudentPanel] = useState(mode === 'teacher');
  const [showToolPanel, setShowToolPanel] = useState(true);

  // Personal learning state (for student mode)
  const [personalProgress, _setPersonalProgress] = useState({
    lessonsCompleted: 0,
    totalLessons: 0,
    currentStreak: 0,
    totalTimeSpent: 0,
    masteryLevel: 'beginner'
  });
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState<any[]>([]);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasHistory, setCanvasHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize canvas
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowColorDropdown(false);
        setShowBackgroundDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Smart teaching session functionality
  const startSmartTeachingSession = useCallback(async (lessonId: string) => {
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
      } else {
        const sessionData = await response.json();
        setCurrentSessionId(sessionData.sessionId || `session-${Date.now()}`);
      }
    } catch (err) {
      console.error('Error starting smart teaching session:', err);
    }
  }, []);

  // Lesson loading functionality
  const loadLessonData = useCallback(async (lessonId: string) => {
    console.log('🎯 [DEBUG] loadLessonData called with lessonId:', lessonId);
    try {
      setLoading(true);
      setError(null);
      console.log('🎯 [DEBUG] Fetching lesson data from API...');
      
      const response = await fetch(`/api/smart-teaching/lesson/${lessonId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load lesson data');
      }
      
      const data = await response.json();
      console.log('🎯 [DEBUG] Lesson data received:', data);
      setLessonData(data.data);
      console.log('🎯 [DEBUG] Lesson data set in state:', data.data);
      
      // Start smart teaching session
      console.log('🎯 [DEBUG] Starting smart teaching session...');
      await startSmartTeachingSession(lessonId);
      
    } catch (err) {
      console.error('🎯 [DEBUG] Error loading lesson data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      console.log('🎯 [DEBUG] Lesson loading completed');
    }
  }, [startSmartTeachingSession]);

  // Load lesson data when selectedLessonId changes
  useEffect(() => {
    const lockKey = `lesson-load-${selectedLessonId || 'none'}-${componentId}`;
    
    // Check if this operation is already in progress (prevents StrictMode duplicates)
    if (componentLocks.has(lockKey)) {
      console.log('🎯 [DEBUG] Lesson loading already in progress, skipping duplicate');
      return;
    }
    
    console.log('🎯 [DEBUG] UnifiedSmartTeachingInterface - selectedLessonId changed:', selectedLessonId);
    
    if (selectedLessonId) {
      console.log('🎯 [DEBUG] Starting to load lesson data for:', selectedLessonId);
      
      // Clear any existing content and cache when switching lessons
      setGeneratedContent(null);
      setContentStatuses({});
      setIsGenerating(false);
      setGenerationProgress(null);
      
      // Reset all content statuses to loading state for new lesson
      setContentStatuses({
        text: { status: 'loading' },
        video: { status: 'loading' },
        math: { status: 'loading' },
        diagram: { status: 'loading' },
        interactive: { status: 'loading' },
        assessment: { status: 'loading' }
      });
      
      componentLocks.add(lockKey);
      loadLessonData(selectedLessonId).finally(() => {
        componentLocks.delete(lockKey);
      });
    } else {
      console.log('🎯 [DEBUG] No selectedLessonId, clearing lesson data');
      setLessonData(null);
      setGeneratedContent(null);
      setContentStatuses({});
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  }, [selectedLessonId, loadLessonData, componentId]);

  // Generate content when lesson data is loaded
  useEffect(() => {
    if (lessonData?.lesson?.id && !generatedContent) {
      const lockKey = `content-gen-${lessonData.lesson.id}-${componentId}`;
      
      // Check if content generation is already in progress
      if (componentLocks.has(lockKey)) {
        console.log('🎯 [DEBUG] Content generation already in progress, skipping duplicate');
        return;
      }
      
      console.log('🎯 [DEBUG] Lesson data loaded, starting content generation for:', lessonData.lesson.id);
      console.log('🎯 [DEBUG] Lesson data:', lessonData);
      componentLocks.add(lockKey);
      generateAllContent().finally(() => {
        componentLocks.delete(lockKey);
      });
    }
  }, [lessonData?.lesson?.id, generatedContent, generateAllContent, componentId]);

  // Cleanup locks when component unmounts
  useEffect(() => {
    return () => {
      // Clean up any locks for this component instance
      for (const lockKey of componentLocks) {
        if (lockKey.includes(componentId)) {
          componentLocks.delete(lockKey);
        }
      }
    };
  }, [componentId]);

  // Handle lesson selection from parent component
  const _handleLessonSelect = (lessonId: string) => {
    loadLessonData(lessonId);
    // Also call parent callback if provided
    if (onLessonSelect) {
      onLessonSelect(lessonId);
    }
  };

  // Canvas operations
  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const newHistory = canvasHistory.slice(0, historyStep + 1);
      newHistory.push(canvas.toDataURL());
      setCanvasHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
    }
  }, [canvasHistory, historyStep]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = canvasBackground;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveToHistory();
    }
  }, [canvasBackground, saveToHistory]);

  const undo = () => {
    if (historyStep > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const img = new window.Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = canvasHistory[historyStep - 1];
      setHistoryStep(historyStep - 1);
    }
  };

  const redo = () => {
    if (historyStep < canvasHistory.length - 1) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const img = new window.Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = canvasHistory[historyStep + 1];
      setHistoryStep(historyStep + 1);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'select') return;
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    if (selectedTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        ctx.font = `${brushSize * 4}px Arial`;
        ctx.fillStyle = selectedColor;
        ctx.fillText(text, x, y);
      }
      setIsDrawing(false);
      return;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || selectedTool === 'select' || selectedTool === 'text') return;
  
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (selectedTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 2;
    } else if (selectedTool === 'highlighter') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.strokeStyle = selectedColor + '40';
      ctx.lineWidth = brushSize * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = brushSize;
    }
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!showGrid) return;
    
    const gridSize = 20;
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };


  // Unified tab configuration
  const unifiedTabs = [
    {
      id: 'smart-teaching',
      label: 'Smart Teaching',
      icon: Brain,
      color: 'blue',
      description: 'AI-powered adaptive learning'
    },
    {
      id: 'media',
      label: 'Media Hub',
      icon: Image,
      color: 'orange',
      description: 'Images, videos, and resources'
    },
    {
      id: 'interactive',
      label: 'Interactive',
      icon: Calculator,
      color: 'purple',
      description: 'Tools and simulations'
    },
    {
      id: 'assessment',
      label: 'Assessment',
      icon: Award,
      color: 'yellow',
      description: 'Quizzes and evaluations'
    },
    {
      id: 'ai-tools',
      label: 'AI Tools',
      icon: Zap,
      color: 'red',
      description: 'AI assistant and automation'
    },
    {
      id: 'whiteboard',
      label: 'Whiteboard',
      icon: FileText,
      color: 'green',
      description: 'Interactive drawing and annotation'
    }
  ];

  // Drawing tools for whiteboard
  const drawingTools = [
    { id: 'pen', icon: MousePointer, label: 'Pen', cursor: 'crosshair' },
    { id: 'highlighter', icon: Minus, label: 'Highlighter', cursor: 'crosshair' },
    { id: 'eraser', icon: RotateCcw, label: 'Eraser', cursor: 'grab' },
    { id: 'rectangle', icon: Plus, label: 'Rectangle', cursor: 'crosshair' },
    { id: 'circle', icon: Plus, label: 'Circle', cursor: 'crosshair' },
    { id: 'text', icon: FileText, label: 'Text', cursor: 'text' },
    { id: 'select', icon: MousePointer, label: 'Select', cursor: 'default' }
  ];

  const colors = [
    '#000000', '#ffffff', '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];

  const backgroundColors = [
    { color: '#ffffff', label: 'White' },
    { color: '#f8fafc', label: 'Light Gray' },
    { color: '#1e293b', label: 'Dark' },
    { color: '#065f46', label: 'Green Board' },
    { color: '#1e40af', label: 'Blue Board' }
  ];

  // Unified canvas rendering
  const renderUnifiedCanvas = () => {
    switch (activeTab) {
      case 'smart-teaching':
        return renderSmartTeachingCanvas();
      case 'whiteboard':
        return renderWhiteboardCanvas();
      case 'media':
        return renderMediaHub();
      case 'interactive':
        return renderInteractiveTools();
      case 'assessment':
        return renderAssessmentPanel();
      case 'ai-tools':
        return renderAITools();
      default:
        return renderSmartTeachingCanvas();
    }
  };

  const renderSmartTeachingCanvas = () => {
    const renderLockKey = `render-${componentId}`;
    
    // Only log once per render cycle to reduce StrictMode noise
    if (!componentLocks.has(renderLockKey)) {
      console.log('🎯 [DEBUG] renderSmartTeachingCanvas called with state:', { loading, error, lessonData, generatedContent });
      componentLocks.add(renderLockKey);
      // Clear the lock after a short delay
      setTimeout(() => componentLocks.delete(renderLockKey), 100);
    }
    
    if (loading) {
      console.log('🎯 [DEBUG] Rendering loading state');
      return (
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Loading Lesson...</h3>
            <p className="text-gray-500">Preparing your AI-enhanced learning experience</p>
          </div>
        </div>
      );
    }

    if (error) {
      console.log('🎯 [DEBUG] Rendering error state:', error);
      return (
        <div className="flex items-center justify-center">
          <div className="text-center text-red-600">
            <Brain className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Lesson</h3>
            <p className="mb-4">{error}</p>
            <button 
              onClick={() => selectedLessonId && loadLessonData(selectedLessonId)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (lessonData) {
      console.log('🎯 [DEBUG] Rendering ProgressiveContentLoader with lessonData:', lessonData);
      return (
        <div className="h-full overflow-hidden">
          <ProgressiveContentLoader
            lessonData={lessonData}
            learningStyle={learningStyle}
            generatedContent={generatedContent}
            contentStatuses={contentStatuses}
            isGenerating={isGenerating}
            generationProgress={generationProgress}
            onGenerateContent={generateContent}
            onGenerateAllContent={generateAllContent}
          />
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Smart Teaching Canvas</h3>
          <p className="text-gray-500">Select a lesson from the sidebar to begin AI-enhanced learning</p>
        </div>
      </div>
    );
  };

  const renderWhiteboardCanvas = () => {
    const canvasWidth = Math.min(800, window.innerWidth - 40);
    const canvasHeight = Math.min(500, window.innerHeight - 200);
    
    return (
      <div className="relative w-full flex flex-col">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className={`border rounded-lg ${drawingTools.find(t => t.id === selectedTool)?.cursor === 'crosshair' ? 'cursor-crosshair' : 
            drawingTools.find(t => t.id === selectedTool)?.cursor === 'grab' ? 'cursor-grab' : 
            drawingTools.find(t => t.id === selectedTool)?.cursor === 'text' ? 'cursor-text' : 'cursor-default'}`}
          style={{ backgroundColor: canvasBackground }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        {showGrid && (
          <canvas
            width={canvasWidth}
            height={canvasHeight}
            className="absolute top-0 left-0 pointer-events-none"
            ref={(gridCanvas) => {
              if (gridCanvas) {
                const ctx = gridCanvas.getContext('2d');
                if (ctx) {
                  drawGrid(ctx, canvasWidth, canvasHeight);
                }
              }
            }}
          />
        )}
      </div>
    );
  };

  const renderMediaHub = () => {
    console.log('🎯 [DEBUG] renderMediaHub called with generatedContent:', generatedContent);
    // Check if we have video content available
    const hasVideoContent = generatedContent?.video;
    const videoStatus = contentStatuses?.video?.status;
    console.log('🎯 [DEBUG] hasVideoContent:', hasVideoContent, 'videoStatus:', videoStatus);
    
    if (hasVideoContent) {
      console.log('🎯 [DEBUG] Rendering video content:', hasVideoContent);
      return (
        <div className="w-full h-full bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Media Hub - Video Content</h3>
          <div className="h-full">
            <EnhancedVideoPlayer
              src={generatedContent.video.src}
              title={generatedContent.video.title}
              description={generatedContent.video.description}
              poster={generatedContent.video.poster}
              transcript={generatedContent.video.transcript}
              keyConcepts={generatedContent.video.keyConcepts}
              duration={generatedContent.video.duration}
              onProgress={(progress) => console.log('Video progress:', progress)}
              onComplete={() => console.log('Video completed')}
              onError={(error) => console.error('Video error:', error)}
              subject={lessonData?.subject?.name}
              topic={lessonData?.topic?.name}
              className="h-full"
            />
          </div>
        </div>
      );
    }
    
    // Show loading state when video content is being generated
    if (videoStatus === 'loading' || (lessonData && !hasVideoContent)) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Media Hub</h3>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-spin" />
              <h4 className="text-lg font-medium text-gray-600 mb-2">Generating Video Content</h4>
              <p className="text-sm text-gray-500">
                Creating personalized video content for this lesson...
              </p>
              {generationProgress !== null && (
                <div className="mt-4 w-64 mx-auto">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(generationProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="w-full h-full bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Media Hub</h3>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-600 mb-2">No Video Content Available</h4>
            <p className="text-sm text-gray-500">
              Select a lesson to view video content
            </p>
            <button
              onClick={() => setActiveTab('smart-teaching')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Smart Teaching
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderInteractiveTools = () => {
    console.log('🎯 [DEBUG] renderInteractiveTools called with generatedContent:', generatedContent);
    console.log('🎯 [DEBUG] renderInteractiveTools called with contentStatuses:', contentStatuses);
    
    // Check both generatedContent and contentStatuses for content
    const mathContent = generatedContent?.math || contentStatuses?.math?.content;
    const diagramContent = generatedContent?.diagram || contentStatuses?.diagram?.content;
    const interactiveContent = generatedContent?.interactive || contentStatuses?.interactive?.content;
    
    console.log('🎯 [DEBUG] Interactive content available:', { mathContent, diagramContent, interactiveContent });
    
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Interactive Tools</h3>
        
        {/* Math Content */}
        {mathContent && (
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
              <Calculator className="w-5 h-5 text-blue-500 mr-2" />
              Math Tools
            </h4>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <EnhancedMathRenderer
                content={mathContent}
                learningStyle={learningStyle}
                onProgress={(progress) => console.log('Math progress:', progress)}
              />
            </div>
          </div>
        )}
        
        {/* Diagram Content */}
        {diagramContent && (
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
              <Globe className="w-5 h-5 text-green-500 mr-2" />
              Diagrams & Visualizations
            </h4>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <EnhancedDiagramRenderer
                content={diagramContent}
                learningStyle={learningStyle}
                onProgress={(progress) => console.log('Diagram progress:', progress)}
              />
            </div>
          </div>
        )}
        
        {/* Interactive Content */}
        {interactiveContent && (
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
              <Target className="w-5 h-5 text-purple-500 mr-2" />
              Interactive Activities
            </h4>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <EnhancedInteractiveRenderer
                content={interactiveContent}
                learningStyle={learningStyle}
                onProgress={(progress) => console.log('Interactive progress:', progress)}
              />
            </div>
          </div>
        )}
        
        {/* Show loading state when content is being generated */}
        {!mathContent && !diagramContent && !interactiveContent && lessonData && (
          <div className="text-center py-8">
            <Loader2 className="w-16 h-16 text-purple-500 mx-auto mb-4 animate-spin" />
            <h4 className="text-lg font-medium text-gray-600 mb-2">Generating Interactive Content</h4>
            <p className="text-sm text-gray-500">
              Creating personalized interactive tools for this lesson...
            </p>
            {generationProgress !== null && (
              <div className="mt-4 w-64 mx-auto">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(generationProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Fallback when no lesson is selected */}
        {!mathContent && !diagramContent && !interactiveContent && !lessonData && (
          <div className="text-center py-8">
            <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-600 mb-2">Interactive Content</h4>
            <p className="text-sm text-gray-500">
              Select a lesson to view interactive content
            </p>
            <button
              onClick={() => setActiveTab('smart-teaching')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Smart Teaching
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderAssessmentPanel = () => {
    console.log('🎯 [DEBUG] renderAssessmentPanel called with generatedContent:', generatedContent);
    console.log('🎯 [DEBUG] renderAssessmentPanel called with contentStatuses:', contentStatuses);
    
    // Check both generatedContent and contentStatuses for content
    const assessmentContent = generatedContent?.assessment || contentStatuses?.assessment?.content;
    console.log('🎯 [DEBUG] Assessment content available:', assessmentContent);
    
    return (
      <div className="w-full h-full bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Assessment Center</h3>
        
        {/* Generated Assessment Content */}
        {assessmentContent && (
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
              <Award className="w-5 h-5 text-yellow-500 mr-2" />
              AI-Generated Assessment
            </h4>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <EnhancedAssessmentRenderer
                content={assessmentContent}
                learningStyle={learningStyle}
                onProgress={(progress) => console.log('Assessment progress:', progress)}
              />
            </div>
          </div>
        )}
        
        {/* Smart Assessment Interface */}
        {lessonData && currentSessionId && (
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
              <Target className="w-5 h-5 text-blue-500 mr-2" />
              Interactive Assessment
            </h4>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <SmartAssessmentInterface
                sessionId={currentSessionId}
                lessonId={lessonData.lesson.id}
                onAssessmentComplete={() => {}}
              />
            </div>
          </div>
        )}
        
        {/* Show loading state when content is being generated */}
        {!assessmentContent && lessonData && !currentSessionId && (
          <div className="text-center py-8">
            <Loader2 className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-spin" />
            <h4 className="text-lg font-medium text-gray-600 mb-2">Generating Assessment Content</h4>
            <p className="text-sm text-gray-500">
              Creating personalized assessment questions for this lesson...
            </p>
            {generationProgress !== null && (
              <div className="mt-4 w-64 mx-auto">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(generationProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Fallback when no lesson is selected */}
        {!assessmentContent && !lessonData && (
          <div className="text-center py-8">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-600 mb-2">Assessment Center</h4>
            <p className="text-sm text-gray-500">
              Select a lesson to view assessments
            </p>
            <button
              onClick={() => setActiveTab('smart-teaching')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Smart Teaching
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderAITools = () => (
    <div className="w-full h-full bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-3 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Assistant</h3>
      {mode === 'student' ? (
        <div className="space-y-4">
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2 sm:gap-0">
              <div className="flex items-center">
                <Brain className="w-5 h-5 text-red-500 mr-2" />
                <h4 className="font-medium">Personal AI Teacher</h4>
              </div>
              <button
                onClick={() => setShowAIAssistant(!showAIAssistant)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors w-full sm:w-auto"
              >
                {showAIAssistant ? 'Hide Chat' : 'Start Chat'}
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Ask questions, get explanations, and receive personalized help from your AI teacher.
            </p>
            {showAIAssistant && (
              <div className="border-t pt-3">
                <div className="h-32 overflow-y-auto mb-3 p-2 bg-gray-50 rounded">
                  {aiChatMessages.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center">Start a conversation with your AI teacher!</p>
                  ) : (
                    aiChatMessages.map((msg, idx) => (
                      <div key={idx} className={`mb-2 p-2 rounded ${msg.sender === 'ai' ? 'bg-blue-100 ml-4' : 'bg-green-100 mr-4'}`}>
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <input
                    type="text"
                    placeholder="Ask your AI teacher..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        if (input.value.trim()) {
                          setAiChatMessages(prev => [...prev, { sender: 'student', text: input.value }]);
                          // Simulate AI response
                          setTimeout(() => {
                            setAiChatMessages(prev => [...prev, { sender: 'ai', text: 'I understand your question. Let me help you with that!' }]);
                          }, 1000);
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto">
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center mb-2">
              <Zap className="w-5 h-5 text-purple-500 mr-2" />
              <h4 className="font-medium">Smart Learning</h4>
            </div>
            <p className="text-sm text-gray-600">AI adapts content to your learning style and pace.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <Brain className="w-5 h-5 text-red-500 mb-2" />
            <h4 className="font-medium">AI Assistant</h4>
            <p className="text-sm text-gray-600">Content generation</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <Zap className="w-5 h-5 text-purple-500 mb-2" />
            <h4 className="font-medium">Smart Features</h4>
            <p className="text-sm text-gray-600">Automation tools</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 h-full">
      <div className="mx-auto flex flex-col h-full w-full max-w-fit">
        {/* Unified Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 mb-2 sm:mb-4 p-3 sm:p-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {mode === 'student' ? 'Personal AI Teacher' : 'Unified Smart Teaching Interface'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  {lessonData ? `${lessonData.subject?.name} - ${lessonData.topic?.name}` : 
                   mode === 'student' ? 'Your Personal Learning Space' : 'AI-Enhanced Learning Platform'}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-4">
              {mode === 'student' ? (
                // Student-focused header
                <>
                  <div className="flex items-center justify-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium shadow-sm">
                    <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Progress: {personalProgress.lessonsCompleted}/{personalProgress.totalLessons}</span>
                    <span className="sm:hidden">{personalProgress.lessonsCompleted}/{personalProgress.totalLessons}</span>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-xs sm:text-sm font-medium shadow-sm">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Streak: {personalProgress.currentStreak} days</span>
                    <span className="sm:hidden">{personalProgress.currentStreak}d</span>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full text-xs sm:text-sm font-medium shadow-sm">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Time: {Math.floor(personalProgress.totalTimeSpent / 60)}h</span>
                    <span className="sm:hidden">{Math.floor(personalProgress.totalTimeSpent / 60)}h</span>
                  </div>
                  
                  <div className="flex flex-col items-center px-2 sm:px-3 py-2 bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 rounded-lg text-xs sm:text-sm font-medium shadow-sm min-w-fit">
                    <label className="text-xs font-medium mb-1 hidden sm:block">Learning style:</label>
                    <select
                      value={learningStyle}
                      onChange={(e) => setLearningStyle(e.target.value as any)}
                      className="bg-transparent border-none text-orange-800 font-medium text-xs focus:outline-none focus:ring-0 cursor-pointer text-center min-w-fit"
                    >
                      <option value="visual">Visual</option>
                      <option value="audio">Audio</option>
                      <option value="kinesthetic">Kinesthetic</option>
                      <option value="analytical">Analytical</option>
                    </select>
                  </div>
                </>
              ) : (
                // Teacher-focused header
                <>
                  <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-sm font-medium shadow-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live Session</span>
                    <span className="text-xs bg-white/50 px-2 py-1 rounded-full">32:15</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Learning style:</label>
                    <select
                      value={learningStyle}
                      onChange={(e) => setLearningStyle(e.target.value as any)}
                      className="border border-gray-200 rounded-md px-2 py-1 text-sm h-8 min-h-8 max-h-8"
                    >
                      <option value="visual">Visual</option>
                      <option value="audio">Audio</option>
                      <option value="kinesthetic">Kinesthetic</option>
                      <option value="analytical">Analytical</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className={`flex-1 flex ${mode === 'student' ? 'flex-col' : 'flex-col lg:flex-row'} gap-2 sm:gap-4 min-h-0`}>
          {/* Left Sidebar - Controls (Only for teacher mode) */}
          {mode === 'teacher' && (
            <div className="w-64 flex-shrink-0">
              {/* Teacher-focused sidebar */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 mb-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Session Controls
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`w-full p-3 rounded-xl flex items-center justify-center transition-all duration-200 ${
                          isMuted 
                            ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-700' 
                            : 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-700'
                        }`}
                      >
                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </button>
                      
                      <button
                        onClick={() => setIsVideoOn(!isVideoOn)}
                        className={`w-full p-3 rounded-xl flex items-center justify-center transition-all duration-200 ${
                          !isVideoOn 
                            ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-700' 
                            : 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-700'
                        }`}
                      >
                        {!isVideoOn ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                      </button>
                      
                      <button 
                        onClick={() => setIsRecording(!isRecording)}
                        className={`w-full p-3 rounded-xl flex items-center justify-center transition-all duration-200 ${
                          isRecording
                            ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-700'
                            : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700'
                        }`}
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Live Stats
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-blue-500 mr-2" />
                          <span className="text-sm text-gray-600">Duration</span>
                        </div>
                        <span className="text-sm font-semibold text-blue-600">32:15</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-purple-500 mr-2" />
                          <span className="text-sm text-gray-600">Students</span>
                        </div>
                        <span className="text-sm font-semibold text-purple-600">24</span>
                      </div>
                    </div>
                  </div>
            </div>
          )}

          {/* Main Teaching Area */}
          <div className="flex-1 min-h-0">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/30 transition-all duration-500 h-full flex flex-col">
              {/* Unified Tab Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white rounded-t-xl">
                <div className="flex flex-wrap gap-1 sm:space-x-1 sm:gap-0">
                  {unifiedTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as UnifiedTab)}
                      className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center space-x-1 sm:space-x-2 transition-all duration-300 text-xs sm:text-sm font-medium ${
                        activeTab === tab.id
                          ? `bg-gradient-to-r from-${tab.color}-100 to-${tab.color}-200 text-${tab.color}-700 shadow-lg transform scale-105`
                          : 'text-gray-600 hover:bg-white hover:text-gray-800 hover:shadow-md'
                      }`}
                      title={tab.description}
                    >
                      <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tool Panel (when whiteboard is active) */}
              {activeTab === 'whiteboard' && showToolPanel && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-2 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100 gap-2 sm:gap-0">
                  <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
                    {/* Drawing Tools */}
                    <div className="flex space-x-1">
                      {drawingTools.map((tool) => (
                        <button
                          key={tool.id}
                          onClick={() => setSelectedTool(tool.id)}
                          className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                            selectedTool === tool.id
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-110'
                              : 'text-gray-600 hover:bg-white hover:shadow-md hover:scale-105'
                          }`}
                          title={tool.label}
                        >
                          <tool.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      ))}
                    </div>

                    {/* Color Dropdown */}
                    <div className="relative dropdown-container">
                      <button
                        onClick={() => setShowColorDropdown(!showColorDropdown)}
                        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Select Color"
                      >
                        <div 
                          className="w-5 h-5 rounded border border-gray-300"
                          style={{ backgroundColor: selectedColor }}
                        />
                        <span className="text-sm text-gray-600">Color</span>
                        <div className="w-4 h-4 text-gray-400">▼</div>
                      </button>
                      
                      {showColorDropdown && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-2">
                          <div className="grid grid-cols-4 gap-2">
                            {colors.map((color) => (
                              <button
                                key={color}
                                onClick={() => {
                                  setSelectedColor(color);
                                  setShowColorDropdown(false);
                                }}
                                className={`w-8 h-8 rounded border-2 transition-all duration-200 hover:scale-110 ${
                                  selectedColor === color ? 'border-gray-600 shadow-lg' : 'border-gray-200 hover:border-gray-400'
                                }`}
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Brush Size */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-gray-600">Size:</span>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="w-16 accent-blue-500"
                      />
                      <span className="text-xs font-medium text-gray-600 w-4">{brushSize}</span>
                    </div>

                    {/* Background Dropdown */}
                    <div className="relative dropdown-container">
                      <button
                        onClick={() => setShowBackgroundDropdown(!showBackgroundDropdown)}
                        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Select Background"
                      >
                        <div 
                          className="w-5 h-5 rounded border border-gray-300"
                          style={{ backgroundColor: canvasBackground }}
                        />
                        <span className="text-sm text-gray-600">Background</span>
                        <div className="w-4 h-4 text-gray-400">▼</div>
                      </button>
                      
                      {showBackgroundDropdown && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-2">
                          <div className="space-y-2">
                            {backgroundColors.map((bg) => (
                              <button
                                key={bg.color}
                                onClick={() => {
                                  setCanvasBackground(bg.color);
                                  setShowBackgroundDropdown(false);
                                }}
                                className={`w-full flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-50 transition-colors ${
                                  canvasBackground === bg.color ? 'bg-blue-50' : ''
                                }`}
                              >
                                <div 
                                  className="w-4 h-4 rounded border border-gray-300"
                                  style={{ backgroundColor: bg.color }}
                                />
                                <span className="text-sm text-gray-600">{bg.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Grid Toggle */}
                    <button
                      onClick={() => setShowGrid(!showGrid)}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        showGrid ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title="Toggle Grid"
                    >
                      <div className="w-4 h-4 grid grid-cols-2 gap-px">
                        <div className="bg-current opacity-30"></div>
                        <div className="bg-current opacity-30"></div>
                        <div className="bg-current opacity-30"></div>
                        <div className="bg-current opacity-30"></div>
                      </div>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={undo}
                      disabled={historyStep <= 0}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        historyStep <= 0 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-600 hover:bg-yellow-50 hover:text-yellow-600'
                      }`}
                      title="Undo"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={redo}
                      disabled={historyStep >= canvasHistory.length - 1}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        historyStep >= canvasHistory.length - 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-yellow-50 hover:text-yellow-600'
                      }`}
                      title="Redo"
                    >
                      <RotateCcw className="w-4 h-4 transform scale-x-[-1]" />
                    </button>
                    
                    <div className="w-px h-6 bg-gray-300"></div>
                    
                    <button
                      onClick={clearCanvas}
                      className="px-3 py-1 text-sm bg-gradient-to-r from-red-100 to-red-200 text-red-700 hover:from-red-200 hover:to-red-300 rounded-lg transition-all duration-200 font-medium"
                    >
                      Clear
                    </button>
                    
                    <button
                      onClick={downloadCanvas}
                      className="p-2 bg-gradient-to-r from-green-100 to-green-200 text-green-700 hover:from-green-200 hover:to-green-300 rounded-lg transition-all duration-200"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    
                    <button className="p-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 hover:from-blue-200 hover:to-blue-300 rounded-lg transition-all duration-200">
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Content Area */}
              <div className="flex-1 p-2 sm:p-4 min-h-0">
                <div className="h-full rounded-lg">
                  {renderUnifiedCanvas()}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Student Panel (Teacher Mode Only) */}
          {showStudentPanel && mode === 'teacher' && (
            <div className="w-64 flex-shrink-0">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Students (24)
                  </h3>
                  <button
                    onClick={() => setShowStudentPanel(!showStudentPanel)}
                    className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="flex items-center space-x-2 p-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-lg transition-all duration-200">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                        {String.fromCharCode(65 + i)}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm text-gray-700 font-medium">Student {i + 1}</span>
                        <div className="text-xs text-gray-500">
                          {Math.random() > 0.7 ? '✋ Question' : Math.random() > 0.3 ? '👀 Viewing' : '💭 Thinking'}
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        Math.random() > 0.3 ? 'bg-green-400 animate-pulse' : 'bg-gray-300'
                      }`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Chat */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Live Chat
                </h3>
                <div className="space-y-2 h-40 overflow-y-auto mb-3">
                  <div className="text-xs p-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                    <span className="font-semibold text-blue-700">Student:</span>
                    <span className="text-blue-600"> Great explanation! 👍</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedSmartTeachingInterface;
