import { prisma } from '../prisma';
import { LearningAnalyticsEngine, PersonalizedContent, LearningPattern } from './learning-analytics';
import { User, Lesson, StudentProgress, NeuralPathway, LearningDimensions, EmotionalState } from '@prisma/client';

export interface PersonalizationContext {
  student: User;
  currentLesson: Lesson;
  learningPattern: LearningPattern;
  neuralPathways: NeuralPathway[];
  learningDimensions: LearningDimensions | null;
  recentEmotionalState: EmotionalState | null;
  previousAttempts: StudentProgress[];
  crossDomainConnections: any[];
}

export interface AdaptiveContent {
  originalContent: string;
  adaptedContent: string;
  adaptationReason: string;
  contentType: string;
  difficulty: string;
  pacing: string;
  modality: string;
  reinforcement: string;
  emotionalSupport: string;
  crossDomainConnections: string[];
  expectedOutcome: string;
  confidence: number;
}

export interface LearningIntervention {
  id: string;
  type: 'predictive' | 'remedial' | 'accelerative' | 'creative' | 'emotional';
  trigger: string;
  approach: string;
  expectedOutcome: string;
  confidence: number;
  personalizedContent: string;
  crossDomainConnections: string[];
  emotionalSupport: string;
  successMetrics: string[];
  isActive: boolean;
}

export class PersonalizationEngine {
  private analyticsEngine: LearningAnalyticsEngine;

  constructor() {
    this.analyticsEngine = new LearningAnalyticsEngine();
  }

  /**
   * Generate personalized content for a student and lesson
   */
  async generatePersonalizedContent(
    studentId: string,
    lessonId: string
  ): Promise<AdaptiveContent> {
    // Get personalization context
    const context = await this.getPersonalizationContext(studentId, lessonId);
    
    // Get the original lesson content
    const originalContent = context.currentLesson.content;
    
    // Generate personalized content based on learning pattern
    const personalizedContent = await this.analyticsEngine.predictOptimalContent(
      context.student,
      //context.currentLesson
    );
    
    // Adapt the content based on personalization data
    const adaptedContent = await this.adaptContent(originalContent, personalizedContent, context);
    
    // Generate adaptation reason
    const adaptationReason = this.generateAdaptationReason(context);
    
    // Calculate confidence in the adaptation
    const confidence = this.calculateAdaptationConfidence(context);

    return {
      originalContent,
      adaptedContent,
      adaptationReason,
      contentType: personalizedContent.contentType,
      difficulty: personalizedContent.difficulty,
      pacing: personalizedContent.pacing,
      modality: personalizedContent.modality,
      reinforcement: personalizedContent.reinforcement,
      emotionalSupport: personalizedContent.emotionalSupport,
      crossDomainConnections: personalizedContent.crossDomainConnections,
      expectedOutcome: personalizedContent.expectedOutcome,
      confidence
    };
  }

  /**
   * Create learning interventions for struggling students
   */
  async createLearningInterventions(
    studentId: string,
    strugglingConcepts: string[]
  ): Promise<LearningIntervention[]> {
    const student = await prisma.user.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Get recommended interventions from analytics engine
    const recommendedInterventions = await this.analyticsEngine.recommendInterventions(
      student,
      strugglingConcepts
    );

    // Create interventions in database
    const createdInterventions = await Promise.all(
      recommendedInterventions.map(async (intervention) => {
        const created = await prisma.learningIntervention.create({
          data: {
            studentId: intervention.studentId,
            interventionType: intervention.interventionType as any,
            trigger: intervention.trigger,
            approach: intervention.approach,
            expectedOutcome: intervention.expectedOutcome,
            confidence: intervention.confidence,
            personalizedContent: intervention.personalizedContent,
            crossDomainConnections: intervention.crossDomainConnections,
            emotionalSupport: intervention.emotionalSupport,
            successMetrics: intervention.successMetrics,
            isActive: intervention.isActive
          }
        });

        return {
          id: created.id,
          type: created.interventionType,
          trigger: created.trigger,
          approach: created.approach,
          expectedOutcome: created.expectedOutcome,
          confidence: created.confidence,
          personalizedContent: created.personalizedContent,
          crossDomainConnections: created.crossDomainConnections,
          emotionalSupport: created.emotionalSupport,
          successMetrics: created.successMetrics,
          isActive: created.isActive
        };
      })
    );

    return createdInterventions;
  }

