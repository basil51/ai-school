"use client";
import React, { useState, useEffect, useCallback } from 'react';
import TextFormatter from './TextFormatter';
import EnhancedVideoPlayer from './EnhancedVideoPlayer';
import EnhancedMathRenderer from './EnhancedMathRenderer';
import EnhancedDiagramRenderer from './EnhancedDiagramRenderer';
import EnhancedInteractiveRenderer from './EnhancedInteractiveRenderer';
import { 
  Brain, 
  Loader2, 
  RefreshCw,  
  Zap,
  Play,
  BookOpen,
  Target,
  Clock,
  CheckCircle,
  AlertCircle
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
  };
}

interface ProgressiveContentLoaderProps {
  lessonData: LessonData;
  learningStyle: 'visual' | 'audio' | 'kinesthetic' | 'analytical';
  generatedContent?: any;
  contentStatuses?: Record<string, any>;
  isGenerating?: boolean;
  generationProgress?: number | null;
  onGenerateContent?: (contentType: string, options?: { force?: boolean }) => void;
  onGenerateAllContent?: (options?: { force?: boolean }) => void;
}

type ContentStatus = {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  content?: any;
  error?: string;
};

const ProgressiveContentLoader: React.FC<ProgressiveContentLoaderProps> = ({
  lessonData,
  learningStyle,
  generatedContent,
  contentStatuses = {},
  isGenerating = false,
  generationProgress = null,
  onGenerateContent,
  onGenerateAllContent
}) => {
  console.log('🎯 [DEBUG] ProgressiveContentLoader (presentational) initialized with:', { 
    lessonData, 
    learningStyle, 
    generatedContent, 
    contentStatuses,
    isGenerating 
  });
  
  const [currentContentType, setCurrentContentType] = useState<string>('text');
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // Check if we have text content to determine if initial loading is complete
  useEffect(() => {
    if (generatedContent?.baseContent) {
      setIsLoadingInitial(false);
      console.log('🎯 [DEBUG] Initial loading completed - text content available');
    }
  }, [generatedContent]);

  // Presentational component - no API calls, just calls parent functions
  const loadContent = useCallback((contentType: string) => {
    console.log(`🎯 [DEBUG] ProgressiveContentLoader requesting ${contentType} content from parent`);
    if (onGenerateContent) {
      onGenerateContent(contentType);
    }
  }, [onGenerateContent]);

  const loadAdditionalContent = useCallback((contentType: string) => {
    const status = contentStatuses[contentType]?.status;
    console.log(`🎯 [DEBUG] loadAdditionalContent called for ${contentType}, current status:`, status);
    if (status === 'idle' || status === 'error') {
      loadContent(contentType);
    }
  }, [contentStatuses, loadContent]);

  const retryContent = useCallback((contentType: string) => {
    console.log(`🎯 [DEBUG] Retrying content generation for ${contentType}`);
    if (onGenerateContent) {
      onGenerateContent(contentType, { force: true });
    }
  }, [onGenerateContent]);

  const currentStatus = contentStatuses[currentContentType] || { status: 'idle' };

  if (isLoadingInitial) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading lesson content...</p>
          <p className="text-sm text-gray-500 mt-2">Getting text content ready for you</p>
        </div>
      </div>
    );
  }

  if (isGenerating && currentStatus.status === 'loading') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading {currentContentType} content...</p>
          {generationProgress !== null && (
            <p className="text-sm text-gray-500 mt-2">{generationProgress}% complete</p>
          )}
        </div>
      </div>
    );
  }

  if (currentStatus.status === 'error') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p className="mb-4">Error loading {currentContentType} content</p>
          <button 
            onClick={() => retryContent(currentContentType)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (currentStatus.status === 'loaded' && currentStatus.content) {
    switch (currentContentType) {
      case 'text':
        const textContent = generatedContent?.baseContent || currentStatus.content?.baseContent || currentStatus.content;
        return (
          <div className="h-full flex flex-col">
            <TextFormatter
              content={textContent}
              learningStyle={learningStyle}
              onProgress={(progress) => console.log('Reading progress:', progress)}
              onBookmark={(section) => console.log('Bookmarked section:', section)}
              onHighlight={(text) => console.log('Highlighted text:', text)}
            />
            
            {/* Progressive Loading Controls */}
            <div className="flex-shrink-0 p-4 border-t bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Additional content available:</span>
                </div>
                <div className="flex space-x-2">
                  {['video', 'math', 'diagram', 'interactive'].map((type) => {
                    const status = contentStatuses[type]?.status || 'idle';
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          setCurrentContentType(type);
                          loadAdditionalContent(type);
                        }}
                        disabled={status === 'loading'}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          status === 'loaded'
                            ? 'bg-green-100 text-green-700'
                            : status === 'loading'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {status === 'loading' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : status === 'loaded' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        <span className="ml-1 capitalize">{type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 'video':
        const videoContent = generatedContent?.video || currentStatus.content;
        if (videoContent?.src) {
          return (
            <div className="p-6">
              <EnhancedVideoPlayer
                src={videoContent.src}
                title={videoContent.title}
                description={videoContent.description}
                captions={videoContent.captions}
                poster={videoContent.poster}
                transcript={videoContent.transcript}
                keyConcepts={videoContent.keyConcepts}
                duration={videoContent.duration}
                onProgress={(progress) => console.log('Video progress:', progress)}
                onComplete={() => console.log('Video completed')}
                onError={(error) => console.error('Video error:', error)}
                subject={lessonData?.subject?.name}
                topic={lessonData?.topic?.name}
              />
            </div>
          );
        }
        break;

      case 'math':
        const mathContent = generatedContent?.math || currentStatus.content;
        if (mathContent?.equation) {
          return (
            <EnhancedMathRenderer
              content={mathContent}
              learningStyle={learningStyle}
              onProgress={(progress) => console.log('Math progress:', progress)}
            />
          );
        }
        break;

      case 'diagram':
        const diagramContent = generatedContent?.diagram || currentStatus.content;
        if (diagramContent?.chart) {
          return (
            <EnhancedDiagramRenderer
              content={diagramContent}
              learningStyle={learningStyle}
              onProgress={(progress) => console.log('Diagram progress:', progress)}
            />
          );
        }
        break;

      case 'interactive':
        const interactiveContent = generatedContent?.interactive || currentStatus.content;
        if (interactiveContent?.title) {
          return (
            <EnhancedInteractiveRenderer
              content={interactiveContent}
              learningStyle={learningStyle}
              onProgress={(progress) => console.log('Interactive progress:', progress)}
            />
          );
        }
        break;
    }
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-10 h-10 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Content Available</h3>
        <p className="text-gray-500 max-w-md">
          The {currentContentType} content is being prepared. Please wait while we generate the learning materials for you.
        </p>
      </div>
    </div>
  );
};

export default ProgressiveContentLoader;
