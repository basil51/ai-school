import { openai } from '@ai-sdk/openai';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';

// Content generation schemas
const MathContentSchema = z.object({
  equation: z.string().describe('LaTeX equation string'),
  explanation: z.string().describe('Step-by-step explanation of the mathematical concept'),
  graphExpression: z.string().describe('JavaScript expression for graphing (e.g., "Math.sin(x)")'),
  graphTitle: z.string().describe('Title for the graph'),
  examples: z.array(z.object({
    problem: z.string(),
    solution: z.string(),
    steps: z.array(z.string())
  })).describe('Practice problems with solutions'),
  narration: z.string().describe('Audio narration text')
});

const DiagramContentSchema = z.object({
  title: z.string().describe('Title of the diagram'),
  chart: z.string().describe('Mermaid diagram syntax'),
  theme: z.string().describe('Mermaid theme (neutral, dark, forest, etc.)'),
  explanation: z.string().describe('Detailed explanation of the diagram'),
  keyPoints: z.array(z.string()).describe('Key points to highlight'),
  narration: z.string().describe('Audio narration text')
});

const SimulationContentSchema = z.object({
  title: z.string().describe('Title of the simulation'),
  type: z.enum(['physics', 'chemistry', 'biology', 'math', 'economics']).describe('Type of simulation'),
  parameters: z.record(z.string(), z.any()).describe('Simulation parameters (e.g., gravity, initial speed, etc.)'),
  instructions: z.string().describe('Instructions for using the simulation'),
  learningObjectives: z.array(z.string()).describe('What students will learn'),
  narration: z.string().describe('Audio narration text')
});

const VideoContentSchema = z.object({
  title: z.string().describe('Title of the video content'),
  description: z.string().describe('Description of what the video should show'),
  keyConcepts: z.array(z.string()).describe('Key concepts to cover in the video'),
  duration: z.number().describe('Estimated duration in minutes'),
  narration: z.string().describe('Audio narration text'),
  transcript: z.string().describe('Full transcript of the video')
});

const InteractiveContentSchema = z.object({
  title: z.string().describe('Title of the interactive content'),
  type: z.enum(['code_playground', 'quiz', 'drag_drop', 'timeline', 'calculator']).describe('Type of interaction'),
  instructions: z.string().describe('Instructions for the interactive element'),
  initialCode: z.string().optional().describe('Initial code for code playgrounds'),
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string(),
    explanation: z.string()
  })).optional().describe('Questions for interactive quizzes'),
  narration: z.string().describe('Audio narration text')
});

const ThreeDContentSchema = z.object({
  title: z.string().describe('Title of the 3D visualization'),
  visualizationType: z.enum(['geometry', 'molecule', 'anatomy', 'architecture', 'physics']).describe('Type of 3D visualization'),
  config: z.record(z.string(), z.any()).describe('Configuration for the 3D visualization'),
  description: z.string().describe('Description of what students will see'),
  interactions: z.array(z.string()).describe('Available interactions (rotate, zoom, etc.)'),
  narration: z.string().describe('Audio narration text')
});

