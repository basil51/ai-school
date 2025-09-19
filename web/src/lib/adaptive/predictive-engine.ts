/**
 * Predictive Learning Engine
 * Revolutionary AI system that predicts learning outcomes and prevents failures
 * before they happen through advanced pattern recognition and intervention
 */

import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { NeuralPathway, LearningDimensions, LearningIntervention } from './neural-pathways';
// import { contentGenerator } from './content-generator';

const openai = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy_key_for_build' 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

// Prediction types
export interface LearningPrediction {
  id: string;
  studentId: string;
  predictionType: 'success' | 'struggle' | 'engagement' | 'retention' | 'emotional' | 'motivational';
  confidence: number; // 0-1
  predictedValue: number; // 0-1
  timeframe: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  factors: PredictionFactor[];
  interventionSuggested: boolean;
  intervention?: LearningIntervention;
  predictedAt: Date;
  actualValue?: number;
  accuracy?: number;
}

export interface PredictionFactor {
  factor: string;
  weight: number; // 0-1
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface EarlyWarningSignal {
  id: string;
  studentId: string;
  signalType: 'performance' | 'emotional' | 'behavioral' | 'engagement' | 'retention';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
  recommendedAction: string;
  detectedAt: Date;
  resolvedAt?: Date;
}

export interface LearningTrajectory {
  studentId: string;
  currentLevel: number;
  predictedLevel: number;
  confidence: number;
  timeframe: string;
  factors: string[];
  interventions: string[];
}

export class PredictiveLearningEngine {
  /**
   * Predict learning outcomes for a student
   */
  async predictLearningOutcome(
    studentId: string,
    predictionType: string,
    timeframe: string = 'short-term'
  ): Promise<LearningPrediction> {
    
    // Gather comprehensive student data
    const studentData = await this.gatherStudentData(studentId);
    
    // Analyze patterns and predict outcome
    const prediction = await this.analyzeAndPredict(studentData, predictionType, timeframe);
    
    // Store prediction in database
    await this.storePrediction(prediction);
    
    // Generate intervention if needed
    if (prediction.predictedValue < 0.6 && prediction.confidence > 0.7) {
      prediction.intervention = await this.generateIntervention(studentId, prediction);
      prediction.interventionSuggested = true;
    }
    
    return prediction;
  }

  /**
   * Detect early warning signals
   */
  async detectEarlyWarnings(studentId: string): Promise<EarlyWarningSignal[]> {
    const studentData = await this.gatherStudentData(studentId);
    const signals: EarlyWarningSignal[] = [];
    
    // Performance signals
    const performanceSignals = await this.detectPerformanceSignals(studentData);
    signals.push(...performanceSignals);
    
    // Emotional signals
    const emotionalSignals = await this.detectEmotionalSignals(studentData);
    signals.push(...emotionalSignals);
    
    // Behavioral signals
    const behavioralSignals = await this.detectBehavioralSignals(studentData);
    signals.push(...behavioralSignals);
    
    // Engagement signals
    const engagementSignals = await this.detectEngagementSignals(studentData);
    signals.push(...engagementSignals);
    
    // Store signals
    await this.storeEarlyWarnings(signals);
    
    return signals;
  }

  /**
   * Predict learning trajectory
   */
  async predictLearningTrajectory(studentId: string): Promise<LearningTrajectory> {
    const studentData = await this.gatherStudentData(studentId);
    const pathways = await this.getNeuralPathways(studentId);
    const dimensions = await this.getLearningDimensions(studentId);
    
    // Analyze current learning state
    const currentLevel = await this.calculateCurrentLevel(studentData);
    
    // Predict future trajectory
    const trajectory = await this.calculateTrajectory(
      currentLevel, 
      pathways, 
      dimensions, 
      studentData
    );
    
    return trajectory;
  }

  /**
   * Generate proactive interventions
   */
  async generateProactiveInterventions(studentId: string): Promise<LearningIntervention[]> {
    const predictions = await this.getRecentPredictions(studentId);
    const warnings = await this.getActiveWarnings(studentId);
    const pathways = await this.getNeuralPathways(studentId);
    const dimensions = await this.getLearningDimensions(studentId);
    
    const interventions: LearningIntervention[] = [];
    
    // Generate interventions based on predictions
    for (const prediction of predictions) {
      if (prediction.predictedValue < 0.6 && prediction.confidence > 0.7) {
        const intervention = await this.createIntervention(
          studentId, 
          prediction, 
          //pathways,
          dimensions
        );
        interventions.push(intervention);
      }
    }
    
    // Generate interventions based on warnings
    for (const warning of warnings) {
      if (warning.severity === 'high' || warning.severity === 'critical') {
        const intervention = await this.createWarningIntervention(
          studentId, 
          warning, 
          pathways, 
          dimensions
        );
        interventions.push(intervention);
      }
    }
    
    return interventions;
  }