  /**
   * Update learning memory based on student performance
   */
  async updateLearningMemory(
    studentId: string,
    lessonId: string,
    performance: {
      timeSpent: number;
      attempts: number;
      success: boolean;
      engagement: number;
      emotionalState: any;
    }
  ): Promise<void> {
    // Update student progress
    await prisma.studentProgress.upsert({
      where: {
        studentId_lessonId: {
          studentId,
          lessonId
        }
      },
      update: {
        status: performance.success ? 'completed' : 'in_progress',
        timeSpent: performance.timeSpent,
        attempts: performance.attempts,
        updatedAt: new Date()
      },
      create: {
        studentId,
        lessonId,
        status: performance.success ? 'completed' : 'in_progress',
        timeSpent: performance.timeSpent,
        attempts: performance.attempts
      }
    });

    // Update emotional state
    if (performance.emotionalState) {
      await prisma.emotionalState.create({
        data: {
          studentId,
          confidence: performance.emotionalState.confidence || 0.5,
          stress: performance.emotionalState.stress || 0.3,
          engagement: performance.engagement,
          motivation: performance.emotionalState.motivation || 0.6,
          curiosity: performance.emotionalState.curiosity || 0.5,
          frustration: performance.emotionalState.frustration || 0.2,
          joy: performance.emotionalState.joy || 0.4,
          context: `Lesson: ${lessonId}`
        }
      });
    }

    // Update neural pathways based on performance
    await this.updateNeuralPathways(studentId, performance);

    // Update learning analytics
    await this.updateLearningAnalytics(studentId, performance);

    // Update personalization data
    await this.updatePersonalizationData(studentId, lessonId, performance);
  }

  /**
   * Get personalized learning recommendations
   */
  async getPersonalizedRecommendations(studentId: string): Promise<{
    nextLessons: any[];
    studySchedule: any[];
    contentPreferences: any[];
    interventionSuggestions: any[];
  }> {
    // Get student's learning pattern
    const timeframe = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: new Date()
    };
    
    const learningPattern = await this.analyticsEngine.analyzeLearningPattern(studentId, timeframe);
    
    // Get student's current progress
    const currentProgress = await prisma.studentProgress.findMany({
      where: { studentId },
      include: {
        lesson: {
          include: {
            topic: {
              include: {
                subject: true
              }
            }
          }
        }
      }
    });

    // Recommend next lessons based on learning pattern
    const nextLessons = await this.recommendNextLessons(studentId, learningPattern, currentProgress);
    
    // Generate study schedule based on optimal times
    const studySchedule = this.generateStudySchedule(learningPattern.optimalStudyTimes, learningPattern.engagementPatterns);
    
    // Get content preferences
    const contentPreferences = learningPattern.preferredContentTypes;
    
    // Get intervention suggestions
    const interventionSuggestions = await this.getInterventionSuggestions(studentId, learningPattern);

