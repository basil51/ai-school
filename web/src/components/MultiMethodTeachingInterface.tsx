"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Lightbulb, 
  BookMarked, 
  Zap, 
  Brain,
  CheckCircle,
  Clock,
  TrendingUp,
  Star,
  ArrowRight
} from 'lucide-react';

interface TeachingMethod {
  id: string;
  name: string;
  description: string;
  approach: string;
  example: string;
  effectiveness: number;
  studentPreference: number;
}

interface MultiMethodExplanation {
  originalContent: string;
  methods: {
    stepByStep: string;
    analogy: string;
    storyBased: string;
    simplified: string;
    advanced: string;
  };
  recommendedMethod: string;
  studentChoice?: string;
  effectiveness: {
    [method: string]: number;
  };
}

interface MultiMethodTeachingInterfaceProps {
  lessonContent: string;
  studentId: string;
  subject: string;
  topic: string;
  onMethodSelected?: (method: string, success: boolean, timeSpent: number) => void;
}

const methodIcons = {
  'step-by-step': BookOpen,
  'analogy': Lightbulb,
  'story-based': BookMarked,
  'simplified': Zap,
  'advanced': Brain
};

const methodColors = {
  'step-by-step': 'bg-blue-100 text-blue-800 border-blue-200',
  'analogy': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'story-based': 'bg-purple-100 text-purple-800 border-purple-200',
  'simplified': 'bg-green-100 text-green-800 border-green-200',
  'advanced': 'bg-red-100 text-red-800 border-red-200'
};

export default function MultiMethodTeachingInterface({
  lessonContent,
  studentId,
  subject,
  topic,
  onMethodSelected
}: MultiMethodTeachingInterfaceProps) {
  const [explanations, setExplanations] = useState<MultiMethodExplanation | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [hasSelected, setHasSelected] = useState(false);

  useEffect(() => {
    generateExplanations();
  }, [lessonContent, studentId, subject, topic]);

  const generateExplanations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/teaching/multi-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonContent,
          studentId,
          subject,
          topic
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setExplanations(data.data);
        setSelectedMethod(data.data.recommendedMethod);
        setStartTime(Date.now());
      } else {
        console.error('Failed to generate explanations');
      }
    } catch (error) {
      console.error('Error generating explanations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    setHasSelected(true);
  };

  const handleSuccess = async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000 / 60); // minutes
    await recordChoice(true, timeSpent);
    onMethodSelected?.(selectedMethod, true, timeSpent);
  };

  const handleFailure = async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000 / 60); // minutes
    await recordChoice(false, timeSpent);
    onMethodSelected?.(selectedMethod, false, timeSpent);
  };

  const recordChoice = async (success: boolean, timeSpent: number) => {
    try {
      await fetch('/api/teaching/record-choice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          lessonId: 'current-lesson', // You might want to pass this as a prop
          chosenMethod: selectedMethod,
          success,
          timeSpent
        }),
      });
    } catch (error) {
      console.error('Error recording choice:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Generating personalized explanations...</span>
      </div>
    );
  }

  if (!explanations) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to generate explanations. Please try again.</p>
        <Button onClick={generateExplanations} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const methodTabs = [
    { id: 'step-by-step', label: 'Step-by-Step', content: explanations.methods.stepByStep },
    { id: 'analogy', label: 'Analogy', content: explanations.methods.analogy },
    { id: 'story-based', label: 'Story-Based', content: explanations.methods.storyBased },
    { id: 'simplified', label: 'Simplified', content: explanations.methods.simplified },
    { id: 'advanced', label: 'Advanced', content: explanations.methods.advanced }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your Learning Style
        </h2>
        <p className="text-gray-600">
          Select the explanation method that works best for you
        </p>
        {explanations.recommendedMethod && (
          <div className="mt-4">
            <Badge className={`${methodColors[explanations.recommendedMethod as keyof typeof methodColors]} text-sm`}>
              <Star className="w-3 h-3 mr-1" />
              Recommended: {methodTabs.find(t => t.id === explanations.recommendedMethod)?.label}
            </Badge>
          </div>
        )}
      </div>

      {/* Method Selection */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {methodTabs.map((method) => {
          const Icon = methodIcons[method.id as keyof typeof methodIcons];
          const isSelected = selectedMethod === method.id;
          const effectiveness = explanations.effectiveness[method.id] || 0.5;
          
          return (
            <Card 
              key={method.id}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleMethodSelect(method.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Icon className="w-5 h-5 text-gray-600" />
                  {isSelected && <CheckCircle className="w-4 h-4 text-green-500" />}
                </div>
                <CardTitle className="text-sm">{method.label}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">
                    Effectiveness: {Math.round(effectiveness * 100)}%
                  </div>
                  <Progress value={effectiveness * 100} className="h-1" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Method Content */}
      {selectedMethod && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {React.createElement(methodIcons[selectedMethod as keyof typeof methodIcons], {
                  className: "w-5 h-5 mr-2 text-blue-600"
                })}
                <CardTitle>
                  {methodTabs.find(t => t.id === selectedMethod)?.label} Explanation
                </CardTitle>
              </div>
              <Badge className={methodColors[selectedMethod as keyof typeof methodColors]}>
                {Math.round((explanations.effectiveness[selectedMethod] || 0.5) * 100)}% Effective
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                {methodTabs.find(t => t.id === selectedMethod)?.content}
              </p>
            </div>
            
            {/* Action Buttons */}
            {hasSelected && (
              <div className="flex gap-4 mt-6 pt-4 border-t">
                <Button 
                  onClick={handleSuccess}
                  className="flex items-center bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  I Understand
                </Button>
                <Button 
                  onClick={handleFailure}
                  variant="outline"
                  className="flex items-center"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Try Another Method
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Learning Statistics */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            Your Learning Preferences
          </CardTitle>
          <CardDescription>
            Based on your past performance and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((explanations.effectiveness[selectedMethod] || 0.5) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.floor((Date.now() - startTime) / 1000 / 60)}m
              </div>
              <div className="text-sm text-gray-600">Time Spent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {methodTabs.findIndex(t => t.id === selectedMethod) + 1}/5
              </div>
              <div className="text-sm text-gray-600">Method Selected</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
