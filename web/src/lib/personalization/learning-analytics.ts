import { prisma } from '../prisma';
import { User } from '@prisma/client';

export interface LearningPattern {
  conceptualStrengths: string[];
  proceduralStrengths: string[];
  commonMistakes: string[];
  effectiveStrategies: TeachingStrategy[];
  optimalStudyTimes: string[];
  preferredContentTypes: ContentType[];
  learningVelocity: number;
  retentionRate: number;
  engagementPatterns: EngagementPattern[];
}

export interface TeachingStrategy {
  approach: 'visual' | 'auditory' | 'kinesthetic' | 'analytical' | 'creative' | 'collaborative';
  modality: 'text' | 'math' | 'diagram' | 'video' | 'interactive' | 'simulation' | '3d' | 'advanced-3d' | 'd3-advanced';
  pacing: 'slow' | 'moderate' | 'fast' | 'adaptive';
  reinforcement: 'minimal' | 'moderate' | 'extensive';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  effectiveness: number; // 0-1 score
}

export interface ContentType {
  type: 'text' | 'math' | 'diagram' | 'simulation' | 'video' | 'interactive' | '3d' | 'advanced-3d' | 'd3-advanced';
  preference: number; // 0-1 preference score
  effectiveness: number; // 0-1 effectiveness score
}

export interface EngagementPattern {
  timeOfDay: string;
  dayOfWeek: string;
  sessionLength: number; // minutes
  engagementLevel: number; // 0-1
  optimalDuration: number; // minutes
}

export interface PersonalizedContent {
  contentType: string;
  difficulty: string;
  pacing: string;
  modality: string;
  reinforcement: string;
  emotionalSupport: string;
  crossDomainConnections: string[];
  expectedOutcome: string;
}

