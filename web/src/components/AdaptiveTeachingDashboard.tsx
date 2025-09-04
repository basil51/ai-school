"use client";
  
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  Lightbulb,
  Zap,
  Heart,
  Palette,
  BarChart3,
  Loader2,
  Eye,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { useTranslations } from "@/lib/useTranslations";

interface NeuralPathway {
  id: string;
  pathwayType: 'sequential' | 'parallel' | 'hierarchical' | 'network' | 'hybrid';
  strength: number;
  learningVelocity: number;
  retentionRate: number;
  emotionalResonance: number;
  crossDomainTransfer: number;
}

interface LearningPrediction {
  id: string;
  predictionType: 'success' | 'struggle' | 'engagement' | 'retention' | 'emotional' | 'motivational';
  confidence: number;
  predictedValue: number;
  timeframe: string;
  factors: Array<{
    factor: string;
    weight: number;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }>;
}

interface EarlyWarningSignal {
  id: string;
  signalType: 'performance' | 'emotional' | 'behavioral' | 'engagement' | 'retention';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
  recommendedAction: string;
}

interface LearningIntervention {
  id: string;
  interventionType: 'predictive' | 'remedial' | 'accelerative' | 'creative' | 'emotional';
  trigger: string;
  approach: string;
  expectedOutcome: string;
  confidence: number;
  personalizedContent: string;
  crossDomainConnections: string[];
  emotionalSupport: string;
  successMetrics: string[];
}

interface AdaptiveTeachingDashboardProps {
  studentId?: string;
  className?: string;
}

