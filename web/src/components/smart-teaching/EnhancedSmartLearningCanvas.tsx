"use client";
import React, { useState, useEffect, useMemo } from 'react';
import SmartLearningCanvas from '@/components/SmartLearningCanvas';
import EnhancedMathRenderer from './EnhancedMathRenderer';
import EnhancedDiagramRenderer from './EnhancedDiagramRenderer';
import EnhancedSimulationRenderer from './EnhancedSimulationRenderer';
import EnhancedInteractiveRenderer from './EnhancedInteractiveRenderer';
import { 
  Brain, 
  Sparkles, 
  Loader2, 
  RefreshCw, 
  Settings, 
  Zap,
  BookOpen,
  Target,
  Clock,
  TrendingUp
} from 'lucide-react';

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

interface GeneratedContent {
  baseContent: {
    title: string;
    text: string;
    objectives: string[];
    keyConcepts: string[];
    summary: string;
  };
  math?: any;
  diagram?: any;
  simulation?: any;
  video?: any;
  interactive?: any;
  threeD?: any;
  assessment?: any;
  metadata: {
    difficulty: string;
    estimatedTime: number;
    learningStyle: string;
    subject: string;
    topic: string;
    generatedAt: string;
    version: string;
  };
}

interface EnhancedSmartLearningCanvasProps {
  lessonData: LessonData;
  learningStyle: 'visual' | 'audio' | 'kinesthetic' | 'analytical';
  onContentGenerated?: (content: GeneratedContent) => void;
}