    return {
      nextLessons,
      studySchedule,
      contentPreferences,
      interventionSuggestions
    };
  }

  /**
   * Analyze learning effectiveness and suggest improvements
   */
  async analyzeLearningEffectiveness(studentId: string): Promise<{
    strengths: string[];
    weaknesses: string[];
    improvementSuggestions: string[];
    personalizedStrategies: any[];
  }> {
    const timeframe = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: new Date()
    };
    
    const learningPattern = await this.analyticsEngine.analyzeLearningPattern(studentId, timeframe);
    
    // Analyze strengths and weaknesses
    const strengths = [
      ...learningPattern.conceptualStrengths,
      ...learningPattern.proceduralStrengths
    ];
    
    const weaknesses = learningPattern.commonMistakes;
    
    // Generate improvement suggestions
    const improvementSuggestions = this.generateImprovementSuggestions(learningPattern);
    
    // Get personalized strategies
    const personalizedStrategies = learningPattern.effectiveStrategies;

    return {
      strengths,
      weaknesses,
      improvementSuggestions,
      personalizedStrategies
    };
  }

  // Private helper methods

  private async getPersonalizationContext(studentId: string, lessonId: string): Promise<PersonalizationContext> {
    const [student, currentLesson, neuralPathways, learningDimensions, recentEmotionalState, previousAttempts, crossDomainConnections] = await Promise.all([
      prisma.user.findUnique({ where: { id: studentId } }),
      prisma.lesson.findUnique({ 
        where: { id: lessonId },
        include: {
          topic: {
            include: {
              subject: true
            }
          }
        }
      }),
      prisma.neuralPathway.findMany({ where: { studentId } }),
      prisma.learningDimensions.findUnique({ where: { studentId } }),
      prisma.emotionalState.findFirst({
        where: { studentId },
        orderBy: { detectedAt: 'desc' }
      }),
      prisma.studentProgress.findMany({
        where: { studentId },
        include: {
          lesson: {
            include: {
              topic: {
                include: {
                  subject: true
                }
              }
            }
          }
        }
      }),
      prisma.crossDomainConnection.findMany({
        where: { studentId },
        orderBy: { strength: 'desc' },
        take: 5
      })
    ]);

    if (!student || !currentLesson) {
      throw new Error('Student or lesson not found');
    }

    // Get learning pattern
    const timeframe = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: new Date()
    };
    
    const learningPattern = await this.analyticsEngine.analyzeLearningPattern(studentId, timeframe);

    return {
      student,
      currentLesson,
      learningPattern,
      neuralPathways,
      learningDimensions,
      recentEmotionalState,
      previousAttempts,
      crossDomainConnections
    };
  }

  private async adaptContent(
    originalContent: string,
    personalizedContent: PersonalizedContent,
    context: PersonalizationContext
  ): Promise<string> {
    // This is a simplified content adaptation
    // In a real implementation, this would use AI to generate personalized content
    console.log(context);
    let adaptedContent = originalContent;
    
    // Add emotional support
    if (personalizedContent.emotionalSupport) {
      adaptedContent = `${personalizedContent.emotionalSupport}\n\n${adaptedContent}`;
    }
    
    // Add cross-domain connections
    if (personalizedContent.crossDomainConnections.length > 0) {
      const connectionsText = `\n\nRelated concepts: ${personalizedContent.crossDomainConnections.join(', ')}`;
      adaptedContent += connectionsText;
    }
    
    // Add personalized introduction based on learning style
    const introduction = this.generatePersonalizedIntroduction(personalizedContent);
    adaptedContent = `${introduction}\n\n${adaptedContent}`;
    
    return adaptedContent;
  }

  private generatePersonalizedIntroduction(
    personalizedContent: PersonalizedContent,
    //context: PersonalizationContext
  ): string {
    const { modality, difficulty, pacing } = personalizedContent;
    
    let introduction = `Let's explore this concept using your preferred ${modality} approach. `;
    
    if (difficulty === 'beginner') {
      introduction += "We'll start with the basics and build up gradually. ";
    } else if (difficulty === 'advanced') {
      introduction += "Since you're ready for advanced concepts, we'll dive deeper into the details. ";
    }
    
    if (pacing === 'slow') {
      introduction += "Take your time to understand each part before moving on. ";
    } else if (pacing === 'fast') {
      introduction += "We'll move through this efficiently while ensuring you grasp the key concepts. ";
    }
    
    return introduction;
  }

  private generateAdaptationReason(context: PersonalizationContext): string {
    const reasons = [];
    
    if ((context.recentEmotionalState?.stress || 0) > 0.7) {
      reasons.push("High stress levels detected - using supportive approach");
    }
    
    if (context.learningPattern.learningVelocity < 0.5) {
      reasons.push("Slower learning pace - adjusting difficulty and pacing");
    }
    
    if (context.learningPattern.retentionRate < 0.6) {
      reasons.push("Lower retention rate - increasing reinforcement");
    }
    
    const strongestPathway = context.neuralPathways.reduce((strongest, current) => 
      current.strength > strongest.strength ? current : strongest
    );
    
    if (strongestPathway) {
      reasons.push(`Optimizing for ${strongestPathway.pathwayType} processing pattern`);
    }
    
    return reasons.join('; ') || "Standard personalization based on learning profile";
  }

  private calculateAdaptationConfidence(
    context: PersonalizationContext,
    //personalizedContent: PersonalizedContent
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on learning pattern strength
    confidence += context.learningPattern.learningVelocity * 0.2;
    confidence += context.learningPattern.retentionRate * 0.2;
    
    // Increase confidence based on neural pathway strength
    const avgPathwayStrength = context.neuralPathways.reduce((sum, pathway) => 
      sum + pathway.strength, 0) / context.neuralPathways.length;
    confidence += avgPathwayStrength * 0.1;
    
    // Decrease confidence if emotional state is concerning
    if ((context.recentEmotionalState?.stress || 0) > 0.8) {
      confidence -= 0.2;
    }
    
    return Math.min(1, Math.max(0, confidence));
  }

  private async updateNeuralPathways(studentId: string, performance: any): Promise<void> {
    // Update neural pathways based on performance
    // This is a simplified update - in reality, this would be more sophisticated
    
    const pathways = await prisma.neuralPathway.findMany({
      where: { studentId }
    });
    
    for (const pathway of pathways) {
      let newStrength = pathway.strength;
      
      if (performance.success) {
        newStrength += 0.05; // Increase strength for successful learning
      } else {
        newStrength -= 0.02; // Slightly decrease for unsuccessful attempts
      }
      
      // Update learning velocity based on time spent
      if (performance.timeSpent > 0) {
        const timeEfficiency = 1 / (performance.timeSpent / 30); // Assuming 30 minutes is optimal
        pathway.learningVelocity = Math.min(1, pathway.learningVelocity + (timeEfficiency - 1) * 0.1);
      }
      
      // Update retention rate based on success
      if (performance.success) {
        pathway.retentionRate = Math.min(1, pathway.retentionRate + 0.05);
      }
      
      await prisma.neuralPathway.update({
        where: { id: pathway.id },
        data: {
          strength: Math.min(1, Math.max(0, newStrength)),
          learningVelocity: pathway.learningVelocity,
          retentionRate: pathway.retentionRate,
          lastUpdated: new Date()
        }
      });
    }
  }

  private async updateLearningAnalytics(studentId: string, performance: any): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await prisma.learningAnalytics.upsert({
      where: {
        studentId_dateRange: {
          studentId,
          dateRange: today
        }
      },
      update: {
        timeSpent: { increment: performance.timeSpent },
        conceptsMastered: performance.success ? { increment: 1 } : undefined,
        updatedAt: new Date()
      },
      create: {
        studentId,
        dateRange: today,
        timeSpent: performance.timeSpent,
        conceptsMastered: performance.success ? 1 : 0,
        assessmentScores: performance.success ? [1.0] : [0.0],
        strugglingTopics: performance.success ? [] : ['current_topic'],
        improvingTopics: performance.success ? ['current_topic'] : []
      }
    });
  }

  private async updatePersonalizationData(
    studentId: string,
    lessonId: string,
    performance: any
  ): Promise<void> {
    // Update personalization data based on performance
    const personalizationData = await prisma.personalizationData.findUnique({
      where: { studentId }
    });
    
    if (personalizationData) {
      // Update effective strategies based on success
      const effectiveStrategies = personalizationData.effectiveStrategies as unknown as any[];
      if (performance.success && effectiveStrategies.length > 0) {
        // Increase effectiveness of current strategy
        effectiveStrategies[0].effectiveness = Math.min(1, effectiveStrategies[0].effectiveness + 0.05);
      }
      
      await prisma.personalizationData.update({
        where: { studentId },
        data: {
          effectiveStrategies: effectiveStrategies,
          updatedAt: new Date()
        }
      });
    }
  }

  private async recommendNextLessons(
    studentId: string,
    learningPattern: LearningPattern,
    currentProgress: any[]
  ): Promise<any[]> {
    // Get completed lessons
    const completedLessons = currentProgress
      .filter(p => p.status === 'completed')
      .map(p => p.lessonId);
    
    // Get available lessons (not completed)
    const availableLessons = await prisma.lesson.findMany({
      where: {
        id: { notIn: completedLessons },
        isActive: true
      },
      include: {
        topic: {
          include: {
            subject: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });
    
    // Filter lessons based on prerequisites
    const recommendedLessons = availableLessons.filter(lesson => {
      // Check if prerequisites are met
      console.log(lesson);
      return true; // Simplified - would check actual prerequisites
    });
    
    return recommendedLessons.slice(0, 5); // Return top 5 recommendations
  }

  private generateStudySchedule(optimalTimes: string[], engagementPatterns: any[]): any[] {
    const schedule: any[] = [];
    
    optimalTimes.forEach(time => {
      const pattern = engagementPatterns.find(p => p.timeOfDay === time);
      if (pattern) {
        schedule.push({
          timeOfDay: time,
          duration: pattern.optimalDuration,
          engagementLevel: pattern.engagementLevel,
          recommended: true
        });
      }
    });
    
    return schedule;
  }

  private async getInterventionSuggestions(studentId: string, learningPattern: LearningPattern): Promise<any[]> {
    const suggestions: any[] = [];
    
    if (learningPattern.learningVelocity < 0.5) {
      suggestions.push({
        type: 'pacing',
        suggestion: 'Consider slowing down the learning pace to improve comprehension',
        priority: 'high'
      });
    }
    
    if (learningPattern.retentionRate < 0.6) {
      suggestions.push({
        type: 'reinforcement',
        suggestion: 'Increase practice and review sessions to improve retention',
        priority: 'medium'
      });
    }
    
    if (learningPattern.commonMistakes.length > 2) {
      suggestions.push({
        type: 'remedial',
        suggestion: 'Focus on addressing common mistakes with targeted practice',
        priority: 'high'
      });
    }
    
    return suggestions;
  }

  private generateImprovementSuggestions(learningPattern: LearningPattern): string[] {
    const suggestions: string[] = [];
    
    if (learningPattern.learningVelocity < 0.6) {
      suggestions.push('Practice breaking down complex problems into smaller steps');
    }
    
    if (learningPattern.retentionRate < 0.7) {
      suggestions.push('Use spaced repetition techniques for better long-term retention');
    }
    
    if (learningPattern.engagementPatterns.length === 0) {
      suggestions.push('Try studying at different times to find your optimal learning window');
    }
    
    if (learningPattern.effectiveStrategies.length < 2) {
      suggestions.push('Experiment with different learning approaches to find what works best');
    }
    
    return suggestions;
  }
}
