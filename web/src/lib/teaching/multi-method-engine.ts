import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TeachingMethod {
  id: string;
  name: string;
  description: string;
  approach: string;
  example: string;
  effectiveness: number;
  studentPreference: number;
}

export interface MultiMethodExplanation {
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

export interface StudentMethodPreference {
  studentId: string;
  preferredMethods: {
    [method: string]: number;
  };
  successRates: {
    [method: string]: number;
  };
  lastUpdated: Date;
}

export class MultiMethodTeachingEngine {
  private teachingMethods: TeachingMethod[] = [
    {
      id: 'step-by-step',
      name: 'Step-by-Step',
      description: 'Break down complex concepts into clear, sequential steps',
      approach: 'Logical progression with clear milestones',
      example: 'First, we identify the problem. Then, we gather information...',
      effectiveness: 0.8,
      studentPreference: 0.7
    },
    {
      id: 'analogy',
      name: 'Analogy-Based',
      description: 'Use familiar concepts to explain new ideas',
      approach: 'Connect new knowledge to existing understanding',
      example: 'Think of it like a recipe - you need ingredients (data) and steps (process)...',
      effectiveness: 0.75,
      studentPreference: 0.6
    },
    {
      id: 'story-based',
      name: 'Story-Based',
      description: 'Present concepts through engaging narratives',
      approach: 'Contextual learning through storytelling',
      example: 'Once upon a time, there was a young mathematician who discovered...',
      effectiveness: 0.7,
      studentPreference: 0.8
    },
    {
      id: 'simplified',
      name: 'Simplified',
      description: 'Present concepts in the most basic terms possible',
      approach: 'Remove complexity to focus on core understanding',
      example: 'At its simplest, this concept means...',
      effectiveness: 0.85,
      studentPreference: 0.9
    },
    {
      id: 'advanced',
      name: 'Advanced',
      description: 'Present concepts with full complexity and depth',
      approach: 'Comprehensive coverage with technical details',
      example: 'From a theoretical perspective, this involves complex mathematical principles...',
      effectiveness: 0.6,
      studentPreference: 0.4
    }
  ];

  /**
   * Generate multiple teaching methods for a given lesson content
   */
  async generateMultiMethodExplanations(
    lessonContent: string,
    studentId: string,
    subject: string,
    topic: string
  ): Promise<MultiMethodExplanation> {
    try {
      // Get student's method preferences
      const studentPreferences = await this.getStudentMethodPreferences(studentId);
      
      // Generate explanations using different methods
      const explanations = await this.generateExplanations(lessonContent, subject, topic);
      
      // Determine recommended method based on student preferences and content type
      const recommendedMethod = this.determineRecommendedMethod(
        studentPreferences,
        subject,
        //topic,
        //explanations
      );

      // Calculate effectiveness scores
      const effectiveness = this.calculateEffectiveness(explanations, studentPreferences);

      return {
        originalContent: lessonContent,
        methods: explanations,
        recommendedMethod,
        effectiveness
      };
    } catch (error) {
      console.error('Error generating multi-method explanations:', error);
      throw new Error('Failed to generate multi-method explanations');
    }
  }

