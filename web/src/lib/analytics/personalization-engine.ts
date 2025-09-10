import { prisma } from '@/lib/prisma';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Types for learning patterns and personalization
export interface LearningPattern {
  conceptualStrengths: string[];
  proceduralStrengths: string[];
  commonMistakes: string[];
  effectiveStrategies: TeachingStrategy[];
  optimalStudyTimes: string[];
  preferredContentTypes: ContentType[];
  learningVelocity: number;
  retentionRate: number;
  engagementPattern: EngagementPattern;
  difficultyPreference: number;
  socialLearningStyle: SocialLearningStyle;
}

export interface TeachingStrategy {
  type: 'visual' | 'auditory' | 'kinesthetic' | 'analytical' | 'intuitive';
  approach: string;
  effectiveness: number;
  context: string;
}

export interface ContentType {
  type: 'text' | 'visual' | 'audio' | 'interactive' | 'simulation' | 'video';
  preference: number;
  effectiveness: number;
}

export interface EngagementPattern {
  peakHours: string[];
  averageSessionLength: number;
  engagementTriggers: string[];
  disengagementSignals: string[];
  optimalPacing: 'slow' | 'moderate' | 'fast';
}

export interface SocialLearningStyle {
  collaborationPreference: number;
  competitionPreference: number;
  mentorshipPreference: number;
  independencePreference: number;
}

export interface PersonalizedContent {
  content: string;
  contentType: ContentType;
  difficulty: number;
  estimatedTime: number;
  learningObjectives: string[];
  prerequisites: string[];
  assessmentStrategy: string;
}

export interface Intervention {
  type: 'remedial' | 'accelerative' | 'motivational' | 'social' | 'cognitive';
  strategy: string;
  expectedOutcome: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration: number;
}

export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

