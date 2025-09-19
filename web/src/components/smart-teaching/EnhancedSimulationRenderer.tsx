"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Settings,
  Lightbulb,
  Target,
  CheckCircle,
  Zap,
  Activity
} from 'lucide-react';

interface SimulationContent {
  title: string;
  type: 'physics' | 'chemistry' | 'biology' | 'math' | 'economics';
  parameters: Record<string, any>;
  instructions: string;
  learningObjectives: string[];
  narration: string;
}

interface EnhancedSimulationRendererProps {
  content: SimulationContent;
  learningStyle: 'visual' | 'audio' | 'kinesthetic' | 'analytical';
  onProgress?: (progress: number) => void;
}

export default function EnhancedSimulationRenderer({ 
  content, 
  learningStyle,
  onProgress 
}: EnhancedSimulationRendererProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [parameters, setParameters] = useState(content.parameters);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showSettings, setShowSettings] = useState(false);

  const steps = [
    { title: "Setup", description: "Configure simulation parameters" },
    { title: "Run", description: "Execute the simulation" },
    { title: "Observe", description: "Analyze the results" },
    { title: "Learn", description: "Understand the concepts" }
  ];

  useEffect(() => {
    if (onProgress) {
      onProgress((completedSteps.size / steps.length) * 100);
    }
  }, [completedSteps, steps.length, onProgress]);

  const handleStepComplete = (stepIndex: number) => {
    setCompletedSteps(prev => new Set([...prev, stepIndex]));
  };

  const toggleSimulation = () => {
    setIsRunning(!isRunning);
    if (!isRunning) {
      handleStepComplete(1); // Mark "Run" step as completed
    }
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setCurrentStep(0);
    setParameters(content.parameters);
    setCompletedSteps(new Set());
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

  const updateParameter = (key: string, value: number) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getSimulationIcon = (type: string) => {
    switch (type) {
      case 'physics': return '⚡';
      case 'chemistry': return '🧪';
      case 'biology': return '🧬';
      case 'math': return '📊';
      case 'economics': return '💰';
      default: return '🔬';
    }
  };

  const renderSimulationArea = () => {
    // This would be replaced with actual simulation rendering
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">{getSimulationIcon(content.type)}</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{content.title}</h3>
        <p className="text-gray-600 mb-4">Interactive {content.type} simulation</p>
        
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-sm text-gray-600 mb-2">Current Parameters:</div>
          <div className="space-y-2">
            {Object.entries(parameters).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="font-medium">{key}:</span>
                <span className="bg-gray-100 px-2 py-1 rounded">{value}</span>
              </div>
            ))}
          </div>
        </div>
        
        {isRunning && (
          <div className="mt-4 bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-center justify-center space-x-2 text-green-800">
              <Activity className="w-4 h-4 animate-pulse" />
              <span className="font-medium">Simulation Running...</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderParameterControls = () => (
    <Card className="border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-blue-800 flex items-center">
          <Settings className="w-4 h-4 mr-2" />
          Simulation Parameters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(parameters).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                {typeof value === 'number' ? value.toFixed(2) : value}
              </span>
            </div>
            {typeof value === 'number' && (
              <Slider
                value={[value]}
                onValueChange={([newValue]) => updateParameter(key, newValue)}
                min={0}
                max={value * 2}
                step={0.1}
                className="w-full"
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderInstructions = () => (
    <div className="space-y-4">
      <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
        <h4 className="font-semibold text-yellow-900 mb-2 flex items-center">
          <Lightbulb className="w-4 h-4 mr-2" />
          Instructions
        </h4>
        <p className="text-yellow-800 leading-relaxed">{content.instructions}</p>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
          <Target className="w-4 h-4 mr-2" />
          Learning Objectives
        </h4>
        <ul className="space-y-2">
          {content.learningObjectives.map((objective, index) => (
            <li key={index} className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span className="text-blue-800 text-sm">{objective}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className="w-6 h-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-800">Interactive Simulation</h2>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              {learningStyle} learning
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
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
            <span>Progress: {Math.round((completedSteps.size / steps.length) * 100)}%</span>
            <span>Step {currentStep + 1} of {steps.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
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
                onClick={() => {
                  setCurrentStep(index);
                  handleStepComplete(index);
                }}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  currentStep === index
                    ? 'bg-purple-600 text-white'
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
              onClick={resetSimulation}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={toggleSimulation}
              className={isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  Run
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Simulation Area */}
          <div className="lg:col-span-2">
            {renderSimulationArea()}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {showSettings && renderParameterControls()}
            {renderInstructions()}
          </div>
        </div>
      </div>

      {/* Learning Style Indicators */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
          <span className="flex items-center">
            <Zap className="w-4 h-4 mr-1" />
            Interactive simulation
          </span>
          <span className="flex items-center">
            <Settings className="w-4 h-4 mr-1" />
            Parameter control
          </span>
          <span className="flex items-center">
            <Target className="w-4 h-4 mr-1" />
            Learning objectives
          </span>
          <span className="flex items-center">
            <Activity className="w-4 h-4 mr-1" />
            Real-time feedback
          </span>
        </div>
      </div>
    </div>
  );
}
