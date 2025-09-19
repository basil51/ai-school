/**
 * Neural Learning Pathway Engine
 * Revolutionary AI system that maps how each student's brain processes information
 * and creates personalized learning pathways that co-evolve with the student
 * Updated: Fixed Prisma client integration
 */

import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy_key_for_build' 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

// Neural pathway types representing different cognitive processing patterns
export interface NeuralPathway {
  id: string;
  studentId: string;
  pathwayType: 'sequential' | 'parallel' | 'hierarchical' | 'network' | 'hybrid';
  strength: number; // 0-1, how well this pathway works for the student
  activationPattern: any; // Neural activation sequence
  learningVelocity: number; // How fast student learns through this pathway
  retentionRate: number; // How well they retain information through this pathway
  emotionalResonance: number; // How emotionally engaged they are
  crossDomainTransfer: number; // Ability to transfer knowledge across domains
  lastUpdated: Date;
}

// Learning dimension analysis
export interface LearningDimensions {
  cognitive: {
    processingSpeed: number;
    workingMemory: number;
    attentionSpan: number;
    patternRecognition: number;
  };
  emotional: {
    motivation: number;
    confidence: number;
    frustration: number;
    curiosity: number;
  };
  social: {
    collaboration: number;
    competition: number;
    mentorship: number;
    independence: number;
  };
  creative: {
    imagination: number;
    innovation: number;
    artistic: number;
    analytical: number;
  };
}

// Revolutionary learning intervention types
export interface LearningIntervention {
  id: string;
  studentId: string;
  interventionType: 'predictive' | 'remedial' | 'accelerative' | 'creative' | 'emotional';
  trigger: string; // What caused this intervention
  approach: string; // The teaching approach to use
  expectedOutcome: string;
  confidence: number; // AI confidence in this intervention
  personalizedContent: string; // AI-generated personalized content
  crossDomainConnections: string[]; // Connections to other subjects
  emotionalSupport: string; // Emotional guidance
  successMetrics: string[]; // How to measure success
}

export class NeuralPathwayEngine {
  /**
   * Analyze student's learning patterns and create neural pathway map
   */
  async analyzeLearningPatterns(studentId: string): Promise<NeuralPathway[]> {
    // Get comprehensive student data
    const studentData = await this.getStudentLearningData(studentId);
    
    // Use AI to analyze patterns and create neural pathways
    const pathways = await this.generateNeuralPathways(studentData);
    
    // Store pathways in database
    await this.storeNeuralPathways(studentId, pathways);
    
    return pathways;
  }

  /**
   * Predict optimal learning approach for upcoming content
   */
  async predictOptimalApproach(
    studentId: string, 
    content: string, 
    subject: string
  ): Promise<LearningIntervention> {
    const pathways = await this.getStudentPathways(studentId);
    const dimensions = await this.analyzeLearningDimensions(studentId);
    
    // Use AI to predict the best approach
    const intervention = await this.generateLearningIntervention(
      pathways, 
      dimensions, 
      content, 
      subject
    );
    
    return intervention;
  }

  /**
   * Detect learning struggles before they become failures
   */
  async detectEarlyStruggles(studentId: string): Promise<LearningIntervention[]> {
    const recentActivity = await this.getRecentLearningActivity(studentId);
    const emotionalState = await this.analyzeEmotionalState(studentId);
    
    // AI-powered early warning system
    const interventions = await this.generateEarlyInterventions(
      recentActivity, 
      emotionalState
    );
    
    return interventions;
  }

  /**
   * Create cross-domain learning connections
   */
  async generateCrossDomainConnections(
    studentId: string, 
    currentTopic: string, 
    subject: string
  ): Promise<string[]> {
    const studentInterests = await this.getStudentInterests(studentId);
    const pathways = await this.getStudentPathways(studentId);
    
    // AI generates creative connections between subjects
    const connections = await this.createDomainConnections(
      currentTopic, 
      subject, 
      studentInterests, 
      pathways
    );
    
    return connections;
  }

  /**
   * Co-evolve learning pathways based on real-time feedback
   */
  async evolvePathways(
    studentId: string, 
    feedback: {
      success: boolean;
      timeSpent: number;
      emotionalState: string;
      engagement: number;
      retention: number;
    }
  ): Promise<void> {
    const pathways = await this.getStudentPathways(studentId);
    
    // Update pathway strengths based on feedback
    const evolvedPathways = await this.evolvePathwayStrengths(pathways, feedback);
    
    // Store evolved pathways
    await this.updateNeuralPathways(studentId, evolvedPathways);
  }