export class PersonalizationEngine {
  /**
   * Analyze learning patterns for a student over a specific timeframe
   */
  async analyzeLearningPattern(
    studentId: string,
    timeframe: TimeRange
  ): Promise<LearningPattern> {
    try {
      // Gather comprehensive data about the student's learning
      const [
        progressData,
        assessmentData,
        engagementData,
        timeData,
        contentData
      ] = await Promise.all([
        this.getProgressData(studentId, timeframe),
        this.getAssessmentData(studentId, timeframe),
        this.getEngagementData(studentId, timeframe),
        this.getTimeData(studentId, timeframe),
        this.getContentData(studentId, timeframe)
      ]);

      // Use AI to analyze patterns
      const analysisPrompt = `
        Analyze the following learning data for student ${studentId} and identify patterns:

        Progress Data: ${JSON.stringify(progressData)}
        Assessment Data: ${JSON.stringify(assessmentData)}
        Engagement Data: ${JSON.stringify(engagementData)}
        Time Data: ${JSON.stringify(timeData)}
        Content Data: ${JSON.stringify(contentData)}

        Please provide a comprehensive learning pattern analysis including:
        1. Conceptual strengths (areas of strong understanding)
        2. Procedural strengths (areas of strong skill application)
        3. Common mistakes (frequently made errors)
        4. Effective teaching strategies (what works best)
        5. Optimal study times (when learning is most effective)
        6. Preferred content types (visual, audio, text, interactive)
        7. Learning velocity (speed of learning)
        8. Retention rate (how well they retain information)
        9. Engagement patterns (when and how they engage)
        10. Difficulty preference (preferred challenge level)
        11. Social learning style (collaborative vs independent)

        Return as a JSON object with the structure defined in the LearningPattern interface.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational psychologist specializing in learning pattern analysis. Provide detailed, actionable insights about student learning patterns.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const patternData = JSON.parse(response.choices[0].message.content || '{}');

      // Store the learning pattern in the database
      await prisma.learningPattern.upsert({
        where: {
          studentId_patternType: {
            studentId,
            patternType: 'COGNITIVE_PROCESSING'
          }
        },
        update: {
          conceptualStrengths: patternData.conceptualStrengths || [],
          proceduralStrengths: patternData.proceduralStrengths || [],
          commonMistakes: patternData.commonMistakes || [],
          effectiveStrategies: patternData.effectiveStrategies || [],
          optimalStudyTimes: patternData.optimalStudyTimes || [],
          preferredContentTypes: patternData.preferredContentTypes || [],
          learningVelocity: patternData.learningVelocity || 0.5,
          retentionRate: patternData.retentionRate || 0.5,
          engagementPattern: patternData.engagementPattern || {},
          difficultyPreference: patternData.difficultyPreference || 0.5,
          socialLearningStyle: patternData.socialLearningStyle || {}
        },
        create: {
          studentId,
          patternType: 'COGNITIVE_PROCESSING',
          conceptualStrengths: patternData.conceptualStrengths || [],
          proceduralStrengths: patternData.proceduralStrengths || [],
          commonMistakes: patternData.commonMistakes || [],
          effectiveStrategies: patternData.effectiveStrategies || [],
          optimalStudyTimes: patternData.optimalStudyTimes || [],
          preferredContentTypes: patternData.preferredContentTypes || [],
          learningVelocity: patternData.learningVelocity || 0.5,
          retentionRate: patternData.retentionRate || 0.5,
          engagementPattern: patternData.engagementPattern || {},
          difficultyPreference: patternData.difficultyPreference || 0.5,
          socialLearningStyle: patternData.socialLearningStyle || {}
        }
      });

      return patternData;
    } catch (error) {
      console.error('Error analyzing learning pattern:', error);
      throw new Error('Failed to analyze learning pattern');
    }
  }

  /**
   * Predict optimal content for a specific student and upcoming lesson
   */
  async predictOptimalContent(
    studentId: string,
    upcomingLesson: any
  ): Promise<PersonalizedContent> {
    try {
      // Get student's learning pattern
      const learningPattern = await prisma.learningPattern.findFirst({
        where: { studentId }
      });

      if (!learningPattern) {
        throw new Error('No learning pattern found for student');
      }

      // Get recent performance data
      const recentPerformance = await this.getRecentPerformance(studentId);

      const predictionPrompt = `
        Based on the student's learning pattern and recent performance, predict the optimal content for this upcoming lesson:

        Student Learning Pattern: ${JSON.stringify(learningPattern)}
        Recent Performance: ${JSON.stringify(recentPerformance)}
        Upcoming Lesson: ${JSON.stringify(upcomingLesson)}

        Please provide personalized content recommendations including:
        1. Content type (text, visual, audio, interactive, simulation, video)
        2. Difficulty level (0-1 scale)
        3. Estimated time to complete
        4. Learning objectives
        5. Prerequisites
        6. Assessment strategy

        Return as a JSON object with the PersonalizedContent structure.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content designer specializing in personalized learning. Create optimal content recommendations based on individual learning patterns.'
          },
          {
            role: 'user',
            content: predictionPrompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1500
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Error predicting optimal content:', error);
      throw new Error('Failed to predict optimal content');
    }
  }