const AssessmentContentSchema = z.object({
  title: z.string().describe('Title of the assessment'),
  questions: z.array(z.object({
    id: z.string(),
    type: z.enum(['multiple_choice', 'short_answer', 'essay', 'code', 'diagram']),
    question: z.string(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string(),
    explanation: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    points: z.number()
  })).describe('Assessment questions'),
  timeLimit: z.number().optional().describe('Time limit in minutes'),
  passingScore: z.number().describe('Passing score percentage'),
  narration: z.string().describe('Audio narration text')
});

const SmartTeachingContentSchema = z.object({
  baseContent: z.object({
    title: z.string(),
    text: z.string(),
    objectives: z.array(z.string()),
    keyConcepts: z.array(z.string()),
    summary: z.string()
  }),
  math: MathContentSchema.optional(),
  diagram: DiagramContentSchema.optional(),
  simulation: SimulationContentSchema.optional(),
  video: VideoContentSchema.optional(),
  interactive: InteractiveContentSchema.optional(),
  threeD: ThreeDContentSchema.optional(),
  assessment: AssessmentContentSchema.optional(),
  metadata: z.object({
    difficulty: z.string(),
    estimatedTime: z.number(),
    learningStyle: z.string(),
    subject: z.string(),
    topic: z.string(),
    generatedAt: z.string(),
    version: z.string()
  })
});

export type SmartTeachingContent = z.infer<typeof SmartTeachingContentSchema>;
export type MathContent = z.infer<typeof MathContentSchema>;
export type DiagramContent = z.infer<typeof DiagramContentSchema>;
export type SimulationContent = z.infer<typeof SimulationContentSchema>;
export type VideoContent = z.infer<typeof VideoContentSchema>;
export type InteractiveContent = z.infer<typeof InteractiveContentSchema>;
export type ThreeDContent = z.infer<typeof ThreeDContentSchema>;
export type AssessmentContent = z.infer<typeof AssessmentContentSchema>;

export class SmartTeachingContentGenerator {
  private cache = new Map<string, SmartTeachingContent>();

  async generateContent(
    lessonContent: string,
    lessonTitle: string,
    objectives: string[],
    subject: string,
    topic: string,
    difficulty: string,
    learningStyle: 'visual' | 'audio' | 'kinesthetic' | 'analytical' = 'visual'
  ): Promise<SmartTeachingContent> {
    const cacheKey = `${lessonTitle}-${subject}-${topic}-${difficulty}-${learningStyle}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Start with basic content generation
      const basicContent = await this.generateBasicContent(lessonContent, lessonTitle, objectives, subject, topic, difficulty, learningStyle);
      
      // Cache the result
      this.cache.set(cacheKey, basicContent);
      
      return basicContent;
    } catch (error) {
      console.error('Error generating smart teaching content:', error);
      
      // Return fallback content
      return this.generateFallbackContent(lessonContent, lessonTitle, objectives, subject, topic, difficulty);
    }
  }

  private async generateBasicContent(
    lessonContent: string,
    lessonTitle: string,
    objectives: string[],
    subject: string,
    topic: string,
    difficulty: string,
    learningStyle: string
  ): Promise<SmartTeachingContent> {
    const systemPrompt = this.buildSystemPrompt(subject, topic, difficulty, learningStyle);
    
    const result = await generateObject({
      model: openai('gpt-4o-mini'), // Use mini for faster generation
      system: systemPrompt,
      prompt: `Generate educational content for this lesson:

Title: ${lessonTitle}
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}
Learning Style: ${learningStyle}

Lesson Content:
${lessonContent}

Learning Objectives:
${objectives.map(obj => `- ${obj}`).join('\n')}

Please generate engaging educational content with clear objectives and key concepts.`,
      schema: SmartTeachingContentSchema,
      temperature: 0.7,
    });

    return result.object;
  }

  private buildSystemPrompt(subject: string, topic: string, difficulty: string, learningStyle: string): string {
    return `You are an expert AI teacher specializing in creating engaging, multimodal educational content. Your task is to transform basic lesson content into rich, interactive learning experiences.

Subject: ${subject}
Topic: ${topic}
Difficulty Level: ${difficulty}
Learning Style: ${learningStyle}

Guidelines:
1. Create content that matches the learning style (visual learners need diagrams and visuals, audio learners need narration, kinesthetic learners need interactive elements, analytical learners need step-by-step explanations)
2. Ensure all mathematical content includes proper LaTeX formatting
3. Create Mermaid diagrams that are clear and educational
4. Generate realistic simulation parameters
5. Write engaging narration that explains concepts clearly
6. Include practice problems and examples
7. Make content age-appropriate for the difficulty level
8. Ensure all content is accurate and educationally sound

For each content type:
- Math: Include equations, explanations, graphs, and practice problems
- Diagram: Create clear Mermaid diagrams with explanations
- Simulation: Provide realistic parameters and clear instructions
- Video: Write detailed descriptions and transcripts
- Interactive: Create engaging interactive elements
- 3D: Design appropriate 3D visualizations
- Assessment: Generate comprehensive questions with explanations

Generate content that will make students excited to learn and help them master the concepts effectively.`;
  }

  private generateFallbackContent(
    lessonContent: string,
    lessonTitle: string,
    objectives: string[],
    subject: string,
    topic: string,
    difficulty: string
  ): SmartTeachingContent {
    return {
      baseContent: {
        title: lessonTitle,
        text: lessonContent,
        objectives: objectives,
        keyConcepts: this.extractKeyConcepts(lessonContent),
        summary: this.generateSummary(lessonContent)
      },
      metadata: {
        difficulty: difficulty,
        estimatedTime: 30,
        learningStyle: 'visual',
        subject: subject,
        topic: topic,
        generatedAt: new Date().toISOString(),
        version: '1.0'
      }
    };
  }

  private extractKeyConcepts(content: string): string[] {
    // Simple key concept extraction
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 5).map(s => s.trim());
  }

  private generateSummary(content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 3).join('. ') + '.';
  }

  async generateSpecificContentType(
    baseContent: string,
    contentType: 'math' | 'diagram' | 'simulation' | 'video' | 'interactive' | 'threeD' | 'assessment',
    context: {
      subject: string;
      topic: string;
      difficulty: string;
      learningStyle: string;
    }
  ): Promise<any> {
    const schemas = {
      math: MathContentSchema,
      diagram: DiagramContentSchema,
      simulation: SimulationContentSchema,
      video: VideoContentSchema,
      interactive: InteractiveContentSchema,
      threeD: ThreeDContentSchema,
      assessment: AssessmentContentSchema
    };

    const schema = schemas[contentType];
    if (!schema) {
      throw new Error(`Unknown content type: ${contentType}`);
    }

    try {
      const result = await generateObject({
        model: openai('gpt-4o'),
        system: `You are an expert AI teacher creating ${contentType} content for ${context.subject} - ${context.topic}. 
        Difficulty: ${context.difficulty}
        Learning Style: ${context.learningStyle}
        
        Create engaging, educational ${contentType} content that helps students learn effectively.`,
        prompt: `Generate ${contentType} content based on this lesson material:
        
        ${baseContent}`,
        schema: schema,
        temperature: 0.7,
      });

      return result.object;
    } catch (error) {
      console.error(`Error generating ${contentType} content:`, error);
      throw error;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

// Singleton instance
export const smartTeachingContentGenerator = new SmartTeachingContentGenerator();
