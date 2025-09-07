"use client";
import React, { useState, useRef, useEffect } from 'react';
import { 
  Maximize2, Minimize2, Split, RotateCcw, 
  Volume2, VolumeX, Play, Pause, Settings,
  Move, Resize, Eye, EyeOff, Download, Share2,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Palette, Type, Image, Video, Code, Calculator,
  Brain, Sparkles, BookOpen, Lightbulb
} from 'lucide-react';

interface SmartLearningCanvasProps {
  content: any;
  contentType: 'text' | 'math' | 'diagram' | 'simulation' | 'video' | 'interactive';
  onContentChange?: (content: any) => void;
  learningStyle?: 'visual' | 'audio' | 'kinesthetic' | 'analytical';
}

type CanvasState = 'compact' | 'expanded' | 'fullscreen' | 'split';

const SmartLearningCanvas: React.FC<SmartLearningCanvasProps> = ({
  content,
  contentType,
  onContentChange,
  learningStyle = 'visual'
}) => {
  const [canvasState, setCanvasState] = useState<CanvasState>('compact');
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showControls, setShowControls] = useState(true);
  const [isFloating, setIsFloating] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  // Auto-adjust canvas state based on content type
  useEffect(() => {
    const optimalState = getOptimalCanvasState(contentType);
    if (canvasState === 'compact' && optimalState !== 'compact') {
      setCanvasState(optimalState);
    }
  }, [contentType]);

  const getOptimalCanvasState = (type: string): CanvasState => {
    switch (type) {
      case 'video':
      case 'simulation':
        return 'fullscreen';
      case 'diagram':
      case 'interactive':
        return 'expanded';
      default:
        return 'compact';
    }
  };

  const getCanvasClasses = () => {
    const baseClasses = "relative bg-white rounded-xl shadow-2xl border border-gray-200 transition-all duration-500 ease-in-out";
    
    switch (canvasState) {
      case 'compact':
        return `${baseClasses} w-full h-96`;
      case 'expanded':
        return `${baseClasses} w-full h-[600px]`;
      case 'fullscreen':
        return `${baseClasses} fixed inset-4 z-50 w-auto h-auto`;
      case 'split':
        return `${baseClasses} w-1/2 h-[500px]`;
      default:
        return baseClasses;
    }
  };

  const getContentClasses = () => {
    const baseClasses = "w-full h-full overflow-auto";
    
    switch (canvasState) {
      case 'fullscreen':
        return `${baseClasses} p-8`;
      case 'expanded':
        return `${baseClasses} p-6`;
      default:
        return `${baseClasses} p-4`;
    }
  };

  const handleStateChange = (newState: CanvasState) => {
    setCanvasState(newState);
    
    // Auto-hide controls in fullscreen after 3 seconds
    if (newState === 'fullscreen') {
      setTimeout(() => setShowControls(false), 3000);
    } else {
      setShowControls(true);
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const newZoom = direction === 'in' 
      ? Math.min(zoomLevel + 25, 200)
      : Math.max(zoomLevel - 25, 50);
    setZoomLevel(newZoom);
  };

  const renderContent = () => {
    switch (contentType) {
      case 'math':
        return (
          <div className="text-center space-y-4">
            <div className="text-4xl font-mono bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {content.equation || 'x = (-b ± √(b² - 4ac)) / 2a'}
            </div>
            {content.explanation && (
              <p className="text-gray-700 text-lg leading-relaxed">
                {content.explanation}
              </p>
            )}
            {content.graph && (
              <div className="mt-6">
                <svg className="w-full h-64 mx-auto">
                  <path d="M 50 150 Q 150 50 250 150" stroke="url(#gradient)" strokeWidth="3" fill="none"/>
                  <defs>
                    <linearGradient id="gradient">
                      <stop offset="0%" stopColor="#8B5CF6"/>
                      <stop offset="100%" stopColor="#3B82F6"/>
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="150" r="5" fill="#8B5CF6"/>
                  <circle cx="150" cy="50" r="5" fill="#3B82F6"/>
                  <circle cx="250" cy="150" r="5" fill="#8B5CF6"/>
                </svg>
              </div>
            )}
          </div>
        );

      case 'diagram':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">{content.title}</h3>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
              <div className="text-center">
                <div className="text-2xl mb-4">📊</div>
                <p className="text-gray-700">{content.description}</p>
              </div>
            </div>
          </div>
        );

      case 'simulation':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">{content.title}</h3>
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 min-h-[300px] flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">🎮</div>
                <p className="text-gray-700 mb-4">Interactive Simulation</p>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Start Simulation
                </button>
              </div>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">{content.title}</h3>
            <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-4xl mb-4">🎥</div>
                <p className="mb-4">Video Content</p>
                <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 mx-auto">
                  <Play className="w-4 h-4" />
                  Play Video
                </button>
              </div>
            </div>
          </div>
        );

      case 'interactive':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">{content.title}</h3>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 min-h-[300px]">
              <div className="text-center">
                <div className="text-4xl mb-4">✨</div>
                <p className="text-gray-700 mb-4">Interactive Learning Experience</p>
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <button className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    <Code className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <span className="text-sm">Code Editor</span>
                  </button>
                  <button className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    <Calculator className="w-6 h-6 mx-auto mb-2 text-green-600" />
                    <span className="text-sm">Calculator</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">{content.title}</h3>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed text-lg">
                {content.text || 'Welcome to your AI Teacher! This is where your personalized learning content will appear.'}
              </p>
            </div>
          </div>
        );
    }
  };

  const renderToolbar = () => {
    if (!showControls) return null;

    return (
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {/* Content Type Indicators */}
        <div className="flex gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1">
          <button className={`p-2 rounded ${contentType === 'math' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}>
            <Calculator className="w-4 h-4" />
          </button>
          <button className={`p-2 rounded ${contentType === 'diagram' ? 'bg-green-100 text-green-600' : 'text-gray-500'}`}>
            <Image className="w-4 h-4" />
          </button>
          <button className={`p-2 rounded ${contentType === 'video' ? 'bg-red-100 text-red-600' : 'text-gray-500'}`}>
            <Video className="w-4 h-4" />
          </button>
          <button className={`p-2 rounded ${contentType === 'interactive' ? 'bg-purple-100 text-purple-600' : 'text-gray-500'}`}>
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* Canvas Controls */}
        <div className="flex gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1">
          <button 
            onClick={() => handleStateChange('compact')}
            className={`p-2 rounded ${canvasState === 'compact' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            title="Compact View"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleStateChange('expanded')}
            className={`p-2 rounded ${canvasState === 'expanded' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            title="Expanded View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleStateChange('fullscreen')}
            className={`p-2 rounded ${canvasState === 'fullscreen' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleStateChange('split')}
            className={`p-2 rounded ${canvasState === 'split' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            title="Split View"
          >
            <Split className="w-4 h-4" />
          </button>
        </div>

        {/* Audio Controls */}
        <div className="flex gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1">
          <button 
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 rounded ${audioEnabled ? 'bg-green-100 text-green-600' : 'text-gray-500'}`}
            title={audioEnabled ? 'Mute Audio' : 'Enable Audio'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1">
          <button 
            onClick={() => handleZoom('out')}
            className="p-2 rounded hover:bg-gray-50"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-2 py-2 text-xs text-gray-600">{zoomLevel}%</span>
          <button 
            onClick={() => handleZoom('in')}
            className="p-2 rounded hover:bg-gray-50"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderLearningStyleIndicator = () => {
    if (!showControls) return null;

    return (
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-gray-700 capitalize">
            {learningStyle} Learning
          </span>
          <Sparkles className="w-3 h-3 text-yellow-500" />
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={canvasRef}
      className={getCanvasClasses()}
      style={{ 
        transform: `scale(${zoomLevel / 100})`,
        transformOrigin: 'center center'
      }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        if (canvasState !== 'fullscreen') {
          setTimeout(() => setShowControls(false), 2000);
        }
      }}
    >
      {/* Learning Style Indicator */}
      {renderLearningStyleIndicator()}
      
      {/* Toolbar */}
      {renderToolbar()}
      
      {/* Content Area */}
      <div className={getContentClasses()}>
        {renderContent()}
      </div>
      
      {/* Floating Action Button for Fullscreen */}
      {canvasState !== 'fullscreen' && (
        <button
          onClick={() => handleStateChange('fullscreen')}
          className="absolute bottom-4 right-4 p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          title="Enter Fullscreen Mode"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      )}
      
      {/* Exit Fullscreen Button */}
      {canvasState === 'fullscreen' && (
        <button
          onClick={() => handleStateChange('expanded')}
          className="absolute top-4 left-4 p-3 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          title="Exit Fullscreen"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default SmartLearningCanvas;