  /**
   * Recommend specific interventions for struggling students
   */
  async recommendInterventions(
    studentId: string,
    strugglingConcepts: string[]
  ): Promise<Intervention[]> {
    try {
      // Get comprehensive student data
      const [
        learningPattern,
        recentPerformance,
        emotionalState,
        learningGaps
      ] = await Promise.all([
        prisma.learningPattern.findFirst({ where: { studentId } }),
        this.getRecentPerformance(studentId),
        this.getEmotionalState(studentId),
        this.getLearningGaps(studentId)
      ]);

      const interventionPrompt = `
        Based on the student's data, recommend specific interventions for these struggling concepts: ${strugglingConcepts.join(', ')}

        Learning Pattern: ${JSON.stringify(learningPattern)}
        Recent Performance: ${JSON.stringify(recentPerformance)}
        Emotional State: ${JSON.stringify(emotionalState)}
        Learning Gaps: ${JSON.stringify(learningGaps)}

        Please provide intervention recommendations including:
        1. Intervention type (remedial, accelerative, motivational, social, cognitive)
        2. Specific strategy
        3. Expected outcome
        4. Confidence level (0-1)
        5. Priority level (low, medium, high, urgent)
        6. Estimated duration

        Return as an array of Intervention objects.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational intervention specialist. Provide specific, actionable intervention strategies for struggling students.'
          },
          {
            role: 'user',
            content: interventionPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      return JSON.parse(response.choices[0].message.content || '[]');
    } catch (error) {
      console.error('Error recommending interventions:', error);
      throw new Error('Failed to recommend interventions');
    }
  }

  /**
   * Analyze learning curve for a student in a specific subject
   */
  async analyzeLearningCurve(
    studentId: string,
    subjectId: string
  ): Promise<any> {
    try {
      const progressData = await prisma.studentProgress.findMany({
        where: {
          studentId,
          lesson: {
            topic: {
              subjectId
            }
          }
        },
        include: {
          lesson: {
            include: {
              topic: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      const assessmentData = await prisma.assessmentAttempt.findMany({
        where: {
          studentId,
          assessment: {
            lesson: {
              topic: {
                subjectId
              }
            }
          }
        },
        include: {
          assessment: {
            include: {
              lesson: {
                include: {
                  topic: true
                }
              }
            }
          }
        },
        orderBy: {
          startedAt: 'asc'
        }
      });

      // Calculate learning curve metrics
      const dataPoints = this.calculateLearningCurveDataPoints(progressData, assessmentData);
      const slope = this.calculateLearningSlope(dataPoints);
      const plateauPoints = this.identifyPlateauPoints(dataPoints);
      const accelerationZones = this.identifyAccelerationZones(dataPoints);
      const difficultySpikes = this.identifyDifficultySpikes(dataPoints);

      // Store learning curve analysis
      const existingCurve = await prisma.learningCurve.findFirst({
        where: {
          studentId,
          subjectId,
          curveType: 'MASTERY_CURVE'
        }
      });

      const learningCurve = existingCurve 
        ? await prisma.learningCurve.update({
            where: { id: existingCurve.id },
            data: {
              dataPoints,
              slope,
              plateauPoints,
              accelerationZones,
              difficultySpikes,
              confidence: this.calculateConfidence(dataPoints)
            }
          })
        : await prisma.learningCurve.create({
            data: {
              studentId,
              subjectId,
              curveType: 'MASTERY_CURVE',
              dataPoints,
              slope,
              plateauPoints,
              accelerationZones,
              difficultySpikes,
              confidence: this.calculateConfidence(dataPoints)
            }
          });

      return learningCurve;
    } catch (error) {
      console.error('Error analyzing learning curve:', error);
      throw new Error('Failed to analyze learning curve');
    }
  }

  // Helper methods for data gathering
  private async getProgressData(studentId: string, timeframe: TimeRange) {
    return await prisma.studentProgress.findMany({
      where: {
        studentId,
        createdAt: {
          gte: timeframe.startDate,
          lte: timeframe.endDate
        }
      },
      include: {
        lesson: {
          include: {
            topic: true
          }
        }
      }
    });
  }

  private async getAssessmentData(studentId: string, timeframe: TimeRange) {
    return await prisma.assessmentAttempt.findMany({
      where: {
        studentId,
        startedAt: {
          gte: timeframe.startDate,
          lte: timeframe.endDate
        }
      },
      include: {
        assessment: {
          include: {
            lesson: {
              include: {
                topic: true
              }
            }
          }
        }
      }
    });
  }

  private async getEngagementData(studentId: string, timeframe: TimeRange) {
    return await prisma.engagementOptimization.findMany({
      where: {
        studentId,
        timestamp: {
          gte: timeframe.startDate,
          lte: timeframe.endDate
        }
      }
    });
  }

  private async getTimeData(studentId: string, timeframe: TimeRange) {
    return await prisma.studentProgress.findMany({
      where: {
        studentId,
        createdAt: {
          gte: timeframe.startDate,
          lte: timeframe.endDate
        }
      },
      select: {
        timeSpent: true,
        startedAt: true,
        completedAt: true
      }
    });
  }

  private async getContentData(studentId: string, timeframe: TimeRange) {
    return await prisma.lessonAdaptation.findMany({
      where: {
        studentId,
        createdAt: {
          gte: timeframe.startDate,
          lte: timeframe.endDate
        }
      }
    });
  }

  private async getRecentPerformance(studentId: string) {
    return await prisma.assessmentAttempt.findMany({
      where: { studentId },
      orderBy: { startedAt: 'desc' },
      take: 10,
      include: {
        assessment: {
          include: {
            lesson: {
              include: {
                topic: true
              }
            }
          }
        }
      }
    });
  }

  private async getEmotionalState(studentId: string) {
    return await prisma.emotionalState.findMany({
      where: { studentId },
      orderBy: { detectedAt: 'desc' },
      take: 5
    });
  }

  private async getLearningGaps(studentId: string) {
    return await prisma.learningGap.findMany({
      where: { studentId, isResolved: false }
    });
  }

  // Helper methods for learning curve analysis
  private calculateLearningCurveDataPoints(progressData: any[], assessmentData: any[]) {
    const dataPoints = [];
    
    // Combine progress and assessment data
    const combinedData = [...progressData, ...assessmentData].sort((a, b) => 
      new Date(a.createdAt || a.startedAt).getTime() - new Date(b.createdAt || b.startedAt).getTime()
    );

    let cumulativeMastery = 0;
    let totalConcepts = 0;

    for (const dataPoint of combinedData) {
      if (dataPoint.status === 'completed' || dataPoint.passed) {
        cumulativeMastery += 1;
      }
      totalConcepts += 1;

      dataPoints.push({
        time: new Date(dataPoint.createdAt || dataPoint.startedAt),
        mastery: totalConcepts > 0 ? cumulativeMastery / totalConcepts : 0,
        difficulty: dataPoint.lesson?.difficulty || 'intermediate'
      });
    }

    return dataPoints;
  }

  private calculateLearningSlope(dataPoints: any[]): number {
    if (dataPoints.length < 2) return 0;

    const firstPoint = dataPoints[0];
    const lastPoint = dataPoints[dataPoints.length - 1];
    
    const timeDiff = lastPoint.time.getTime() - firstPoint.time.getTime();
    const masteryDiff = lastPoint.mastery - firstPoint.mastery;
    
    return timeDiff > 0 ? masteryDiff / (timeDiff / (1000 * 60 * 60 * 24)) : 0; // mastery per day
  }

  private identifyPlateauPoints(dataPoints: any[]): any[] {
    const plateauPoints = [];
    const windowSize = 3;
    
    for (let i = windowSize; i < dataPoints.length - windowSize; i++) {
      const window = dataPoints.slice(i - windowSize, i + windowSize + 1);
      const masteryValues = window.map(p => p.mastery);
      const variance = this.calculateVariance(masteryValues);
      
      if (variance < 0.01) { // Low variance indicates plateau
        plateauPoints.push(dataPoints[i]);
      }
    }
    
    return plateauPoints;
  }

  private identifyAccelerationZones(dataPoints: any[]): any[] {
    const accelerationZones = [];
    
    for (let i = 1; i < dataPoints.length; i++) {
      const prevPoint = dataPoints[i - 1];
      const currentPoint = dataPoints[i];
      
      const timeDiff = currentPoint.time.getTime() - prevPoint.time.getTime();
      const masteryDiff = currentPoint.mastery - prevPoint.mastery;
      
      const velocity = timeDiff > 0 ? masteryDiff / (timeDiff / (1000 * 60 * 60 * 24)) : 0;
      
      if (velocity > 0.1) { // High learning velocity
        accelerationZones.push(currentPoint);
      }
    }
    
    return accelerationZones;
  }

  private identifyDifficultySpikes(dataPoints: any[]): any[] {
    const difficultySpikes = [];
    
    for (let i = 1; i < dataPoints.length; i++) {
      const prevPoint = dataPoints[i - 1];
      const currentPoint = dataPoints[i];
      
      if (currentPoint.mastery < prevPoint.mastery - 0.1) { // Significant drop in mastery
        difficultySpikes.push(currentPoint);
      }
    }
    
    return difficultySpikes;
  }

  private calculateConfidence(dataPoints: any[]): number {
    if (dataPoints.length < 5) return 0.3;
    if (dataPoints.length < 10) return 0.6;
    return 0.9;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
}

export const personalizationEngine = new PersonalizationEngine();
