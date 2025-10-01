"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  Volume2, 
  VolumeX, 
  BookOpen, 
  Lightbulb,
  Target,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import MathRenderer from '@/components/multimodal/MathRenderer';
import InteractiveGraph from '@/components/multimodal/InteractiveGraph';

interface MathContent {
  equation: string;
  explanation: string;
  graphExpression?: string;
  graphTitle?: string;
  graph?: {
    title: string;
    expressions: any[];
    viewport: any;
    points: any[];
    ggb: any;
  };
  examples: Array<{
    problem: string;
    solution: string;
    steps: string[];
  }>;
  narration: string;
}

interface EnhancedMathRendererProps {
  content: MathContent;
  learningStyle: 'visual' | 'audio' | 'kinesthetic' | 'analytical';
  onProgress?: (progress: number) => void;
}

export default function EnhancedMathRenderer({ 
  content, 
  learningStyle,
  onProgress 
}: EnhancedMathRendererProps) {
  const [currentStep, setCurrentStep] = useState(0);
  //const [isPlaying, setIsPlaying] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Debug logging
  console.log('EnhancedMathRenderer received content:', content);

  const steps = useMemo(() => {
    const stepsArray = [
      { title: "Equation", content: content.equation, type: "equation" },
      { title: "Explanation", content: content.explanation, type: "explanation" },
      ...(content.graph || content.graphExpression ? [{ title: "Graph", content: content.graph || content.graphExpression, type: "graph" }] : []),
      { title: "Examples", content: content.examples, type: "examples" }
    ];
    
    console.log('EnhancedMathRenderer steps created:', stepsArray);
    console.log('Content has graph:', !!content.graph);
    console.log('Content has graphExpression:', !!content.graphExpression);
    
    return stepsArray;
  }, [content.equation, content.explanation, content.graph, content.graphExpression, content.examples]);

  useEffect(() => {
    if (onProgress) {
      onProgress((completedSteps.size / steps.length) * 100);
    }
  }, [completedSteps, steps.length, onProgress]);

  const handleStepComplete = useCallback((stepIndex: number) => {
    setCompletedSteps(prev => new Set([...prev, stepIndex]));
  }, []);

  const handleNextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      handleStepComplete(currentStep);
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, steps.length, handleStepComplete]);

  const handlePreviousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const toggleAudio = useCallback(() => {
    setAudioEnabled(!audioEnabled);
    if (!audioEnabled) {
      // Play narration
      const utterance = new SpeechSynthesisUtterance(content.narration);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    } else {
      speechSynthesis.cancel();
    }
  }, [audioEnabled, content.narration]);

  const renderEquation = (equation: string) => (
    <div className="bg-gray-50 p-6 rounded-lg border-2 border-blue-200">
      <div className="text-center">
        <MathRenderer expression={equation} />
      </div>
    </div>
  );

  const renderExplanation = (explanation: string) => (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
          <Lightbulb className="w-4 h-4 mr-2" />
          Step-by-Step Explanation
        </h4>
        <p className="text-blue-800 leading-relaxed">{explanation}</p>
      </div>
    </div>
  );

  const renderGraph = (graphData: any) => {
    console.log('EnhancedMathRenderer renderGraph called with:', graphData);
    
    // Handle both old and new graph data structures
    const isNewFormat = graphData && typeof graphData === 'object' && graphData.title;
    const graphTitle = isNewFormat ? graphData.title : (typeof graphData === 'string' ? 'Function Plot' : 'Interactive Graph');
    
    // Extract graph expression and other properties
    let graphExpression = 'x';
    let expressions: string[] = [];
    let ggbCommands: string[] = [];
    let viewport = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };
    
    if (isNewFormat) {
      // Handle the new graph format with GeoGebra data
      if (graphData.expressions && Array.isArray(graphData.expressions)) {
        expressions = graphData.expressions;
        graphExpression = expressions[0] || 'x';
      }
      
      if (graphData.ggb && graphData.ggb.commands) {
        ggbCommands = graphData.ggb.commands;
      }
      
      if (graphData.viewport) {
        viewport = {
          xMin: graphData.viewport.xMin || -10,
          xMax: graphData.viewport.xMax || 10,
          yMin: graphData.viewport.yMin || -10,
          yMax: graphData.viewport.yMax || 10
        };
      }
    } else {
      graphExpression = graphData || 'x';
    }
    
    return (
      <div className="space-y-4">
        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
          <h4 className="font-semibold text-green-900 mb-2 flex items-center">
            <Calculator className="w-4 h-4 mr-2" />
            Interactive Graph
          </h4>
          <p className="text-green-800 mb-3">{graphTitle}</p>
          <div className="bg-white p-4 rounded border w-full">
            <InteractiveGraph 
              graphExpression={graphExpression}
              expressions={expressions.length > 0 ? expressions : undefined}
              title={graphTitle} 
              height={400}
              xMin={viewport.xMin}
              xMax={viewport.xMax}
              yMin={viewport.yMin}
              yMax={viewport.yMax}
              ggbCommands={ggbCommands.length > 0 ? ggbCommands : undefined}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderExamples = (examples: Array<{problem: string; solution: string; steps: string[]}>) => (
    <div className="space-y-4">
      <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
        <BookOpen className="w-4 h-4 mr-2" />
        Practice Examples
      </h4>
      {examples && examples.length > 0 ? examples.map((example, index) => (
        <Card key={index} className="border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-purple-800">
              Example {index + 1}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-purple-50 p-3 rounded">
              <p className="font-medium text-purple-900">Problem:</p>
              <p className="text-purple-800">{example.problem}</p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSolution(!showSolution)}
              className="w-full"
            >
              {showSolution ? 'Hide' : 'Show'} Solution
            </Button>
            
            {showSolution && (
              <div className="space-y-2">
                <div className="bg-green-50 p-3 rounded">
                  <p className="font-medium text-green-900">Solution:</p>
                  <p className="text-green-800">{example.solution}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium text-gray-900 mb-2">Steps:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    {example.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="text-gray-800 text-sm">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )) : (
        <div className="text-center py-8 text-gray-500">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No practice examples available for this topic.</p>
        </div>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    const step = steps[currentStep];
    
    switch (step.type) {
      case 'equation':
        return renderEquation(step.content as string);
      case 'explanation':
        return renderExplanation(step.content as string);
      case 'graph':
        return renderGraph(step.content);
      case 'examples':
        return renderExamples(step.content as Array<{problem: string; solution: string; steps: string[]}>);
      default:
        return <div>Unknown step type</div>;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calculator className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Mathematical Concepts</h2>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {learningStyle} learning
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
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
            <span>Progress: {Math.round((completedSteps.size / steps.length) * 100)}%</span>
            <span>Step {currentStep + 1} of {steps.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedSteps.size / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {steps.map((step, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  currentStep === index
                    ? 'bg-blue-600 text-white'
                    : completedSteps.has(index)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-1">
                  {completedSteps.has(index) && <CheckCircle className="w-3 h-3" />}
                  <span>{step.title}</span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button
              size="sm"
              onClick={handleNextStep}
              disabled={currentStep === steps.length - 1}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mx-auto">
          {renderCurrentStep()}
        </div>
      </div>

      {/* Learning Style Indicators */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
          <span className="flex items-center">
            <Target className="w-4 h-4 mr-1" />
            Visual equations
          </span>
          <span className="flex items-center">
            <BookOpen className="w-4 h-4 mr-1" />
            Step-by-step explanations
          </span>
          <span className="flex items-center">
            <Calculator className="w-4 h-4 mr-1" />
            Interactive graphs
          </span>
          <span className="flex items-center">
            <Lightbulb className="w-4 h-4 mr-1" />
            Practice examples
          </span>
        </div>
      </div>
    </div>
  );
}
