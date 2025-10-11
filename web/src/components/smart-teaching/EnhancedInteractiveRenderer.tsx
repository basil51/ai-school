"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Code, 
  Play, 
  //Pause, 
  Volume2, 
  VolumeX, 
  //Settings,
  Lightbulb,
  Target,
  CheckCircle,
  Zap,
  Monitor,
  FileText,
  HelpCircle
} from 'lucide-react';

interface InteractiveContent {
  title: string;
  type?: 'code_playground' | 'quiz' | 'drag_drop' | 'timeline' | 'calculator';
  instructions: string;
  initialCode?: string;
  questions?: Array<{
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation: string;
  }>;
  narration: string;
}

interface EnhancedInteractiveRendererProps {
  content: InteractiveContent;
  learningStyle: 'visual' | 'audio' | 'kinesthetic' | 'analytical';
  onProgress?: (progress: number) => void;
}

export default function EnhancedInteractiveRenderer({ 
  content, 
  learningStyle,
  onProgress 
}: EnhancedInteractiveRendererProps) {
  const [currentMode, setCurrentMode] = useState<'instructions' | 'interactive' | 'results'>('instructions');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [code, setCode] = useState(content.initialCode || '');
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dropZones, setDropZones] = useState<Record<string, string[]>>({});
  const [showResults, setShowResults] = useState(false);
  const [completedModes, setCompletedModes] = useState<Set<string>>(new Set());

  const modes = [
    { id: 'instructions', title: 'Instructions', icon: FileText },
    { id: 'interactive', title: 'Interactive', icon: Monitor },
    { id: 'results', title: 'Results', icon: Target }
  ];

  useEffect(() => {
    if (onProgress) {
      onProgress((completedModes.size / modes.length) * 100);
    }
  }, [completedModes, modes.length, onProgress]);

  const handleModeComplete = (modeId: string) => {
    setCompletedModes(prev => new Set([...prev, modeId]));
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

  const getInteractiveIcon = (type: string) => {
    switch (type) {
      case 'code_playground': return '💻';
      case 'quiz': return '❓';
      case 'drag_drop': return '🎯';
      case 'timeline': return '📅';
      case 'calculator': return '🧮';
      default: return '🎮';
    }
  };

  const renderInstructions = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">{getInteractiveIcon(content.type || 'default')}</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{content.title}</h2>
        <Badge variant="outline" className="mb-4">
          {content.type?.replace('_', ' ').toUpperCase() || 'INTERACTIVE'}
        </Badge>
      </div>
      
      <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-400">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
          <Lightbulb className="w-4 h-4 mr-2" />
          Instructions
        </h4>
        <p className="text-blue-800 leading-relaxed text-lg">
          {content.instructions}
        </p>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
        <h4 className="font-semibold text-green-900 mb-2">
          🎯 What You&#39;ll Learn
        </h4>
        <p className="text-green-800">
          This interactive activity will help you understand the concepts through hands-on practice.
        </p>
      </div>
    </div>
  );

  const renderCodePlayground = () => (
    <div className="space-y-4">
      <div className="bg-gray-900 text-white p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-300">Code Editor</span>
          <Button size="sm" variant="outline" className="text-white border-gray-600">
            <Play className="w-4 h-4 mr-1" />
            Run
          </Button>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-64 bg-transparent text-green-400 font-mono text-sm resize-none border-none outline-none"
          placeholder="Enter your code here..."
        />
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h4 className="font-semibold text-gray-800 mb-2">Output</h4>
        <div className="bg-white p-3 rounded border min-h-[100px]">
          <p className="text-gray-600 text-sm">Code output will appear here...</p>
        </div>
      </div>
    </div>
  );

  const renderQuiz = () => (
    <div className="space-y-6">
      {content.questions?.map((question, index) => (
        <Card key={index} className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">
              Question {index + 1}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-800">{question.question}</p>
            
            {question.options && question.options.length > 0 ? (
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => (
                  <label key={optionIndex} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={option}
                      onChange={(e) => setQuizAnswers(prev => ({
                        ...prev,
                        [index]: e.target.value
                      }))}
                      className="text-blue-600"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={quizAnswers[index] || ''}
                  onChange={(e) => setQuizAnswers(prev => ({
                    ...prev,
                    [index]: e.target.value
                  }))}
                  placeholder="Enter your answer here..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
                <p className="text-sm text-gray-500">
                  Type your answer in the text area above
                </p>
              </div>
            )}
            
            {showResults && (
              <div className="mt-4 space-y-3">
                {quizAnswers[index] && (
                  <div className="p-3 rounded-lg border-l-4 border-blue-400 bg-blue-50">
                    <p className="text-blue-800 text-sm">
                      <strong>Your Answer:</strong> {quizAnswers[index]}
                    </p>
                  </div>
                )}
                <div className="p-3 rounded-lg border-l-4 border-green-400 bg-green-50">
                  <p className="text-green-800 text-sm">
                    <strong>Explanation:</strong> {question.explanation}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      
      <div className="flex justify-center">
        <Button
          onClick={() => {
            setShowResults(true);
            handleModeComplete('interactive');
          }}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={Object.keys(quizAnswers).length === 0}
        >
          Check Answers
        </Button>
      </div>
      
      {Object.keys(quizAnswers).length > 0 && (
        <div className="text-center text-sm text-gray-600">
          {Object.keys(quizAnswers).length} of {content.questions?.length || 0} questions answered
        </div>
      )}
    </div>
  );

  const renderDragDrop = () => {
    // Sample geometric shapes for drag and drop
    const shapes = [
      { id: 'circle', name: 'Circle', emoji: '⭕' },
      { id: 'square', name: 'Square', emoji: '⬜' },
      { id: 'triangle', name: 'Triangle', emoji: '🔺' },
      { id: 'rectangle', name: 'Rectangle', emoji: '⬛' }
    ];
    
    const shapeCategories = [
      { id: 'round', name: 'Round Shapes', description: 'Shapes with curves' },
      { id: 'angular', name: 'Angular Shapes', description: 'Shapes with straight edges' }
    ];

    const handleDragStart = (e: React.DragEvent, shapeId: string) => {
      setDraggedItem(shapeId);
      e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, categoryId: string) => {
      e.preventDefault();
      if (draggedItem) {
        setDropZones(prev => ({
          ...prev,
          [categoryId]: [...(prev[categoryId] || []), draggedItem]
        }));
        setDraggedItem(null);
      }
    };

    const isCorrect = (shapeId: string, categoryId: string) => {
      const correctMappings: Record<string, string> = {
        'circle': 'round',
        'square': 'angular',
        'triangle': 'angular',
        'rectangle': 'angular'
      };
      return correctMappings[shapeId] === categoryId;
    };

    const getScore = () => {
      let correct = 0;
      let total = 0;
      Object.entries(dropZones).forEach(([categoryId, shapeIds]) => {
        shapeIds.forEach(shapeId => {
          total++;
          if (isCorrect(shapeId, categoryId)) {
            correct++;
          }
        });
      });
      return { correct, total };
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Drag and Drop Geometric Shapes
          </h3>
          <p className="text-gray-600 mb-4">
            Drag each shape to its correct category
          </p>
        </div>

        {/* Shapes to drag */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {shapes.map((shape) => (
            <div
              key={shape.id}
              draggable
              onDragStart={(e) => handleDragStart(e, shape.id)}
              className={`p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-move hover:border-blue-400 transition-colors ${
                draggedItem === shape.id ? 'opacity-50' : ''
              }`}
            >
              <div className="text-4xl mb-2">{shape.emoji}</div>
              <div className="text-sm font-medium">{shape.name}</div>
            </div>
          ))}
        </div>

        {/* Drop zones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {shapeCategories.map((category) => (
            <div
              key={category.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, category.id)}
              className={`min-h-[120px] p-6 border-2 border-dashed rounded-lg transition-colors ${
                dropZones[category.id] 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <h4 className="font-semibold text-gray-800 mb-2">{category.name}</h4>
              <p className="text-sm text-gray-600 mb-4">{category.description}</p>
              
              {dropZones[category.id] && dropZones[category.id].length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {dropZones[category.id].map((shapeId, index) => {
                    const shape = shapes.find(s => s.id === shapeId);
                    return (
                      <div
                        key={`${shapeId}-${index}`}
                        className={`text-center p-2 rounded-lg ${
                          isCorrect(shapeId, category.id) 
                            ? 'bg-green-100 border border-green-300' 
                            : 'bg-red-100 border border-red-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{shape?.emoji}</div>
                        <div className="text-xs font-medium">{shape?.name}</div>
                        {isCorrect(shapeId, category.id) ? (
                          <div className="text-green-600 text-xs">✓</div>
                        ) : (
                          <div className="text-red-600 text-xs">✗</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Score and Reset */}
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold text-blue-600 mb-2">
            Score: {getScore().correct}/{getScore().total}
          </div>
          {getScore().total === shapes.length && getScore().correct === shapes.length && (
            <div className="text-green-600 font-semibold">
              🎉 Perfect! You&#39;ve sorted all shapes correctly!
            </div>
          )}
          <Button 
            onClick={() => setDropZones({})}
            variant="outline"
            size="sm"
          >
            Reset Game
          </Button>
        </div>
      </div>
    );
  };

  const renderInteractive = () => {
    switch (content.type || 'default') {
      case 'code_playground':
        return renderCodePlayground();
      case 'quiz':
        return renderQuiz();
      case 'drag_drop':
        return renderDragDrop();
      default:
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">{getInteractiveIcon(content.type || 'default')}</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {content.type?.replace('_', ' ').toUpperCase() || 'INTERACTIVE'} Interactive
            </h3>
            <p className="text-gray-600">
              Interactive {content.type || 'default'} component would render here
            </p>
          </div>
        );
    }
  };

  const renderResults = () => {
    const totalQuestions = content.questions?.length || 0;
    const correctAnswers = Object.values(quizAnswers).filter((answer, index) => 
      answer === content.questions?.[index]?.correctAnswer
    ).length;
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Great Job!</h2>
          <p className="text-gray-600">You&#39;ve completed the interactive activity</p>
        </div>
        
        {(content.type || '') === 'quiz' && (
          <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-400">
            <h3 className="font-semibold text-blue-900 mb-3">Quiz Results</h3>
            <div className="text-3xl font-bold text-blue-800 mb-2">
              {correctAnswers}/{totalQuestions}
            </div>
            <p className="text-blue-700">
              {correctAnswers === totalQuestions 
                ? "Perfect! You got all questions correct!" 
                : `You got ${correctAnswers} out of ${totalQuestions} questions correct.`}
            </p>
          </div>
        )}
        
        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
          <h4 className="font-semibold text-green-900 mb-2">
            🎯 What You&#39;ve Learned
          </h4>
          <p className="text-green-800">
            Through this interactive activity, you&#39;ve gained hands-on experience with the concepts.
            This type of learning helps reinforce your understanding.
          </p>
        </div>
      </div>
    );
  };

  const renderCurrentMode = () => {
    switch (currentMode) {
      case 'instructions':
        return renderInstructions();
      case 'interactive':
        return renderInteractive();
      case 'results':
        return renderResults();
      default:
        return renderInstructions();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Code className="w-6 h-6 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-800">Interactive Learning</h2>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
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
            <span>Progress: {Math.round((completedModes.size / modes.length) * 100)}%</span>
            <span>Mode: {modes.find(m => m.id === currentMode)?.title}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedModes.size / modes.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mode Navigation */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {modes.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    setCurrentMode(mode.id as any);
                    handleModeComplete(mode.id);
                  }}
                  className={`px-3 py-2 rounded-md text-sm transition-colors flex items-center space-x-2 ${
                    currentMode === mode.id
                      ? 'bg-orange-600 text-white'
                      : completedModes.has(mode.id)
                      ? 'bg-green-100 text-green-800'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{mode.title}</span>
                  {completedModes.has(mode.id) && <CheckCircle className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMode('instructions')}
          >
            <HelpCircle className="w-4 h-4 mr-1" />
            Help
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {renderCurrentMode()}
        </div>
      </div>

      {/* Learning Style Indicators */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
          <span className="flex items-center">
            <Code className="w-4 h-4 mr-1" />
            Interactive coding
          </span>
          <span className="flex items-center">
            <Monitor className="w-4 h-4 mr-1" />
            Hands-on practice
          </span>
          <span className="flex items-center">
            <Target className="w-4 h-4 mr-1" />
            Immediate feedback
          </span>
          <span className="flex items-center">
            <Zap className="w-4 h-4 mr-1" />
            Active learning
          </span>
        </div>
      </div>
    </div>
  );
}
