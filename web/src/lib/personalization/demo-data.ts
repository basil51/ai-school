import { LearningPattern, TeachingStrategy, ContentType, EngagementPattern } from './learning-analytics';

export interface DemoStudent {
  id: string;
  name: string;
  email: string;
  learningProfile: {
    age: number;
    grade: string;
    subjects: string[];
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'analytical' | 'creative' | 'collaborative';
    strengths: string[];
    challenges: string[];
  };
  learningPattern: LearningPattern;
  recentActivity: {
    sessionsThisWeek: number;
    totalTimeSpent: number;
    lastActive: Date;
    currentStreak: number;
  };
}

export class DemoDataGenerator {
  private static readonly DEMO_STUDENTS: DemoStudent[] = [
    {
      id: 'demo-student-1',
      name: 'Alex Chen',
      email: 'alex.chen@demo.com',
      learningProfile: {
        age: 14,
        grade: '9th Grade',
        subjects: ['Mathematics', 'Physics', 'Chemistry'],
        learningStyle: 'visual',
        strengths: ['Problem Solving', 'Pattern Recognition', 'Logical Thinking'],
        challenges: ['Reading Comprehension', 'Time Management']
      },
      learningPattern: {
        conceptualStrengths: ['Algebra', 'Geometry', 'Physics'],
        proceduralStrengths: ['Mathematical Problem Solving', 'Scientific Method'],
        commonMistakes: ['Calculation Errors', 'Unit Conversion'],
        effectiveStrategies: [
          {
            approach: 'visual',
            modality: 'diagram',
            pacing: 'moderate',
            reinforcement: 'moderate',
            difficulty: 'intermediate',
            effectiveness: 0.85
          },
          {
            approach: 'analytical',
            modality: 'interactive',
            pacing: 'fast',
            reinforcement: 'minimal',
            difficulty: 'advanced',
            effectiveness: 0.78
          }
        ],
        optimalStudyTimes: ['morning', 'afternoon'],
        preferredContentTypes: [
          { type: 'diagram', preference: 0.9, effectiveness: 0.85 },
          { type: 'interactive', preference: 0.8, effectiveness: 0.78 },
          { type: 'math', preference: 0.85, effectiveness: 0.82 },
          { type: 'simulation', preference: 0.75, effectiveness: 0.80 },
          { type: 'text', preference: 0.4, effectiveness: 0.45 },
          { type: 'video', preference: 0.6, effectiveness: 0.65 },
          { type: '3d', preference: 0.7, effectiveness: 0.72 },
          { type: 'advanced-3d', preference: 0.65, effectiveness: 0.68 },
          { type: 'd3-advanced', preference: 0.8, effectiveness: 0.75 }
        ],
        learningVelocity: 0.82,
        retentionRate: 0.78,
        engagementPatterns: [
          {
            timeOfDay: 'morning',
            dayOfWeek: 'Monday',
            sessionLength: 45,
            engagementLevel: 0.88,
            optimalDuration: 45
          },
          {
            timeOfDay: 'afternoon',
            dayOfWeek: 'Wednesday',
            sessionLength: 60,
            engagementLevel: 0.92,
            optimalDuration: 60
          },
          {
            timeOfDay: 'evening',
            dayOfWeek: 'Friday',
            sessionLength: 30,
            engagementLevel: 0.75,
            optimalDuration: 30
          }
        ]
      },
      recentActivity: {
        sessionsThisWeek: 5,
        totalTimeSpent: 240,
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        currentStreak: 7
      }
    },
    {
      id: 'demo-student-2',
      name: 'Maya Rodriguez',
      email: 'maya.rodriguez@demo.com',
      learningProfile: {
        age: 16,
        grade: '11th Grade',
        subjects: ['Biology', 'Chemistry', 'English Literature'],
        learningStyle: 'creative',
        strengths: ['Creative Writing', 'Critical Thinking', 'Research Skills'],
        challenges: ['Mathematical Concepts', 'Memorization']
      },
      learningPattern: {
        conceptualStrengths: ['Biology', 'Literature Analysis', 'Creative Writing'],
        proceduralStrengths: ['Essay Writing', 'Research Methodology'],
        commonMistakes: ['Mathematical Formulas', 'Scientific Notation'],
        effectiveStrategies: [
          {
            approach: 'creative',
            modality: 'interactive',
            pacing: 'slow',
            reinforcement: 'extensive',
            difficulty: 'intermediate',
            effectiveness: 0.90
          },
          {
            approach: 'collaborative',
            modality: 'video',
            pacing: 'moderate',
            reinforcement: 'moderate',
            difficulty: 'beginner',
            effectiveness: 0.82
          }
        ],
        optimalStudyTimes: ['evening', 'night'],
        preferredContentTypes: [
          { type: 'interactive', preference: 0.9, effectiveness: 0.90 },
          { type: 'video', preference: 0.85, effectiveness: 0.82 },
          { type: 'text', preference: 0.8, effectiveness: 0.75 },
          { type: 'diagram', preference: 0.7, effectiveness: 0.68 },
          { type: 'math', preference: 0.3, effectiveness: 0.35 },
          { type: 'simulation', preference: 0.6, effectiveness: 0.65 },
          { type: '3d', preference: 0.5, effectiveness: 0.55 },
          { type: 'advanced-3d', preference: 0.4, effectiveness: 0.45 },
          { type: 'd3-advanced', preference: 0.6, effectiveness: 0.62 }
        ],
        learningVelocity: 0.65,
        retentionRate: 0.85,
        engagementPatterns: [
          {
            timeOfDay: 'evening',
            dayOfWeek: 'Tuesday',
            sessionLength: 90,
            engagementLevel: 0.95,
            optimalDuration: 90
          },
          {
            timeOfDay: 'night',
            dayOfWeek: 'Thursday',
            sessionLength: 75,
            engagementLevel: 0.88,
            optimalDuration: 75
          },
          {
            timeOfDay: 'afternoon',
            dayOfWeek: 'Saturday',
            sessionLength: 120,
            engagementLevel: 0.92,
            optimalDuration: 120
          }
        ]
      },
      recentActivity: {
        sessionsThisWeek: 4,
        totalTimeSpent: 375,
        lastActive: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        currentStreak: 12
      }
    },
    {
      id: 'demo-student-3',
      name: 'Jordan Kim',
      email: 'jordan.kim@demo.com',
      learningProfile: {
        age: 15,
        grade: '10th Grade',
        subjects: ['Computer Science', 'Mathematics', 'Physics'],
        learningStyle: 'analytical',
        strengths: ['Programming', 'Algorithm Design', 'Systematic Thinking'],
        challenges: ['Creative Writing', 'Social Studies']
      },
      learningPattern: {
        conceptualStrengths: ['Programming', 'Algorithm Design', 'Data Structures'],
        proceduralStrengths: ['Code Debugging', 'System Design'],
        commonMistakes: ['Syntax Errors', 'Logic Flow'],
        effectiveStrategies: [
          {
            approach: 'analytical',
            modality: 'interactive',
            pacing: 'fast',
            reinforcement: 'minimal',
            difficulty: 'advanced',
            effectiveness: 0.92
          },
          {
            approach: 'kinesthetic',
            modality: 'simulation',
            pacing: 'moderate',
            reinforcement: 'moderate',
            difficulty: 'intermediate',
            effectiveness: 0.85
          }
        ],
        optimalStudyTimes: ['morning', 'afternoon'],
        preferredContentTypes: [
          { type: 'interactive', preference: 0.95, effectiveness: 0.92 },
          { type: 'simulation', preference: 0.9, effectiveness: 0.85 },
          { type: '3d', preference: 0.8, effectiveness: 0.78 },
          { type: 'advanced-3d', preference: 0.85, effectiveness: 0.82 },
          { type: 'd3-advanced', preference: 0.9, effectiveness: 0.88 },
          { type: 'math', preference: 0.7, effectiveness: 0.75 },
          { type: 'diagram', preference: 0.6, effectiveness: 0.65 },
          { type: 'text', preference: 0.5, effectiveness: 0.55 },
          { type: 'video', preference: 0.4, effectiveness: 0.45 }
        ],
        learningVelocity: 0.95,
        retentionRate: 0.88,
        engagementPatterns: [
          {
            timeOfDay: 'morning',
            dayOfWeek: 'Monday',
            sessionLength: 60,
            engagementLevel: 0.95,
            optimalDuration: 60
          },
          {
            timeOfDay: 'afternoon',
            dayOfWeek: 'Wednesday',
            sessionLength: 90,
            engagementLevel: 0.98,
            optimalDuration: 90
          },
          {
            timeOfDay: 'morning',
            dayOfWeek: 'Friday',
            sessionLength: 45,
            engagementLevel: 0.92,
            optimalDuration: 45
          }
        ]
      },
      recentActivity: {
        sessionsThisWeek: 6,
        totalTimeSpent: 360,
        lastActive: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        currentStreak: 15
      }
    }
  ];