export function AdaptiveTeachingDashboard({ 
  studentId,
  className = "" 
}: AdaptiveTeachingDashboardProps) {
  const { } = useTranslations();
  const [pathways, setPathways] = useState<NeuralPathway[]>([]);
  const [predictions, setPredictions] = useState<LearningPrediction[]>([]);
  const [warnings, setWarnings] = useState<EarlyWarningSignal[]>([]);
  const [interventions, setInterventions] = useState<LearningIntervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching analysis for studentId:', studentId);
      const response = await fetch(`/api/adaptive/analyze?studentId=${studentId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to fetch analysis: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Analysis data received:', data);
      setPathways(data.pathways || []);
      setPredictions(data.predictions || []);
      setWarnings(data.warnings || []);
      
      // Show message if no data
      if (!data.hasData) {
        setError(data.message || 'No learning data found for this student');
      }
    } catch (err) {
      console.error('Error in fetchAnalysis:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (studentId) {
      fetchAnalysis();
    }
  }, [studentId, fetchAnalysis]);

  const runAnalysis = async () => {
    try {
      setAnalyzing(true);
      const response = await fetch('/api/adaptive/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to run analysis');
      }

      const data = await response.json();
      setPathways(data.pathways || []);
      setPredictions(data.predictions || []);
      setWarnings(data.warnings || []);
      
      // Show message if no data
      if (!data.hasData) {
        setError(data.message || 'No learning data found for this student');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const generateIntervention = async (type: string) => {
    try {
      const response = await fetch('/api/adaptive/interventions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          studentId, 
          interventionType: type,
          content: 'Sample learning content for intervention generation'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate intervention');
      }

      const data = await response.json();
      setInterventions(prev => [data.intervention, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate intervention');
    }
  };

  const createSampleData = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      
      const response = await fetch('/api/adaptive/sample-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create sample data');
      }

      const data = await response.json();
      console.log('Sample data created:', data);
      
      // Refresh the analysis after creating sample data
      await fetchAnalysis();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sample data');
    } finally {
      setAnalyzing(false);
    }
  };

  const getPathwayIcon = (type: string) => {
    switch (type) {
      case 'sequential': return <TrendingUp className="h-4 w-4" />;
      case 'parallel': return <BarChart3 className="h-4 w-4" />;
      case 'hierarchical': return <Target className="h-4 w-4" />;
      case 'network': return <Brain className="h-4 w-4" />;
      case 'hybrid': return <Sparkles className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getPathwayColor = (type: string) => {
    switch (type) {
      case 'sequential': return 'bg-blue-100 text-blue-800';
      case 'parallel': return 'bg-green-100 text-green-800';
      case 'hierarchical': return 'bg-purple-100 text-purple-800';
      case 'network': return 'bg-orange-100 text-orange-800';
      case 'hybrid': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInterventionIcon = (type: string) => {
    switch (type) {
      case 'predictive': return <Eye className="h-4 w-4" />;
      case 'remedial': return <RefreshCw className="h-4 w-4" />;
      case 'accelerative': return <Zap className="h-4 w-4" />;
      case 'creative': return <Palette className="h-4 w-4" />;
      case 'emotional': return <Heart className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading adaptive teaching analysis...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {error && (
        <Alert variant={error.includes('No learning data') ? "default" : "destructive"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            {error.includes('No learning data') && (
              <div className="mt-2 text-sm">
                <p>To use the adaptive teaching features, students need to:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Complete some lessons or assessments</li>
                  <li>Have learning progress data in the system</li>
                  <li>Interact with the learning content</li>
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Brain className="h-6 w-6 text-purple-600" />
            <span>Revolutionary Adaptive Teaching Engine</span>
          </h2>
          <p className="text-gray-600 mt-1">
            AI-powered neural pathway analysis and personalized learning interventions
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={runAnalysis}
            disabled={analyzing}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Run Analysis
              </>
            )}
          </Button>
          <Button 
            variant="outline"
            onClick={createSampleData}
            disabled={analyzing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Create Sample Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pathways" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pathways">Neural Pathways</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="warnings">Early Warnings</TabsTrigger>
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
        </TabsList>

        <TabsContent value="pathways" className="space-y-4">
          <div className="grid gap-4">
            {pathways.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Brain className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No neural pathways detected</h3>
                  <p className="text-gray-500 text-center">
                    Run analysis to discover how this student&apos;s brain processes information.
                  </p>
                </CardContent>
              </Card>
            ) : (
              pathways.map((pathway) => (
                <Card key={pathway.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          {getPathwayIcon(pathway.pathwayType)}
                          <span className="capitalize">{pathway.pathwayType} Pathway</span>
                          <Badge className={getPathwayColor(pathway.pathwayType)}>
                            {Math.round(pathway.strength * 100)}% Strength
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          How this student&apos;s brain processes information
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Learning Velocity</span>
                          <span>{Math.round(pathway.learningVelocity * 100)}%</span>
                        </div>
                        <Progress value={pathway.learningVelocity * 100} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Retention Rate</span>
                          <span>{Math.round(pathway.retentionRate * 100)}%</span>
                        </div>
                        <Progress value={pathway.retentionRate * 100} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Emotional Resonance</span>
                          <span>{Math.round(pathway.emotionalResonance * 100)}%</span>
                        </div>
                        <Progress value={pathway.emotionalResonance * 100} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Cross-Domain Transfer</span>
                          <span>{Math.round(pathway.crossDomainTransfer * 100)}%</span>
                        </div>
                        <Progress value={pathway.crossDomainTransfer * 100} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid gap-4">
            {predictions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No predictions available</h3>
                  <p className="text-gray-500 text-center">
                    Run analysis to generate learning outcome predictions.
                  </p>
                </CardContent>
              </Card>
            ) : (
              predictions.map((prediction) => (
                <Card key={prediction.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span className="capitalize">{prediction.predictionType} Prediction</span>
                      <Badge variant={prediction.predictedValue > 0.7 ? "default" : "destructive"}>
                        {Math.round(prediction.predictedValue * 100)}%
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {prediction.timeframe} prediction with {Math.round(prediction.confidence * 100)}% confidence
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Predicted Value</span>
                          <span>{Math.round(prediction.predictedValue * 100)}%</span>
                        </div>
                        <Progress value={prediction.predictedValue * 100} />
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold">Key Factors</h4>
                        <div className="space-y-1">
                          {(() => {
                            // Handle both array and object formats for factors
                            let factors = prediction.factors;
                            if (typeof factors === 'object' && !Array.isArray(factors)) {
                              // Convert object to array format
                              factors = Object.entries(factors).map(([key, value]) => ({
                                factor: key,
                                weight: typeof value === 'number' ? value : 0.5,
                                impact: (typeof value === 'number' && value > 0.6) ? 'positive' : 
                                        (typeof value === 'number' && value < 0.4) ? 'negative' : 'neutral',
                                description: `Impact of ${key} on learning outcomes`
                              }));
                            }
                            return Array.isArray(factors) ? factors.slice(0, 3).map((factor, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span className={factor.impact === 'positive' ? 'text-green-600' : 
                                                 factor.impact === 'negative' ? 'text-red-600' : 'text-gray-600'}>
                                  {factor.factor}
                                </span>
                                <span className="text-gray-500">
                                  {Math.round((factor.weight || 0.5) * 100)}%
                                </span>
                              </div>
                            )) : (
                              <div className="text-sm text-gray-500">No factors available</div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="warnings" className="space-y-4">
          <div className="grid gap-4">
            {warnings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <AlertTriangle className="h-12 w-12 text-green-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No warnings detected</h3>
                  <p className="text-gray-500 text-center">
                    Student is performing well with no early warning signals.
                  </p>
                </CardContent>
              </Card>
            ) : (
              warnings.map((warning) => (
                <Alert key={warning.id} variant={warning.severity === 'critical' ? 'destructive' : 'default'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold capitalize">{warning.signalType} Warning</span>
                        <Badge className={getSeverityColor(warning.severity)}>
                          {warning.severity}
                        </Badge>
                      </div>
                      <p>{warning.description}</p>
                      <p className="text-sm text-gray-600">
                        <strong>Recommended Action:</strong> {warning.recommendedAction}
                      </p>
                      <p className="text-xs text-gray-500">
                        Confidence: {Math.round(warning.confidence * 100)}%
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="interventions" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Learning Interventions</h3>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => generateIntervention('predictive')}
              >
                <Eye className="h-4 w-4 mr-1" />
                Predictive
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => generateIntervention('creative')}
              >
                <Palette className="h-4 w-4 mr-1" />
                Creative
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => generateIntervention('emotional')}
              >
                <Heart className="h-4 w-4 mr-1" />
                Emotional
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {interventions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Lightbulb className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No interventions generated</h3>
                  <p className="text-gray-500 text-center">
                    Generate personalized learning interventions for this student.
                  </p>
                </CardContent>
              </Card>
            ) : (
              interventions.map((intervention) => (
                <Card key={intervention.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {getInterventionIcon(intervention.interventionType)}
                      <span className="capitalize">{intervention.interventionType} Intervention</span>
                      <Badge variant={intervention.confidence > 0.7 ? "default" : "outline"}>
                        {Math.round(intervention.confidence * 100)}% Confidence
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Trigger: {intervention.trigger}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Approach</h4>
                      <p className="text-sm text-gray-600">{intervention.approach}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Expected Outcome</h4>
                      <p className="text-sm text-gray-600">{intervention.expectedOutcome}</p>
                    </div>
                    
                    {(() => {
                      const connections = Array.isArray(intervention.crossDomainConnections) 
                        ? intervention.crossDomainConnections 
                        : [];
                      return connections.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Cross-Domain Connections</h4>
                          <div className="flex flex-wrap gap-1">
                            {connections.map((connection, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {connection}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                    
                    <div>
                      <h4 className="font-semibold mb-2">Success Metrics</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {(() => {
                          const metrics = Array.isArray(intervention.successMetrics) 
                            ? intervention.successMetrics 
                            : [];
                          return metrics.map((metric, index) => (
                            <li key={index} className="flex items-center space-x-2">
                              <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                              <span>{metric}</span>
                            </li>
                          ));
                        })()}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