  /**
   * Update predictions with actual outcomes
   */
  async updatePredictionAccuracy(predictionId: string, actualValue: number): Promise<void> {
    const prediction = await (prisma as any).predictiveAnalytics.findUnique({
      where: { id: predictionId }
    });
    
    if (prediction) {
      const accuracy = 1 - Math.abs(prediction.predictedValue - actualValue);
      
      await (prisma as any).predictiveAnalytics.update({
        where: { id: predictionId },
        data: {
          actualValue,
          accuracy,
          measuredAt: new Date()
        }
      });
    }
  }

  // Private helper methods
  private async gatherStudentData(studentId: string) {
    const [progress, attempts, responses, analytics, emotionalStates] = await Promise.all([
      prisma.studentProgress.findMany({
        where: { studentId },
        include: { lesson: { include: { topic: { include: { subject: true } } } } }
      }),
      prisma.assessmentAttempt.findMany({
        where: { studentId },
        include: { assessment: true, responses: true }
      }),
      prisma.studentResponse.findMany({
        where: { attempt: { studentId } },
        include: { question: true }
      }),
      prisma.learningAnalytics.findMany({
        where: { studentId }
      }),
      (prisma as any).emotionalState.findMany({
        where: { studentId },
        orderBy: { detectedAt: 'desc' },
        take: 10
      })
    ]);

    return { progress, attempts, responses, analytics, emotionalStates };
  }

