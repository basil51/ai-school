"use client";
import React from 'react';
import { 
  Brain, 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Zap,
  BookOpen,
  Target,
  Clock
} from 'lucide-react';

interface ContentGenerationStatusProps {
  isGenerating: boolean;
  progress: number;
  currentStep: string;
  error?: string;
  generatedContent?: any;
  onRetry?: () => void;
}

export default function ContentGenerationStatus({
  isGenerating,
  progress,
  currentStep,
  error,
  generatedContent,
  onRetry
}: ContentGenerationStatusProps) {
  const getStepIcon = (step: string) => {
    switch (step.toLowerCase()) {
      case 'analyzing':
        return <Brain className="w-5 h-5 text-blue-600" />;
      case 'generating':
        return <Sparkles className="w-5 h-5 text-purple-600" />;
      case 'optimizing':
        return <Zap className="w-5 h-5 text-yellow-600" />;
      case 'finalizing':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Loader2 className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStepColor = (step: string) => {
    switch (step.toLowerCase()) {
      case 'analyzing':
        return 'text-blue-600';
      case 'generating':
        return 'text-purple-600';
      case 'optimizing':
        return 'text-yellow-600';
      case 'finalizing':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Generation Failed</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (generatedContent && !isGenerating) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="relative">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Generated Successfully!</h3>
          <p className="text-gray-600 mb-4">
            Your personalized learning experience is ready with {Object.keys(generatedContent).filter(key => key !== 'baseContent' && key !== 'metadata').length} content modalities.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <BookOpen className="w-4 h-4 mr-1" />
              {generatedContent.baseContent?.objectives?.length || 0} objectives
            </span>
            <span className="flex items-center">
              <Target className="w-4 h-4 mr-1" />
              {generatedContent.baseContent?.keyConcepts?.length || 0} concepts
            </span>
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {generatedContent.metadata?.estimatedTime || 0} min
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <div className="relative mb-6">
          <div className="w-20 h-20 border-4 border-gray-200 rounded-full mx-auto"></div>
          <div 
            className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-20 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"
            style={{ 
              animationDuration: '2s',
              transform: 'translateX(-50%) rotate(0deg)',
              animation: `spin 2s linear infinite`
            }}
          ></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {getStepIcon(currentStep)}
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Smart Content</h3>
        <p className={`text-sm font-medium mb-4 ${getStepColor(currentStep)}`}>
          {currentStep}...
        </p>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>Creating personalized learning experience</p>
          <p>Optimizing for your learning style</p>
          <p>Generating interactive content</p>
        </div>
      </div>
    </div>
  );
}