  /**
   * Generate explanations using different teaching methods
   */
  private async generateExplanations(
    content: string,
    subject: string,
    topic: string
  ): Promise<MultiMethodExplanation['methods']> {
    const prompt = `
      Generate 5 different explanations for the following educational content using different teaching methods:

      Subject: ${subject}
      Topic: ${topic}
      Content: ${content}

      Please provide explanations using these methods:

      1. Step-by-Step: Break down the concept into clear, sequential steps
      2. Analogy: Use familiar concepts to explain the new idea
      3. Story-Based: Present the concept through an engaging narrative
      4. Simplified: Present the concept in the most basic terms possible
      5. Advanced: Present the concept with full complexity and technical depth

      Return as JSON:
      {
        "stepByStep": "explanation here",
        "analogy": "explanation here", 
        "storyBased": "explanation here",
        "simplified": "explanation here",
        "advanced": "explanation here"
      }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content creator who specializes in adapting explanations to different learning styles and teaching methods.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  /**
   * Get student's method preferences and success rates
   */
  async getStudentMethodPreferences(studentId: string): Promise<StudentMethodPreference> {
    try {
      // Get student's learning analytics
      const analytics = await prisma.learningAnalytics.findMany({
        where: { studentId },
        orderBy: { dateRange: 'desc' },
        take: 30 // Last 30 days
      });

      // Get student's assessment attempts with method tracking
      const assessments = await prisma.assessmentAttempt.findMany({
        where: { studentId },
        include: {
          assessment: {
            include: {
              lesson: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      // Calculate preferences based on performance
      const preferences: { [method: string]: number } = {};
      const successRates: { [method: string]: number } = {};

      // Initialize with default values
      this.teachingMethods.forEach(method => {
        preferences[method.id] = method.studentPreference;
        successRates[method.id] = 0.5;
      });

      // Analyze performance data to adjust preferences
      if (analytics.length > 0) {
        const avgEngagement = analytics.reduce((sum, a) => sum + (a.timeSpent / 30), 0) / analytics.length;
        const avgMastery = analytics.reduce((sum, a) => sum + (a.conceptsMastered / 10), 0) / analytics.length;

        // Adjust preferences based on engagement and mastery
        if (avgEngagement > 0.7) {
          preferences['story-based'] += 0.1;
          preferences['analogy'] += 0.05;
        }
        if (avgMastery > 0.8) {
          preferences['step-by-step'] += 0.1;
          preferences['simplified'] += 0.05;
        }
      }

      // Analyze assessment performance
      if (assessments.length > 0) {
        const passedAssessments = assessments.filter(a => a.passed);
        const overallSuccessRate = passedAssessments.length / assessments.length;

        // Adjust success rates based on performance
        if (overallSuccessRate > 0.8) {
          successRates['step-by-step'] = 0.9;
          successRates['simplified'] = 0.85;
        } else if (overallSuccessRate < 0.6) {
          successRates['advanced'] = 0.3;
          successRates['simplified'] = 0.7;
        }
      }

      return {
        studentId,
        preferredMethods: preferences,
        successRates,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting student method preferences:', error);
      // Return default preferences
      const defaultPreferences: { [method: string]: number } = {};
      const defaultSuccessRates: { [method: string]: number } = {};
      
      this.teachingMethods.forEach(method => {
        defaultPreferences[method.id] = method.studentPreference;
        defaultSuccessRates[method.id] = 0.5;
      });

      return {
        studentId,
        preferredMethods: defaultPreferences,
        successRates: defaultSuccessRates,
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Determine the recommended teaching method for a student
   */
  private determineRecommendedMethod(
    preferences: StudentMethodPreference,
    subject: string,
    //topic: string,
    //explanations: MultiMethodExplanation['methods']
  ): string {
    // Subject-specific method preferences
    const subjectPreferences: { [subject: string]: string[] } = {
      'Mathematics': ['step-by-step', 'simplified', 'analogy'],
      'Physics': ['analogy', 'step-by-step', 'story-based'],
      'Chemistry': ['step-by-step', 'analogy', 'simplified'],
      'Biology': ['story-based', 'analogy', 'simplified'],
      'History': ['story-based', 'analogy', 'step-by-step'],
      'Literature': ['story-based', 'analogy', 'advanced'],
      'Art': ['story-based', 'analogy', 'simplified']
    };

    // Get subject-specific methods
    const subjectMethods = subjectPreferences[subject] || ['step-by-step', 'simplified', 'analogy'];

    // Score each method based on student preferences and subject suitability
    const methodScores: { [method: string]: number } = {};
    
    this.teachingMethods.forEach(method => {
      let score = 0;
      
      // Base preference score
      score += preferences.preferredMethods[method.id] * 0.4;
      
      // Success rate score
      score += preferences.successRates[method.id] * 0.3;
      
      // Subject suitability score
      const subjectRank = subjectMethods.indexOf(method.id);
      if (subjectRank !== -1) {
        score += (subjectMethods.length - subjectRank) * 0.1;
      }
      
      // Method effectiveness score
      score += method.effectiveness * 0.2;
      
      methodScores[method.id] = score;
    });

    // Return the method with the highest score
    return Object.keys(methodScores).reduce((a, b) => 
      methodScores[a] > methodScores[b] ? a : b
    );
  }

  /**
   * Calculate effectiveness scores for each method
   */
  private calculateEffectiveness(
    explanations: MultiMethodExplanation['methods'],
    preferences: StudentMethodPreference
  ): { [method: string]: number } {
    const effectiveness: { [method: string]: number } = {};
    
    Object.keys(explanations).forEach(method => {
      // Base effectiveness from method definition
      const methodDef = this.teachingMethods.find(m => m.id === method);
      let score = methodDef?.effectiveness || 0.5;
      
      // Adjust based on student preferences
      score += preferences.preferredMethods[method] * 0.3;
      
      // Adjust based on success rates
      score += preferences.successRates[method] * 0.2;
      
      effectiveness[method] = Math.min(1, Math.max(0, score));
    });
    
    return effectiveness;
  }

  /**
   * Record student's choice of teaching method
   */
  async recordStudentChoice(
    studentId: string,
    lessonId: string,
    chosenMethod: string,
    success: boolean,
    timeSpent: number
  ): Promise<void> {
    try {
      // Update student's method preferences based on choice and outcome
      const preferences = await this.getStudentMethodPreferences(studentId);
      
      // Adjust preference for chosen method
      if (success) {
        preferences.preferredMethods[chosenMethod] = Math.min(1, 
          preferences.preferredMethods[chosenMethod] + 0.05
        );
        preferences.successRates[chosenMethod] = Math.min(1,
          preferences.successRates[chosenMethod] + 0.1
        );
      } else {
        preferences.preferredMethods[chosenMethod] = Math.max(0,
          preferences.preferredMethods[chosenMethod] - 0.02
        );
      }

      // Store the choice in database (you might want to create a new table for this)
      await prisma.studentProgress.upsert({
        where: {
          studentId_lessonId: {
            studentId,
            lessonId
          }
        },
        update: {
          timeSpent: { increment: timeSpent },
          attempts: { increment: 1 },
          updatedAt: new Date()
        },
        create: {
          studentId,
          lessonId,
          timeSpent,
          attempts: 1,
          status: success ? 'completed' : 'in_progress'
        }
      });

      // Update learning analytics
      await this.updateLearningAnalytics(studentId, chosenMethod, success, timeSpent);
      
    } catch (error) {
      console.error('Error recording student choice:', error);
    }
  }

  /**
   * Update learning analytics based on method choice
   */
  private async updateLearningAnalytics(
    studentId: string,
    method: string,
    success: boolean,
    timeSpent: number
  ): Promise<void> {
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
        timeSpent: { increment: timeSpent },
        conceptsMastered: success ? { increment: 1 } : undefined,
        updatedAt: new Date()
      },
      create: {
        studentId,
        dateRange: today,
        timeSpent,
        conceptsMastered: success ? 1 : 0,
        assessmentScores: success ? [1.0] : [0.0],
        strugglingTopics: success ? [] : ['current_topic'],
        improvingTopics: success ? ['current_topic'] : []
      }
    });
  }

  /**
   * Get available teaching methods
   */
  getTeachingMethods(): TeachingMethod[] {
    return this.teachingMethods;
  }

  /**
   * Get method effectiveness statistics
   */
  async getMethodEffectivenessStats(): Promise<{
    [method: string]: {
      totalUsage: number;
      successRate: number;
      avgTimeSpent: number;
      studentSatisfaction: number;
    };
  }> {
    // This would typically query the database for real statistics
    // For now, return mock data
    const stats: { [method: string]: any } = {};
    
    this.teachingMethods.forEach(method => {
      stats[method.id] = {
        totalUsage: Math.floor(Math.random() * 1000) + 100,
        successRate: method.effectiveness + (Math.random() - 0.5) * 0.2,
        avgTimeSpent: Math.floor(Math.random() * 30) + 15,
        studentSatisfaction: method.studentPreference + (Math.random() - 0.5) * 0.2
      };
    });
    
    return stats;
  }
}