export default function EnhancedSmartLearningCanvas({ 
  lessonData, 
  learningStyle,
  onContentGenerated 
}: EnhancedSmartLearningCanvasProps) {
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentContentType, setCurrentContentType] = useState<'text' | 'math' | 'diagram' | 'simulation' | 'video' | 'interactive' | '3d' | 'advanced-3d' | 'd3-advanced'>('text');
  const [availableContentTypes, setAvailableContentTypes] = useState<string[]>(['text']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  useEffect(() => {
    if (lessonData) {
      generateSmartContent();
    }
  }, [lessonData, learningStyle]);

  const generateSmartContent = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsGenerating(true);
      setGenerationProgress(0);

      // Generate comprehensive content
      const response = await fetch('/api/smart-teaching/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId: lessonData.lesson.id,
          contentType: 'full',
          learningStyle: learningStyle,
          forceRegenerate: false
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate smart content');
      }

      const data = await response.json();
      setGeneratedContent(data.data);
      
      // Determine available content types
      const availableTypes = ['text'];
      if (data.data.math) availableTypes.push('math');
      if (data.data.diagram) availableTypes.push('diagram');
      if (data.data.simulation) availableTypes.push('simulation');
      if (data.data.video) availableTypes.push('video');
      if (data.data.interactive) availableTypes.push('interactive');
      if (data.data.threeD) availableTypes.push('3d', 'advanced-3d');
      
      setAvailableContentTypes(availableTypes);
      
      // Set initial content type based on learning style
      const initialType = getInitialContentType(learningStyle, availableTypes);
      setCurrentContentType(initialType);

      if (onContentGenerated) {
        onContentGenerated(data.data);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const getInitialContentType = (style: string, available: string[]): any => {
    switch (style) {
      case 'visual':
        if (available.includes('diagram')) return 'diagram';
        if (available.includes('3d')) return '3d';
        if (available.includes('math')) return 'math';
        break;
      case 'kinesthetic':
        if (available.includes('interactive')) return 'interactive';
        if (available.includes('simulation')) return 'simulation';
        break;
      case 'analytical':
        if (available.includes('math')) return 'math';
        if (available.includes('interactive')) return 'interactive';
        break;
      case 'audio':
        return 'text'; // Text with narration
    }
    return 'text';
  };

  const regenerateContent = async (contentType: string) => {
    try {
      setIsGenerating(true);
      setGenerationProgress(0);

      const response = await fetch('/api/smart-teaching/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId: lessonData.lesson.id,
          contentType: contentType,
          learningStyle: learningStyle,
          forceRegenerate: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate content');
      }

      const data = await response.json();
      
      // Update the specific content type
      if (generatedContent) {
        const updatedContent = {
          ...generatedContent,
          [contentType]: data.data
        };
        setGeneratedContent(updatedContent);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const content = useMemo(() => {
    if (!generatedContent) {
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

    // Map generated content to SmartLearningCanvas format
    switch (currentContentType) {
      case 'math':
        return generatedContent.math ? {
          equation: generatedContent.math.equation,
          explanation: generatedContent.math.explanation,
          graphExpression: generatedContent.math.graphExpression,
          graphTitle: generatedContent.math.graphTitle,
          examples: generatedContent.math.examples,
          narration: generatedContent.math.narration
        } : {
          title: generatedContent.baseContent.title,
          text: generatedContent.baseContent.text,
          narration: `Let's explore the mathematical concepts in ${generatedContent.baseContent.title}.`
        };

      case 'diagram':
        return generatedContent.diagram ? {
          title: generatedContent.diagram.title,
          chart: generatedContent.diagram.chart,
          theme: generatedContent.diagram.theme,
          explanation: generatedContent.diagram.explanation,
          keyPoints: generatedContent.diagram.keyPoints,
          narration: generatedContent.diagram.narration
        } : {
          title: generatedContent.baseContent.title,
          text: generatedContent.baseContent.text,
          narration: `Let's visualize the concepts in ${generatedContent.baseContent.title}.`
        };

      case 'simulation':
        return generatedContent.simulation ? {
          title: generatedContent.simulation.title,
          type: generatedContent.simulation.type,
          parameters: generatedContent.simulation.parameters,
          instructions: generatedContent.simulation.instructions,
          learningObjectives: generatedContent.simulation.learningObjectives,
          narration: generatedContent.simulation.narration
        } : {
          title: generatedContent.baseContent.title,
          text: generatedContent.baseContent.text,
          narration: `Let's explore this concept through simulation.`
        };

      case 'video':
        return generatedContent.video ? {
          title: generatedContent.video.title,
          description: generatedContent.video.description,
          keyConcepts: generatedContent.video.keyConcepts,
          duration: generatedContent.video.duration,
          narration: generatedContent.video.narration,
          transcript: generatedContent.video.transcript
        } : {
          title: generatedContent.baseContent.title,
          text: generatedContent.baseContent.text,
          narration: `Let's watch a video about ${generatedContent.baseContent.title}.`
        };

      case 'interactive':
        return generatedContent.interactive ? {
          title: generatedContent.interactive.title,
          type: generatedContent.interactive.type,
          instructions: generatedContent.interactive.instructions,
          initialCode: generatedContent.interactive.initialCode,
          questions: generatedContent.interactive.questions,
          narration: generatedContent.interactive.narration
        } : {
          title: generatedContent.baseContent.title,
          text: generatedContent.baseContent.text,
          narration: `Let's interact with this content to learn better.`
        };

      case '3d':
      case 'advanced-3d':
        return generatedContent.threeD ? {
          title: generatedContent.threeD.title,
          visualizationType: generatedContent.threeD.visualizationType,
          config: generatedContent.threeD.config,
          description: generatedContent.threeD.description,
          interactions: generatedContent.threeD.interactions,
          narration: generatedContent.threeD.narration
        } : {
          title: generatedContent.baseContent.title,
          text: generatedContent.baseContent.text,
          narration: `Let's explore this in 3D.`
        };

      default:
        return {
          title: generatedContent.baseContent.title,
          text: generatedContent.baseContent.text,
          objectives: generatedContent.baseContent.objectives,
          keyConcepts: generatedContent.baseContent.keyConcepts,
          summary: generatedContent.baseContent.summary,
          subject: generatedContent.metadata.subject,
          topic: generatedContent.metadata.topic,
          difficulty: generatedContent.metadata.difficulty,
          estimatedTime: generatedContent.metadata.estimatedTime,
          narration: `Let's learn about ${generatedContent.baseContent.title}. This lesson covers ${generatedContent.metadata.topic} in ${generatedContent.metadata.subject}.`
        };
    }
  }, [generatedContent, currentContentType, lessonData]);

  const renderEnhancedContent = () => {
    if (!generatedContent) {
      return (
        <div className="p-6">
          <SmartLearningCanvas 
            content={content} 
            contentType={currentContentType} 
            learningStyle={learningStyle} 
          />
        </div>
      );
    }

    // Render enhanced content based on type
    switch (currentContentType) {
      case 'math':
        if (generatedContent.math) {
          return (
            <EnhancedMathRenderer
              content={generatedContent.math}
              learningStyle={learningStyle}
              onProgress={(progress) => console.log('Math progress:', progress)}
            />
          );
        }
        break;
        
      case 'diagram':
        if (generatedContent.diagram) {
          return (
            <EnhancedDiagramRenderer
              content={generatedContent.diagram}
              learningStyle={learningStyle}
              onProgress={(progress) => console.log('Diagram progress:', progress)}
            />
          );
        }
        break;
        
      case 'simulation':
        if (generatedContent.simulation) {
          return (
            <EnhancedSimulationRenderer
              content={generatedContent.simulation}
              learningStyle={learningStyle}
              onProgress={(progress) => console.log('Simulation progress:', progress)}
            />
          );
        }
        break;
        
      case 'interactive':
        if (generatedContent.interactive) {
          return (
            <EnhancedInteractiveRenderer
              content={generatedContent.interactive}
              learningStyle={learningStyle}
              onProgress={(progress) => console.log('Interactive progress:', progress)}
            />
          );
        }
        break;
        
      default:
        // Fallback to standard SmartLearningCanvas for other types
        return (
          <div className="p-6">
            <SmartLearningCanvas 
              content={content} 
              contentType={currentContentType} 
              learningStyle={learningStyle} 
            />
          </div>
        );
    }

    // If no enhanced content available, fallback to standard
    return (
      <div className="p-6">
        <SmartLearningCanvas 
          content={content} 
          contentType={currentContentType} 
          learningStyle={learningStyle} 
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating smart content...</p>
          {isGenerating && (
            <div className="mt-4">
              <div className="w-64 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">Creating personalized learning experience...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <p className="mb-4">Error generating content: {error}</p>
          <button 
            onClick={generateSmartContent}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* AI Content Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">AI-Enhanced Learning</span>
            </div>
            {generatedContent && (
              <div className="flex items-center space-x-4 text-xs text-gray-600">
                <span className="flex items-center">
                  <Target className="w-3 h-3 mr-1" />
                  {generatedContent.baseContent.objectives.length} objectives
                </span>
                <span className="flex items-center">
                  <BookOpen className="w-3 h-3 mr-1" />
                  {generatedContent.baseContent.keyConcepts.length} key concepts
                </span>
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {generatedContent.metadata.estimatedTime} min
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => regenerateContent(currentContentType)}
              disabled={isGenerating}
              className="flex items-center space-x-1 px-3 py-1 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="text-sm">Regenerate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Type Selector */}
      {generatedContent && availableContentTypes.length > 1 && (
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">Learning Modalities</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableContentTypes.map((type) => (
              <button
                key={type}
                onClick={() => setCurrentContentType(type as any)}
                className={`px-3 py-1 rounded-md text-sm border transition-colors ${
                  currentContentType === type
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {type === '3d' ? '3D Visualization' : 
                 type === 'advanced-3d' ? 'Advanced 3D' :
                 type === 'd3-advanced' ? 'Data Visualization' :
                 type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Smart Learning Canvas */}
      <div className="flex-1">
        {renderEnhancedContent()}
      </div>

      {/* Footer with AI Status */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Brain className="w-4 h-4 mr-1 text-purple-600" />
              AI-Enhanced Content
            </span>
            {generatedContent && (
              <span className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                Optimized for {learningStyle} learners
              </span>
            )}
          </div>
          {generatedContent && (
            <span className="text-xs text-gray-500">
              Generated {new Date(generatedContent.metadata.generatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
