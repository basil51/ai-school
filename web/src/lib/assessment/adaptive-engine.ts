import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AdaptiveQuestion {
  id: string;
  questionType: string;
  content: any;
  difficulty: number;
  estimatedTime: number;
  learningObjective?: string;
  cognitiveLevel: string;
  order: number;
}

export interface AdaptiveResponse {
  questionId: string;
  answer: any;
  isCorrect?: boolean;
  confidence?: number;
  timeSpent: number;
  hintsUsed: number;
  attempts: number;
}

export interface AssessmentAnalytics {
  learningVelocity: number;
  retentionRate: number;
  engagementScore: number;
  confidenceLevel: number;
  difficultyAdjustment: number;
  masteryProgression: number;
  timeEfficiency: number;
  errorPatternAnalysis: any;
}

export class AdaptiveAssessmentEngine {
  private studentId: string;
  private subjectId: string;
  private sessionType: string;

  constructor(studentId: string, subjectId: string, sessionType: string) {
    this.studentId = studentId;
    this.subjectId = subjectId;
    this.sessionType = sessionType;
  }

  /**
   * Create a new adaptive assessment session
   */
  async createAssessmentSession(): Promise<string> {
    const assessment = await prisma.adaptiveAssessment.create({
      data: {
        studentId: this.studentId,
        subjectId: this.subjectId,
        sessionType: this.sessionType as any,
        currentLevel: 1,
        currentDifficulty: 0.5,
        confidence: 0.5,
      },
    });

    return assessment.id;
  }

  /**
   * Generate the next adaptive question based on student performance
   */
  async generateNextQuestion(assessmentId: string): Promise<AdaptiveQuestion | null> {
    const assessment = await prisma.adaptiveAssessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: true,
        responses: true,
        student: {
          include: {
            personalizationData: true,
            learningAnalytics: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    // Get student's learning patterns
    const learningPattern = await this.getStudentLearningPattern();
    
    // Calculate current performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(assessment);
    
    // Determine next question parameters
    const questionParams = await this.determineQuestionParameters(
      performanceMetrics,
      learningPattern,
      assessment
    );

    // Generate question using AI
    const questionContent = await this.generateQuestionContent(questionParams);

    // Create the question in database
    const question = await prisma.adaptiveQuestion.create({
      data: {
        adaptiveAssessmentId: assessmentId,
        questionType: questionParams.type,
        content: questionContent,
        difficulty: questionParams.difficulty,
        estimatedTime: questionParams.estimatedTime,
        learningObjective: questionParams.learningObjective,
        cognitiveLevel: questionParams.cognitiveLevel,
        order: assessment.questions.length + 1,
      },
    });

    return {
      id: question.id,
      questionType: question.questionType,
      content: question.content,
      difficulty: question.difficulty,
      estimatedTime: question.estimatedTime,
      learningObjective: question.learningObjective || undefined,
      cognitiveLevel: question.cognitiveLevel,
      order: question.order,
    };
  }

  /**
   * Process student response and update assessment
   */
  async processResponse(
    assessmentId: string,
    response: AdaptiveResponse
  ): Promise<{ feedback: string; nextAction: string; analytics: AssessmentAnalytics }> {
    const assessment = await prisma.adaptiveAssessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: {
          where: { id: response.questionId },
        },
        responses: true,
      },
    });

    if (!assessment || !assessment.questions.length) {
      throw new Error('Assessment or question not found');
    }

    const question = assessment.questions[0];

    // Grade the response using AI
    const gradingResult = await this.gradeResponse(question, response);

    // Save the response
    await prisma.adaptiveResponse.create({
      data: {
        adaptiveAssessmentId: assessmentId,
        questionId: response.questionId,
        answer: response.answer,
        isCorrect: gradingResult.isCorrect,
        confidence: response.confidence,
        timeSpent: response.timeSpent,
        hintsUsed: response.hintsUsed,
        attempts: response.attempts,
        aiFeedback: gradingResult.feedback,
      },
    });

