"use client";
import React, { useState, useRef, useEffect } from 'react';
import { 
  Maximize2, Minimize2, Split, Volume2, VolumeX, ZoomIn,
  ZoomOut,Image, Video, Code, Calculator, Brain, Sparkles
} from 'lucide-react';
import MathRenderer from './multimodal/MathRenderer';
import MermaidDiagram from './multimodal/MermaidDiagram';
import AudioNarrator from './multimodal/AudioNarrator';
import ProjectileSimulator from './multimodal/ProjectileSimulator';
import CodePlayground from './multimodal/CodePlayground';
//import VideoPlayer from './multimodal/VideoPlayer';
import EnhancedVideoPlayer from './smart-teaching/EnhancedVideoPlayer';
import InteractiveGraph from './multimodal/InteractiveGraph';
import ThreeJSVisualizer from './multimodal/ThreeJSVisualizer';
import BabylonJSVisualizer from './multimodal/BabylonJSVisualizer';
import AdvancedD3Visualizer from './multimodal/AdvancedD3Visualizer';
import TextFormatter from './smart-teaching/TextFormatter';

interface SmartLearningCanvasProps {
  content: any;
  contentType: 'text' | 'math' | 'diagram' | 'simulation' | 'video' | 'interactive' | '3d' | 'advanced-3d' | 'd3-advanced' | '3d_model' | 'particle_effects';
  onContentChange?: (content: any) => void;
  learningStyle?: 'visual' | 'audio' | 'kinesthetic' | 'analytical';
}

type CanvasState = 'compact' | 'expanded' | 'fullscreen' | 'split';