  static getDemoStudent(studentId: string): DemoStudent | null {
    return this.DEMO_STUDENTS.find(student => student.id === studentId) || null;
  }

  static getAllDemoStudents(): DemoStudent[] {
    return this.DEMO_STUDENTS;
  }

  static generateDemoLearningPattern(studentId: string): LearningPattern {
    const student = this.getDemoStudent(studentId);
    if (student) {
      return student.learningPattern;
    }

    // Fallback pattern for unknown students
    return {
      conceptualStrengths: ['Mathematics', 'Science'],
      proceduralStrengths: ['Problem Solving', 'Analysis'],
      commonMistakes: ['Calculation Errors', 'Concept Application'],
      effectiveStrategies: [
        {
          approach: 'visual',
          modality: 'interactive',
          pacing: 'moderate',
          reinforcement: 'moderate',
          difficulty: 'intermediate',
          effectiveness: 0.75
        }
      ],
      optimalStudyTimes: ['morning', 'afternoon'],
      preferredContentTypes: [
        { type: 'interactive', preference: 0.7, effectiveness: 0.75 },
        { type: 'diagram', preference: 0.6, effectiveness: 0.65 },
        { type: 'text', preference: 0.5, effectiveness: 0.55 },
        { type: 'video', preference: 0.6, effectiveness: 0.62 },
        { type: 'math', preference: 0.7, effectiveness: 0.72 },
        { type: 'simulation', preference: 0.6, effectiveness: 0.65 },
        { type: '3d', preference: 0.5, effectiveness: 0.55 },
        { type: 'advanced-3d', preference: 0.4, effectiveness: 0.45 },
        { type: 'd3-advanced', preference: 0.5, effectiveness: 0.52 }
      ],
      learningVelocity: 0.7,
      retentionRate: 0.75,
      engagementPatterns: [
        {
          timeOfDay: 'morning',
          dayOfWeek: 'Monday',
          sessionLength: 45,
          engagementLevel: 0.8,
          optimalDuration: 45
        }
      ]
    };
  }

