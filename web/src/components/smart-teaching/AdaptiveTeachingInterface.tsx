'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Target,
  Zap,
  Users,
  //BookOpen,
  Lightbulb,
  Activity,
  BarChart3
} from 'lucide-react';

interface AdaptiveTeachingInterfaceProps {
  sessionId: string;
  lessonId: string;
  onAdaptation?: (adaptation: any) => void;
  onMethodChange?: (method: any) => void;
  className?: string;
}

interface AdaptiveSession {
  id: string;
  studentId: string;
  lessonId: string;
  currentMethod: {
    id: string;
    name: string;
    type: string;
    approach: string;
    pacing: string;
    reinforcement: string;
    difficulty: string;
    modality: string;
  };
  performanceMetrics: {
    engagement: number;
    comprehension: number;
    confusion: number;
    timeSpent: number;
    interactions: number;
    assessmentScore: number;
    learningVelocity: number;
    retentionRate: number;
    emotionalState: string;
  };
  learningStyle: {
    visual: number;
    auditory: number;
    kinesthetic: number;
    analytical: number;
    intuitive: number;
    social: number;
    solitary: number;
  };
  adaptationHistory: any[];
  predictions: any[];
  interventions: any[];
}

interface AdaptationRecommendation {
  type: string;
  threshold: number;
  currentValue: number;
  direction: string;
  urgency: string;
}

export default function AdaptiveTeachingInterface({ 
  sessionId, 
  lessonId, 
  onAdaptation, 
  onMethodChange,
  className = '' 
}: AdaptiveTeachingInterfaceProps) {
  const [session, setSession] = useState<AdaptiveSession | null>(null);
  const [recommendations, setRecommendations] = useState<AdaptationRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  console.log(onMethodChange);
    // Load adaptation recommendations
  const loadRecommendations = useCallback(async () => {
      if (!sessionId) return;
  
      try {
        const response = await fetch(`/api/smart-teaching/adaptive?sessionId=${sessionId}&action=get_recommendations`);
        
        if (response.ok) {
          const data = await response.json();
          setRecommendations(data.data || []);
        }
      } catch (err) {
        console.error('Error loading recommendations:', err);
      }
  }, [sessionId]);
  // Initialize adaptive session
  const initializeSession = useCallback(async () => {
    if (!sessionId || !lessonId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/smart-teaching/adaptive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId,
          sessionId,
          action: 'initialize'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initialize adaptive session');
      }

      const data = await response.json();
      setSession(data.data);
      
      // Load recommendations
      await loadRecommendations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [sessionId, lessonId, loadRecommendations]);

  // Update performance metrics
  const updateMetrics = useCallback(async (metrics: Partial<any>) => {
    if (!sessionId) return;

    try {
      const response = await fetch('/api/smart-teaching/adaptive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          action: 'update_metrics',
          metrics
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          // Adaptation occurred
          setSession(prev => prev ? { ...prev, ...data.data } : null);
          onAdaptation?.(data.data);
        }
        
        // Reload recommendations
        await loadRecommendations();
      }
    } catch (err) {
      console.error('Error updating metrics:', err);
    }
  }, [sessionId, onAdaptation, loadRecommendations]);

  // Initialize on mount
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  // Get urgency color
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Get urgency icon
  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <TrendingDown className="h-4 w-4" />;
      case 'medium': return <Target className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  // Get method type color
  const getMethodTypeColor = (type: string) => {
    switch (type) {
      case 'visual': return 'text-blue-600 bg-blue-50';
      case 'auditory': return 'text-green-600 bg-green-50';
      case 'kinesthetic': return 'text-purple-600 bg-purple-50';
      case 'analytical': return 'text-orange-600 bg-orange-50';
      case 'multimodal': return 'text-indigo-600 bg-indigo-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Get emotional state color
  const getEmotionalStateColor = (state: string) => {
    switch (state) {
      case 'positive': return 'text-green-600';
      case 'neutral': return 'text-gray-600';
      case 'negative': return 'text-yellow-600';
      case 'frustrated': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span>Initializing adaptive teaching...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
            <Button 
              onClick={initializeSession} 
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-gray-600">
            <Brain className="h-8 w-8 mx-auto mb-2" />
            <p>No adaptive session found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <CardTitle>Adaptive Teaching</CardTitle>
            <Badge variant="secondary">{session.currentMethod.name}</Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Teaching Method */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Current Method</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getMethodTypeColor(session.currentMethod.type)}>
              {session.currentMethod.type}
            </Badge>
            <span className="text-sm text-gray-600">
              {session.currentMethod.approach} • {session.currentMethod.pacing} • {session.currentMethod.modality}
            </span>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Performance Metrics</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Engagement</span>
                <span>{(session.performanceMetrics.engagement * 100).toFixed(0)}%</span>
              </div>
              <Progress value={session.performanceMetrics.engagement * 100} className="h-2" />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Comprehension</span>
                <span>{(session.performanceMetrics.comprehension * 100).toFixed(0)}%</span>
              </div>
              <Progress value={session.performanceMetrics.comprehension * 100} className="h-2" />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Confusion</span>
                <span>{(session.performanceMetrics.confusion * 100).toFixed(0)}%</span>
              </div>
              <Progress value={session.performanceMetrics.confusion * 100} className="h-2" />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Emotional State</span>
                <span className={getEmotionalStateColor(session.performanceMetrics.emotionalState)}>
                  {session.performanceMetrics.emotionalState}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Adaptation Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Adaptation Recommendations</span>
            </div>
            
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${getUrgencyColor(rec.urgency)}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getUrgencyIcon(rec.urgency)}
                    <span className="text-sm font-medium capitalize">
                      {rec.type} {rec.direction}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {rec.urgency}
                    </Badge>
                  </div>
                  <p className="text-xs">
                    Current: {(rec.currentValue * 100).toFixed(0)}% • 
                    Threshold: {(rec.threshold * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learning Style Profile */}
        {showDetails && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium">Learning Style Profile</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(session.learningStyle).map(([style, value]) => (
                <div key={style} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="capitalize">{style}</span>
                    <span>{(value * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={value * 100} className="h-1" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Adaptation History */}
        {showDetails && session.adaptationHistory.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Recent Adaptations</span>
            </div>
            
            <div className="space-y-1">
              {session.adaptationHistory.slice(-3).map((adaptation, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium">{adaptation.trigger.type}</span>
                    <span className="text-gray-500">
                      {new Date(adaptation.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-600">{adaptation.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateMetrics({ engagement: 0.8, confusion: 0.2 })}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Simulate Success
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateMetrics({ engagement: 0.3, confusion: 0.7 })}
          >
            <TrendingDown className="h-4 w-4 mr-1" />
            Simulate Struggle
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={loadRecommendations}
          >
            <Zap className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