const SmartLearningCanvas: React.FC<SmartLearningCanvasProps> = ({
  content,
  contentType,
  //onContentChange,
  learningStyle = 'visual'
}) => {
  const [canvasState, setCanvasState] = useState<CanvasState>('compact');
  //const [isDragging, setIsDragging] = useState(false);
  //const [isResizing, setIsResizing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showControls, setShowControls] = useState(true);
  //const [isFloating, setIsFloating] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  //const dragRef = useRef<HTMLDivElement>(null);

  // Auto-adjust canvas state based on content type
  useEffect(() => {
    const optimalState = getOptimalCanvasState(contentType);
    if (canvasState === 'compact' && optimalState !== 'compact') {
      setCanvasState(optimalState);
    }
  }, [contentType, canvasState]);

  const getOptimalCanvasState = (type: string): CanvasState => {
    switch (type) {
      case 'video':
      case 'simulation':
      case '3d':
      case 'advanced-3d':
        return 'fullscreen';
      case 'diagram':
      case 'interactive':
      case 'd3-advanced':
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
          <div className="space-y-6">
            <div className="text-center">
              <MathRenderer expression={content.equation || String('x=\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}')}/>
            </div>
            {content.explanation && (
              <p className="text-gray-700 text-lg leading-relaxed text-center">
                {content.explanation}
              </p>
            )}
            {(content.graphExpression || content.points) && (
              <div className="mt-2 w-full">
                <InteractiveGraph
                  graphExpression={content.graphExpression}
                  points={content.points}
                  height={canvasState === 'fullscreen' ? 600 : 400}
                />
              </div>
            )}
            {audioEnabled && content.narration && (
              <div className="flex justify-center">
                <AudioNarrator text={content.narration} />
              </div>
            )}
          </div>
        );

      case 'diagram':
        return (
          <div className="space-y-4">
            {content.title && <h3 className="text-xl font-semibold text-gray-800">{content.title}</h3>}
            {content.chart ? (
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <MermaidDiagram chart={content.chart} theme={content.theme || 'neutral'} />
              </div>
            ) : (
              <p className="text-gray-700">{content.description || 'Diagram unavailable.'}</p>
            )}
            {audioEnabled && content.narration && (
              <AudioNarrator text={content.narration} />
            )}
          </div>
        );

      case 'simulation':
        return (
          <div className="space-y-4">
            {content.title && <h3 className="text-xl font-semibold text-gray-800">{content.title}</h3>}
            <ProjectileSimulator
              g={content.g}
              initialSpeed={content.initialSpeed}
              angleDeg={content.angleDeg}
            />
            {audioEnabled && content.narration && (
              <AudioNarrator text={content.narration} />
            )}
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4">
            {content.title && <h3 className="text-xl font-semibold text-gray-800">{content.title}</h3>}
            {content.src ? (
              <EnhancedVideoPlayer
                src={content.src}
                title={content.title}
                description={content.description}
                captions={content.captions}
                poster={content.poster}
                transcript={content.transcript}
                keyConcepts={content.keyConcepts}
                duration={content.duration}
                subject={content.subject}
                topic={content.topic}
                onProgress={(progress) => console.log('Video progress:', progress)}
                onComplete={() => console.log('Video completed')}
                onError={(error) => console.error('Video error:', error)}
              />
            ) : (
              <div className="w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center text-white p-6">
                  <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Video Not Available</h3>
                  <p className="text-gray-300">No video source provided for this content.</p>
                </div>
              </div>
            )}
            {audioEnabled && content.narration && (
              <AudioNarrator text={content.narration} />
            )}
          </div>
        );

      case 'interactive':
        return (
          <div className="space-y-6">
            {content.title && <h3 className="text-xl font-semibold text-gray-800">{content.title}</h3>}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Code Playground</h4>
                <CodePlayground initialCode={content.initialCode} />
              </div>
              <div className="w-full">
                <h4 className="font-medium text-gray-800 mb-2">Visualization</h4>
                <InteractiveGraph 
                  graphExpression={content.graphExpression} 
                  points={content.points} 
                  height={400}
                />
              </div>
            </div>
            {audioEnabled && content.narration && (
              <AudioNarrator text={content.narration} />
            )}
          </div>
        );

      case '3d':
        return (
          <div className="space-y-4">
            {content.title && <h3 className="text-xl font-semibold text-gray-800">{content.title}</h3>}
            <ThreeJSVisualizer 
              type={content.visualizationType || 'geometry'}
              config={content.config}
              width={canvasState === 'fullscreen' ? 800 : 600}
              height={canvasState === 'fullscreen' ? 600 : 400}
            />
            {audioEnabled && content.narration && (
              <AudioNarrator text={content.narration} />
            )}
          </div>
        );

      case 'advanced-3d':
        return (
          <div className="space-y-4">
            {content.title && <h3 className="text-xl font-semibold text-gray-800">{content.title}</h3>}
            <BabylonJSVisualizer 
              type={content.visualizationType || 'advanced-3d'}
              config={content.config}
              width={canvasState === 'fullscreen' ? 800 : 600}
              height={canvasState === 'fullscreen' ? 600 : 400}
            />
            {audioEnabled && content.narration && (
              <AudioNarrator text={content.narration} />
            )}
          </div>
        );

      case 'd3-advanced':
        return (
          <div className="space-y-4">
            {content.title && <h3 className="text-xl font-semibold text-gray-800">{content.title}</h3>}
            <AdvancedD3Visualizer 
              type={content.visualizationType || 'network'}
              config={content.config}
              width={canvasState === 'fullscreen' ? 800 : 600}
              height={canvasState === 'fullscreen' ? 600 : 400}
            />
            {audioEnabled && content.narration && (
              <AudioNarrator text={content.narration} />
            )}
          </div>
        );

      case '3d_model':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">{content.title || '3D Model'}</h3>
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">3D Model visualization would be rendered here</p>
              <p className="text-sm text-gray-500">{content.description || 'Interactive 3D model for enhanced learning'}</p>
            </div>
            {audioEnabled && content.narration && (
              <AudioNarrator text={content.narration} />
            )}
          </div>
        );

      case 'particle_effects':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">{content.title || 'Particle Effects'}</h3>
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">Particle effects visualization would be rendered here</p>
              <p className="text-sm text-gray-500">{content.description || 'Dynamic particle effects for engaging learning'}</p>
            </div>
            {audioEnabled && content.narration && (
              <AudioNarrator text={content.narration} />
            )}
          </div>
        );

      case 'text':
        return (
          <TextFormatter
            content={content}
            learningStyle={learningStyle}
            onProgress={(progress) => console.log('Reading progress:', progress)}
            onBookmark={(section) => console.log('Bookmarked section:', section)}
            onHighlight={(text) => console.log('Highlighted text:', text)}
          />
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
            {audioEnabled && content.narration && (
              <div className="pt-2">
                <AudioNarrator text={content.narration} />
              </div>
            )}
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
            <Image className="w-4 h-4" aria-label="Image icon" />
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