    // Update assessment metrics
    await this.updateAssessmentMetrics(assessmentId, gradingResult);

    // Generate analytics
    const analytics = await this.generateAnalytics(assessmentId);

    // Determine next action
    const nextAction = await this.determineNextAction(assessmentId, gradingResult);

    return {
      feedback: gradingResult.feedback,
      nextAction,
      analytics,
    };
  }

  /**
   * Get student's learning pattern for personalization
   */
  private async getStudentLearningPattern(): Promise<any> {
    const personalizationData = await prisma.personalizationData.findUnique({
      where: { studentId: this.studentId },
    });

    const learningAnalytics = await prisma.learningAnalytics.findMany({
      where: { studentId: this.studentId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      personalizationData,
      recentAnalytics: learningAnalytics,
    };
  }

  /**
   * Calculate current performance metrics
   */
  private calculatePerformanceMetrics(assessment: any): any {
    const totalQuestions = assessment.questions.length;
    const correctAnswers = assessment.responses.filter((r: any) => r.isCorrect).length;
    const accuracy = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
    
    const avgTimeSpent = assessment.responses.length > 0 
      ? assessment.responses.reduce((sum: number, r: any) => sum + r.timeSpent, 0) / assessment.responses.length
      : 0;

    return {
      accuracy,
      avgTimeSpent,
      totalQuestions,
      correctAnswers,
      currentDifficulty: assessment.currentDifficulty,
    };
  }

  /**
   * Determine question parameters based on performance
   */
  private async determineQuestionParameters(
    performance: any,
    learningPattern: any,
    assessment: any
  ): Promise<any> {
    // AI-powered question parameter determination
    const prompt = `
    Based on the following student performance data, determine the optimal next question parameters:
    
    Performance Metrics:
    - Accuracy: ${performance.accuracy}
    - Average Time Spent: ${performance.avgTimeSpent} seconds
    - Current Difficulty: ${performance.currentDifficulty}
    - Total Questions: ${performance.totalQuestions}
    
    Learning Pattern:
    - Learning Style: ${learningPattern.personalizationData?.learningStyle || 'unknown'}
    - Strengths: ${JSON.stringify(learningPattern.personalizationData?.strengths || [])}
    - Weaknesses: ${JSON.stringify(learningPattern.personalizationData?.weaknesses || [])}
    
    Assessment Type: ${assessment.sessionType}
    
    Determine:
    1. Question type (MULTIPLE_CHOICE, SHORT_ANSWER, MATHEMATICAL, etc.)
    2. Difficulty level (0.0 to 1.0)
    3. Cognitive level (REMEMBER, UNDERSTAND, APPLY, ANALYZE, EVALUATE, CREATE)
    4. Estimated time in seconds
    5. Learning objective focus
    
    Respond in JSON format.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        type: result.questionType || 'MULTIPLE_CHOICE',
        difficulty: Math.max(0.1, Math.min(1.0, result.difficulty || 0.5)),
        cognitiveLevel: result.cognitiveLevel || 'UNDERSTAND',
        estimatedTime: result.estimatedTime || 60,
        learningObjective: result.learningObjective || 'General understanding',
      };
    } catch (error) {
      console.error('Error determining question parameters:', error);
      // Fallback parameters
      return {
        type: 'MULTIPLE_CHOICE',
        difficulty: Math.max(0.1, Math.min(1.0, performance.currentDifficulty)),
        cognitiveLevel: 'UNDERSTAND',
        estimatedTime: 60,
        learningObjective: 'General understanding',
      };
    }
  }

  /**
   * Generate question content using AI
   */
  private async generateQuestionContent(params: any): Promise<any> {
    const prompt = `
    Generate an educational question with the following parameters:
    
    Question Type: ${params.type}
    Difficulty: ${params.difficulty} (0.0 = very easy, 1.0 = very difficult)
    Cognitive Level: ${params.cognitiveLevel}
    Subject: ${this.subjectId}
    Learning Objective: ${params.learningObjective}
    
    Create a question that:
    1. Is appropriate for the difficulty level
    2. Tests the specified cognitive level
    3. Is engaging and educational
    4. Includes all necessary components (question text, options if multiple choice, etc.)
    
    IMPORTANT: Respond in JSON format with the following structure:
    {
      "question": "The question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Explanation of the correct answer"
    }
    
    For multiple choice questions, ensure options are simple strings, not objects.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate and sanitize the result
      if (!result.question && !result.text && !result.prompt) {
        throw new Error('No question text found in AI response');
      }
      
      // Ensure options are strings if they exist
      if (result.options && Array.isArray(result.options)) {
        result.options = result.options.map((option: any) => {
          if (typeof option === 'string') return option;
          if (typeof option === 'object' && option !== null) {
            return option.optionText || option.text || option.answer || option.label || JSON.stringify(option);
          }
          return String(option);
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error generating question content:', error);
      // Fallback question
      return {
        question: 'What is the main concept being tested?',
        type: params.type,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A',
      };
    }
  }

  /**
   * Grade student response using AI
   */
  private async gradeResponse(question: any, response: AdaptiveResponse): Promise<any> {
    const prompt = `
    Grade the following student response:
    
    Question: ${JSON.stringify(question.content)}
    Student Answer: ${JSON.stringify(response.answer)}
    Time Spent: ${response.timeSpent} seconds
    Attempts: ${response.attempts}
    Hints Used: ${response.hintsUsed}
    
    Provide:
    1. Correctness (true/false)
    2. Detailed feedback explaining why the answer is correct or incorrect
    3. Suggestions for improvement if incorrect
    4. Encouragement and next steps
    
    Respond in JSON format.
    `;

    try {
      const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const result = JSON.parse(aiResponse.choices[0].message.content || '{}');
      
      return {
        isCorrect: result.correctness || false,
        feedback: result.feedback || 'Thank you for your response.',
      };
    } catch (error) {
      console.error('Error grading response:', error);
      return {
        isCorrect: false,
        feedback: 'Thank you for your response. Please review the material and try again.',
      };
    }
  }

  /**
   * Update assessment metrics based on response
   */
  private async updateAssessmentMetrics(assessmentId: string, gradingResult: any): Promise<void> {
    const assessment = await prisma.adaptiveAssessment.findUnique({
      where: { id: assessmentId },
      include: { responses: true },
    });

    if (!assessment) return;

    const totalQuestions = assessment.responses.length + 1;
    const correctAnswers = assessment.responses.filter(r => r.isCorrect).length + (gradingResult.isCorrect ? 1 : 0);
    const accuracy = correctAnswers / totalQuestions;

    // Adjust difficulty based on performance
    let newDifficulty = assessment.currentDifficulty;
    if (gradingResult.isCorrect && accuracy > 0.7) {
      newDifficulty = Math.min(1.0, newDifficulty + 0.1);
    } else if (!gradingResult.isCorrect && accuracy < 0.5) {
      newDifficulty = Math.max(0.1, newDifficulty - 0.1);
    }

    // Update confidence based on consistency
    const recentResponses = assessment.responses.slice(-5);
    const recentAccuracy = recentResponses.length > 0 
      ? recentResponses.filter(r => r.isCorrect).length / recentResponses.length 
      : 0;
    
    const newConfidence = Math.max(0.1, Math.min(1.0, recentAccuracy));

    await prisma.adaptiveAssessment.update({
      where: { id: assessmentId },
      data: {
        totalQuestions,
        correctAnswers,
        currentDifficulty: newDifficulty,
        confidence: newConfidence,
      },
    });
  }

  /**
   * Generate comprehensive analytics
   */
  private async generateAnalytics(assessmentId: string): Promise<AssessmentAnalytics> {
    const assessment = await prisma.adaptiveAssessment.findUnique({
      where: { id: assessmentId },
      include: { responses: true, analytics: true },
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    const accuracy = assessment.totalQuestions > 0 ? assessment.correctAnswers / assessment.totalQuestions : 0;
    const avgTimeSpent = assessment.responses.length > 0 
      ? assessment.responses.reduce((sum, r) => sum + r.timeSpent, 0) / assessment.responses.length
      : 0;

    const analytics: AssessmentAnalytics = {
      learningVelocity: accuracy * (1 / (avgTimeSpent / 60)), // Questions per minute adjusted by accuracy
      retentionRate: accuracy, // Simplified retention rate
      engagementScore: Math.min(1.0, assessment.responses.length / 10), // Based on number of responses
      confidenceLevel: assessment.confidence,
      difficultyAdjustment: assessment.currentDifficulty - 0.5, // Deviation from baseline
      masteryProgression: accuracy * assessment.currentDifficulty,
      timeEfficiency: 1 / (avgTimeSpent / 60), // Questions per minute
      errorPatternAnalysis: this.analyzeErrorPatterns(assessment.responses),
    };

    // Save analytics to database
    await this.saveAnalytics(assessmentId, analytics);

    return analytics;
  }

  /**
   * Analyze error patterns in responses
   */
  private analyzeErrorPatterns(responses: any[]): any {
    const incorrectResponses = responses.filter(r => !r.isCorrect);
    
    return {
      totalErrors: incorrectResponses.length,
      commonErrorTypes: this.categorizeErrors(incorrectResponses),
      timePatterns: this.analyzeTimePatterns(incorrectResponses),
      hintUsage: this.analyzeHintUsage(incorrectResponses),
    };
  }

  /**
   * Categorize errors by type
   */
  private categorizeErrors(incorrectResponses: any[]): any {
    // Simplified error categorization
    return {
      conceptual: incorrectResponses.filter(r => r.timeSpent > 120).length,
      procedural: incorrectResponses.filter(r => r.attempts > 2).length,
      timeManagement: incorrectResponses.filter(r => r.timeSpent < 30).length,
    };
  }

  /**
   * Analyze time patterns in errors
   */
  private analyzeTimePatterns(incorrectResponses: any[]): any {
    if (incorrectResponses.length === 0) return {};

    const times = incorrectResponses.map(r => r.timeSpent);
    return {
      averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
    };
  }

  /**
   * Analyze hint usage patterns
   */
  private analyzeHintUsage(incorrectResponses: any[]): any {
    const withHints = incorrectResponses.filter(r => r.hintsUsed > 0);
    return {
      totalHintsUsed: incorrectResponses.reduce((sum, r) => sum + r.hintsUsed, 0),
      responsesWithHints: withHints.length,
      averageHintsPerError: withHints.length > 0 
        ? withHints.reduce((sum, r) => sum + r.hintsUsed, 0) / withHints.length 
        : 0,
    };
  }

  /**
   * Save analytics to database
   */
  private async saveAnalytics(assessmentId: string, analytics: AssessmentAnalytics): Promise<void> {
    const analyticsEntries = [
      { metricType: 'LEARNING_VELOCITY', value: analytics.learningVelocity },
      { metricType: 'RETENTION_RATE', value: analytics.retentionRate },
      { metricType: 'ENGAGEMENT_SCORE', value: analytics.engagementScore },
      { metricType: 'CONFIDENCE_LEVEL', value: analytics.confidenceLevel },
      { metricType: 'DIFFICULTY_ADJUSTMENT', value: analytics.difficultyAdjustment },
      { metricType: 'MASTERY_PROGRESSION', value: analytics.masteryProgression },
      { metricType: 'TIME_EFFICIENCY', value: analytics.timeEfficiency },
      { metricType: 'ERROR_PATTERN_ANALYSIS', value: analytics.errorPatternAnalysis },
    ];

    for (const entry of analyticsEntries) {
      await prisma.adaptiveAnalytics.create({
        data: {
          adaptiveAssessmentId: assessmentId,
          metricType: entry.metricType as any,
          value: entry.value,
          metadata: entry.metricType === 'ERROR_PATTERN_ANALYSIS' ? entry.value : null,
        },
      });
    }
  }

  /**
   * Determine next action based on performance
   */
  private async determineNextAction(assessmentId: string, gradingResult: any): Promise<string> {
    const assessment = await prisma.adaptiveAssessment.findUnique({
      where: { id: assessmentId },
      include: { responses: true },
    });

    if (!assessment) return 'CONTINUE';

    const accuracy = assessment.totalQuestions > 0 ? assessment.correctAnswers / assessment.totalQuestions : 0;
    const totalQuestions = assessment.totalQuestions;

    // Determine next action based on performance and session type
    if (totalQuestions >= 10 && accuracy >= 0.8) {
      return 'COMPLETE'; // Student has demonstrated mastery
    } else if (totalQuestions >= 15) {
      return 'COMPLETE'; // Maximum questions reached
    } else if (accuracy < 0.3 && totalQuestions >= 5) {
      return 'REMEDIATION'; // Student needs additional support
    } else {
      return 'CONTINUE'; // Continue with next question
    }
  }

  /**
   * Complete assessment and generate final report
   */
  async completeAssessment(assessmentId: string): Promise<any> {
    const assessment = await prisma.adaptiveAssessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: true,
        responses: true,
        analytics: true,
        student: true,
        subject: true,
      },
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    // Calculate final metrics
    const finalAnalytics = await this.generateAnalytics(assessmentId);
    
    // Generate learning gaps if any
    await this.identifyLearningGaps(assessmentId, finalAnalytics);

    // Update assessment as completed
    await prisma.adaptiveAssessment.update({
      where: { id: assessmentId },
      data: {
        isActive: false,
        completedAt: new Date(),
      },
    });

    return {
      assessment,
      finalAnalytics,
      recommendations: await this.generateRecommendations(finalAnalytics),
    };
  }

  /**
   * Identify learning gaps based on performance
   */
  private async identifyLearningGaps(assessmentId: string, analytics: AssessmentAnalytics): Promise<void> {
    if (analytics.retentionRate < 0.6) {
      await prisma.learningGap.create({
        data: {
          studentId: this.studentId,
          subjectId: this.subjectId,
          gapType: 'CONCEPTUAL_UNDERSTANDING',
          severity: analytics.retentionRate < 0.4 ? 'HIGH' : 'MEDIUM',
          description: 'Student shows difficulty with conceptual understanding based on assessment performance.',
          recommendedActions: {
            actions: [
              'Review fundamental concepts',
              'Provide additional practice problems',
              'Use visual learning aids',
              'Schedule one-on-one tutoring session',
            ],
          },
        },
      });
    }

    if (analytics.timeEfficiency < 0.5) {
      await prisma.learningGap.create({
        data: {
          studentId: this.studentId,
          subjectId: this.subjectId,
          gapType: 'TIME_MANAGEMENT',
          severity: 'MEDIUM',
          description: 'Student takes longer than expected to complete questions.',
          recommendedActions: {
            actions: [
              'Practice time management techniques',
              'Break down complex problems into smaller steps',
              'Use timers during practice sessions',
            ],
          },
        },
      });
    }
  }

  /**
   * Generate personalized recommendations
   */
  private async generateRecommendations(analytics: AssessmentAnalytics): Promise<any> {
    const recommendations = [];

    if (analytics.learningVelocity < 0.5) {
      recommendations.push({
        type: 'STUDY_METHOD',
        title: 'Improve Learning Velocity',
        description: 'Focus on understanding concepts more deeply before moving to practice.',
        priority: 'HIGH',
      });
    }

    if (analytics.retentionRate < 0.7) {
      recommendations.push({
        type: 'REVIEW_SCHEDULE',
        title: 'Increase Review Frequency',
        description: 'Schedule regular review sessions to improve retention.',
        priority: 'MEDIUM',
      });
    }

    if (analytics.confidenceLevel < 0.6) {
      recommendations.push({
        type: 'CONFIDENCE_BUILDING',
        title: 'Build Confidence',
        description: 'Start with easier problems and gradually increase difficulty.',
        priority: 'MEDIUM',
      });
    }

    return recommendations;
  }
}