  private async analyzeAndPredict(
    studentData: any, 
    predictionType: string, 
    timeframe: string
  ): Promise<LearningPrediction> {
    
    // If OpenAI is not available, generate sample predictions
    if (!openai) {
      return this.generateSamplePrediction(studentData, predictionType, timeframe);
    }

    const prompt = `
    Analyze this student's learning data and predict their future learning outcome.

    Student Data:
    - Progress: ${JSON.stringify(studentData.progress.slice(0, 5))}
    - Assessment Performance: ${JSON.stringify(studentData.attempts.slice(0, 5))}
    - Response Patterns: ${JSON.stringify(studentData.responses.slice(0, 10))}
    - Learning Analytics: ${JSON.stringify(studentData.analytics.slice(0, 3))}
    - Emotional States: ${JSON.stringify(studentData.emotionalStates.slice(0, 3))}

    Prediction Type: ${predictionType}
    Timeframe: ${timeframe}

    Analyze patterns and predict:
    1. Predicted Value (0-1): How well they will perform
    2. Confidence (0-1): How confident you are in this prediction
    3. Key Factors: What influences this prediction
    4. Risk Factors: What could cause problems
    5. Success Factors: What could help them succeed

    Return as JSON:
    {
      "predictedValue": number,
      "confidence": number,
      "factors": [
        {
          "factor": string,
          "weight": number,
          "impact": "positive" | "negative" | "neutral",
          "description": string
        }
      ]
    }
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.6,
        messages: [{ role: "user", content: prompt }]
      });

      const content = response.choices[0]?.message?.content || "{}";
      // Clean markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const analysis = JSON.parse(cleanContent);
      
      return {
        id: `prediction_${Date.now()}`,
        studentId: studentData.progress[0]?.studentId || '',
        predictionType: predictionType as any,
        confidence: analysis.confidence || 0.5,
        predictedValue: analysis.predictedValue || 0.5,
        timeframe: timeframe as any,
        factors: analysis.factors || [],
        interventionSuggested: false,
        predictedAt: new Date()
      };
    } catch (error) {
      console.warn('OpenAI API error, falling back to sample prediction:', error);
      return this.generateSamplePrediction(studentData, predictionType, timeframe);
    }
  }

  private generateSamplePrediction(
    studentData: any, 
    predictionType: string, 
    timeframe: string
  ): LearningPrediction {
    const studentId = studentData.progress[0]?.studentId || '';
    
    // Generate sample prediction based on available data
    const avgScore = studentData.attempts.length > 0 
      ? studentData.attempts.reduce((sum: number, attempt: any) => sum + (attempt.score || 0), 0) / studentData.attempts.length
      : 0.5;
    
    const completionRate = studentData.progress.length > 0
      ? studentData.progress.filter((p: any) => p.status === 'completed').length / studentData.progress.length
      : 0.5;

    const predictedValue = (avgScore + completionRate) / 2;
    
    return {
      id: `prediction_${Date.now()}`,
      studentId,
      predictionType: predictionType as any,
      confidence: 0.7,
      predictedValue: Math.max(0.3, Math.min(0.9, predictedValue)),
      timeframe: timeframe as any,
      factors: [
        {
          factor: 'Previous Performance',
          weight: 0.4,
          impact: avgScore > 0.7 ? 'positive' : 'negative',
          description: `Based on average score of ${Math.round(avgScore * 100)}%`
        },
        {
          factor: 'Completion Rate',
          weight: 0.3,
          impact: completionRate > 0.8 ? 'positive' : 'neutral',
          description: `Completed ${Math.round(completionRate * 100)}% of lessons`
        },
        {
          factor: 'Learning Engagement',
          weight: 0.3,
          impact: 'positive',
          description: 'Active participation in learning activities'
        }
      ],
      interventionSuggested: predictedValue < 0.6,
      predictedAt: new Date()
    };
  }

  private async detectPerformanceSignals(studentData: any): Promise<EarlyWarningSignal[]> {
    const signals: EarlyWarningSignal[] = [];
    
    // Check for declining performance
    const recentAttempts = studentData.attempts.slice(0, 5);
    if (recentAttempts.length >= 3) {
      const scores = recentAttempts.map((attempt: any) => attempt.score || 0);
      const trend = this.calculateTrend(scores);
      
      if (trend < -0.1) {
        signals.push({
          id: `perf_signal_${Date.now()}`,
          studentId: studentData.attempts[0]?.studentId || '',
          signalType: 'performance',
          severity: 'high',
          description: 'Declining performance trend detected',
          confidence: 0.8,
          recommendedAction: 'Provide additional support and review previous concepts',
          detectedAt: new Date()
        });
      }
    }
    
    // Check for repeated failures
    const failedAttempts = recentAttempts.filter((attempt: any) => !attempt.passed);
    if (failedAttempts.length >= 2) {
      signals.push({
        id: `fail_signal_${Date.now()}`,
        studentId: studentData.attempts[0]?.studentId || '',
        signalType: 'performance',
        severity: 'critical',
        description: 'Multiple consecutive failures detected',
        confidence: 0.9,
        recommendedAction: 'Immediate intervention required - alternative teaching approach needed',
        detectedAt: new Date()
      });
    }
    
    return signals;
  }

  private async detectEmotionalSignals(studentData: any): Promise<EarlyWarningSignal[]> {
    const signals: EarlyWarningSignal[] = [];
    
    const recentEmotionalStates = studentData.emotionalStates.slice(0, 3);
    if (recentEmotionalStates.length >= 2) {
      const avgStress = recentEmotionalStates.reduce((sum: number, state: any) => sum + state.stress, 0) / recentEmotionalStates.length;
      const avgFrustration = recentEmotionalStates.reduce((sum: number, state: any) => sum + state.frustration, 0) / recentEmotionalStates.length;
      
      if (avgStress > 0.7) {
        signals.push({
          id: `stress_signal_${Date.now()}`,
          studentId: studentData.emotionalStates[0]?.studentId || '',
          signalType: 'emotional',
          severity: 'high',
          description: 'High stress levels detected',
          confidence: 0.8,
          recommendedAction: 'Implement stress-reduction techniques and break down content',
          detectedAt: new Date()
        });
      }
      
      if (avgFrustration > 0.6) {
        signals.push({
          id: `frustration_signal_${Date.now()}`,
          studentId: studentData.emotionalStates[0]?.studentId || '',
          signalType: 'emotional',
          severity: 'medium',
          description: 'High frustration levels detected',
          confidence: 0.7,
          recommendedAction: 'Provide emotional support and alternative learning approaches',
          detectedAt: new Date()
        });
      }
    }
    
    return signals;
  }

  private async detectBehavioralSignals(studentData: any): Promise<EarlyWarningSignal[]> {
    const signals: EarlyWarningSignal[] = [];
    
    // Check for decreased engagement time
    const recentProgress = studentData.progress.slice(0, 5);
    if (recentProgress.length >= 3) {
      const timeSpent = recentProgress.map((p: any) => p.timeSpent || 0);
      const trend = this.calculateTrend(timeSpent);
      
      if (trend < -0.2) {
        signals.push({
          id: `engagement_signal_${Date.now()}`,
          studentId: studentData.progress[0]?.studentId || '',
          signalType: 'behavioral',
          severity: 'medium',
          description: 'Decreasing engagement time detected',
          confidence: 0.7,
          recommendedAction: 'Increase content engagement and provide more interactive elements',
          detectedAt: new Date()
        });
      }
    }
    
    return signals;
  }

  private async detectEngagementSignals(studentData: any): Promise<EarlyWarningSignal[]> {
    const signals: EarlyWarningSignal[] = [];
    
    const recentEmotionalStates = studentData.emotionalStates.slice(0, 3);
    if (recentEmotionalStates.length >= 2) {
      const avgEngagement = recentEmotionalStates.reduce((sum: number, state: any) => sum + state.engagement, 0) / recentEmotionalStates.length;
      
      if (avgEngagement < 0.4) {
        signals.push({
          id: `low_engagement_signal_${Date.now()}`,
          studentId: studentData.emotionalStates[0]?.studentId || '',
          signalType: 'engagement',
          severity: 'high',
          description: 'Low engagement levels detected',
          confidence: 0.8,
          recommendedAction: 'Implement gamification and interactive content to increase engagement',
          detectedAt: new Date()
        });
      }
    }
    
    return signals;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    return (secondAvg - firstAvg) / firstAvg;
  }

  private async storePrediction(prediction: LearningPrediction): Promise<void> {
    await (prisma as any).predictiveAnalytics.create({
      data: {
        studentId: prediction.studentId,
        predictionType: prediction.predictionType,
        confidence: prediction.confidence,
        predictedValue: prediction.predictedValue,
        factors: prediction.factors,
        interventionSuggested: prediction.interventionSuggested,
        predictedAt: prediction.predictedAt
      }
    });
  }

  private async storeEarlyWarnings(signals: EarlyWarningSignal[]): Promise<void> {
    // Store in a custom table or use existing structure
    for (const signal of signals) {
      // Implementation depends on database structure
      console.log('Early warning signal:', signal);
    }
  }

  async getNeuralPathways(studentId: string): Promise<NeuralPathway[]> {
    return await (prisma as any).neuralPathway.findMany({
      where: { studentId }
    });
  }

  async getLearningDimensions(studentId: string): Promise<LearningDimensions | null> {
    return await (prisma as any).learningDimensions.findUnique({
      where: { studentId }
    });
  }

  private async calculateCurrentLevel(studentData: any): Promise<number> {
    // Calculate current learning level based on progress and performance
    const recentAttempts = studentData.attempts.slice(0, 5);
    const avgScore = recentAttempts.reduce((sum: number, attempt: any) => sum + (attempt.score || 0), 0) / recentAttempts.length;
    
    const completedLessons = studentData.progress.filter((p: any) => p.status === 'completed').length;
    const totalLessons = studentData.progress.length;
    const completionRate = totalLessons > 0 ? completedLessons / totalLessons : 0;
    
    return (avgScore + completionRate) / 2;
  }

  private async calculateTrajectory(
    currentLevel: number,
    pathways: NeuralPathway[],
    dimensions: LearningDimensions | null,
    studentData: any
  ): Promise<LearningTrajectory> {
    
    // If OpenAI is not available, generate sample trajectory
    if (!openai) {
      return this.generateSampleTrajectory(currentLevel, pathways, studentData);
    }

    // Use AI to predict trajectory
    const prompt = `
    Predict the learning trajectory for this student.

    Current Level: ${currentLevel}
    Neural Pathways: ${JSON.stringify(pathways)}
    Learning Dimensions: ${JSON.stringify(dimensions)}
    Recent Performance: ${JSON.stringify(studentData.attempts.slice(0, 3))}

    Predict:
    1. Future learning level
    2. Confidence in prediction
    3. Timeframe for achievement
    4. Key factors influencing trajectory
    5. Recommended interventions

    Return as JSON:
    {
      "predictedLevel": number,
      "confidence": number,
      "timeframe": string,
      "factors": [string],
      "interventions": [string]
    }
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }]
      });

      const content = response.choices[0]?.message?.content || "{}";
      // Clean markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const trajectory = JSON.parse(cleanContent);
      
      return {
        studentId: studentData.progress[0]?.studentId || '',
        currentLevel,
        predictedLevel: trajectory.predictedLevel || currentLevel,
        confidence: trajectory.confidence || 0.5,
        timeframe: trajectory.timeframe || 'medium-term',
        factors: trajectory.factors || [],
        interventions: trajectory.interventions || []
      };
    } catch (error) {
      console.warn('OpenAI API error, falling back to sample trajectory:', error);
      return this.generateSampleTrajectory(currentLevel, pathways, studentData);
    }
  }

  private generateSampleTrajectory(
    currentLevel: number,
    pathways: NeuralPathway[],
    studentData: any
  ): LearningTrajectory {
    const studentId = studentData.progress[0]?.studentId || '';
    
    // Calculate predicted level based on current performance and pathways
    const avgPathwayStrength = pathways.length > 0 
      ? pathways.reduce((sum, p) => sum + p.strength, 0) / pathways.length
      : 0.5;
    
    const predictedLevel = Math.min(1, currentLevel + (avgPathwayStrength * 0.2));
    
    return {
      studentId,
      currentLevel,
      predictedLevel,
      confidence: 0.7,
      timeframe: 'medium-term',
      factors: [
        'Current learning performance',
        'Neural pathway strengths',
        'Engagement level',
        'Previous success patterns'
      ],
      interventions: [
        'Continue current learning approach',
        'Focus on strongest neural pathways',
        'Provide additional practice opportunities',
        'Monitor progress regularly'
      ]
    };
  }

  async getRecentPredictions(studentId: string): Promise<LearningPrediction[]> {
    const predictions = await (prisma as any).predictiveAnalytics.findMany({
      where: { studentId },
      orderBy: { predictedAt: 'desc' },
      take: 5
    });

    return predictions.map((p: any) => ({
      id: p.id,
      studentId: p.studentId,
      predictionType: p.predictionType as any,
      confidence: p.confidence,
      predictedValue: p.predictedValue,
      timeframe: 'short-term' as any,
      factors: p.factors as PredictionFactor[],
      interventionSuggested: p.interventionSuggested,
      predictedAt: p.predictedAt,
      actualValue: p.actualValue || undefined,
      accuracy: p.accuracy || undefined
    }));
  }

  async getActiveWarnings(_studentId: string): Promise<EarlyWarningSignal[]> {
    // Implementation depends on how warnings are stored
    return [];
  }

  private async createIntervention(
    _studentId: string,
    prediction: LearningPrediction,
    //pathways: NeuralPathway[],
    _dimensions: LearningDimensions | null
  ): Promise<LearningIntervention> {
    
    /*const strongestPathway = pathways.reduce((prev, current) => 
      prev.strength > current.strength ? prev : current
    );*/

    return {
      id: `intervention_${Date.now()}`,
      studentId: _studentId,
      // pathwayId: strongestPathway.id,
      interventionType: 'predictive',
      trigger: `Predicted ${prediction.predictionType} issue`,
      approach: 'Proactive support and alternative content',
      expectedOutcome: 'Improved learning outcomes',
      confidence: prediction.confidence,
      personalizedContent: 'Proactive support content will be generated',
      crossDomainConnections: [],
      emotionalSupport: 'Emotional support will be provided',
      successMetrics: ['Improved performance', 'Increased engagement', 'Better retention']
    };
  }

  private async createWarningIntervention(
    _studentId: string,
    warning: EarlyWarningSignal,
    pathways: NeuralPathway[],
    _dimensions: LearningDimensions | null
  ): Promise<LearningIntervention> {
    console.log('pathways', pathways);
    /*const strongestPathway = pathways.reduce((prev, current) => 
      prev.strength > current.strength ? prev : current
    );*/

    return {
      id: `warning_intervention_${Date.now()}`,
      studentId: _studentId,
      // pathwayId: strongestPathway.id,
      interventionType: 'remedial',
      trigger: warning.description,
      approach: warning.recommendedAction,
      expectedOutcome: 'Resolution of warning signal',
      confidence: warning.confidence,
      personalizedContent: 'Intervention content will be generated',
      crossDomainConnections: [],
      emotionalSupport: 'Emotional support will be provided',
      successMetrics: ['Warning resolved', 'Performance improved', 'Engagement increased']
    };
  }

  private async generateIntervention(
    studentId: string, 
    prediction: LearningPrediction
  ): Promise<LearningIntervention> {
    
    // Generate intervention based on prediction
    //const pathways = await this.getNeuralPathways(studentId);
    const dimensions = await this.getLearningDimensions(studentId);
    
    return await this.createIntervention(studentId, prediction, /*pathways,*/ dimensions);
  }
}

export const predictiveEngine = new PredictiveLearningEngine();