  static generateDemoRecommendations(studentId: string): any {
    const student = this.getDemoStudent(studentId);
    if (!student) {
      return {
        nextLessons: [],
        studySchedule: [],
        contentPreferences: [],
        interventionSuggestions: []
      };
    }

    return {
      nextLessons: [
        {
          id: 'lesson-1',
          title: 'Advanced Algebra Concepts',
          topic: {
            name: 'Algebra',
            subject: { name: 'Mathematics' }
          },
          difficulty: 'intermediate'
        },
        {
          id: 'lesson-2',
          title: 'Physics Problem Solving',
          topic: {
            name: 'Mechanics',
            subject: { name: 'Physics' }
          },
          difficulty: 'advanced'
        },
        {
          id: 'lesson-3',
          title: 'Chemical Reactions',
          topic: {
            name: 'Chemistry',
            subject: { name: 'Chemistry' }
          },
          difficulty: 'intermediate'
        }
      ],
      studySchedule: student.learningPattern.engagementPatterns.map(pattern => ({
        timeOfDay: pattern.timeOfDay,
        duration: pattern.optimalDuration,
        engagementLevel: pattern.engagementLevel,
        recommended: true
      })),
      contentPreferences: student.learningPattern.preferredContentTypes,
      interventionSuggestions: [
        {
          type: 'pacing',
          suggestion: 'Consider adjusting study pace based on your learning velocity',
          priority: 'medium'
        },
        {
          type: 'reinforcement',
          suggestion: 'Increase practice sessions for better retention',
          priority: 'low'
        }
      ]
    };
  }

  static generateDemoEffectiveness(studentId: string): any {
    const student = this.getDemoStudent(studentId);
    if (!student) {
      return {
        strengths: [],
        weaknesses: [],
        improvementSuggestions: [],
        personalizedStrategies: []
      };
    }

    return {
      strengths: student.learningProfile.strengths,
      weaknesses: student.learningProfile.challenges,
      improvementSuggestions: [
        'Practice time management techniques',
        'Use visual aids for complex concepts',
        'Break down large problems into smaller steps',
        'Review material regularly for better retention'
      ],
      personalizedStrategies: student.learningPattern.effectiveStrategies
    };
  }

  static generateDemoInterventions(studentId: string): any[] {
    const student = this.getDemoStudent(studentId);
    if (!student) {
      return [];
    }

    return [
      {
        id: 'intervention-1',
        type: 'predictive',
        trigger: 'Learning velocity below optimal range',
        approach: 'Adjust pacing and provide additional support',
        expectedOutcome: 'Improved learning velocity and comprehension',
        confidence: 0.85,
        personalizedContent: 'Personalized content focusing on your visual learning style',
        crossDomainConnections: ['Mathematics → Physics', 'Chemistry → Biology'],
        emotionalSupport: 'Remember that learning is a journey. Take your time and celebrate small victories!',
        successMetrics: ['Learning velocity improvement', 'Retention rate increase', 'Engagement level'],
        isActive: true
      },
      {
        id: 'intervention-2',
        type: 'remedial',
        trigger: 'Common mistakes in calculations',
        approach: 'Focus on error prevention and systematic checking',
        expectedOutcome: 'Reduced calculation errors and improved accuracy',
        confidence: 0.78,
        personalizedContent: 'Step-by-step calculation guides with visual aids',
        crossDomainConnections: ['Mathematics → Chemistry', 'Physics → Engineering'],
        emotionalSupport: 'Mistakes are part of learning. Let\'s work together to build your confidence!',
        successMetrics: ['Error rate reduction', 'Calculation accuracy', 'Confidence level'],
        isActive: true
      }
    ];
  }

  static isDemoMode(): boolean {
    return process.env.NODE_ENV === 'development' || process.env.DEMO_MODE === 'true';
  }

  static getDemoModeIndicator(): string {
    return this.isDemoMode() ? 'DEMO MODE' : 'LIVE MODE';
  }
}
