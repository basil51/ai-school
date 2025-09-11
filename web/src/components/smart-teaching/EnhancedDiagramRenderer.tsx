"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Network, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Eye,
  Lightbulb,
  Target,
  CheckCircle,
  ArrowRight,
  Maximize2,
  RotateCcw
} from 'lucide-react';

interface DiagramContent {
  title: string;
  chart: string;
  theme: string;
  explanation: string;
  keyPoints: string[];
  narration: string;
}

interface EnhancedDiagramRendererProps {
  content: DiagramContent;
  learningStyle: 'visual' | 'audio' | 'kinesthetic' | 'analytical';
  onProgress?: (progress: number) => void;
}

export default function EnhancedDiagramRenderer({ 
  content, 
  learningStyle,
  onProgress 
}: EnhancedDiagramRendererProps) {
  const [currentView, setCurrentView] = useState<'overview' | 'explanation' | 'keypoints'>('overview');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [completedViews, setCompletedViews] = useState<Set<string>>(new Set());

  const views = [
    { id: 'overview', title: 'Diagram Overview', icon: Eye },
    { id: 'explanation', title: 'Detailed Explanation', icon: Lightbulb },
    { id: 'keypoints', title: 'Key Points', icon: Target }
  ];

  useEffect(() => {
    if (onProgress) {
      onProgress((completedViews.size / views.length) * 100);
    }
  }, [completedViews, views.length, onProgress]);

  const handleViewComplete = (viewId: string) => {
    setCompletedViews(prev => new Set([...prev, viewId]));
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (!audioEnabled) {
      const utterance = new SpeechSynthesisUtterance(content.narration);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    } else {
      speechSynthesis.cancel();
    }
  };

  const renderMermaidDiagram = (chart: string, theme: string) => {
    // In a real implementation, this would render the actual Mermaid diagram
    // For now, we'll show a placeholder with the chart syntax
    return (
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Mermaid Diagram</h3>
          <Badge variant="outline" className="mb-4">
            Theme: {theme}
          </Badge>
        </div>
        
        <div className="bg-gray-50 p-4 rounded border mb-4">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
            {chart}
          </pre>
        </div>
        
        <div className="bg-blue-50 p-4 rounded border">
          <p className="text-sm text-blue-800 text-center">
            📊 Interactive Mermaid diagram would render here
          </p>
          <p className="text-xs text-blue-600 text-center mt-1">
            The diagram would be interactive and responsive
          </p>
        </div>
      </div>
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{content.title}</h2>
        <p className="text-gray-600">Visual representation of concepts and relationships</p>
      </div>
      
      {renderMermaidDiagram(content.chart, content.theme)}
      
      <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
        <h4 className="font-semibold text-green-900 mb-2 flex items-center">
          <Eye className="w-4 h-4 mr-2" />
          Visual Learning
        </h4>
        <p className="text-green-800">
          This diagram helps you visualize the relationships and flow between different concepts. 
          Take time to observe the connections and structure.
        </p>
      </div>
    </div>
  );

  const renderExplanation = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-400">
        <h3 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
          <Lightbulb className="w-5 h-5 mr-2" />
          Detailed Explanation
        </h3>
        <div className="prose prose-blue max-w-none">
          <p className="text-blue-800 leading-relaxed text-lg">
            {content.explanation}
          </p>
        </div>
      </div>
      
      <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
        <h4 className="font-semibold text-yellow-900 mb-2">
          💡 Understanding Tip
        </h4>
        <p className="text-yellow-800">
          Read through the explanation while looking at the diagram above. 
          This combination of visual and textual information will help you understand the concepts better.
        </p>
      </div>
    </div>
  );

  const renderKeyPoints = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-400">
        <h3 className="text-xl font-semibold text-purple-900 mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Key Points to Remember
        </h3>
        <div className="space-y-3">
          {content.keyPoints.map((point, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                {index + 1}
              </div>
              <p className="text-purple-800 leading-relaxed">{point}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">
          🎯 Learning Check
        </h4>
        <p className="text-gray-700">
          Can you explain each key point in your own words? Try to connect them to the visual diagram.
        </p>
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'overview':
        return renderOverview();
      case 'explanation':
        return renderExplanation();
      case 'keypoints':
        return renderKeyPoints();
      default:
        return renderOverview();
    }
  };

  return (
    <div className={`h-full flex flex-col bg-white ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Network className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-800">Visual Diagram</h2>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {learningStyle} learning
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAudio}
              className={audioEnabled ? 'bg-green-50 border-green-200' : ''}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        {/* Progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progress: {Math.round((completedViews.size / views.length) * 100)}%</span>
            <span>View: {views.find(v => v.id === currentView)?.title}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedViews.size / views.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* View Navigation */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {views.map((view) => {
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => {
                    setCurrentView(view.id as any);
                    handleViewComplete(view.id);
                  }}
                  className={`px-3 py-2 rounded-md text-sm transition-colors flex items-center space-x-2 ${
                    currentView === view.id
                      ? 'bg-green-600 text-white'
                      : completedViews.has(view.id)
                      ? 'bg-green-100 text-green-800'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{view.title}</span>
                  {completedViews.has(view.id) && <CheckCircle className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentView('overview')}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {renderCurrentView()}
        </div>
      </div>

      {/* Learning Style Indicators */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
          <span className="flex items-center">
            <Eye className="w-4 h-4 mr-1" />
            Visual diagrams
          </span>
          <span className="flex items-center">
            <Lightbulb className="w-4 h-4 mr-1" />
            Detailed explanations
          </span>
          <span className="flex items-center">
            <Target className="w-4 h-4 mr-1" />
            Key points
          </span>
          <span className="flex items-center">
            <Network className="w-4 h-4 mr-1" />
            Interactive exploration
          </span>
        </div>
      </div>
    </div>
  );
}