export class LearningAnalyticsEngine {
  /**
   * Analyze learning patterns for a student over a specific timeframe
   */
  async analyzeLearningPattern(
    studentId: string,
    timeframe: { start: Date; end: Date }
  ): Promise<LearningPattern> {
    // Get all learning data for the timeframe
    const [progress, assessments, analytics, emotionalStates] = await Promise.all([
      prisma.studentProgress.findMany({
        where: {
          studentId,
          createdAt: {
            gte: timeframe.start,
            lte: timeframe.end
          }
        },
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
      prisma.assessmentAttempt.findMany({
        where: {
          studentId,
          createdAt: {
            gte: timeframe.start,
            lte: timeframe.end
          }
        },
        include: {
          assessment: {
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
          },
          responses: {
            include: {
              question: true
            }
          }
        }
      }),
      prisma.learningAnalytics.findMany({
        where: {
          studentId,
          dateRange: {
            gte: timeframe.start,
            lte: timeframe.end
          }
        }
      }),
      prisma.emotionalState.findMany({
        where: {
          studentId,
          detectedAt: {
            gte: timeframe.start,
            lte: timeframe.end
          }
        }
      })
    ]);

    // Analyze conceptual strengths
    const conceptualStrengths = this.analyzeConceptualStrengths(assessments);
    
    // Analyze procedural strengths
    const proceduralStrengths = this.analyzeProceduralStrengths(progress);
    
    // Identify common mistakes
    const commonMistakes = this.identifyCommonMistakes(assessments);
    
    // Determine effective strategies
    const effectiveStrategies = await this.determineEffectiveStrategies(studentId, assessments, progress);
    
    // Analyze optimal study times
    const optimalStudyTimes = this.analyzeOptimalStudyTimes(emotionalStates);
    
    // Determine preferred content types
    const preferredContentTypes = await this.determinePreferredContentTypes(studentId, progress);
    
    // Calculate learning velocity
    const learningVelocity = this.calculateLearningVelocity(progress);
    
    // Calculate retention rate
    const retentionRate = this.calculateRetentionRate(assessments);
    
    // Analyze engagement patterns
    const engagementPatterns = this.analyzeEngagementPatterns(emotionalStates);

    return {
      conceptualStrengths,
      proceduralStrengths,
      commonMistakes,
      effectiveStrategies,
      optimalStudyTimes,
      preferredContentTypes,
      learningVelocity,
      retentionRate,
      engagementPatterns
    };
  }

  /**
   * Predict optimal content for a specific student and upcoming lesson
   */
  async predictOptimalContent(
    student: User,
    upcomingLesson: any
  ): Promise<PersonalizedContent> {
    // Get student's learning pattern
    const timeframe = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: new Date()
    };
    
    const learningPattern = await this.analyzeLearningPattern(student.id, timeframe);
    
    // Get student's neural pathways
    const neuralPathways = await prisma.neuralPathway.findMany({
      where: { studentId: student.id }
    });
    
    // Get student's learning dimensions
    const learningDimensions = await prisma.learningDimensions.findUnique({
      where: { studentId: student.id }
    });
    
    // Get recent emotional state
    const recentEmotionalState = await prisma.emotionalState.findFirst({
      where: { studentId: student.id },
      orderBy: { detectedAt: 'desc' }
    });

    // Determine optimal content type based on learning pattern
    const bestContentType = this.selectOptimalContentType(learningPattern.preferredContentTypes);
    
    // Determine difficulty based on learning velocity and recent performance
    const difficulty = this.determineOptimalDifficulty(learningPattern.learningVelocity);
    
    // Determine pacing based on engagement patterns
    const pacing = this.determineOptimalPacing(learningPattern.engagementPatterns, recentEmotionalState);
    
    // Select modality based on neural pathways
    const modality = this.selectOptimalModality(neuralPathways);
    
    // Determine reinforcement level
    const reinforcement = this.determineReinforcementLevel(learningPattern.retentionRate, learningPattern.commonMistakes);
    
    // Generate emotional support
    const emotionalSupport = this.generateEmotionalSupport(recentEmotionalState);
    
    // Find cross-domain connections
    const crossDomainConnections = await this.findCrossDomainConnections(student.id, upcomingLesson);
    
    // Predict expected outcome
    const expectedOutcome = this.predictExpectedOutcome(learningPattern, neuralPathways, upcomingLesson);

    return {
      contentType: bestContentType,
      difficulty,
      pacing,
      modality,
      reinforcement,
      emotionalSupport,
      crossDomainConnections,
      expectedOutcome
    };
  }

  /**
   * Recommend specific interventions for struggling students
   */
  async recommendInterventions(
    student: User,
    strugglingConcepts: string[]
  ): Promise<any[]> {
    const interventions = [];
    
    // Get student's learning pattern
    const timeframe = {
      start: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Last 14 days
      end: new Date()
    };
    
    const learningPattern = await this.analyzeLearningPattern(student.id, timeframe);
    
    // Get neural pathways
    const neuralPathways = await prisma.neuralPathway.findMany({
      where: { studentId: student.id }
    });
    
    // Get recent emotional state
    const recentEmotionalState = await prisma.emotionalState.findFirst({
      where: { studentId: student.id },
      orderBy: { detectedAt: 'desc' }
    });

    for (const concept of strugglingConcepts) {
      // Determine intervention type based on failure analysis
      const interventionType = this.determineInterventionType(concept, learningPattern, recentEmotionalState);
      
      // Generate personalized approach
      const approach = this.generatePersonalizedApproach(concept, learningPattern, neuralPathways);
      
      // Create intervention
      const intervention = {
        studentId: student.id,
        interventionType,
        trigger: `Struggling with concept: ${concept}`,
        approach,
        expectedOutcome: `Mastery of ${concept} through personalized approach`,
        confidence: this.calculateInterventionConfidence(learningPattern, neuralPathways),
        personalizedContent: await this.generatePersonalizedContent(concept, learningPattern),
        crossDomainConnections: await this.findCrossDomainConnections(student.id, { topic: concept }),
        emotionalSupport: this.generateEmotionalSupport(recentEmotionalState),
        successMetrics: [`Understanding of ${concept}`, 'Engagement level', 'Retention rate'],
        isActive: true
      };
      
      interventions.push(intervention);
    }

    return interventions;
  }

  // Private helper methods

  private analyzeConceptualStrengths(assessments: any[]): string[] {
    const strengths: { [key: string]: number } = {};
    
    assessments.forEach(attempt => {
      if (attempt.passed) {
        const subject = attempt.assessment.lesson.topic.subject.name;
        strengths[subject] = (strengths[subject] || 0) + 1;
      }
    });
    
    return Object.entries(strengths)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([subject]) => subject);
  }

