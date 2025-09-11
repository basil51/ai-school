'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Clock, 
  Target, 
  Lightbulb, 
  CheckCircle, 
  AlertTriangle,
  BookOpen,
  Zap
} from 'lucide-react';

interface AdaptiveQuestionTriggerProps {
  sessionId: string;
  lessonId: string;
  onTriggerAssessment: (triggerType: string) => void;
  studentEngagement?: number;
  timeSpent?: number;
  confusionDetected?: boolean;
  conceptMastery?: number;
}

export default function AdaptiveQuestionTrigger({
  sessionId,
  lessonId,
  onTriggerAssessment,
  studentEngagement = 0.7,
  timeSpent = 0,
  confusionDetected = false,
  conceptMastery = 0.5
}: AdaptiveQuestionTriggerProps) {
  const [suggestedTriggers, setSuggestedTriggers] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analyze student state and suggest triggers
  useEffect(() => {
    const analyzeStudentState = () => {
      setIsAnalyzing(true);
      
      // Simulate analysis delay
      setTimeout(() => {
        const triggers: string[] = [];
        
        // Time-based triggers
        if (timeSpent > 10 && timeSpent % 5 === 0) {
          triggers.push('periodic_check');
        }
        
        // Engagement-based triggers
        if (studentEngagement < 0.5) {
          triggers.push('engagement_check');
        }
        
        // Confusion detection
        if (confusionDetected) {
          triggers.push('confusion_detected');
        }
        
        // Concept mastery
        if (conceptMastery > 0.8) {
          triggers.push('concept_mastery');
        } else if (conceptMastery < 0.3) {
          triggers.push('difficulty_assessment');
        }
        
        setSuggestedTriggers(triggers);
        setIsAnalyzing(false);
      }, 1000);
    };

    analyzeStudentState();
  }, [studentEngagement, timeSpent, confusionDetected, conceptMastery]);

  const getTriggerInfo = (triggerType: string) => {
    switch (triggerType) {
      case 'periodic_check':
        return {
          icon: Clock,
          title: 'Periodic Check',
          description: 'Quick knowledge check to ensure understanding',
          color: 'bg-blue-500',
          badge: 'Timed'
        };
      case 'engagement_check':
        return {
          icon: Target,
          title: 'Engagement Check',
          description: 'Interactive questions to boost engagement',
          color: 'bg-green-500',
          badge: 'Engagement'
        };
      case 'confusion_detected':
        return {
          icon: AlertTriangle,
          title: 'Confusion Detected',
          description: 'Targeted questions to clarify understanding',
          color: 'bg-orange-500',
          badge: 'Support'
        };
      case 'concept_mastery':
        return {
          icon: CheckCircle,
          title: 'Concept Mastery',
          description: 'Advanced questions to test deep understanding',
          color: 'bg-purple-500',
          badge: 'Mastery'
        };
      case 'difficulty_assessment':
        return {
          icon: Lightbulb,
          title: 'Difficulty Assessment',
          description: 'Simplified questions to build confidence',
          color: 'bg-yellow-500',
          badge: 'Support'
        };
      default:
        return {
          icon: Brain,
          title: 'Knowledge Check',
          description: 'General assessment of understanding',
          color: 'bg-gray-500',
          badge: 'General'
        };
    }
  };

  const handleTriggerAssessment = (triggerType: string) => {
    onTriggerAssessment(triggerType);
  };

  if (suggestedTriggers.length === 0 && !isAnalyzing) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mb-6">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold">Adaptive Learning Suggestions</h3>
          {isAnalyzing && (
            <Badge variant="secondary" className="ml-auto">
              Analyzing...
            </Badge>
          )}
        </div>

        {isAnalyzing ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Analyzing learning patterns...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestedTriggers.map((triggerType) => {
              const info = getTriggerInfo(triggerType);
              const Icon = info.icon;
              
              return (
                <div key={triggerType} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${info.color} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{info.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {info.badge}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{info.description}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleTriggerAssessment(triggerType)}
                    className="ml-4"
                  >
                    Start
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${studentEngagement > 0.7 ? 'bg-green-500' : studentEngagement > 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              <span>Engagement: {(studentEngagement * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${conceptMastery > 0.7 ? 'bg-green-500' : conceptMastery > 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              <span>Mastery: {(conceptMastery * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
