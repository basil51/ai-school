"use client";
import React, { useState, useRef, useEffect } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  Move, 
  Palette, 
  Type, 
  Square, 
  Circle, 
  Triangle, 
  Eraser, 
  Save, 
  Upload, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Users,
  MessageCircle,
  Settings,
  Camera,
  Mic,
  MicOff,
  VideoOff,
  Video,
  Share2,
  FileText,
  Image,
  Calculator,
  Globe,
  BookOpen,
  Lightbulb,
  Target,
  Award,
  Clock,
  BarChart3,
  X,
  Plus,
  Minus,
  RotateCcw,
  Download,
  Zap,
  Brain,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  MousePointer,
  Hand
} from 'lucide-react';

const AITeacher = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('whiteboard');
  const [selectedTool, setSelectedTool] = useState('pen');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [brushSize, setBrushSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showStudentPanel, setShowStudentPanel] = useState(true);
  const [showToolPanel, setShowToolPanel] = useState(true);
  const [lessonProgress, setLessonProgress] = useState(35);
  const [studentEngagement, setStudentEngagement] = useState(87);
  const [onlineStudents, setOnlineStudents] = useState(24);
  const [activeStudents, setActiveStudents] = useState(18);
  const [sessionTime, setSessionTime] = useState('32:15');
  const [canvasBackground, setCanvasBackground] = useState('#ffffff');
  const [showGrid, setShowGrid] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasHistory, setCanvasHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // Drawing tools configuration
  const tools = [
    { id: 'pen', icon: Type, label: 'Pen', cursor: 'crosshair' },
    { id: 'highlighter', icon: Minus, label: 'Highlighter', cursor: 'crosshair' },
    { id: 'eraser', icon: Eraser, label: 'Eraser', cursor: 'grab' },
    { id: 'rectangle', icon: Square, label: 'Rectangle', cursor: 'crosshair' },
    { id: 'circle', icon: Circle, label: 'Circle', cursor: 'crosshair' },
    { id: 'triangle', icon: Triangle, label: 'Triangle', cursor: 'crosshair' },
    { id: 'line', icon: Minus, label: 'Line', cursor: 'crosshair' },
    { id: 'arrow', icon: ChevronRight, label: 'Arrow', cursor: 'crosshair' },
    { id: 'text', icon: Type, label: 'Text', cursor: 'text' },
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

  const tabs = [
    { id: 'whiteboard', label: 'Whiteboard', icon: FileText, color: 'blue' },
    { id: 'media', label: 'Media Hub', icon: Image, color: 'green' },
    { id: 'interactive', label: 'Interactive', icon: Target, color: 'purple' },
    { id: 'assessment', label: 'Assessment', icon: Award, color: 'yellow' },
    { id: 'ai-tools', label: 'AI Tools', icon: Brain, color: 'red' }
  ];

  // Canvas operations
  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const newHistory = canvasHistory.slice(0, historyStep + 1);
      newHistory.push(canvas.toDataURL());
      setCanvasHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
    }
  };

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

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      setIsExpanded(true);
    }
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

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = canvasBackground;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveToHistory();
    }
  }, [canvasBackground]);

  // Draw grid
  const drawGrid = () => {
    if (!showGrid) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const gridSize = 20;
    
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  };

  const WhiteboardContent = () => {
    const canvasWidth = isFullscreen ? window.innerWidth - 100 : isExpanded ? 1000 : 400;
    const canvasHeight = isFullscreen ? window.innerHeight - 200 : isExpanded ? 600 : 300;
    
    return (
      <div className="relative w-full h-full flex flex-col">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className={`border rounded-lg ${tools.find(t => t.id === selectedTool)?.cursor === 'crosshair' ? 'cursor-crosshair' : 
            tools.find(t => t.id === selectedTool)?.cursor === 'grab' ? 'cursor-grab' : 
            tools.find(t => t.id === selectedTool)?.cursor === 'text' ? 'cursor-text' : 'cursor-default'}`}
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
                drawGrid();
              }
            }}
          />
        )}
      </div>
    );
  };

  const MediaContent = () => (
    <div className="w-full h-full bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6">
      <div className="grid grid-cols-2 gap-6 h-full">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Media Library</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <Image className="w-6 h-6 text-blue-500 mb-2" />
              <h4 className="font-medium text-sm">Images</h4>
              <p className="text-xs text-gray-600">Upload & annotate</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <Play className="w-6 h-6 text-green-500 mb-2" />
              <h4 className="font-medium text-sm">Videos</h4>
              <p className="text-xs text-gray-600">Educational content</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <Volume2 className="w-6 h-6 text-purple-500 mb-2" />
              <h4 className="font-medium text-sm">Audio</h4>
              <p className="text-xs text-gray-600">Voice & music</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <Globe className="w-6 h-6 text-red-500 mb-2" />
              <h4 className="font-medium text-sm">Web Links</h4>
              <p className="text-xs text-gray-600">Interactive resources</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h4 className="font-semibold mb-3">Recent Media</h4>
          <div className="space-y-2">
            <div className="flex items-center p-2 hover:bg-gray-50 rounded">
              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center mr-3">
                <Image className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Math_Diagram_1.png</p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center p-2 hover:bg-gray-50 rounded">
              <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center mr-3">
                <Play className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Lesson_Intro.mp4</p>
                <p className="text-xs text-gray-500">5 minutes ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const InteractiveContent = () => (
    <div className="w-full h-full bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6">
      <div className="grid grid-cols-3 gap-4 h-full">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center mb-3">
            <Calculator className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="font-semibold">Math Tools</h3>
          </div>
          <div className="space-y-2">
            <button className="w-full p-2 text-left text-sm hover:bg-blue-50 rounded transition-colors">
              📊 Graphing Calculator
            </button>
            <button className="w-full p-2 text-left text-sm hover:bg-blue-50 rounded transition-colors">
              📐 Geometry Tools
            </button>
            <button className="w-full p-2 text-left text-sm hover:bg-blue-50 rounded transition-colors">
              🧮 Formula Builder
            </button>
            <button className="w-full p-2 text-left text-sm hover:bg-blue-50 rounded transition-colors">
              📈 Statistics Tools
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center mb-3">
            <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
            <h3 className="font-semibold">Simulations</h3>
          </div>
          <div className="space-y-2">
            <button className="w-full p-2 text-left text-sm hover:bg-yellow-50 rounded transition-colors">
              🔬 Physics Lab
            </button>
            <button className="w-full p-2 text-left text-sm hover:bg-yellow-50 rounded transition-colors">
              ⚗️ Chemistry Set
            </button>
            <button className="w-full p-2 text-left text-sm hover:bg-yellow-50 rounded transition-colors">
              🧬 Biology Models
            </button>
            <button className="w-full p-2 text-left text-sm hover:bg-yellow-50 rounded transition-colors">
              🌍 Earth Science
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center mb-3">
            <Target className="w-5 h-5 text-green-500 mr-2" />
            <h3 className="font-semibold">Activities</h3>
          </div>
          <div className="space-y-2">
            <button className="w-full p-2 text-left text-sm hover:bg-green-50 rounded transition-colors">
              🎯 Quiz Builder
            </button>
            <button className="w-full p-2 text-left text-sm hover:bg-green-50 rounded transition-colors">
              🗺️ Mind Maps
            </button>
            <button className="w-full p-2 text-left text-sm hover:bg-green-50 rounded transition-colors">
              📊 Polls & Surveys
            </button>
            <button className="w-full p-2 text-left text-sm hover:bg-green-50 rounded transition-colors">
              🎮 Educational Games
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const AssessmentContent = () => (
    <div className="w-full h-full bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6">
      <div className="grid grid-cols-2 gap-6 h-full">
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Class Progress</h3>
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Lesson Completion</span>
                  <span className="font-medium">{lessonProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${lessonProgress}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Student Engagement</span>
                  <span className="font-medium">{studentEngagement}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${studentEngagement}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Live Analytics</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Students</span>
                <span className="font-medium text-green-600">{activeStudents}/{onlineStudents}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Score</span>
                <span className="font-medium text-blue-600">85%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Questions Asked</span>
                <span className="font-medium text-purple-600">12</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Quick Assessment</h3>
            <Award className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="space-y-3">
            <button className="w-full p-3 text-left bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-150 rounded-lg transition-all duration-200">
              <div className="font-medium text-blue-800">📝 Pop Quiz</div>
              <div className="text-sm text-blue-600 mt-1">Quick knowledge check</div>
            </button>
            <button className="w-full p-3 text-left bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-150 rounded-lg transition-all duration-200">
              <div className="font-medium text-green-800">🎫 Exit Ticket</div>
              <div className="text-sm text-green-600 mt-1">Lesson understanding</div>
            </button>
            <button className="w-full p-3 text-left bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-150 rounded-lg transition-all duration-200">
              <div className="font-medium text-purple-800">👥 Peer Review</div>
              <div className="text-sm text-purple-600 mt-1">Student collaboration</div>
            </button>
            <button className="w-full p-3 text-left bg-gradient-to-r from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-150 rounded-lg transition-all duration-200">
              <div className="font-medium text-yellow-800">🏆 Gamified Quiz</div>
              <div className="text-sm text-yellow-600 mt-1">Interactive competition</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const AIToolsContent = () => (
    <div className="w-full h-full bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-6">
      <div className="grid grid-cols-2 gap-6 h-full">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center mb-3">
            <Brain className="w-5 h-5 text-red-500 mr-2" />
            <h3 className="font-semibold">AI Assistant</h3>
          </div>
          <div className="space-y-3">
            <button className="w-full p-3 text-left bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
              <div className="font-medium text-red-800">🤖 Content Generator</div>
              <div className="text-sm text-red-600 mt-1">Auto-create lesson materials</div>
            </button>
            <button className="w-full p-3 text-left bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
              <div className="font-medium text-red-800">📚 Explanation Helper</div>
              <div className="text-sm text-red-600 mt-1">Simplify complex topics</div>
            </button>
            <button className="w-full p-3 text-left bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
              <div className="font-medium text-red-800">🎯 Personalization</div>
              <div className="text-sm text-red-600 mt-1">Adapt to student needs</div>
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center mb-3">
            <Zap className="w-5 h-5 text-purple-500 mr-2" />
            <h3 className="font-semibold">Smart Features</h3>
          </div>
          <div className="space-y-3">
            <button className="w-full p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <div className="font-medium text-purple-800">🔍 Auto-Transcription</div>
              <div className="text-sm text-purple-600 mt-1">Convert speech to text</div>
            </button>
            <button className="w-full p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <div className="font-medium text-purple-800">📝 Smart Notes</div>
              <div className="text-sm text-purple-600 mt-1">AI-generated summaries</div>
            </button>
            <button className="w-full p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <div className="font-medium text-purple-800">🎨 Style Suggestions</div>
              <div className="text-sm text-purple-600 mt-1">Improve visual design</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'whiteboard': return <WhiteboardContent />;
      case 'media': return <MediaContent />;
      case 'interactive': return <InteractiveContent />;
      case 'assessment': return <AssessmentContent />;
      case 'ai-tools': return <AIToolsContent />;
      default: return <WhiteboardContent />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 mb-4 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Teacher Studio Pro
                </h1>
                <p className="text-sm text-gray-600">Advanced Mathematics - Quadratic Equations</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-sm font-medium shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Session</span>
                <span className="text-xs bg-white/50 px-2 py-1 rounded-full">{sessionTime}</span>
              </div>
              
              {isRecording && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-600 rounded-full text-sm animate-pulse">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Recording</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-full text-sm">
                <Users className="w-4 h-4" />
                <span className="font-medium">{onlineStudents}</span>
                <span className="text-xs">students</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className={`grid ${isFullscreen ? 'grid-cols-1' : 'grid-cols-12'} gap-4`}>
          {/* Left Sidebar - Controls */}
          {!isFullscreen && (
            <div className="col-span-2">
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
                        ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 hover:from-red-200 hover:to-red-300' 
                        : 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-700 hover:from-green-200 hover:to-emerald-300'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  
                  <button
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    className={`w-full p-3 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      !isVideoOn 
                        ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 hover:from-red-200 hover:to-red-300' 
                        : 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-700 hover:from-green-200 hover:to-emerald-300'
                    }`}
                  >
                    {!isVideoOn ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>
                  
                  <button 
                    onClick={() => setIsRecording(!isRecording)}
                    className={`w-full p-3 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isRecording
                        ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 hover:from-red-200 hover:to-red-300'
                        : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 hover:from-blue-200 hover:to-blue-300'
                    }`}
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  
                  <button className="w-full p-3 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 hover:from-purple-200 hover:to-purple-300 rounded-xl flex items-center justify-center transition-all duration-200">
                    <Share2 className="w-5 h-5" />
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
                    <span className="text-sm font-semibold text-blue-600">{sessionTime}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Target className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm text-gray-600">Engagement</span>
                    </div>
                    <span className="text-sm font-semibold text-green-600">{studentEngagement}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 text-purple-500 mr-2" />
                      <span className="text-sm text-gray-600">Active</span>
                    </div>
                    <span className="text-sm font-semibold text-purple-600">{activeStudents}/{onlineStudents}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Teaching Area */}
          <div className={`${isFullscreen ? 'w-full h-screen' : 'col-span-8'}`}>
            <div 
              ref={containerRef}
              className={`bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/30 transition-all duration-500 ${
                isExpanded ? 'h-[85vh]' : 'h-[500px]'
              } ${isFullscreen ? 'h-full' : ''}`}
            >
              {/* Enhanced Tab Navigation */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white rounded-t-xl">
                <div className="flex space-x-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all duration-300 text-sm font-medium ${
                        activeTab === tab.id
                          ? `bg-gradient-to-r from-${tab.color}-100 to-${tab.color}-200 text-${tab.color}-700 shadow-lg transform scale-105`
                          : 'text-gray-600 hover:bg-white hover:text-gray-800 hover:shadow-md'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center space-x-2">
                  {showToolPanel && (
                    <button
                      onClick={() => setShowToolPanel(!showToolPanel)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                      title="Toggle Tools"
                    >
                      {showToolPanel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                  
                  <button
                    onClick={toggleExpand}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 transform hover:scale-110"
                    title="Expand/Collapse"
                  >
                    {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-200 transform hover:scale-110"
                    title="Fullscreen Mode"
                  >
                    <Move className="w-4 h-4" />
                  </button>
                  
                  {isFullscreen && (
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                      title="Exit Fullscreen"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Advanced Tool Panel for Whiteboard */}
              {activeTab === 'whiteboard' && showToolPanel && (
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100">
                  <div className="flex items-center space-x-6">
                    {/* Drawing Tools */}
                    <div className="flex space-x-1">
                      {tools.map((tool) => (
                        <button
                          key={tool.id}
                          onClick={() => setSelectedTool(tool.id)}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            selectedTool === tool.id
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-110'
                              : 'text-gray-600 hover:bg-white hover:shadow-md hover:scale-105'
                          }`}
                          title={tool.label}
                        >
                          <tool.icon className="w-4 h-4" />
                        </button>
                      ))}
                    </div>

                    {/* Color Palette */}
                    <div className="flex space-x-1">
                      {colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-7 h-7 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                            selectedColor === color ? 'border-gray-600 shadow-lg transform scale-110' : 'border-gray-200 hover:border-gray-400'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
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
                        className="w-20 accent-blue-500"
                      />
                      <span className="text-xs font-medium text-gray-600 w-6">{brushSize}</span>
                    </div>

                    {/* Background Options */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-gray-600">Background:</span>
                      <div className="flex space-x-1">
                        {backgroundColors.map((bg) => (
                          <button
                            key={bg.color}
                            onClick={() => setCanvasBackground(bg.color)}
                            className={`w-6 h-6 rounded border-2 ${
                              canvasBackground === bg.color ? 'border-gray-600' : 'border-gray-200'
                            }`}
                            style={{ backgroundColor: bg.color }}
                            title={bg.label}
                          />
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setShowGrid(!showGrid)}
                        className={`p-1 rounded ${showGrid ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
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
              <div className="p-4 h-full overflow-hidden">
                <div className="h-full rounded-lg">
                  {renderContent()}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Student Panel */}
          {!isFullscreen && showStudentPanel && (
            <div className="col-span-2">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Students ({onlineStudents})
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
                    <span className="font-semibold text-blue-700">Sarah M:</span>
                    <span className="text-blue-600"> Can you explain step 3 again? 🤔</span>
                  </div>
                  <div className="text-xs p-2 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                    <span className="font-semibold text-green-700">Mike J:</span>
                    <span className="text-green-600"> Great explanation! 👍</span>
                  </div>
                  <div className="text-xs p-2 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                    <span className="font-semibold text-purple-700">Emma L:</span>
                    <span className="text-purple-600"> I have the same question as Sarah</span>
                  </div>
                  <div className="text-xs p-2 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg">
                    <span className="font-semibold text-yellow-700">Alex T:</span>
                    <span className="text-yellow-600"> Can we see more examples? 📊</span>
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

        {/* Floating Action Button for Quick Actions */}
        {!isFullscreen && (
          <div className="fixed bottom-6 right-6 z-40">
            <div className="flex flex-col space-y-2">
              <button 
                onClick={() => setActiveTab('ai-tools')}
                className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center"
                title="AI Assistant"
              >
                <Brain className="w-6 h-6" />
              </button>
              
              <button 
                onClick={() => setActiveTab('assessment')}
                className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center"
                title="Quick Assessment"
              >
                <Award className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AITeacher;