  private analyzeProceduralStrengths(progress: any[]): string[] {
    const strengths: { [key: string]: number } = {};
    
    progress.forEach(p => {
      if (p.status === 'completed' && p.timeSpent > 0) {
        const topic = p.lesson.topic.name;
        const efficiency = p.lesson.estimatedTime / p.timeSpent;
        strengths[topic] = (strengths[topic] || 0) + efficiency;
      }
    });
    
    return Object.entries(strengths)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic);
  }

  private identifyCommonMistakes(assessments: any[]): string[] {
    const mistakes: { [key: string]: number } = {};
    
    assessments.forEach(attempt => {
      attempt.responses.forEach((response: any) => {
        if (!response.isCorrect) {
          const questionType = response.question.type;
          mistakes[questionType] = (mistakes[questionType] || 0) + 1;
        }
      });
    });
    
    return Object.entries(mistakes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([mistake]) => mistake);
  }

  private async determineEffectiveStrategies(
    studentId: string,
    assessments: any[],
    progress: any[]
  ): Promise<TeachingStrategy[]> {
    // Get personalization data
    const personalizationData = await prisma.personalizationData.findUnique({
      where: { studentId }
    });
    
    if (personalizationData?.effectiveStrategies) {
      return personalizationData.effectiveStrategies as unknown as TeachingStrategy[];
    }
    
    // Analyze from assessment and progress data
    const strategies: TeachingStrategy[] = [];
    
    // Analyze successful attempts to determine effective strategies
    const successfulAttempts = assessments.filter(a => a.passed);
    
    if (successfulAttempts.length > 0) {
      // Determine most effective approach
      const approach = this.analyzeEffectiveApproach(successfulAttempts);
      const modality = this.analyzeEffectiveModality(progress);
      const pacing = this.analyzeEffectivePacing(progress);
      
      strategies.push({
        approach,
        modality,
        pacing,
        reinforcement: 'moderate',
        difficulty: 'intermediate',
        effectiveness: 0.8
      });
    }
    
    return strategies;
  }

  private analyzeOptimalStudyTimes(emotionalStates: any[]): string[] {
    const timePatterns: { [key: string]: { engagement: number; count: number } } = {};
    
    emotionalStates.forEach(state => {
      const hour = new Date(state.detectedAt).getHours();
      const timeSlot = this.getTimeSlot(hour);
      
      if (!timePatterns[timeSlot]) {
        timePatterns[timeSlot] = { engagement: 0, count: 0 };
      }
      
      timePatterns[timeSlot].engagement += state.engagement;
      timePatterns[timeSlot].count += 1;
    });
    
    return Object.entries(timePatterns)
      .map(([time, data]) => ({
        time,
        avgEngagement: data.engagement / data.count
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 3)
      .map(item => item.time);
  }

  private async determinePreferredContentTypes(
    studentId: string,
    progress: any[]
  ): Promise<ContentType[]> {
    const personalizationData = await prisma.personalizationData.findUnique({
      where: { studentId }
    });
    
    if (personalizationData?.contentPreferences) {
      return personalizationData.contentPreferences as unknown as ContentType[];
    }
    
    // Analyze from progress data
    const contentTypes: ContentType[] = [
      { type: 'text', preference: 0.5, effectiveness: 0.5 },
      { type: 'math', preference: 0.5, effectiveness: 0.5 },
      { type: 'diagram', preference: 0.5, effectiveness: 0.5 },
      { type: 'simulation', preference: 0.5, effectiveness: 0.5 },
      { type: 'video', preference: 0.5, effectiveness: 0.5 },
      { type: 'interactive', preference: 0.5, effectiveness: 0.5 },
      { type: '3d', preference: 0.5, effectiveness: 0.5 },
      { type: 'advanced-3d', preference: 0.5, effectiveness: 0.5 },
      { type: 'd3-advanced', preference: 0.5, effectiveness: 0.5 }
    ];
    
    // Adjust based on progress data
    progress.forEach(p => {
      if (p.status === 'completed') {
        // This is a simplified analysis - in reality, we'd track content types used
        contentTypes.forEach(ct => {
          ct.effectiveness += 0.1; // Increase effectiveness for completed lessons
        });
      }
    });
    
    return contentTypes;
  }

  private calculateLearningVelocity(progress: any[]): number {
    const completedLessons = progress.filter(p => p.status === 'completed');
    const totalTime = completedLessons.reduce((sum, p) => sum + p.timeSpent, 0);
    const totalLessons = completedLessons.length;
    
    if (totalLessons === 0) return 0.5;
    
    const avgTimePerLesson = totalTime / totalLessons;
    const avgEstimatedTime = completedLessons.reduce((sum, p) => sum + p.lesson.estimatedTime, 0) / totalLessons;
    
    // Learning velocity is inverse of time ratio (faster = higher velocity)
    return Math.min(1, avgEstimatedTime / avgTimePerLesson);
  }

  private calculateRetentionRate(assessments: any[]): number {
    if (assessments.length === 0) return 0.5;
    
    const passedAssessments = assessments.filter(a => a.passed);
    const retentionRate = passedAssessments.length / assessments.length;
    
    return retentionRate;
  }

  private analyzeEngagementPatterns(emotionalStates: any[]): EngagementPattern[] {
    const patterns: { [key: string]: EngagementPattern } = {};
    
    emotionalStates.forEach(state => {
      const date = new Date(state.detectedAt);
      const timeOfDay = this.getTimeSlot(date.getHours());
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const key = `${dayOfWeek}-${timeOfDay}`;
      
      if (!patterns[key]) {
        patterns[key] = {
          timeOfDay,
          dayOfWeek,
          sessionLength: 0,
          engagementLevel: 0,
          optimalDuration: 30
        };
      }
      
      patterns[key].engagementLevel += state.engagement;
      patterns[key].sessionLength += 1; // Simplified - would track actual session length
    });
    
    return Object.values(patterns).map(pattern => ({
      ...pattern,
      engagementLevel: pattern.engagementLevel / Math.max(1, pattern.sessionLength),
      optimalDuration: Math.min(60, Math.max(15, pattern.sessionLength * 5))
    }));
  }

  private selectOptimalContentType(contentTypes: ContentType[]): string {
    const bestType = contentTypes.reduce((best, current) => 
      (current.preference * current.effectiveness) > (best.preference * best.effectiveness) ? current : best
    );
    
    return bestType.type;
  }

  private determineOptimalDifficulty(learningVelocity: number): string {
    if (learningVelocity > 0.8) return 'advanced';
    if (learningVelocity > 0.6) return 'intermediate';
    return 'beginner';
  }

  private determineOptimalPacing(engagementPatterns: EngagementPattern[], emotionalState: any): string {
    if (emotionalState?.stress > 0.7) return 'slow';
    if (emotionalState?.engagement > 0.8) return 'fast';
    return 'moderate';
  }

  private selectOptimalModality(neuralPathways: any[]): string {
    // Find strongest neural pathway
    const strongestPathway = neuralPathways.reduce((strongest, current) => 
      current.strength > strongest.strength ? current : strongest
    );
    
    switch (strongestPathway?.pathwayType) {
      case 'sequential': return 'text';
      case 'parallel': return 'interactive';
      case 'hierarchical': return 'diagram';
      case 'network': return 'd3-advanced';
      case 'hybrid': return 'advanced-3d';
      default: return 'interactive';
    }
  }

  private determineReinforcementLevel(retentionRate: number, commonMistakes: string[]): string {
    if (retentionRate < 0.6 || commonMistakes.length > 2) return 'extensive';
    if (retentionRate < 0.8) return 'moderate';
    return 'minimal';
  }

  private generateEmotionalSupport(emotionalState: any): string {
    if ((emotionalState?.stress || 0) > 0.7) {
      return "Take a deep breath. Learning is a journey, and it's okay to find some concepts challenging. Let's break this down into smaller, manageable steps.";
    }
    
    if ((emotionalState?.confidence || 0.5) < 0.4) {
      return "You've got this! Remember your past successes and the progress you've made. Every expert was once a beginner.";
    }
    
    if ((emotionalState?.frustration || 0) > 0.6) {
      return "I can see this is challenging. Let's try a different approach that might work better for your learning style.";
    }
    
    return "Great job staying engaged! Let's continue building on your strengths and tackle this new concept together.";
  }

  private async findCrossDomainConnections(studentId: string, lesson: any): Promise<string[]> {
    const connections = await prisma.crossDomainConnection.findMany({
      where: { studentId },
      orderBy: { strength: 'desc' },
      take: 3
    });
    
    return connections.map(conn => `${conn.sourceDomain} → ${conn.targetDomain}`);
  }

  private predictExpectedOutcome(
    learningPattern: LearningPattern,
    neuralPathways: any[],
    lesson: any
  ): string {
    const baseConfidence = learningPattern.learningVelocity * learningPattern.retentionRate;
    const pathwayBoost = neuralPathways.reduce((sum, pathway) => sum + pathway.strength, 0) / neuralPathways.length;
    
    const overallConfidence = (baseConfidence + pathwayBoost) / 2;
    
    if (overallConfidence > 0.8) {
      return "High confidence in mastery with this personalized approach";
    } else if (overallConfidence > 0.6) {
      return "Good likelihood of understanding with additional support";
    } else {
      return "Will need extra attention and alternative teaching methods";
    }
  }

  private determineInterventionType(concept: string, learningPattern: LearningPattern, emotionalState: any): string {
    if ((emotionalState?.stress || 0) > 0.7) return 'emotional';
    if (learningPattern.learningVelocity < 0.4) return 'remedial';
    if (learningPattern.retentionRate < 0.5) return 'predictive';
    return 'accelerative';
  }

  private generatePersonalizedApproach(concept: string, learningPattern: LearningPattern, neuralPathways: any[]): string {
    const bestStrategy = learningPattern.effectiveStrategies[0];
    const strongestPathway = neuralPathways.reduce((strongest, current) => 
      current.strength > strongest.strength ? current : strongest
    );
    
    return `Using ${bestStrategy?.approach || 'visual'} approach with ${strongestPathway?.pathwayType || 'sequential'} processing pattern for ${concept}`;
  }

  private calculateInterventionConfidence(learningPattern: LearningPattern, neuralPathways: any[]): number {
    const strategyConfidence = learningPattern.effectiveStrategies.reduce((sum, strategy) => 
      sum + strategy.effectiveness, 0) / learningPattern.effectiveStrategies.length;
    
    const pathwayConfidence = neuralPathways.reduce((sum, pathway) => 
      sum + pathway.strength, 0) / neuralPathways.length;
    
    return (strategyConfidence + pathwayConfidence) / 2;
  }

  private async generatePersonalizedContent(concept: string, learningPattern: LearningPattern): Promise<string> {
    const bestStrategy = learningPattern.effectiveStrategies[0];
    const bestContentType = learningPattern.preferredContentTypes[0];
    
    return `Personalized content for ${concept} using ${bestStrategy?.approach || 'visual'} approach with ${bestContentType?.type || 'interactive'} modality, adapted for ${bestStrategy?.pacing || 'moderate'} pacing and ${bestStrategy?.reinforcement || 'moderate'} reinforcement level.`;
  }

  private analyzeEffectiveApproach(successfulAttempts: any[]): 'visual' | 'auditory' | 'kinesthetic' | 'analytical' | 'creative' | 'collaborative' {
    // Simplified analysis - in reality, we'd track which approaches were used
    return 'visual';
  }

  private analyzeEffectiveModality(progress: any[]): 'text' | 'video' | 'interactive' | 'simulation' | '3d' | 'advanced-3d' | 'd3-advanced' {
    // Simplified analysis - in reality, we'd track which modalities were used
    return 'interactive';
  }

  private analyzeEffectivePacing(progress: any[]): 'slow' | 'moderate' | 'fast' | 'adaptive' {
    const avgTimeRatio = progress.reduce((sum, p) => {
      if (p.status === 'completed' && p.timeSpent > 0) {
        return sum + (p.lesson.estimatedTime / p.timeSpent);
      }
      return sum;
    }, 0) / progress.length;
    
    if (avgTimeRatio > 1.2) return 'fast';
    if (avgTimeRatio < 0.8) return 'slow';
    return 'moderate';
  }

  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }
}