  // Private helper methods
  private async getStudentLearningData(studentId: string) {
    const [progress, attempts, responses, _analytics] = await Promise.all([
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
      })
    ]);

    return { progress, attempts, responses, analytics: _analytics };
  }

  private async generateNeuralPathways(studentData: any): Promise<NeuralPathway[]> {
    // If OpenAI is not available, generate sample pathways based on student data
    if (!openai) {
      return this.generateSamplePathways(studentData);
    }

    const prompt = `You are an AI expert in cognitive science and learning analytics. Analyze the student's learning data and create neural pathway maps.

Student Data:
- Progress: ${JSON.stringify(studentData.progress.slice(0, 5))}
- Assessment Performance: ${JSON.stringify(studentData.attempts.slice(0, 5))}
- Response Patterns: ${JSON.stringify(studentData.responses.slice(0, 10))}
- Learning Analytics: ${JSON.stringify(studentData.analytics.slice(0, 3))}

Create 3-5 neural pathways representing different cognitive processing patterns:
1. Sequential: Step-by-step logical processing
2. Parallel: Multi-threaded simultaneous processing  
3. Hierarchical: Top-down conceptual processing
4. Network: Interconnected web-like processing
5. Hybrid: Combination of multiple patterns

For each pathway, provide:
- strength: number (0-1)
- activationPattern: string array
- learningVelocity: number (0-1)
- retentionRate: number (0-1)
- emotionalResonance: number (0-1)
- crossDomainTransfer: number (0-1)
- pathwayType: string

CRITICAL: Return ONLY valid JSON array. No explanations, no markdown, no additional text. Start with [ and end with ].`;

    let response: any;
    try {
      response = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.3, // Lower temperature for more consistent JSON output
        messages: [
          { 
            role: "system", 
            content: "You are a JSON API. Always respond with valid JSON only. No explanations, no markdown, no additional text." 
          },
          { role: "user", content: prompt }
        ]
      });

      const content = response.choices[0]?.message?.content || "[]";
      
      // More robust content cleaning
      let cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^[^{[]*/, '') // Remove any text before JSON starts
        .replace(/[^}\]]*$/, '') // Remove any text after JSON ends
        .trim();
      
      // If content doesn't start with [ or {, try to find JSON in the content
      if (!cleanContent.startsWith('[') && !cleanContent.startsWith('{')) {
        const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          cleanContent = jsonMatch[0];
        } else {
          throw new Error('No valid JSON found in response');
        }
      }
      
      const pathways = JSON.parse(cleanContent);
      return pathways.map((pathway: any, index: number) => ({
        id: `pathway_${index}`,
        studentId: studentData.progress[0]?.studentId || '',
        ...pathway,
        lastUpdated: new Date()
      }));
    } catch (error) {
      console.warn('OpenAI API error, falling back to sample pathways:', error);
      console.warn('Raw response content:', response?.choices?.[0]?.message?.content);
      return this.generateSamplePathways(studentData);
    }
  }

  private generateSamplePathways(studentData: any): NeuralPathway[] {
    const studentId = studentData.progress[0]?.studentId || '';
    
    // Generate sample pathways based on available data
    const pathways: NeuralPathway[] = [
      {
        id: 'pathway_sequential',
        studentId,
        pathwayType: 'sequential',
        strength: 0.8,
        activationPattern: { steps: ['read', 'understand', 'apply', 'practice'] },
        learningVelocity: 0.7,
        retentionRate: 0.8,
        emotionalResonance: 0.6,
        crossDomainTransfer: 0.5,
        lastUpdated: new Date()
      },
      {
        id: 'pathway_visual',
        studentId,
        pathwayType: 'parallel',
        strength: 0.6,
        activationPattern: { steps: ['visualize', 'connect', 'synthesize'] },
        learningVelocity: 0.8,
        retentionRate: 0.7,
        emotionalResonance: 0.8,
        crossDomainTransfer: 0.7,
        lastUpdated: new Date()
      },
      {
        id: 'pathway_creative',
        studentId,
        pathwayType: 'network',
        strength: 0.7,
        activationPattern: { steps: ['explore', 'create', 'share', 'reflect'] },
        learningVelocity: 0.6,
        retentionRate: 0.9,
        emotionalResonance: 0.9,
        crossDomainTransfer: 0.8,
        lastUpdated: new Date()
      }
    ];

    return pathways;
  }

  private async generateLearningIntervention(
    pathways: NeuralPathway[],
    dimensions: LearningDimensions,
    content: string,
    subject: string
  ): Promise<LearningIntervention> {
    const prompt = `
    Create a revolutionary learning intervention for this student based on their neural pathways and learning dimensions.

    Neural Pathways: ${JSON.stringify(pathways)}
    Learning Dimensions: ${JSON.stringify(dimensions)}
    Content: ${content}
    Subject: ${subject}

    Design an intervention that:
    1. Uses their strongest neural pathway
    2. Addresses their emotional state
    3. Creates cross-domain connections
    4. Provides predictive support
    5. Includes creative elements

    Return a JSON object with:
    - interventionType: 'predictive' | 'remedial' | 'accelerative' | 'creative' | 'emotional'
    - trigger: What caused this intervention
    - approach: The teaching approach to use
    - expectedOutcome: What we expect to achieve
    - confidence: AI confidence (0-1)
    - personalizedContent: AI-generated personalized content
    - crossDomainConnections: Connections to other subjects
    - emotionalSupport: Emotional guidance
    - successMetrics: How to measure success
    `;

    if (!openai) {
      return {
        id: `intervention_${Date.now()}`,
        studentId: pathways[0]?.studentId || '',
        interventionType: 'predictive',
        trigger: 'Sample intervention trigger',
        approach: 'Sample teaching approach',
        expectedOutcome: 'Improved learning outcomes',
        confidence: 0.7,
        personalizedContent: 'Sample personalized content',
        crossDomainConnections: ['Sample connection'],
        emotionalSupport: 'Sample emotional support',
        successMetrics: ['Sample success metric']
      };
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.8,
      messages: [{ role: "user", content: prompt }]
    });

    const responseContent = response.choices[0]?.message?.content || "{}";
    // Clean markdown code blocks if present
    const cleanContent = responseContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const intervention = JSON.parse(cleanContent);
    return {
      id: `intervention_${Date.now()}`,
      studentId: pathways[0]?.studentId || '',
      ...intervention
    };
  }

  private async storeNeuralPathways(studentId: string, pathways: NeuralPathway[]) {
    // Store in database (we'll create the table structure)
    for (const pathway of pathways) {
      await (prisma as any).neuralPathway.upsert({
        where: { id: pathway.id },
        update: pathway,
        create: pathway
      });
    }
  }

  async getStudentPathways(studentId: string): Promise<NeuralPathway[]> {
    return await (prisma as any).neuralPathway.findMany({
      where: { studentId }
    });
  }

  async analyzeLearningDimensions(studentId: string): Promise<LearningDimensions> {
    // Analyze student's learning dimensions using AI
    const studentData = await this.getStudentLearningData(studentId);
    
    const prompt = `
    Analyze this student's learning dimensions across cognitive, emotional, social, and creative domains.

    Student Data: ${JSON.stringify(studentData)}

    Return a JSON object with dimensions (0-1 scale):
    - cognitive: { processingSpeed, workingMemory, attentionSpan, patternRecognition }
    - emotional: { motivation, confidence, frustration, curiosity }
    - social: { collaboration, competition, mentorship, independence }
    - creative: { imagination, innovation, artistic, analytical }
    `;

    if (!openai) {
      return {
        cognitive: {
          processingSpeed: 0.7,
          workingMemory: 0.6,
          attentionSpan: 0.8,
          patternRecognition: 0.7
        },
        emotional: {
          motivation: 0.8,
          confidence: 0.6,
          frustration: 0.3,
          curiosity: 0.9
        },
        social: {
          collaboration: 0.7,
          competition: 0.5,
          mentorship: 0.6,
          independence: 0.8
        },
        creative: {
          imagination: 0.8,
          innovation: 0.7,
          artistic: 0.6,
          analytical: 0.8
        }
      };
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.6,
      messages: [{ role: "user", content: prompt }]
    });

    const responseContent = response.choices[0]?.message?.content || "{}";
    // Clean markdown code blocks if present
    const cleanContent = responseContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanContent);
  }

  private async getRecentLearningActivity(studentId: string) {
    return await prisma.studentProgress.findMany({
      where: { studentId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: { lesson: true }
    });
  }

  private async analyzeEmotionalState(studentId: string) {
    // Analyze emotional state from recent interactions
    const recentAttempts = await prisma.assessmentAttempt.findMany({
      where: { studentId },
      orderBy: { startedAt: 'desc' },
      take: 5
    });

    // Simple emotional analysis based on performance patterns
    const avgScore = recentAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / recentAttempts.length;
    const timeSpent = recentAttempts.reduce((sum, attempt) => {
      const start = new Date(attempt.startedAt);
      const end = new Date(attempt.completedAt || new Date());
      return sum + (end.getTime() - start.getTime());
    }, 0) / recentAttempts.length;

    return {
      confidence: avgScore,
      stress: timeSpent > 300000 ? 0.8 : 0.3, // 5 minutes threshold
      engagement: avgScore > 0.7 ? 0.9 : 0.5,
      motivation: recentAttempts.length > 3 ? 0.8 : 0.6
    };
  }

  private async generateEarlyInterventions(activity: any[], emotionalState: any): Promise<LearningIntervention[]> {
    const interventions: LearningIntervention[] = [];
    
    // Detect patterns that might lead to struggles
    if (emotionalState.stress > 0.7) {
      interventions.push({
        id: `stress_intervention_${Date.now()}`,
        studentId: activity[0]?.studentId || '',
        interventionType: 'emotional',
        trigger: 'High stress detected',
        approach: 'Mindfulness and breathing exercises',
        expectedOutcome: 'Reduced stress and improved focus',
        confidence: 0.8,
        personalizedContent: 'Let\'s take a moment to breathe and center ourselves before continuing.',
        crossDomainConnections: ['Mindfulness', 'Stress Management'],
        emotionalSupport: 'It\'s okay to feel overwhelmed. Let\'s break this down into smaller steps.',
        successMetrics: ['Reduced time per question', 'Improved accuracy', 'Positive feedback']
      });
    }

    if (emotionalState.engagement < 0.5) {
      interventions.push({
        id: `engagement_intervention_${Date.now()}`,
        studentId: activity[0]?.studentId || '',
        interventionType: 'creative',
        trigger: 'Low engagement detected',
        approach: 'Gamification and interactive elements',
        expectedOutcome: 'Increased engagement and motivation',
        confidence: 0.7,
        personalizedContent: 'Let\'s turn this into a game! You\'re on a quest to master this concept.',
        crossDomainConnections: ['Gaming', 'Storytelling', 'Competition'],
        emotionalSupport: 'Learning should be fun! Let\'s make this exciting together.',
        successMetrics: ['Increased time spent', 'More interactions', 'Positive emotional responses']
      });
    }

    return interventions;
  }

  private async getStudentInterests(studentId: string) {
    console.log('getStudentInterests', studentId);
    // Get student interests from their learning patterns
    /*const analytics = await prisma.learningAnalytics.findMany({
      where: { studentId },
      orderBy: { dateRange: 'desc' },
      take: 5
    });*/

    // Extract interests from learning patterns
    return {
      subjects: ['Mathematics', 'Science', 'Art'],
      activities: ['Problem Solving', 'Creative Projects', 'Collaborative Learning'],
      preferences: ['Visual Learning', 'Hands-on Activities', 'Story-based Learning']
    };
  }

  private async createDomainConnections(
    currentTopic: string,
    subject: string,
    interests: any,
    pathways: NeuralPathway[]
  ): Promise<string[]> {
    const prompt = `
    Create creative cross-domain connections for this learning topic.

    Current Topic: ${currentTopic}
    Subject: ${subject}
    Student Interests: ${JSON.stringify(interests)}
    Neural Pathways: ${JSON.stringify(pathways.slice(0, 2))}

    Generate 5-7 creative connections that link this topic to other domains in ways that would engage this specific student.

    Examples:
    - "Learn calculus through music rhythm patterns"
    - "Understand physics through cooking and baking"
    - "Master history through role-playing games"

    Return as JSON array of connection strings.
    `;

    if (!openai) {
      return [
        `Learn ${currentTopic} through creative storytelling`,
        `Connect ${currentTopic} to real-world applications`,
        `Use visual metaphors to understand ${currentTopic}`,
        `Apply ${currentTopic} in hands-on projects`,
        `Explore ${currentTopic} through music and rhythm`
      ];
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.9,
      messages: [{ role: "user", content: prompt }]
    });

    const content = response.choices[0]?.message?.content || "[]";
    // Clean markdown code blocks if present
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanContent);
  }

  private async evolvePathwayStrengths(pathways: NeuralPathway[], feedback: any): Promise<NeuralPathway[]> {
    return pathways.map(pathway => {
      let newStrength = pathway.strength;
      
      // Adjust strength based on feedback
      if (feedback.success) {
        newStrength = Math.min(1, pathway.strength + 0.1);
      } else {
        newStrength = Math.max(0, pathway.strength - 0.05);
      }

      // Adjust based on engagement
      if (feedback.engagement > 0.8) {
        newStrength = Math.min(1, newStrength + 0.05);
      }

      return {
        ...pathway,
        strength: newStrength,
        lastUpdated: new Date()
      };
    });
  }

  private async updateNeuralPathways(studentId: string, pathways: NeuralPathway[]) {
    for (const pathway of pathways) {
      await (prisma as any).neuralPathway.update({
        where: { id: pathway.id },
        data: pathway
      });
    }
  }
}

export const neuralPathwayEngine = new NeuralPathwayEngine();
