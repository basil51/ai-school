import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { perplexity } from '@ai-sdk/perplexity'; 
import { generateText } from 'ai';
import { z } from 'zod';

const MathContentSchema = z.object({
  equation: z.string().describe("LaTeX equation string"),
  explanation: z.string(),
  graphExpression: z.string().optional().describe(
    "Only if relevant to THIS concept. Avoid trig/function-notation unless explicitly asked."
  ),
  graphTitle: z.string().optional(),
  examples: z.array(z.object({
    problem: z.string(),
    solution: z.string(),
    steps: z.array(z.string())
  })).optional(),
  narration: z.string(),
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
  transcript: z.string().describe('Full transcript of the video'),
  src: z.string().describe('Video source URL - MUST be a real, working educational video URL (YouTube, Vimeo, or direct MP4)'),
  poster: z.string().optional().describe('Video poster/thumbnail image URL'),
  isValidUrl: z.boolean().describe('Whether the video URL is valid and accessible')
  // Note: captions removed to avoid CORS issues with external URLs
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

const Model3DContentSchema = z.object({
  title: z.string().describe('Title of the 3D model'),
  visualizationType: z.enum(['geometry', 'molecule', 'anatomy', 'architecture', 'physics']).describe('Type of 3D model'),
  config: z.object({
    type: z.string().describe('Specific model type (e.g., cube, sphere, pendulum)'),
    parameters: z.record(z.string(), z.any()).describe('Model parameters (dimensions, colors, etc.)')
  }).describe('3D model configuration'),
  description: z.string().describe('Description of the 3D model'),
  interactions: z.array(z.string()).describe('Available interactions'),
  narration: z.string().describe('Audio narration text'),
  learningObjectives: z.array(z.string()).describe('Learning objectives for the 3D model'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe('Difficulty level')
});

const ParticleEffectsContentSchema = z.object({
  title: z.string().describe('Title of the particle effects'),
  effectType: z.enum(['fire', 'smoke', 'stars', 'sparkles', 'rain', 'snow']).describe('Type of particle effect'),
  config: z.object({
    count: z.number().describe('Number of particles'),
    color: z.string().describe('Particle color'),
    size: z.number().describe('Particle size'),
    opacity: z.number().describe('Particle opacity'),
    speed: z.number().describe('Animation speed'),
    amplitude: z.number().describe('Animation amplitude')
  }).describe('Particle effect configuration'),
  description: z.string().describe('Description of the particle effects'),
  learningObjectives: z.array(z.string()).describe('Learning objectives'),
  educationalValue: z.string().describe('How this effect helps learning')
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

// Schema for stage 2 enhancements (only the enhancement types)
const Stage2EnhancedContentSchema = z.object({
  math: MathContentSchema.optional(),
  diagram: DiagramContentSchema.optional(),
  simulation: SimulationContentSchema.optional(),
  video: VideoContentSchema.optional(),
  interactive: InteractiveContentSchema.optional(),
  threeD: ThreeDContentSchema.optional(),
  model3D: Model3DContentSchema.optional(),
  particleEffects: ParticleEffectsContentSchema.optional().nullable(),
  assessment: AssessmentContentSchema.optional().nullable()
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
  model3D: Model3DContentSchema.optional(),
  particleEffects: ParticleEffectsContentSchema.optional().nullable(),
  assessment: AssessmentContentSchema.optional().nullable(),
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
export type Stage2EnhancedContent = z.infer<typeof Stage2EnhancedContentSchema>;
export type MathContent = z.infer<typeof MathContentSchema>;
export type DiagramContent = z.infer<typeof DiagramContentSchema>;
export type SimulationContent = z.infer<typeof SimulationContentSchema>;
export type VideoContent = z.infer<typeof VideoContentSchema>;
export type InteractiveContent = z.infer<typeof InteractiveContentSchema>;
export type ThreeDContent = z.infer<typeof ThreeDContentSchema>;
export type Model3DContent = z.infer<typeof Model3DContentSchema>;
export type ParticleEffectsContent = z.infer<typeof ParticleEffectsContentSchema>;
export type AssessmentContent = z.infer<typeof AssessmentContentSchema>;

export class SmartTeachingContentGenerator {
  private cache = new Map<string, SmartTeachingContent>();
  private cacheTimestamps = new Map<string, number>();
  private readonly CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

  async generateContent(
    lessonContent: string,
    lessonTitle: string,
    objectives: string[],
    subject: string,
    topic: string,
    difficulty: string,
    learningStyle: 'visual' | 'audio' | 'kinesthetic' | 'analytical' = 'visual',
    lessonId?: string,
    forceRegenerate: boolean = false
  ): Promise<SmartTeachingContent> {
    const cacheKey = `${lessonId ?? 'no-id'}-${lessonTitle}-${subject}-${topic}-${difficulty}-${learningStyle}`;
    
    // Check cache first (unless force regenerate)
    if (!forceRegenerate && this.cache.has(cacheKey)) {
      const timestamp = this.cacheTimestamps.get(cacheKey);
      if (timestamp && Date.now() - timestamp < this.CACHE_DURATION) {
        console.log(`Using cached content for ${cacheKey}`);
        return this.cache.get(cacheKey)!;
      } else {
        // Cache expired, remove it
        this.cache.delete(cacheKey);
        this.cacheTimestamps.delete(cacheKey);
      }
    }
    
    // Clear cache entry if force regenerate
    if (forceRegenerate && this.cache.has(cacheKey)) {
      this.cache.delete(cacheKey);
      this.cacheTimestamps.delete(cacheKey);
    }

    try {
      // Use progressive content generation pipeline
      const content = await this.generateProgressiveContent(lessonContent, lessonTitle, objectives, subject, topic, difficulty, learningStyle);
      
      // Validate that we have multimodal content, if not enhance it
      const hasMultimodal = !!(content.math || content.diagram || content.simulation || 
                              content.video || content.interactive || content.threeD || 
                              content.model3D || content.particleEffects);
      
      if (!hasMultimodal) {
        console.warn('Generated content lacks multimodal elements, enhancing with fallback content...');
        const requiredTypes = this.detectRequiredContentTypes(subject, lessonTitle);
        const enhancedContent = await this.generateFallbackMultimodalContent(
          lessonContent, lessonTitle, objectives, subject, topic, difficulty, learningStyle, requiredTypes
        );
        
        // Merge base content with enhanced multimodal content
        const finalContent = {
          ...content,
          ...enhancedContent,
          baseContent: content.baseContent // Keep the AI-generated base content
        };
        
        this.cache.set(cacheKey, finalContent);
        this.cacheTimestamps.set(cacheKey, Date.now());
        return finalContent;
      }
      
      // Cache the result
      this.cache.set(cacheKey, content);
      this.cacheTimestamps.set(cacheKey, Date.now());
      
      return content;
    } catch (error) {
      console.error('Error generating smart teaching content:', error);
      
      // Check if it's a schema validation error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage && (errorMessage.includes('schema') || errorMessage.includes('validation') || errorMessage.includes('metadata'))) {
        console.warn('Schema validation error detected, using fallback content generation...');
      }
      
      // Return fallback multimodal content with enhanced types
      const requiredTypes = this.detectRequiredContentTypes(subject, lessonTitle);
      const enhancedTypes = [...requiredTypes, 'diagram', 'interactive']; // Always include these
      return await this.generateFallbackMultimodalContent(lessonContent, lessonTitle, objectives, subject, topic, difficulty, learningStyle, enhancedTypes);
    }
  }

  private async generateProgressiveContent(
    lessonContent: string,
    lessonTitle: string,
    objectives: string[],
    subject: string,
    topic: string,
    difficulty: string,
    learningStyle: string
  ): Promise<SmartTeachingContent> {
    console.log('🎯 Starting optimized content generation pipeline...');
    
    // STEP 1: Search for video content first using Perplexity
    console.log('🔍 [DEBUG] Parameters received:', { subject, topic, lessonTitle, difficulty, learningStyle });
    // Use lessonTitle instead of topic for more specific video search
    const videoSearchResult = await this.searchForVideoContent(subject, lessonTitle);
    console.log('🎥 [STEP 1] Video search result:', videoSearchResult);
    
    // Detect required content types once (video not included)
    const requiredTypes = this.detectRequiredContentTypes(subject, lessonTitle);
    console.log(`Required content types for ${subject}:`, requiredTypes);
    
    // Optimize content types for learning style
    const optimizedTypes = this.optimizeContentTypesForLearningStyle(requiredTypes, learningStyle, subject, lessonTitle);
    console.log(`Optimized content types for ${learningStyle}:`, optimizedTypes);
    
    // STEP 2: Generate all other content using GPT-4o (without video)
    console.log('📝 [STEP 2] Generating other content types via GPT-4o...');
    const content = await this.generateOptimizedContent(lessonContent, lessonTitle, objectives, subject, topic, difficulty, learningStyle, optimizedTypes);
    
    // STEP 3: Add video content if found
    if (videoSearchResult) {
      console.log('🎥 [STEP 3] Adding video content to generated content...');
      const keyConcepts = this.generateKeyConceptsForSubject(subject, lessonTitle);
      
      content.video = {
        title: videoSearchResult.title,
        description: videoSearchResult.description,
        keyConcepts: keyConcepts,
        duration: 10,
        narration: `This video will help you understand ${lessonTitle} better. Watch carefully and take notes on the key concepts.`,
        transcript: `This educational video covers ${lessonTitle}. The instructor will explain the main concepts step by step, making it easy to understand. Key points include: ${keyConcepts.join(', ')}.`,
        src: videoSearchResult.url,
        poster: '',
        isValidUrl: true
      };
      console.log('✅ [STEP 3] Video content added successfully');
    } else {
      console.log('❌ [STEP 3] No video content found, skipping video addition');
    }
    
    // Validate and enhance the generated content
    console.log('🔍 [DEBUG] About to validate and enhance content...');
    const validatedContent = await this.validateAndEnhanceContent(content, subject, topic, lessonTitle);
    console.log('🔍 [DEBUG] Content validation completed');
    
    console.log('✅ Optimized content generation pipeline completed');
    return validatedContent;
  }

  private async generateOptimizedContent(
    lessonContent: string,
    lessonTitle: string,
    objectives: string[],
    subject: string,
    topic: string,
    difficulty: string,
    learningStyle: string,
    optimizedTypes: string[]
  ): Promise<SmartTeachingContent> {
    console.log('📝 Generating optimized content with all required types...');
    
    const systemPrompt = this.buildOptimizedSystemPrompt(subject, topic, difficulty, learningStyle, optimizedTypes);
    
    // Use the main schema for optimized generation
    let result;
    try {
      result = await generateObject({
        model: openai('gpt-4o'),
        system: systemPrompt,
        prompt: `Generate comprehensive educational content for this lesson:

Title: ${lessonTitle}
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}
Learning Style: ${learningStyle}
Required Content Types: ${optimizedTypes.join(', ')}

Lesson Content:
${lessonContent}

Learning Objectives:
${objectives.map(obj => `- ${obj}`).join('\n')}

CRITICAL REQUIREMENTS:
1. You MUST generate content for ALL required types: ${optimizedTypes.join(', ')}
2. You MUST include the metadata object with ALL required fields:
   - difficulty: "${difficulty}"
   - estimatedTime: 30
   - learningStyle: "${learningStyle}"
   - subject: "${subject}"
   - topic: "${topic}"
   - generatedAt: current timestamp
   - version: "1.0"
3. Do not skip any required content types or metadata fields.`,
        schema: SmartTeachingContentSchema,
        temperature: 0.7,
      });
    } catch (schemaError) {
      const errorMessage = schemaError instanceof Error ? schemaError.message : String(schemaError);
      console.warn('Schema validation failed, falling back to basic content generation:', errorMessage);
      // Fall back to basic content generation without strict schema validation
      return await this.generateFallbackMultimodalContent(lessonContent, lessonTitle, objectives, subject, topic, difficulty, learningStyle, optimizedTypes);
    }

    const generatedContent = result.object;
    
    // Note: Video content is now handled separately via Perplexity search
    
    // Ensure metadata is always present
    if (!generatedContent.metadata) {
      console.warn('Generated content missing metadata, adding fallback metadata...');
      generatedContent.metadata = {
        difficulty: difficulty,
        estimatedTime: 30,
        learningStyle: learningStyle,
        subject: subject,
        topic: topic,
        generatedAt: new Date().toISOString(),
        version: '1.0'
      };
    }
    
    // Validate that we have multimodal content
    const hasMultimodal = !!(generatedContent.math || generatedContent.diagram || 
                            generatedContent.simulation || generatedContent.video || 
                            generatedContent.interactive || generatedContent.threeD || 
                            generatedContent.model3D);
    
    if (!hasMultimodal) {
      console.warn('Generated content lacks multimodal elements, enhancing with fallback content...');
      return await this.generateFallbackMultimodalContent(lessonContent, lessonTitle, objectives, subject, topic, difficulty, learningStyle, optimizedTypes);
    }
    
    console.log('✅ Optimized content generation completed');
    return generatedContent;
  }

  private buildOptimizedSystemPrompt(
    subject: string, 
    topic: string, 
    difficulty: string, 
    learningStyle: string, 
    requiredTypes: string[]): string {
    const subjectGuidelines = this.getSubjectSpecificGuidelines(subject);
    const learningStyleGuidelines = this.getLearningStyleGuidelines(learningStyle);
    const contentTypeInstructions = this.getContentTypeInstructions(requiredTypes);
    
    return `You are an expert AI teacher specializing in creating engaging, multimodal educational content. Your task is to transform basic lesson content into rich, interactive learning experiences that surpass traditional search engine results.

      🎯 CONTEXT & OBJECTIVES:
      Subject: ${subject}
      Topic: ${topic}
      Difficulty Level: ${difficulty}
      Learning Style: ${learningStyle}
      Required Content Types: ${requiredTypes.join(', ')}

      🚨 CRITICAL REQUIREMENTS - NON-NEGOTIABLE:
      1. You MUST generate content for ALL required types: ${requiredTypes.join(', ')}
      2. Do not skip any required content types - this is mandatory and will be validated
      3. Each content type must be substantial and educationally valuable
      4. Content must be more engaging and effective than a simple search engine result
      5. All content must be age-appropriate and educationally sound
      6. For optional fields like particleEffects and assessment, you may set them to null if not needed

      📚 SUBJECT-SPECIFIC GUIDELINES:
      ${subjectGuidelines}

      🎨 LEARNING STYLE OPTIMIZATION:
      ${learningStyleGuidelines}

      🔧 CONTENT TYPE INSTRUCTIONS:
      ${contentTypeInstructions}

      📊 QUALITY STANDARDS & VALIDATION:
      - Mathematical expressions: Use proper LaTeX formatting with clear notation
      - Diagrams: Create clear, educational Mermaid diagrams that support learning objectives
      - Simulations: Generate realistic parameters with clear instructions and expected outcomes
      - Interactive elements: Design intuitive, educational activities that encourage participation
      - Narration: Write engaging, clear explanations that build understanding progressively
      - 3D models: Provide detailed specifications for realistic, educational 3D representations
      - Assessments: Create meaningful questions that test understanding, not just memorization

      🎯 RELEVANCE & ALIGNMENT REQUIREMENTS:
      - All content MUST be directly grounded in the provided lesson content and topic
      - Do NOT produce generic placeholders (e.g., "y = f(x)", "Math.sin(x)") unless explicitly present in the lesson
      - For math, base equations, graphs, and examples on the lesson's equations (e.g., if the lesson shows 2x+3=11, use that or closely related linear equations)
      - Use the subject name (${subject}) and topic (${topic}) to keep all modalities strictly on-topic

      🎯 ENGAGEMENT REQUIREMENTS:
      - Content must be more engaging than traditional textbook material
      - Include real-world connections and practical applications
      - Use storytelling elements where appropriate
      - Incorporate progressive difficulty and scaffolding
      - Ensure content is accessible to diverse learners

      💡 INNOVATION STANDARDS:
      - Leverage modern educational technology capabilities
      - Create immersive learning experiences
      - Use multimedia elements effectively
      - Provide multiple pathways to understanding
      - Include opportunities for discovery and exploration

      Remember: You are creating a next-generation educational experience that should make students excited to learn. Every piece of content should add significant value and create a memorable learning experience.`;
  }

  private async validateAndEnhanceContent(
    content: SmartTeachingContent,
    subject: string,
    topic: string,
    lessonTitle: string
  ): Promise<SmartTeachingContent> {
    console.log('🔍 Stage 4: Validating and enhancing content quality...');
    
    // Video URLs are now pre-validated via Perplexity search, no need to validate again
    if (content.video) {
      console.log('🎥 [DEBUG] Video content present (pre-validated via Perplexity):', content.video.src);
      // Mark as valid since it came from Perplexity search
      content.video.isValidUrl = true;
    } else {
      console.log('🎥 [DEBUG] No video content present');
    }
    
    // Validate content completeness and quality
    const validationResults = this.validateContentCompleteness(content, subject, lessonTitle);
    const qualityValidation = this.validateContentQuality(content, subject, lessonTitle);
    console.log('Content validation results:', validationResults);
    console.log('Content quality validation:', qualityValidation);
    
    // If content is complete and meets quality standards, return as is
    if (validationResults.isComplete && qualityValidation.isValid) {
      console.log('✅ Stage 4 completed - Content validation and quality check passed');
      return content;
    }
    
    // Enhance missing content and apply quality recommendations
    const allMissingTypes = [...validationResults.missingTypes, ...qualityValidation.missingTypes];
    const enhancedContent = await this.enhanceMissingContent(content, subject, topic, lessonTitle, allMissingTypes);
    
    console.log('✅ Stage 4 completed - Content enhanced and validated');
    return enhancedContent;
  }

  private buildStage1SystemPrompt(subject: string, topic: string, difficulty: string, learningStyle: string, requiredTypes: string[]): string {
    const subjectGuidelines = this.getSubjectSpecificGuidelines(subject);
    const learningStyleGuidelines = this.getLearningStyleGuidelines(learningStyle);
    const contentTypeInstructions = this.getContentTypeInstructions(requiredTypes);
    
    return `You are an expert AI teacher specializing in creating engaging, multimodal educational content. Your task is to transform basic lesson content into rich, interactive learning experiences that surpass traditional search engine results.

🎯 CONTEXT & OBJECTIVES:
Subject: ${subject}
Topic: ${topic}
Difficulty Level: ${difficulty}
Learning Style: ${learningStyle}
Required Content Types: ${requiredTypes.join(', ')}

🚨 CRITICAL REQUIREMENTS - NON-NEGOTIABLE:
1. You MUST generate content for ALL required types: ${requiredTypes.join(', ')}
2. Do not skip any required content types - this is mandatory and will be validated
3. Each content type must be substantial and educationally valuable
4. Content must be more engaging and effective than a simple search engine result
5. All content must be age-appropriate and educationally sound

📚 SUBJECT-SPECIFIC GUIDELINES:
${subjectGuidelines}

🎨 LEARNING STYLE OPTIMIZATION:
${learningStyleGuidelines}

🔧 CONTENT TYPE INSTRUCTIONS:
${contentTypeInstructions}

📊 QUALITY STANDARDS & VALIDATION:
- Mathematical expressions: Use proper LaTeX formatting with clear notation
- Diagrams: Create clear, educational Mermaid diagrams that support learning objectives
- Simulations: Generate realistic parameters with clear instructions and expected outcomes
- Interactive elements: Design intuitive, educational activities that encourage participation
- Narration: Write engaging, clear explanations that build understanding progressively
- 3D models: Provide detailed specifications for realistic, educational 3D representations
- Assessments: Create meaningful questions that test understanding, not just memorization

🎯 RELEVANCE & ALIGNMENT REQUIREMENTS:
- All content MUST be directly grounded in the provided lesson content and topic
- Do NOT produce generic placeholders (e.g., "y = f(x)", "Math.sin(x)") unless explicitly present in the lesson
- For math, base equations, graphs, and examples on the lesson's equations (e.g., if the lesson shows 2x+3=11, use that or closely related linear equations)
- Use the subject name (${subject}) and topic (${topic}) to keep all modalities strictly on-topic

🎯 ENGAGEMENT REQUIREMENTS:
- Content must be more engaging than traditional textbook material
- Include real-world connections and practical applications
- Use storytelling elements where appropriate
- Incorporate progressive difficulty and scaffolding
- Ensure content is accessible to diverse learners

💡 INNOVATION STANDARDS:
- Leverage modern educational technology capabilities
- Create immersive learning experiences
- Use multimedia elements effectively
- Provide multiple pathways to understanding
- Include opportunities for discovery and exploration

Remember: You are creating a next-generation educational experience that should make students excited to learn. Every piece of content should add significant value and create a memorable learning experience.`;
  }

  private buildStage2SystemPrompt(subject: string, topic: string, difficulty: string, learningStyle: string, enhancementTypes: string[]): string {
    const subjectEnhancements = this.getSubjectSpecificEnhancements(subject);
    const learningStyleEnhancements = this.getLearningStyleEnhancements(learningStyle);
    
    return `You are an expert AI teacher specializing in subject-specific educational enhancements. Your task is to enhance existing educational content with sophisticated, subject-specific features that create deeper learning experiences.

🎯 ENHANCEMENT CONTEXT:
Subject: ${subject}
Topic: ${topic}
Difficulty Level: ${difficulty}
Learning Style: ${learningStyle}
Enhancement Types: ${enhancementTypes.join(', ')}

🚨 CRITICAL ENHANCEMENT REQUIREMENTS:
1. You MUST add content for ALL enhancement types: ${enhancementTypes.join(', ')}
2. Do not remove any existing content - only enhance and add
3. Each enhancement must be substantial and educationally valuable
4. Enhancements must be more sophisticated than basic content
5. All enhancements must be age-appropriate and educationally sound

📚 SUBJECT-SPECIFIC ENHANCEMENTS:
${subjectEnhancements}

🎨 LEARNING STYLE ENHANCEMENTS:
${learningStyleEnhancements}

🔧 ENHANCEMENT GUIDELINES:
- Build upon the existing content structure and flow
- Add subject-specific examples, applications, and connections
- Include advanced visual and interactive elements
- Enhance the learning experience without overwhelming students
- Maintain consistency with existing content style and quality
- Create deeper understanding and engagement
- Include real-world applications and current examples
- Provide multiple pathways to understanding

💡 ENHANCEMENT QUALITY STANDARDS:
- Each enhancement should add significant educational value
- Enhancements should be more engaging than basic content
- Include opportunities for deeper exploration and discovery
- Provide connections to broader concepts and applications
- Include assessment opportunities for enhanced content
- Ensure accessibility and inclusivity in all enhancements

🎯 ENHANCEMENT SUCCESS CRITERIA:
- Content should be more engaging than traditional educational materials
- Enhancements should create memorable learning experiences
- Students should be able to apply enhanced content in real-world contexts
- Enhanced content should support multiple learning preferences
- All enhancements should be validated for educational effectiveness

Remember: You are creating sophisticated educational enhancements that should make the learning experience significantly more engaging and effective than basic content. Every enhancement should add substantial value and create deeper understanding.`;
  }

  private buildStage3SystemPrompt(subject: string, topic: string, difficulty: string, learningStyle: string, advancedFeatures: string[]): string {
    return `You are an expert AI teacher specializing in advanced multimodal educational features. Your task is to add advanced multimodal capabilities to existing educational content.

Subject: ${subject}
Topic: ${topic}
Difficulty Level: ${difficulty}
Learning Style: ${learningStyle}
Advanced Features: ${advancedFeatures.join(', ')}

CRITICAL REQUIREMENTS:
1. You MUST add content for ALL advanced features: ${advancedFeatures.join(', ')}
2. Do not remove any existing content - only enhance and add
3. Add advanced multimodal capabilities that enhance learning
4. Ensure all advanced features are relevant and educational
5. Maintain the quality and educational value of existing content

Advanced Feature Guidelines:
- Add 3D models, particle effects, and advanced visualizations where appropriate
- Include interactive elements that engage students
- Add assessment components that test understanding
- Ensure all advanced features are educationally sound
- Maintain consistency with the learning style and difficulty level

Remember: You are adding advanced multimodal capabilities to create a modern, engaging learning experience. Every advanced feature should enhance the educational value.`;
  }

  private getSubjectEnhancementTypes(subject: string, topic: string): string[] {
    const subjectLower = subject.toLowerCase();
    const topicLower = topic.toLowerCase();
    const enhancements: string[] = [];
    
    // Subject-specific enhancements
    if (subjectLower.includes('math') || subjectLower.includes('algebra') || 
        subjectLower.includes('geometry') || subjectLower.includes('calculus')) {
      enhancements.push('math', 'interactive');
    }
    
    if (subjectLower.includes('science') || subjectLower.includes('physics') || 
        subjectLower.includes('chemistry') || subjectLower.includes('biology')) {
      enhancements.push('simulation', 'diagram');
    }
    
    if (subjectLower.includes('history') || subjectLower.includes('social')) {
      enhancements.push('video', 'interactive');
    }
    
    if (subjectLower.includes('language') || subjectLower.includes('english') || 
        subjectLower.includes('literature')) {
      enhancements.push('video', 'interactive');
    }
    
    // Topic-specific enhancements
    if (topicLower.includes('3d') || topicLower.includes('spatial') || 
        topicLower.includes('geometry') || topicLower.includes('molecular')) {
      enhancements.push('3d', 'model3d');
    }
    
    if (topicLower.includes('animation') || topicLower.includes('motion') || 
        topicLower.includes('dynamics')) {
      enhancements.push('particleEffects');
    }
    
    return [...new Set(enhancements)]; // Remove duplicates
  }

  private getAdvancedFeatures(subject: string, learningStyle: string): string[] {
    const features: string[] = [];
    
    // Learning style-based features
    if (learningStyle === 'visual') {
      features.push('3d', 'model3d', 'particleEffects');
    }
    
    if (learningStyle === 'kinesthetic') {
      features.push('interactive', 'simulation');
    }
    
    if (learningStyle === 'audio') {
      features.push('video', 'assessment');
    }
    
    if (learningStyle === 'analytical') {
      features.push('assessment', 'interactive');
    }
    
    // Subject-based advanced features
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes('science') || subjectLower.includes('physics') || 
        subjectLower.includes('chemistry') || subjectLower.includes('biology')) {
      features.push('3d', 'model3d', 'particleEffects');
    }
    
    if (subjectLower.includes('math') || subjectLower.includes('algebra') || 
        subjectLower.includes('geometry') || subjectLower.includes('calculus')) {
      features.push('interactive', 'assessment');
    }
    
    return [...new Set(features)]; // Remove duplicates
  }

  private validateContentCompleteness(content: SmartTeachingContent, subject: string, lessonTitle: string): { isComplete: boolean; missingTypes: string[] } {
    const requiredTypes = this.detectRequiredContentTypes(subject, lessonTitle);
    const missingTypes: string[] = [];
    
    for (const type of requiredTypes) {
      if (!content[type as keyof SmartTeachingContent]) {
        missingTypes.push(type);
      }
    }
    
    return {
      isComplete: missingTypes.length === 0,
      missingTypes
    };
  }

  private async enhanceMissingContent(content: SmartTeachingContent, subject: string, topic: string, lessonTitle: string, missingTypes: string[]): Promise<SmartTeachingContent> {
    if (missingTypes.length === 0) {
      return content;
    }
    
    console.log(`Enhancing missing content types: ${missingTypes.join(', ')}`);
    
    const systemPrompt = `You are an expert AI teacher. Add the missing content types to the existing educational content.

Subject: ${subject}
Topic: ${topic}
Missing Content Types: ${missingTypes.join(', ')}

Existing Content:
${JSON.stringify(content, null, 2)}

CRITICAL: Add content for the missing types: ${missingTypes.join(', ')}. Do not remove any existing content.`;
    
    const result = await generateObject({
      model: openai('gpt-4o'),
      system: systemPrompt,
      prompt: `Add the missing content types to the existing educational content.`,
      schema: Stage2EnhancedContentSchema
    });
    
    // Merge the enhanced content with the existing content
    const enhancedContent: SmartTeachingContent = {
      ...content,
      ...result.object
    };
    
    return enhancedContent;
  }

  private detectRequiredContentTypes(subject: string, lessonTitle: string): string[] {
    // Simplified and faster content type detection
    const types = ['text']; // Always include text
    const subjectLower = subject.toLowerCase();
    //const contentLower = lessonContent.toLowerCase();
    
    // Note: Video is now handled separately via Perplexity search, not included in GPT generationc
    // Quick subject-based detection
    if (subjectLower.includes('math') || subjectLower.includes('algebra') || 
        subjectLower.includes('geometry') || subjectLower.includes('calculus')) {
      types.push('math', 'diagram', 'interactive');
    } else if (subjectLower.includes('science') || subjectLower.includes('physics') || 
               subjectLower.includes('chemistry') || subjectLower.includes('biology')) {
      types.push('diagram', 'simulation', 'threeD');
    } else if (subjectLower.includes('history') || subjectLower.includes('social')) {
      types.push('diagram', 'interactive');
    } else if (subjectLower.includes('language') || subjectLower.includes('english')) {
      types.push('interactive', 'assessment');
    } else {
      // Default multimodal types
      types.push('diagram', 'interactive');
    }
    
    // Remove duplicates and return
    const uniqueTypes = [...new Set(types)];
    console.log(`Content types for ${subject}: ${uniqueTypes.join(', ')}`);
    
    return uniqueTypes;
  }

  private optimizeContentTypesForLearningStyle(contentTypes: string[], learningStyle: string, subject?: string, lessonTitle?: string): string[] {
    // Subject-aware learning style optimization
    const subjectLower = subject?.toLowerCase() || '';
    
    // Define which subjects are appropriate for 3D content
    const subjectsAppropriateFor3D = [
      'science', 'physics', 'chemistry', 'biology', 'geometry', 
      'anatomy', 'architecture', 'engineering', 'astronomy', 'geology'
    ];
    
    const isSubjectAppropriateFor3D = subjectsAppropriateFor3D.some(appropriateSubject => 
      subjectLower.includes(appropriateSubject)
    );

    // Learning style additions - now subject-aware
    const learningStyleAdditions = {
      visual: ['diagram', 'video', ...(isSubjectAppropriateFor3D ? ['threeD'] : [])],
      audio: ['video', 'assessment'],
      kinesthetic: ['interactive', 'simulation'],
      analytical: ['math', 'diagram', 'assessment']
    };

    const additions = learningStyleAdditions[learningStyle as keyof typeof learningStyleAdditions] || [];
    
    // Normalize types and add learning style preferences
    const normalize = (t: string) => (t === '3d' ? 'threeD' : t === 'model3d' ? 'model3D' : t);
    const allowed = new Set(['text','math','diagram','simulation','video','interactive','threeD','model3D','particleEffects','assessment']);

    const optimizedTypes = [...new Set([
      ...contentTypes.map(normalize),
      ...additions.map(normalize)
    ])].filter(t => allowed.has(t));

    console.log(`Optimized content types for ${learningStyle} (${subject}): ${optimizedTypes.join(', ')}`);
    if (!isSubjectAppropriateFor3D && learningStyle === 'visual') {
      console.log(`✅ 3D content filtered out for ${subject} - not appropriate for this subject`);
    }
    return optimizedTypes;
  }

  private validateContentQuality(content: SmartTeachingContent, subject: string, lessonTitle: string): { 
    isValid: boolean; 
    qualityScore: number; 
    missingTypes: string[]; 
    recommendations: string[] 
  } {
    console.log('🔍 Validating content quality...');
    
    const requiredTypes = this.detectRequiredContentTypes(subject, lessonTitle);
    const presentTypes = this.getPresentContentTypes(content);
    const missingTypes = requiredTypes.filter(type => !presentTypes.includes(type));
    
    let qualityScore = 0;
    const recommendations: string[] = [];
    
    // Check for required content types
    const typeCompleteness = (requiredTypes.length - missingTypes.length) / requiredTypes.length;
    qualityScore += typeCompleteness * 40; // 40% weight for type completeness
    
    // Check content richness
    const contentRichness = this.assessContentRichness(content);
    qualityScore += contentRichness * 30; // 30% weight for content richness
    
    // Check multimodal diversity
    const multimodalDiversity = this.assessMultimodalDiversity(content);
    qualityScore += multimodalDiversity * 30; // 30% weight for multimodal diversity
    
    // Generate recommendations
    if (missingTypes.length > 0) {
      recommendations.push(`Add missing content types: ${missingTypes.join(', ')}`);
    }
    
    if (contentRichness < 0.7) {
      recommendations.push('Enhance content richness with more detailed explanations and examples');
    }
    
    if (multimodalDiversity < 0.6) {
      recommendations.push('Increase multimodal diversity with more visual and interactive elements');
    }
    
    const isValid = qualityScore >= 0.7 && missingTypes.length === 0;
    
    console.log(`Content quality validation: ${isValid ? 'PASSED' : 'FAILED'} (score: ${qualityScore.toFixed(2)})`);
    console.log(`Missing types: ${missingTypes.join(', ')}`);
    console.log(`Recommendations: ${recommendations.join('; ')}`);
    
    return {
      isValid,
      qualityScore,
      missingTypes,
      recommendations
    };
  }

  private getPresentContentTypes(content: SmartTeachingContent): string[] {
    const types: string[] = ['text']; // Always present
    
    if (content.diagram) {
      types.push('diagram');
    }
    
    if (content.threeD || content.model3D) {
      types.push('3d');
    }
    
    if (content.interactive) {
      types.push('interactive');
    }
    
    if (content.assessment) {
      types.push('assessment');
    }
    
    if (content.simulation) {
      types.push('simulation');
    }
    
    if (content.video) {
      types.push('video');
    }
    
    if (content.math) {
      types.push('math');
    }
    
    if (content.particleEffects) {
      types.push('particle');
    }
    
    return types;
  }

  private assessContentRichness(content: SmartTeachingContent): number {
    let richness = 0;
    
    // Check text content richness
    if (content.baseContent.text && content.baseContent.text.length > 200) {
      richness += 0.3;
    }
    
    // Check for detailed explanations
    if (content.baseContent.keyConcepts && content.baseContent.keyConcepts.length > 3) {
      richness += 0.2;
    }
    
    // Check for comprehensive summary
    if (content.baseContent.summary && content.baseContent.summary.length > 100) {
      richness += 0.2;
    }
    
    // Check for multiple content types
    const contentTypes = this.getPresentContentTypes(content);
    richness += Math.min(contentTypes.length / 5, 0.3);
    
    return Math.min(richness, 1.0);
  }

  private assessMultimodalDiversity(content: SmartTeachingContent): number {
    const contentTypes = this.getPresentContentTypes(content);
    const totalPossibleTypes = 8; // text, diagram, 3d, interactive, assessment, simulation, audio, video, math
    
    return Math.min(contentTypes.length / totalPossibleTypes, 1.0);
  }

  private getSubjectSpecificGuidelines(subject: string): string {
    const subjectLower = subject.toLowerCase();
    
    if (subjectLower.includes('math') || subjectLower.includes('algebra') || subjectLower.includes('geometry') || subjectLower.includes('calculus')) {
      return `MATHEMATICS FOCUS:
- Emphasize problem-solving strategies and logical reasoning
- Include step-by-step solutions with clear explanations
- Use visual representations (graphs, charts, geometric shapes)
- Provide multiple solution methods when applicable
- Include real-world applications and word problems
- Ensure mathematical notation is precise and consistent
- Create interactive problem-solving activities
- Include formative assessments to check understanding`;
    }
    
    if (subjectLower.includes('science') || subjectLower.includes('physics') || subjectLower.includes('chemistry') || subjectLower.includes('biology')) {
      return `SCIENCE FOCUS:
- Emphasize scientific method and inquiry-based learning
- Include hands-on experiments and simulations
- Use visual models and 3D representations for complex concepts
- Connect concepts to real-world phenomena and current events
- Include data analysis and interpretation activities
- Provide clear explanations of scientific processes
- Include safety considerations for experiments
- Create opportunities for hypothesis testing and prediction`;
    }
    
    if (subjectLower.includes('language') || subjectLower.includes('english') || subjectLower.includes('literature')) {
      return `LANGUAGE ARTS FOCUS:
- Emphasize critical thinking and analytical skills
- Include creative writing and expression opportunities
- Use multimedia to enhance storytelling and comprehension
- Provide examples from diverse authors and cultures
- Include grammar and vocabulary in context
- Create interactive reading and writing activities
- Include peer collaboration and discussion elements
- Assess both comprehension and creative expression`;
    }
    
    if (subjectLower.includes('history') || subjectLower.includes('social')) {
      return `SOCIAL STUDIES FOCUS:
- Emphasize critical thinking about historical events and social issues
- Include primary source analysis and interpretation
- Use timelines, maps, and visual representations
- Connect historical events to current issues
- Include multiple perspectives and viewpoints
- Create role-playing and simulation activities
- Include research and presentation skills
- Assess understanding through project-based learning`;
    }
    
    if (subjectLower.includes('art') || subjectLower.includes('music') || subjectLower.includes('creative')) {
      return `ARTS FOCUS:
- Emphasize creativity and self-expression
- Include hands-on creation and performance activities
- Use multimedia to showcase artistic techniques
- Provide examples from diverse artists and cultures
- Include art history and cultural context
- Create opportunities for peer critique and collaboration
- Include both technical skills and creative interpretation
- Assess both process and final product`;
    }
    
    if (subjectLower.includes('technology') || subjectLower.includes('computer') || subjectLower.includes('programming')) {
      return `TECHNOLOGY FOCUS:
- Emphasize practical application and problem-solving
- Include hands-on coding and design activities
- Use interactive simulations and virtual environments
- Connect technology to real-world applications
- Include ethical considerations and digital citizenship
- Create opportunities for collaboration and sharing
- Include both technical skills and creative problem-solving
- Assess through project-based learning and portfolios`;
    }
    
    return `GENERAL SUBJECT FOCUS:
- Emphasize critical thinking and problem-solving
- Include real-world connections and applications
- Use multiple learning modalities and representations
- Provide opportunities for active learning and participation
- Include formative and summative assessment opportunities
- Create engaging and interactive learning experiences
- Ensure content is accessible to diverse learners
- Connect learning to student interests and experiences`;
  }

  private getLearningStyleGuidelines(learningStyle: string): string {
    switch (learningStyle.toLowerCase()) {
      case 'visual':
        return `VISUAL LEARNER OPTIMIZATION:
- Prioritize diagrams, charts, graphs, and visual representations
- Use color coding and visual organization
- Include infographics and visual summaries
- Provide visual step-by-step processes
- Use mind maps and concept maps
- Include visual examples and demonstrations
- Create visual memory aids and mnemonics
- Use visual metaphors and analogies`;
      
      case 'audio':
        return `AUDIO LEARNER OPTIMIZATION:
- Prioritize narration, explanations, and verbal instructions
- Include audio descriptions and sound effects
- Use rhythm, rhyme, and musical elements
- Provide verbal step-by-step processes
- Include discussion and verbal interaction
- Use audio examples and demonstrations
- Create verbal memory aids and mnemonics
- Use verbal metaphors and analogies`;
      
      case 'kinesthetic':
        return `KINESTHETIC LEARNER OPTIMIZATION:
- Prioritize hands-on activities and interactive simulations
- Include movement and physical engagement
- Use manipulatives and interactive tools
- Provide step-by-step physical processes
- Include role-playing and simulation activities
- Create opportunities for building and creating
- Use physical memory aids and gestures
- Include real-world applications and practice`;
      
      case 'analytical':
        return `ANALYTICAL LEARNER OPTIMIZATION:
- Prioritize logical structure and systematic approaches
- Include detailed explanations and reasoning
- Use data analysis and problem-solving frameworks
- Provide step-by-step logical processes
- Include research and investigation activities
- Create opportunities for analysis and evaluation
- Use systematic memory aids and organization
- Include cause-and-effect relationships`;
      
      default:
        return `MULTIMODAL LEARNER OPTIMIZATION:
- Combine visual, audio, kinesthetic, and analytical elements
- Provide multiple pathways to understanding
- Include diverse learning activities and assessments
- Use varied instructional methods and materials
- Create opportunities for different types of engagement
- Include both individual and collaborative activities
- Use multiple memory aids and learning strategies
- Ensure accessibility for diverse learning preferences`;
    }
  }

  private getContentTypeInstructions(requiredTypes: string[]): string {
    const instructions: string[] = [];
    
    if (requiredTypes.includes('text')) {
      instructions.push(`TEXT CONTENT:
- Create comprehensive, well-structured written content
- Use clear, age-appropriate language
- Include proper headings, subheadings, and organization
- Provide detailed explanations and examples
- Include key concepts and vocabulary definitions
- Use engaging writing style that maintains interest`);
    }
    
    if (requiredTypes.includes('math')) {
      instructions.push(`MATHEMATICAL CONTENT:
- Use proper LaTeX formatting for all mathematical expressions
- Include step-by-step solutions with clear explanations
- Provide multiple solution methods when applicable
- Include practice problems with varying difficulty levels
- Use mathematical notation consistently and precisely
- Include real-world applications and word problems
- CRITICAL: Base all equations, graphs, and examples on the specific lesson topic
- For linear equations lessons: use actual linear equations like "2x + 3 = 11", not generic "y = f(x)"
- For geometry lessons: use specific geometric formulas and shapes from the lesson
- Graph expressions must relate to the lesson content (e.g., for linear equations, use "2*x + 3" not "Math.sin(x)")`);
    }
    
    if (requiredTypes.includes('diagram')) {
      instructions.push(`DIAGRAM CONTENT:
- Create clear, educational Mermaid diagrams
- Use appropriate diagram types (flowchart, sequence, class, etc.)
- Include proper labels and annotations
- Ensure diagrams support learning objectives
- Use color coding and visual organization
- Include interactive elements where possible`);
    }
    
    if (requiredTypes.includes('simulation')) {
      instructions.push(`SIMULATION CONTENT:
- Generate realistic parameters and scenarios
- Include clear instructions and expected outcomes
- Provide interactive controls and variables
- Include data collection and analysis opportunities
- Use appropriate simulation types for the subject
- Include safety considerations and limitations`);
    }
    
    if (requiredTypes.includes('3d')) {
      instructions.push(`3D MODEL CONTENT:
- Provide detailed specifications for 3D representations
- Include interactive controls and viewing options
- Use appropriate 3D model types for the subject
- Include annotations and labeling
- Provide multiple viewing angles and perspectives
- Include measurement and analysis tools`);
    }
    
    if (requiredTypes.includes('interactive')) {
      instructions.push(`INTERACTIVE CONTENT:
- Create engaging, educational interactive activities
- Include clear instructions and feedback
- Provide multiple difficulty levels and challenges
- Include progress tracking and achievement systems
- Use appropriate interaction types (drag-and-drop, click, etc.)
- Include collaborative and competitive elements`);
    }
    
    // Video content is now handled separately via Perplexity search, not generated by GPT
    
    if (requiredTypes.includes('assessment')) {
      instructions.push(`ASSESSMENT CONTENT:
- Create meaningful questions that test understanding
- Include various question types (multiple choice, open-ended, etc.)
- Provide clear rubrics and scoring criteria
- Include formative and summative assessment opportunities
- Use appropriate difficulty levels and scaffolding
- Include feedback and remediation suggestions`);
    }
    
    if (requiredTypes.includes('audio')) {
      instructions.push(`AUDIO CONTENT:
- Create engaging audio scripts and narration
- Include clear pronunciation and pacing
- Use appropriate audio types (narration, sound effects, etc.)
- Include interactive audio elements
- Provide multiple playback speeds and accessibility options
- Include transcripts and visual aids`);
    }
    
    return instructions.join('\n\n');
  }

  private getSubjectSpecificEnhancements(subject: string): string {
    const subjectLower = subject.toLowerCase();
    
    if (subjectLower.includes('math') || subjectLower.includes('algebra') || subjectLower.includes('geometry') || subjectLower.includes('calculus')) {
      return `MATHEMATICS ENHANCEMENTS:
- Add advanced problem-solving strategies and multiple solution approaches
- Include mathematical modeling and real-world applications
- Provide interactive graphing and visualization tools
- Add mathematical proofs and logical reasoning exercises
- Include statistical analysis and data interpretation
- Create mathematical games and puzzles
- Add historical context and famous mathematicians
- Include career connections and mathematical professions`;
    }
    
    if (subjectLower.includes('science') || subjectLower.includes('physics') || subjectLower.includes('chemistry') || subjectLower.includes('biology')) {
      return `SCIENCE ENHANCEMENTS:
- Add advanced laboratory simulations and virtual experiments
- Include scientific data analysis and interpretation tools
- Provide 3D molecular models and atomic structures
- Add scientific method applications and hypothesis testing
- Include current scientific research and discoveries
- Create environmental impact assessments and sustainability projects
- Add scientific career exploration and role models
- Include interdisciplinary connections and real-world applications`;
    }
    
    if (subjectLower.includes('language') || subjectLower.includes('english') || subjectLower.includes('literature')) {
      return `LANGUAGE ARTS ENHANCEMENTS:
- Add advanced literary analysis and critical thinking exercises
- Include creative writing workshops and peer review activities
- Provide multimedia storytelling and digital composition tools
- Add cultural and historical context for literature
- Include language evolution and etymology exploration
- Create debate and discussion forums
- Add publishing and sharing opportunities
- Include career connections in writing and communication`;
    }
    
    if (subjectLower.includes('history') || subjectLower.includes('social')) {
      return `SOCIAL STUDIES ENHANCEMENTS:
- Add primary source analysis and historical investigation tools
- Include interactive timelines and geographic mapping
- Provide role-playing simulations and historical reenactments
- Add current events analysis and civic engagement activities
- Include cultural exchange and global perspective projects
- Create policy analysis and government simulation activities
- Add historical preservation and community service projects
- Include career connections in social sciences and public service`;
    }
    
    if (subjectLower.includes('art') || subjectLower.includes('music') || subjectLower.includes('creative')) {
      return `ARTS ENHANCEMENTS:
- Add advanced creative techniques and artistic processes
- Include digital art tools and multimedia composition
- Provide art history analysis and cultural context
- Add performance opportunities and exhibition spaces
- Include collaborative art projects and community engagement
- Create art critique and peer review activities
- Add career exploration in arts and creative industries
- Include interdisciplinary connections and STEAM projects`;
    }
    
    if (subjectLower.includes('technology') || subjectLower.includes('computer') || subjectLower.includes('programming')) {
      return `TECHNOLOGY ENHANCEMENTS:
- Add advanced coding projects and software development
- Include cybersecurity and digital citizenship education
- Provide AI and machine learning exploration tools
- Add robotics and automation project opportunities
- Include data science and analytics applications
- Create technology entrepreneurship and innovation projects
- Add career exploration in technology and engineering
- Include ethical considerations and responsible technology use`;
    }
    
    return `GENERAL SUBJECT ENHANCEMENTS:
- Add advanced critical thinking and problem-solving activities
- Include interdisciplinary connections and real-world applications
- Provide collaborative learning and peer interaction opportunities
- Add research and investigation projects
- Include technology integration and digital literacy
- Create community engagement and service learning projects
- Add career exploration and professional development
- Include global perspective and cultural awareness`;
  }

  private getLearningStyleEnhancements(learningStyle: string): string {
    switch (learningStyle.toLowerCase()) {
      case 'visual':
        return `VISUAL LEARNER ENHANCEMENTS:
- Add advanced infographics and data visualization tools
- Include interactive mind maps and concept mapping
- Provide video tutorials and animated explanations
- Add color-coded organization and visual hierarchy
- Include virtual reality and immersive visual experiences
- Create visual storytelling and narrative elements
- Add graphic design and visual communication tools
- Include visual assessment and portfolio opportunities`;
      
      case 'audio':
        return `AUDIO LEARNER ENHANCEMENTS:
- Add advanced audio narration and voice-over tools
- Include podcast creation and audio storytelling
- Provide music and rhythm-based learning activities
- Add discussion forums and verbal interaction opportunities
- Include audio feedback and verbal assessment
- Create sound design and audio production projects
- Add language learning and pronunciation tools
- Include audio-based memory techniques and mnemonics`;
      
      case 'kinesthetic':
        return `KINESTHETIC LEARNER ENHANCEMENTS:
- Add advanced hands-on projects and building activities
- Include virtual reality and immersive simulation experiences
- Provide movement-based learning and physical activities
- Add maker spaces and creative construction opportunities
- Include role-playing and simulation activities
- Create interactive games and gamified learning experiences
- Add physical manipulatives and tactile learning tools
- Include outdoor and experiential learning opportunities`;
      
      case 'analytical':
        return `ANALYTICAL LEARNER ENHANCEMENTS:
- Add advanced data analysis and research tools
- Include logical reasoning and systematic problem-solving
- Provide detailed documentation and record-keeping systems
- Add comparative analysis and evaluation frameworks
- Include scientific method and hypothesis testing
- Create systematic organization and categorization tools
- Add critical thinking and logical argumentation
- Include research methodology and academic writing`;
      
      default:
        return `MULTIMODAL LEARNER ENHANCEMENTS:
- Add diverse learning pathways and multiple representation options
- Include adaptive learning and personalized content delivery
- Provide collaborative and individual learning opportunities
- Add technology integration and digital literacy tools
- Include assessment options that accommodate different preferences
- Create inclusive and accessible learning experiences
- Add metacognitive strategies and learning reflection
- Include cross-curricular connections and interdisciplinary projects`;
    }
  }

  private buildSystemPrompt(subject: string, topic: string, difficulty: string, learningStyle: string): string {
    return `You are an expert AI teacher specializing in creating engaging, multimodal educational content. Your task is to transform basic lesson content into rich, interactive learning experiences.

Subject: ${subject}
Topic: ${topic}
Difficulty Level: ${difficulty}
Learning Style: ${learningStyle}

🚨 CRITICAL REQUIREMENT: You MUST generate multimodal content. Do not return content with only baseContent - always include at least 2-3 multimodal elements from the following:

MANDATORY MULTIMODAL CONTENT REQUIREMENTS:
1. ALWAYS include a diagram (Mermaid chart) for visual concepts
2. ALWAYS include interactive elements for engagement
3. For mathematical subjects: Include math content with LaTeX equations
4. For science subjects: Include 3D models and simulations
5. For all subjects: Include audio narration for accessibility
6. Add visual effects and particle effects where appropriate

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
- Video: Write detailed descriptions and transcripts, and provide working video URLs. Use these specific educational video URLs:
  * For Linear Equations specifically: "https://www.youtube.com/watch?v=vQhT83kUBRc" (Khan Academy Linear Equations)
  * For math topics (algebra, geometry, calculus): "https://www.youtube.com/watch?v=vQhT83kUBRc" (Khan Academy Math)
  * For science topics: "https://www.youtube.com/watch?v=8a3r-cG8Wic" (Crash Course Science)
  * For physics: "https://www.youtube.com/watch?v=WUvTyaaNkzM" (Physics concepts)
  * For chemistry: "https://www.youtube.com/watch?v=FSyAehMdpyI" (Chemistry basics)
  * For biology: "https://www.youtube.com/watch?v=QnQe0xW_JY4" (Biology fundamentals)
  * For general education: "https://www.youtube.com/watch?v=vQhT83kUBRc" (Khan Academy educational content)
  CRITICAL: Always use real, working video URLs that are appropriate for the educational content. For Linear Equations specifically, ALWAYS use "https://www.youtube.com/watch?v=vQhT83kUBRc" (Khan Academy Linear Equations video).
  IMPORTANT: Do NOT include captions URLs as they cause CORS issues. The transcript field will be used for accessibility instead.
- Interactive: Create engaging interactive elements
- 3D: Design appropriate 3D visualizations
- Assessment: Generate comprehensive questions with explanations

CONTENT TYPE DETECTION:
- Mathematics: Generate math + diagram + interactive content
- Science/Physics: Generate diagram + simulation + 3D models
- Chemistry: Generate diagram + 3D models + interactive elements
- Biology: Generate diagram + simulation + interactive content
- History: Generate diagram + interactive timeline + video content
- Language Arts: Generate interactive + video + assessment content

Generate content that will make students excited to learn and help them master the concepts effectively. Remember: Rich multimodal content is REQUIRED, not optional.`;
  }

  private async generateFallbackMultimodalContent(
    lessonContent: string,
    lessonTitle: string,
    objectives: string[],
    subject: string,
    topic: string,
    difficulty: string,
    learningStyle: string,
    requiredTypes: string[]
  ): Promise<SmartTeachingContent> {
    console.log('Generating fallback multimodal content for types:', requiredTypes);
    
    const baseContent = {
      title: lessonTitle,
      text: lessonContent,
      objectives: objectives,
      keyConcepts: this.extractKeyConcepts(lessonContent),
      summary: this.generateSummary(lessonContent)
    };

    const content: SmartTeachingContent = {
      baseContent,
      metadata: {
        difficulty: difficulty,
        estimatedTime: 30,
        learningStyle: learningStyle,
        subject: subject,
        topic: topic,
        generatedAt: new Date().toISOString(),
        version: '1.0'
      }
    };

    // Generate static fallback content for multimodal experience
    try {
      // Always generate diagram content based on learning style
      if (requiredTypes.includes('diagram') || learningStyle === 'visual' || learningStyle === 'kinesthetic') {
        content.diagram = this.generateStaticDiagramContent(lessonTitle, subject, topic);
      }
      
      // Always generate interactive content for kinesthetic learners
      if (requiredTypes.includes('interactive') || learningStyle === 'kinesthetic' || learningStyle === 'analytical') {
        content.interactive = this.generateStaticInteractiveContent(lessonTitle, subject, topic, difficulty);
      }
      
      // Generate 3D content for visual learners
      if (requiredTypes.includes('3d') || (learningStyle === 'visual' && this.is3DSubject(subject))) {
        content.threeD = this.generateStatic3DContent(lessonTitle, subject, topic);
      }
      
      // Generate math content for math subjects
      if (requiredTypes.includes('math') || this.isMathSubject(subject)) {
        content.math = this.generateStaticMathContent(lessonTitle, subject, topic, difficulty, lessonContent);
      }
      
      // Generate simulation content for science subjects
      if (requiredTypes.includes('simulation') || this.isScienceSubject(subject)) {
        content.simulation = this.generateStaticSimulationContent(lessonTitle, subject, topic);
      }

      // Try to generate video content for better learning experience
      console.log('🎥 [DEBUG] About to generate video content for:', { lessonTitle, subject, topic });
      const videoContent = await this.generateStaticVideoContent(lessonTitle, subject, topic);
      console.log('🎥 [DEBUG] Video content result:', videoContent);
      
      if (videoContent) {
        content.video = videoContent;
        console.log('✅ [DEBUG] Video content added to content object');
      } else {
        console.log('❌ No video content available for this topic');
      }

      // Validate we have minimum required content
      const validation = this.validateGeneratedContent(content, requiredTypes);
      if (!validation.isComplete) {
        console.warn(`Still missing content after fallback generation: ${validation.missingTypes.join(', ')}`);
      }
      
    } catch (error) {
      console.error('Error generating fallback content:', error);
    }

    return content;
  }

  private generateStaticDiagramContent(title: string, subject: string, topic: string): any {
    return {
      title: `${title} Overview`,
      chart: this.generateMermaidDiagram(subject, topic),
      theme: 'neutral',
      explanation: `This diagram shows the key concepts and relationships in ${title}.`,
      keyPoints: [
        `Understanding the main concepts of ${topic}`,
        `Seeing how different elements connect`,
        `Visual representation for better comprehension`,
        `Step-by-step learning progression`
      ],
      narration: `Let's explore this diagram to understand the key concepts in ${title}. This visual representation will help you see how different elements relate to each other.`
    };
  }

  private generateMermaidDiagram(subject: string, topic: string): string {
    const subjectLower = subject.toLowerCase();
    
    if (subjectLower.includes('math') || subjectLower.includes('algebra')) {
      // More specific to linear equations flow
      return `graph TD
        A[Linear Equation] --> B[Combine Like Terms]
        B --> C[Move Variable Terms]
        C --> D[Move Constants]
        D --> E[Isolate Variable]
        E --> F[Solution]`;
    }
    
    if (subjectLower.includes('science') || subjectLower.includes('physics') || subjectLower.includes('chemistry')) {
      return `graph LR
        A[Observation] --> B[Hypothesis]
        B --> C[Experiment]
        C --> D[Analysis]
        D --> E[Conclusion]
        E --> F[Application]`;
    }
    
    return `graph TD
        A[${topic}] --> B[Learn]
        B --> C[Practice]
        C --> D[Apply]
        D --> E[Master]`;
  }

  private generateStaticInteractiveContent(title: string, subject: string, topic: string, difficulty: string): any {
    return {
      title: `Interactive ${title} Exercise`,
      type: 'quiz',
      instructions: `Test your understanding of ${topic} with this interactive quiz.`,
      questions: this.generateQuizQuestions(subject, topic, difficulty),
      narration: `Let's test your knowledge with some interactive questions about ${title}. Take your time and think through each answer.`
    };
  }

  private generateQuizQuestions(subject: string, topic: string, difficulty: string): any[] {
    const subjectLower = subject.toLowerCase();
    //const topicLower = topic.toLowerCase();
    
    // Generate subject-specific questions
    if (subjectLower.includes('math') || subjectLower.includes('algebra')) {
      return this.generateMathQuizQuestions(topic);
    } else if (subjectLower.includes('science') || subjectLower.includes('physics') || subjectLower.includes('chemistry')) {
      return this.generateScienceQuizQuestions();
    } else if (subjectLower.includes('history') || subjectLower.includes('social')) {
      return this.generateHistoryQuizQuestions();
    } else if (subjectLower.includes('language') || subjectLower.includes('english')) {
      return this.generateLanguageQuizQuestions();
    }
    
    // Default generic questions with better content
    const questions = [
      {
        question: `What is the primary focus of ${topic}?`,
        options: [
          `Understanding the core principles of ${topic}`,
          `Memorizing facts about ${topic}`,
          `Avoiding ${topic} concepts`,
          `Simplifying ${topic} unnecessarily`
        ],
        correctAnswer: `Understanding the core principles of ${topic}`,
        explanation: `The primary focus of ${topic} is to understand its core principles and how they apply to real-world situations.`
      },
      {
        question: `Which approach best helps you learn ${topic}?`,
        options: [
          `Active practice and application`,
          `Passive reading only`,
          `Avoiding examples`,
          `Memorizing without understanding`
        ],
        correctAnswer: `Active practice and application`,
        explanation: `Active practice and application of ${topic} concepts helps build deeper understanding and retention.`
      }
    ];

    if (difficulty === 'advanced') {
      questions.push({
        question: `What advanced skill is most important for mastering ${topic}?`,
        options: [
          `Critical thinking and analysis`,
          `Simple memorization`,
          `Avoiding complexity`,
          `Following instructions blindly`
        ],
        correctAnswer: `Critical thinking and analysis`,
        explanation: `Advanced mastery of ${topic} requires critical thinking and the ability to analyze complex situations.`
      });
    }

    return questions;
  }

  private generateMathQuizQuestions(topic: string): any[] {
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('linear') || topicLower.includes('equation')) {
      return [
        {
          question: `What is the first step in solving a linear equation like 2x + 3 = 11?`,
          options: [
            'Subtract 3 from both sides',
            'Multiply by 2',
            'Add 3 to both sides',
            'Divide by 2'
          ],
          correctAnswer: 'Subtract 3 from both sides',
          explanation: 'The first step is to isolate the variable term by subtracting 3 from both sides to get 2x = 8.'
        },
        {
          question: `What is the solution to 2x + 3 = 11?`,
          options: ['x = 4', 'x = 7', 'x = 2', 'x = 5'],
          correctAnswer: 'x = 4',
          explanation: 'After subtracting 3: 2x = 8, then divide by 2: x = 4.'
        }
      ];
    }
    
    return [
      {
        question: `What is the most important skill in mathematics?`,
        options: [
          'Problem-solving and logical reasoning',
          'Memorizing formulas',
          'Avoiding mistakes',
          'Speed in calculations'
        ],
        correctAnswer: 'Problem-solving and logical reasoning',
        explanation: 'Mathematics is fundamentally about developing problem-solving skills and logical reasoning abilities.'
      }
    ];
  }

  private generateScienceQuizQuestions(): any[] {
    return [
      {
        question: `What is the scientific method?`,
        options: [
          'A systematic approach to understanding the natural world',
          'A way to memorize scientific facts',
          'A method to avoid experiments',
          'A technique for guessing answers'
        ],
        correctAnswer: 'A systematic approach to understanding the natural world',
        explanation: 'The scientific method is a systematic approach involving observation, hypothesis, experimentation, and analysis.'
      }
    ];
  }

  private generateHistoryQuizQuestions(): any[] {
    return [
      {
        question: `Why is it important to study history?`,
        options: [
          'To understand how past events shape the present',
          'To memorize dates and names',
          'To avoid repeating mistakes',
          'To predict the future accurately'
        ],
        correctAnswer: 'To understand how past events shape the present',
        explanation: 'Studying history helps us understand the causes and effects of past events and their impact on current society.'
      }
    ];
  }

  private generateLanguageQuizQuestions(): any[] {
    return [
      {
        question: `What is the purpose of literature?`,
        options: [
          'To explore human experiences and emotions',
          'To provide entertainment only',
          'To teach grammar rules',
          'To avoid complex topics'
        ],
        correctAnswer: 'To explore human experiences and emotions',
        explanation: 'Literature serves to explore the depth of human experiences, emotions, and the complexity of life.'
      }
    ];
  }

  private generateStatic3DContent(title: string, subject: string, topic: string): any {
    return {
      title: `3D Visualization: ${title}`,
      visualizationType: this.get3DType(subject),
      config: {
        type: 'interactive_model',
        parameters: {
          width: 800,
          height: 600,
          rotatable: true,
          zoomable: true,
          color: '#3b82f6'
        }
      },
      description: `Explore ${topic} in three dimensions to better understand its structure and properties.`,
      interactions: ['rotate', 'zoom', 'pan', 'highlight'],
      narration: `This 3D model helps you visualize ${title} from all angles. You can rotate, zoom, and explore different aspects of the concept.`
    };
  }

  private get3DType(subject: string): string {
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes('geometry') || subjectLower.includes('math')) return 'geometry';
    if (subjectLower.includes('chemistry')) return 'molecule';
    if (subjectLower.includes('biology')) return 'anatomy';
    if (subjectLower.includes('physics')) return 'physics';
    return 'geometry';
  }

  private generateStaticMathContent(title: string, subject: string, topic: string, difficulty: string, lessonContent?: string): any {
    const normalizedTitle = title.toLowerCase();
    const isLinear = normalizedTitle.includes('linear') || subject.toLowerCase().includes('algebra');

    // Extract actual equations from lesson content if available
    let equation = '2x + 3 = 11'; // default
    let graphExpression = '2 * x + 3';
    let graphTitle = 'Graph of 2x + 3';
    let explanation = 'To solve this equation, subtract 3 from both sides to get 2x = 8, then divide both sides by 2 to find x = 4.';
    let examples = [{
      problem: 'Solve 2x + 3 = 11',
      solution: 'x = 4',
      steps: ['Subtract 3 from both sides: 2x = 8', 'Divide both sides by 2: x = 4']
    }];

    if (lessonContent) {
      // Extract equations from lesson content
      const equationMatches = lessonContent.match(/(\d+[xy]\s*[+\-]\s*\d+\s*=\s*\d+)/g);
      if (equationMatches && equationMatches.length > 0) {
        equation = equationMatches[0];
        // Extract the left side for graphing
        const leftSide = equation.split('=')[0].trim();
        if (leftSide.includes('x')) {
          // Convert to JavaScript expression for graphing
          graphExpression = leftSide.replace(/(\d+)x/g, '$1 * x').replace(/\s+/g, '');
          graphTitle = `Graph of ${leftSide}`;
        }
      }

      // Extract step-by-step solution from lesson content
      const stepMatches = lessonContent.match(/Step \d+:.*/g);
      if (stepMatches && stepMatches.length > 0) {
        const steps = stepMatches.map(step => step.replace(/Step \d+:\s*/, ''));
        const solutionMatch = lessonContent.match(/x\s*=\s*\d+/);
        const solution = solutionMatch ? solutionMatch[0] : 'x = 4';
        
        examples = [{
          problem: `Solve ${equation}`,
          solution: solution,
          steps: steps
        }];
        
        explanation = `Let's solve ${equation} step by step: ${steps.join('. ')}.`;
      }
    }

    // For non-linear subjects, use appropriate content
    if (!isLinear) {
      equation = this.generateSampleEquation(subject, difficulty);
      graphExpression = subject.toLowerCase().includes('geometry') ? '' : 'Math.sin(x)';
      graphTitle = `Graph of ${title}`;
      explanation = `This equation represents the fundamental concept in ${title}. Let's break it down step by step.`;
      examples = [{
        problem: `Solve this ${topic} problem`,
        solution: 'Step-by-step solution provided',
        steps: ['Step 1: Identify the variables', 'Step 2: Apply the formula', 'Step 3: Calculate the result']
      }];
    }

    return {
      equation,
      explanation,
      graphExpression: graphExpression || undefined,
      graphTitle,
      examples,
      narration: isLinear
        ? `Let's solve the linear equation ${equation} step by step.`
        : `Let's explore the mathematical concepts in ${title}. We'll work through examples and see how to apply these formulas.`
    };
  }

  private generateSampleEquation(subject: string, difficulty: string): string {
    const subjectLower = subject.toLowerCase();
    
    if (subjectLower.includes('algebra')) {
      return difficulty === 'beginner' ? 'y = mx + b' : 'ax^2 + bx + c = 0';
    }
    
    if (subjectLower.includes('geometry')) {
      return difficulty === 'beginner' ? 'A = \\pi r^2' : 'V = \\frac{4}{3}\\pi r^3';
    }
    
    if (subjectLower.includes('calculus')) {
      return difficulty === 'beginner' ? '\\frac{d}{dx}x^n = nx^{n-1}' : '\\int_a^b f(x)dx = F(b) - F(a)';
    }
    
    return 'y = f(x)';
  }

  private generateStaticSimulationContent(title: string, subject: string, topic: string): any {
    return {
      title: `${title} Simulation`,
      type: this.getSimulationType(subject),
      parameters: this.getSimulationParameters(subject),
      instructions: `Use this simulation to explore ${topic} interactively. Adjust the parameters and observe the results.`,
      learningObjectives: [
        `Understand the behavior of ${topic}`,
        'Observe cause and effect relationships',
        'Experiment with different variables',
        'Apply theoretical knowledge practically'
      ],
      narration: `This simulation lets you experiment with ${title}. Try changing different variables to see how they affect the outcome.`
    };
  }

  private getSimulationType(subject: string): string {
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes('physics')) return 'physics';
    if (subjectLower.includes('chemistry')) return 'chemistry';
    if (subjectLower.includes('biology')) return 'biology';
    if (subjectLower.includes('math')) return 'math';
    return 'physics';
  }

  private getSimulationParameters(subject: string): Record<string, any> {
    const subjectLower = subject.toLowerCase();
    
    if (subjectLower.includes('physics')) {
      return {
        gravity: 9.81,
        mass: 1.0,
        velocity: 10.0,
        angle: 45
      };
    }
    
    if (subjectLower.includes('chemistry')) {
      return {
        temperature: 25,
        pressure: 1.0,
        concentration: 0.5,
        ph: 7.0
      };
    }
    
    return {
      variable1: 1.0,
      variable2: 2.0,
      scale: 1.0
    };
  }

  private async searchForVideoContent(subject: string, topic: string): Promise<{ url: string; title: string; description: string } | null> {
    console.log('🚀 [DEBUG] searchForVideoContent called with:', { subject, topic });
    
    try {
      const searchQuery = `educational video tutorial ${subject} ${topic} site:youtube.com OR site:vimeo.com`;
      console.log('🔍 [DEBUG] Search query:', searchQuery);
      
      // Using generateText with Perplexity provider
      console.log('🤖 [DEBUG] Calling Perplexity API...');
      const result = await generateText({
        model: perplexity('sonar-pro'),
        prompt: `Find a high-quality educational video specifically about "${topic}" in the subject of ${subject}. 
        
        IMPORTANT: The video must be specifically about "${topic}", not just general ${subject} content.
        
        Requirements:
        - Must be from YouTube or Vimeo
        - Must be educational/instructional content
        - Must be appropriate for students
        - Must be specifically about "${topic}" (not general ${subject})
        
        Return ONLY in this exact format:
        URL: [complete URL]
        TITLE: [video title]
        DESCRIPTION: [brief description]
        
        If you cannot find a specific video about "${topic}", return:
        URL: NOTFOUND
        TITLE: ${topic} Tutorial
        DESCRIPTION: Educational content about ${topic}`
      });
      
      const response = result.text;
      console.log('📝 [DEBUG] Full response text:', response);
      
      const urlMatch = response.match(/URL:\s*(.+)/);
      const titleMatch = response.match(/TITLE:\s*(.+)/);
      const descMatch = response.match(/DESCRIPTION:\s*(.+)/);
      
      const url = urlMatch?.[1]?.trim();
      const title = titleMatch?.[1]?.trim() || `${topic} Tutorial`;
      const description = descMatch?.[1]?.trim() || `Learn about ${topic}`;
      
      console.log('🔗 [DEBUG] Extracted values:', { url, title, description });
      
      if (url && url !== 'NOTFOUND' && (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com'))) {
        console.log('✅ [DEBUG] Valid video URL found:', url);
        return { url, title, description };
      } else {
        console.log('❌ [DEBUG] Invalid or NOTFOUND URL:', url);
      }
    } catch (error) { console.warn('💥 Perplexity search failed:', error);}
    
    // No video found - return null instead of fallback
    console.log('❌ No suitable video found for:', subject, topic);
    return null;
  }

  private async generateStaticVideoContent(title: string, subject: string, topic: string): Promise<any> {
    console.log('🎬 [DEBUG] generateStaticVideoContent called with:', { title, subject, topic });
    
    // Try Perplexity search first
    const searchResult = await this.searchForVideoContent(subject, topic);
    console.log('🔍 [DEBUG] searchResult from searchForVideoContent:', searchResult);
    
    // If no video found, return null to indicate no video content
    if (!searchResult) {
      console.log('❌ No video content available for:', subject, topic);
      return null;
    }
    
    const keyConcepts = this.generateKeyConceptsForSubject(subject, topic);
    
    const videoContent = {
      title: searchResult.title,
      description: searchResult.description,
      keyConcepts: keyConcepts,
      duration: 10,
      narration: `This video will help you understand ${topic} better. Watch carefully and take notes on the key concepts.`,
      transcript: `This educational video covers ${topic}. The instructor will explain the main concepts step by step, making it easy to understand. Key points include: ${keyConcepts.join(', ')}.`,
      src: searchResult.url,
      poster: '',
      isValidUrl: true
    };
    
    console.log('📹 [DEBUG] Generated video content:', videoContent);
    return videoContent;
  }
  
  private generateKeyConceptsForSubject(subject: string, topic: string): string[] {
    const subjectLower = subject.toLowerCase();
    
    if (subjectLower.includes('math') || subjectLower.includes('algebra')) {
      return ['Problem Solving', 'Equations', 'Variables', 'Step-by-step Solutions'];
    } else if (subjectLower.includes('science') || subjectLower.includes('physics')) {
      return ['Scientific Method', 'Experiments', 'Theory', 'Applications'];
    } else if (subjectLower.includes('chemistry')) {
      return ['Chemical Reactions', 'Molecules', 'Atoms', 'Laboratory'];
    } else if (subjectLower.includes('biology')) {
      return ['Living Systems', 'Cells', 'Organisms', 'Life Processes'];
    }
    
    return [topic, 'Learning', 'Education', 'Understanding'];
  }

  private validateGeneratedContent(content: SmartTeachingContent, requiredTypes: string[]): { isComplete: boolean; missingTypes: string[] } {
  const missingTypes: string[] = [];
  
  for (const type of requiredTypes) {
    if (type === 'text') continue; // Always present in baseContent
    
    const hasContent = content[type as keyof SmartTeachingContent];
    if (!hasContent) {
      missingTypes.push(type);
    }
  }
  
  return {
    isComplete: missingTypes.length === 0,
    missingTypes
  };
  }

  private isMathSubject(subject: string): boolean {
    const subjectLower = subject.toLowerCase();
    return subjectLower.includes('math') || subjectLower.includes('algebra') || 
           subjectLower.includes('geometry') || subjectLower.includes('calculus') ||
           subjectLower.includes('arithmetic') || subjectLower.includes('trigonometry');
  }

  private isScienceSubject(subject: string): boolean {
    const subjectLower = subject.toLowerCase();
    return subjectLower.includes('science') || subjectLower.includes('physics') || 
           subjectLower.includes('chemistry') || subjectLower.includes('biology') ||
           subjectLower.includes('earth') || subjectLower.includes('astronomy');
  }

  private is3DSubject(subject: string): boolean {
    const subjectLower = subject.toLowerCase();
    const appropriate3DSubjects = [
      'geometry', 'chemistry', 'biology', 'physics', 'anatomy', 
      'architecture', 'engineering', 'astronomy', 'geology', 
      'molecular', 'crystal', 'spatial', '3d', 'structure'
    ];
    
    return appropriate3DSubjects.some(appropriateSubject => 
      subjectLower.includes(appropriateSubject)
    );
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
    contentType: 'text' | 'math' | 'diagram' | 'simulation' | 'video' | 'interactive' | 'threeD' | 'assessment',
    context: {
      subject: string;
      topic: string;
      difficulty: string;
      learningStyle: string;
    },
    //forceRegenerate: boolean = false
  ): Promise<any> {
    const schemas = {
      text: z.object({
        content: z.string().describe('Main text content'),
        summary: z.string().describe('Brief summary of the content'),
        keyPoints: z.array(z.string()).describe('Key learning points')
      }),
      math: MathContentSchema,
      diagram: DiagramContentSchema,
      simulation: SimulationContentSchema,
      video: VideoContentSchema,
      interactive: InteractiveContentSchema,
      threeD: ThreeDContentSchema,
      model3D: Model3DContentSchema,
      particleEffects: ParticleEffectsContentSchema,
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
        
        CRITICAL REQUIREMENTS:
        - Generate content that is DIRECTLY RELATED to the lesson topic: "${context.topic}"
        - For math content: Create equations, graphs, and examples that match the specific topic
        - For diagrams: Create visual representations that illustrate the lesson concepts
        - Ensure all content is educationally relevant and age-appropriate
        - Make content engaging and interactive for the specified learning style
        
        Create engaging, educational ${contentType} content that helps students learn effectively.`,
        prompt: `Generate ${contentType} content based on this lesson material for the topic "${context.topic}":
        
        ${baseContent}
        
        IMPORTANT: The content must be specifically about "${context.topic}" and not generic content. For math content, create equations and graphs that directly relate to this topic. For diagrams, create visualizations that illustrate concepts from this specific lesson.`,
        schema: schema,
        temperature: 0.7,
      });

      return result.object;
    } catch (error) {
      console.error(`Error generating ${contentType} content:`, error);
      
      // Provide fallback content based on content type
      const fallbackContent = this.generateSpecificContentTypeFallback(contentType, context);
      console.log(`Using fallback content for ${contentType}`);
      return fallbackContent;
    }
  }

  private generateSpecificContentTypeFallback(contentType: string, context: any): any {
    const baseFallback = {
      equation: "x = 1",
      explanation: `This is a fallback explanation for ${context.topic}. The content generation encountered an error, but we're providing basic educational content to keep the learning experience going.`,
      graphExpression: "x",
      graphTitle: `Graph for ${context.topic}`,
      narration: `Let's explore ${context.topic} in ${context.subject}. This is fallback content to ensure learning continues.`
    };

    switch (contentType) {
      case 'text':
        return {
          content: `This is educational content about ${context.topic} in ${context.subject}. The content generation encountered an error, but we're providing basic educational material to keep the learning experience going.`,
          summary: `Overview of ${context.topic} concepts and applications.`,
          keyPoints: [
            `Understanding ${context.topic}`,
            `Key concepts and principles`,
            `Practical applications`
          ]
        };
      case 'math':
        return {
          ...baseFallback,
          equation: context.topic.toLowerCase().includes('linear') ? "2x + 3 = 11" : "x = 1",
          explanation: `This is fallback content for ${context.topic}. We're working on generating better content for this topic.`,
          graphExpression: context.topic.toLowerCase().includes('linear') ? "2*x + 3" : "x",
          graphTitle: `Graph for ${context.topic}`,
          narration: `Let's explore ${context.topic} in ${context.subject}. This is fallback content to ensure learning continues.`
        };
      case 'diagram':
        return {
          title: `${context.topic} Overview`,
          chart: `graph TD\n    A[${context.topic}] --> B[Key Concepts]\n    A --> C[Examples]\n    A --> D[Applications]`,
          theme: "neutral",
          explanation: `This diagram shows the key components of ${context.topic}.`,
          keyPoints: [`Understanding ${context.topic}`, `Key concepts in ${context.topic}`, `Applications of ${context.topic}`],
          narration: `This diagram illustrates the main concepts of ${context.topic}.`
        };
      default:
        return baseFallback;
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  clearCacheForLesson(lessonId: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(lessonId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
    });
    console.log(`Cleared ${keysToDelete.length} cache entries for lesson ${lessonId}`);
  }

  getCacheSize(): number {
    return this.cache.size;
  }


  private classifySubjectType(subject: string): { category: string; confidence: number } {
    const subjectPatterns = {
      mathematics: {
        keywords: ['math', 'algebra', 'geometry', 'calculus', 'trigonometry', 'statistics', 'arithmetic'],
        weight: 1.0
      },
      science: {
        keywords: ['science', 'physics', 'chemistry', 'biology', 'earth', 'environmental', 'astronomy'],
        weight: 1.0
      },
      language: {
        keywords: ['language', 'english', 'literature', 'writing', 'grammar', 'reading', 'composition'],
        weight: 1.0
      },
      social_studies: {
        keywords: ['history', 'social', 'geography', 'civics', 'government', 'economics', 'culture'],
        weight: 1.0
      },
      arts: {
        keywords: ['art', 'music', 'drama', 'theater', 'visual', 'creative', 'design'],
        weight: 1.0
      },
      technology: {
        keywords: ['computer', 'technology', 'programming', 'coding', 'digital', 'software', 'hardware'],
        weight: 1.0
      }
    };

    let bestMatch = { category: 'general', confidence: 0.3 };
    
    Object.entries(subjectPatterns).forEach(([category, pattern]) => {
      const matches = pattern.keywords.filter(keyword => subject.includes(keyword)).length;
      const confidence = (matches / pattern.keywords.length) * pattern.weight;
      
      if (confidence > bestMatch.confidence) {
        bestMatch = { category, confidence };
      }
    });

    return bestMatch;
  }

  private getBaseTypesForSubject(subjectClassification: { category: string; confidence: number }): string[] {
    const baseTypeMap = {
      mathematics: ['math', 'diagram', 'interactive'],
      science: ['diagram', 'simulation', '3d'],
      language: ['interactive', 'video', 'assessment'],
      social_studies: ['diagram', 'interactive', 'video'],
      arts: ['video', 'interactive', '3d'],
      technology: ['interactive', 'simulation', '3d'],
      general: ['diagram', 'interactive']
    };

    return baseTypeMap[subjectClassification.category as keyof typeof baseTypeMap] || baseTypeMap.general;
  }

  private analyzeContentForTypes(content: string): Record<string, number> {
    const contentLower = content.toLowerCase();
    const typePatterns = {
      math: {
        keywords: ['equation', 'formula', 'calculate', 'solve', 'variable', 'function', 'derivative', 'integral'],
        weight: 1.0
      },
      diagram: {
        keywords: ['process', 'cycle', 'flow', 'diagram', 'chart', 'graph', 'structure', 'hierarchy'],
        weight: 0.8
      },
      simulation: {
        keywords: ['simulation', 'experiment', 'model', 'demonstration', 'virtual', 'interactive', 'lab'],
        weight: 1.0
      },
      '3d': {
        keywords: ['3d', 'three dimensional', 'spatial', 'molecule', 'crystal', 'structure', 'geometry'],
        weight: 0.9
      },
      interactive: {
        keywords: ['quiz', 'exercise', 'practice', 'game', 'activity', 'worksheet', 'problem'],
        weight: 0.7
      },
      video: {
        keywords: ['video', 'animation', 'movie', 'clip', 'demonstration', 'tutorial', 'lecture'],
        weight: 0.8
      },
      assessment: {
        keywords: ['test', 'quiz', 'exam', 'evaluation', 'assessment', 'check', 'verify'],
        weight: 0.9
      },
      audio: {
        keywords: ['sound', 'audio', 'music', 'pronunciation', 'speech', 'narration', 'listen'],
        weight: 0.8
      }
    };

    const results: Record<string, number> = {};

    Object.entries(typePatterns).forEach(([type, pattern]) => {
      const matches = pattern.keywords.filter(keyword => contentLower.includes(keyword)).length;
      const confidence = Math.min((matches / pattern.keywords.length) * pattern.weight, 1.0);
      results[type] = confidence;
    });

    return results;
  }

  private analyzeLearningComplexity(content: string): { isComplex: boolean; complexityScore: number } {
    const complexityIndicators = [
      'complex', 'advanced', 'difficult', 'challenging', 'sophisticated',
      'multi-step', 'algorithm', 'procedure', 'methodology', 'framework',
      'concept', 'theory', 'principle', 'fundamental', 'foundation'
    ];

    const contentLower = content.toLowerCase();
    const matches = complexityIndicators.filter(indicator => contentLower.includes(indicator)).length;
    const complexityScore = matches / complexityIndicators.length;
    
    return {
      isComplex: complexityScore > 0.3,
      complexityScore
    };
  }

  private getTopicSpecificEnhancements(subject: string, content: string): string[] {
    const enhancements: string[] = [];
    
    // Math-specific enhancements
    if (subject.includes('geometry') && content.includes('shape')) {
      enhancements.push('3d');
    }
    
    if (subject.includes('calculus') && content.includes('graph')) {
      enhancements.push('diagram', 'interactive');
    }
    
    // Science-specific enhancements
    if (subject.includes('chemistry') && content.includes('molecule')) {
      enhancements.push('3d', 'simulation');
    }
    
    if (subject.includes('physics') && content.includes('motion')) {
      enhancements.push('simulation', 'diagram');
    }
    
    if (subject.includes('biology') && content.includes('cell')) {
      enhancements.push('3d', 'diagram');
    }
    
    // Language-specific enhancements
    if (subject.includes('language') && content.includes('pronunciation')) {
      enhancements.push('audio');
    }
    
    if (subject.includes('literature') && content.includes('character')) {
      enhancements.push('video', 'interactive');
    }
    
    return enhancements;
  }

  private async tryAIGeneration(
    content: SmartTeachingContent, 
    lessonContent: string, 
    requiredTypes: string[], 
    context: { subject: string; topic: string; difficulty: string; learningStyle: string }
  ): Promise<void> {
    try {
      for (const type of requiredTypes) {
        if (type === 'text') continue;
        
        if (!content[type as keyof SmartTeachingContent]) {
          const aiContent = await this.generateSpecificContentType(
            lessonContent, type as any, context
          );
          (content as any)[type] = aiContent;
        }
      }
    } catch (error) {
      console.warn('AI generation failed, using static fallback content:', error);
    }
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

  private async generateStage1BaseContent(
    lessonContent: string,
    lessonTitle: string,
    objectives: string[],
    subject: string,
    topic: string,
    difficulty: string,
    learningStyle: string
  ): Promise<SmartTeachingContent> {
    console.log('📝 Stage 1: Generating base content with required types...');
    
    // Detect required content types for this subject
    const requiredTypes = this.detectRequiredContentTypes(subject, lessonTitle);
    console.log(`Required content types for ${subject}:`, requiredTypes);
    
    // Optimize content types for learning style
    const optimizedTypes = this.optimizeContentTypesForLearningStyle(requiredTypes, learningStyle, subject, lessonTitle);
    console.log(`Optimized content types for ${learningStyle}:`, optimizedTypes);
    
    const systemPrompt = this.buildStage1SystemPrompt(subject, topic, difficulty, learningStyle, optimizedTypes);
    
    // Lenient Stage 1 schema to tolerate minor model deviations
    const Stage1LenientSchema = z.object({
      baseContent: z.object({
        title: z.string().optional(),
        text: z.union([
          z.string(),
          z.object({
            title: z.string().optional(),
            text: z.string()
          })
        ]),
        objectives: z.array(z.string()).optional(),
        keyConcepts: z.array(z.string()).optional(),
        summary: z.string().optional()
      }),
      math: MathContentSchema.partial().optional(),
      diagram: DiagramContentSchema.partial().optional(),
      simulation: SimulationContentSchema.partial().optional(),
      video: VideoContentSchema.partial().optional(),
      interactive: InteractiveContentSchema.partial().optional(),
      threeD: ThreeDContentSchema.partial().optional(),
      model3D: Model3DContentSchema.partial().optional(),
      particleEffects: ParticleEffectsContentSchema.partial().optional().nullable(),
      assessment: AssessmentContentSchema.partial().optional().nullable(),
      metadata: z.any().optional()
    });

    const result = await generateObject({
      model: openai('gpt-4o'),
      system: systemPrompt,
      prompt: `Generate base educational content for this lesson:

Title: ${lessonTitle}
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}
Learning Style: ${learningStyle}
Required Content Types: ${requiredTypes.join(', ')}

Lesson Content:
${lessonContent}

Learning Objectives:
${objectives.map(obj => `- ${obj}`).join('\n')}

CRITICAL: You MUST generate content for ALL required types: ${optimizedTypes.join(', ')}. Do not skip any required content types.`,
      schema: Stage1LenientSchema
    });

    const stage1 = result.object as any;

    // Normalize lenient output to strict SmartTeachingContent shape
    const baseText = typeof stage1.baseContent?.text === 'string'
      ? stage1.baseContent.text
      : (stage1.baseContent?.text?.text ?? '');

    const normalized: SmartTeachingContent = {
      baseContent: {
        title: stage1.baseContent?.title || lessonTitle,
        text: baseText,
        objectives: stage1.baseContent?.objectives || objectives || [],
        keyConcepts: stage1.baseContent?.keyConcepts || this.extractKeyConcepts(baseText || lessonContent),
        summary: stage1.baseContent?.summary || this.generateSummary(baseText || lessonContent)
      },
      math: stage1.math
        ? {
            equation: stage1.math.equation || '',
            explanation: stage1.math.explanation || '',
            graphExpression: stage1.math.graphExpression || '',
            graphTitle: stage1.math.graphTitle || '',
            examples: stage1.math.examples || [],
            narration: stage1.math.narration || ''
          }
        : undefined,
      diagram: stage1.diagram as any,
      simulation: stage1.simulation as any,
      video: stage1.video as any,
      interactive: stage1.interactive as any,
      threeD: stage1.threeD as any,
      model3D: stage1.model3D as any,
      particleEffects: stage1.particleEffects as any,
      assessment: stage1.assessment as any,
      metadata: {
        difficulty,
        estimatedTime: 30,
        learningStyle,
        subject,
        topic,
        generatedAt: new Date().toISOString(),
        version: '1.0'
      }
    };

    // Final validation to strict schema; if it fails, fall back later
    const validated = SmartTeachingContentSchema.safeParse(normalized);
    if (!validated.success) {
      console.warn('Stage 1 normalization failed strict validation, proceeding with fallback path.', validated.error);
      return normalized; // return normalized anyway; downstream has further validation and fallback
    }

    console.log('✅ Stage 1 completed - Base content generated');
    return validated.data;
  }

  private async generateStage2EnhancedContent(
    baseContent: SmartTeachingContent,
    subject: string,
    topic: string,
    difficulty: string,
    learningStyle: string
  ): Promise<SmartTeachingContent> {
    console.log('🎨 Stage 2: Enhancing with subject-specific content types...');
    
    // Get subject-specific enhancement requirements
    const enhancementTypes = this.getSubjectEnhancementTypes(subject, topic);
    console.log(`Enhancement types for ${subject}:`, enhancementTypes);
    
    // If no additional enhancements needed, return base content
    if (enhancementTypes.length === 0) {
      console.log('✅ Stage 2 completed - No additional enhancements needed');
      return baseContent;
    }
    
    const systemPrompt = this.buildStage2SystemPrompt(subject, topic, difficulty, learningStyle, enhancementTypes);
    
    const result = await generateObject({
      model: openai('gpt-4o'),
      system: systemPrompt,
      prompt: `Enhance the existing educational content with subject-specific features:

Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}
Learning Style: ${learningStyle}
Enhancement Types: ${enhancementTypes.join(', ')}

Existing Content:
${JSON.stringify(baseContent, null, 2)}

CRITICAL: Add the following enhancement types: ${enhancementTypes.join(', ')}. Enhance the existing content without removing any existing features.`,
      schema: Stage2EnhancedContentSchema
    });

    console.log('✅ Stage 2 completed - Subject-specific enhancements added');
    
    // Merge the enhanced content with the base content
    const enhancedContent: SmartTeachingContent = {
      ...baseContent,
      ...result.object
    };
    
    return enhancedContent;
  }

  private async generateStage3AdvancedContent(
    enhancedContent: SmartTeachingContent,
    subject: string,
    topic: string,
    difficulty: string,
    learningStyle: string
  ): Promise<SmartTeachingContent> {
    console.log('🚀 Stage 3: Adding advanced multimodal features...');
    
    // Determine advanced features based on subject and learning style
    const advancedFeatures = this.getAdvancedFeatures(subject, learningStyle);
    console.log(`Advanced features for ${subject} (${learningStyle}):`, advancedFeatures);
    
    // If no advanced features needed, return enhanced content
    if (advancedFeatures.length === 0) {
      console.log('✅ Stage 3 completed - No advanced features needed');
      return enhancedContent;
    }
    
    const systemPrompt = this.buildStage3SystemPrompt(subject, topic, difficulty, learningStyle, advancedFeatures);
    
    const result = await generateObject({
      model: openai('gpt-4o'),
      system: systemPrompt,
      prompt: `Add advanced multimodal features to the existing educational content:

Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}
Learning Style: ${learningStyle}
Advanced Features: ${advancedFeatures.join(', ')}

Existing Content:
${JSON.stringify(enhancedContent, null, 2)}

CRITICAL: Add the following advanced features: ${advancedFeatures.join(', ')}. Enhance the existing content with these advanced multimodal capabilities.`,
      schema: SmartTeachingContentSchema
    });

    console.log('✅ Stage 3 completed - Advanced multimodal features added');
    return result.object;
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
    // Detect required content types
    const requiredTypes = this.detectRequiredContentTypes(subject, lessonTitle);
    
    const systemPrompt = this.buildSystemPrompt(subject, topic, difficulty, learningStyle);
    
    const result = await generateObject({
      model: openai('gpt-4o'), // Upgraded to full model for better multimodal content generation
      system: systemPrompt,
      prompt: `Generate educational content for this lesson:

Title: ${lessonTitle}
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}
Learning Style: ${learningStyle}

REQUIRED CONTENT TYPES: ${requiredTypes.join(', ')}

Lesson Content:
${lessonContent}

Learning Objectives:
${objectives.map(obj => `- ${obj}`).join('\n')}

CRITICAL: You must generate content for ALL required types: ${requiredTypes.join(', ')}. Do not return content with only baseContent.`,
      schema: SmartTeachingContentSchema,
      temperature: 0.7,
    });

    const generatedContent = result.object;
    
    // Validate that we have multimodal content
    const hasMultimodal = !!(generatedContent.math || generatedContent.diagram || 
                            generatedContent.simulation || generatedContent.video || 
                            generatedContent.interactive || generatedContent.threeD);
    
    if (!hasMultimodal) {
      console.warn('Generated content lacks multimodal elements, attempting fallback generation...');
      return await this.generateFallbackMultimodalContent(
        lessonContent, lessonTitle, objectives, subject, topic, difficulty, learningStyle, requiredTypes
      );
    }
    
    return generatedContent;
  }

}

// Singleton instance
export const smartTeachingContentGenerator = new SmartTeachingContentGenerator();
