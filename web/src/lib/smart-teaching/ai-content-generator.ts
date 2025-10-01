import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { perplexity } from '@ai-sdk/perplexity'; 
import { generateText } from 'ai';
import { z } from 'zod';
import {
  VIDEO_SEARCH_SYSTEM_PROMPT,
  VIDEO_SEARCH_USER_PROMPT, 
  MAIN_CONTENT_GENERATION_PROMPT,
  buildOptimizedSystemPrompt,
  CONTENT_ENHANCEMENT_SYSTEM_PROMPT,
  CONTENT_ENHANCEMENT_USER_PROMPT,
  SPECIFIC_CONTENT_SYSTEM_PROMPT,
  SPECIFIC_CONTENT_USER_PROMPT,
  getSubjectSpecificGuidelines,
  getLearningStyleGuidelines,
  getContentTypeInstructions,
  TEMPLATES,
  MERMAID_TEMPLATES,
  LOG_MESSAGES
} from './prompts';

// Reusable primitives
export const NonEmptyString = z.string().min(1);
export const LangTag = z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/, "BCP-47 lang tag");
export const DurationMinutes = z.number().int().min(0);
export const Percentage0to100 = z.number().min(0).max(100);

// Optional enums you may want globally
export const DifficultyEnum = z.enum(["beginner", "intermediate", "advanced"]);
export const SubjectEnum = z.enum(["math","physics","chemistry","biology","cs","economics","history","language","other"]);
export const GradeBandEnum = z.enum(["K-5","6-8","9-12","undergrad","grad","other"]);

const MathGraphSpec = z.object({
  title: z.string().optional(),
  expressions: z.array(z.string()).default([]).describe("LaTeX expressions, with solution steps , line by line"),
  viewport: z.object({
    xMin: z.number().default(-10),
    xMax: z.number().default(10),
    yMin: z.number().default(-10),
    yMax: z.number().default(10),
  }).optional(),
  points: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
  ggb: z.object({
    app: z.enum(["graphing","geometry","3d","cas"]).optional(),
    commands: z.array(z.string()).optional(),
  }).optional()
});

const MathContentSchema = z.object({
  equation: z.string().describe("LaTeX equation. Important: show solution steps; multiline allowed."),
  explanation: z.string().describe("Step-by-step, multiline detailed explanation of the solution."),
  // ⬇️ New: structured steps (machine-usable)
  solutionSteps: z.array(z.object({
    step: z.string(),
    math: z.string().optional().describe("LaTeX for the step"),
    rationale: z.string().optional()
  })).optional(),
  variables: z.record(z.string(), z.string()).optional().describe("Variable → meaning"),
  assumptions: z.array(z.string()).optional(),
  // ⬇️ New: pure graph spec
  graph: MathGraphSpec.optional(),

  examples: z.array(z.object({
    problem: z.string(),
    solution: z.string(),
    steps: z.array(z.string())
  })).optional(),

  narration: z.string()
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
  engine: z.enum(['custom','p5','matterjs','box2d','threejs']).default('custom'),
  parameters: z.record(z.string(), z.any()).describe('Simulation parameters (e.g., gravity, initial speed, etc.)'),
  instructions: z.string().describe('Instructions for using the simulation'),
  learningObjectives: z.array(z.string()).describe('What students will learn'),
  seed: z.number().int().optional().describe("Randomization seed for reproducibility"),
  recordable: z.boolean().default(false),
  exportData: z.boolean().default(false),
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
  isValidUrl: z.boolean().describe('Whether the video URL is valid and accessible'),
  // New: host captions yourself to avoid cross-origin
  captions: z.object({
    language: LangTag.default("en"),
    vttText: z.string().optional(),       // inline for generation
    url: z.string().optional(),            // your hosted .vtt if you store as a file
  }).optional(),

  clipStartSec: z.number().min(0).optional(),
  clipEndSec: z.number().min(0).optional(),
  license: z.enum(["CC-BY","CC-BY-SA","CC0","Proprietary","Unknown"]).default("Unknown")

});

//=================  InteractiveContentSchema =================

const CodeRunnerSpec = z.object({
  language: z.enum(["javascript","python","c++","java","typescript"]).default("javascript"),
  initialCode: z.string().optional(),
  tests: z.array(z.object({
    name: z.string(),
    input: z.string().optional(),
    expectedOutput: z.string().optional(),
    hidden: z.boolean().default(false)
  })).optional()
});

const MCQ = z.object({
  type: z.literal("multiple_choice"),
  question: z.string(),
  options: z.array(z.string()).min(2),
  correctAnswer: z.union([z.string(), z.array(z.string())]), // allow multi-correct
  shuffleOptions: z.boolean().default(true),
  explanation: z.string().optional(),
  points: z.number().default(1),
  partialCredit: z.boolean().default(false)
});

const ShortAnswer = z.object({
  type: z.literal("short_answer"),
  question: z.string(),
  correctAnswer: z.string(),
  acceptable: z.array(z.string()).optional(),
  explanation: z.string().optional(),
  points: z.number().default(1)
});

const Essay = z.object({
  type: z.literal("essay"),
  prompt: z.string(),
  rubric: z.array(z.object({ criterion: z.string(), levels: z.array(z.string()) })).optional(),
  points: z.number().default(5)
});

const DiagramQ = z.object({
  type: z.literal("diagram"),
  question: z.string(),
  requiredElements: z.array(z.string()).optional(),
  points: z.number().default(2)
});

const CodeQ = z.object({
  type: z.literal("code"),
  prompt: z.string(),
  runner: CodeRunnerSpec,
  points: z.number().default(3)
});

const QuizQuestionSchema = z.discriminatedUnion("type", [MCQ, ShortAnswer, Essay, DiagramQ, CodeQ]);

const InteractiveContentSchema = z.object({
  title: NonEmptyString,
  type: z.enum(['code_playground','quiz','drag_drop','timeline','calculator']),
  instructions: z.string(),
  initialCode: z.string().optional(),
  questions: z.array(QuizQuestionSchema).optional(),
  grader: z.enum(["auto","ai","manual"]).default("auto"),
  narration: z.string()
});


const ThreeDContentSchema = z.object({
  title: NonEmptyString,
  engine: z.enum(['threejs','babylon','geogebra-3d']).default('threejs'),
  visualizationType: z.enum(['geometry','molecule','anatomy','architecture','physics']),
  description: z.string(),
  interactions: z.array(z.string()).default(["rotate","zoom","pan"]),
  // Either provide a procedural config...
  config: z.record(z.string(), z.any()).optional(),
  // ...or point to an external model:
  srcModelUrl: z.string().optional(),
  units: z.enum(["unitless","m","cm","mm","in"]).default("unitless"),
  narration: z.string(),
  learningObjectives: z.array(z.string()),
  difficulty: DifficultyEnum.default("beginner")
});


export const ParticleEffectsContentSchema = z.object({
  title: NonEmptyString,
  effectType: z.enum(['fire','smoke','stars','sparkles','rain','snow']),
  engine: z.enum(['custom','canvas','webgl']).default('canvas'),
  config: z.object({
    count: z.number().min(0),
    color: z.string(),
    size: z.number().min(0),
    opacity: z.number().min(0).max(1),
    speed: z.number(),
    amplitude: z.number()
  }),
  durationSec: z.number().min(0).optional(),
  loop: z.boolean().default(true),
  soundFxUrl: z.string().optional(),
  description: z.string(),
  learningObjectives: z.array(z.string()).default([]),
  educationalValue: z.string().default("decorative"),
  decorative: z.boolean().default(true)
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

const TextReadingContentSchema = z.object({
  title: NonEmptyString,
  body: z.string().min(100),
  sourceRefs: z.array(z.object({
    title: z.string(),
    url: z.string().optional(),
    citation: z.string().optional()
  })).default([]),
  vocabulary: z.array(z.object({ term: z.string(), definition: z.string() })).optional(),
  keyPoints: z.array(z.string()).default([]),
  narration: z.string().optional()
});

export const AudioContentSchema = z.object({
  title: NonEmptyString,
  description: z.string(),
  src: z.string(),
  transcript: z.string().optional(),
  duration: DurationMinutes,
  language: LangTag.default("en")
});

export const ContentBlockType = z.enum([
  "text","video","math","diagram","simulation","interactive","threeD","particleEffects","assessment","audio"
]);

export const LessonFlowNodeSchema = z.object({
  id: z.string(),
  type: ContentBlockType,
  refKey: z.string().describe("Key to fetch the actual content block of that type"),
  next: z.array(z.string()).default([]) // ids of next nodes
});

export const AdaptiveRuleSchema = z.object({
  when: z.enum(["onCorrect","onIncorrect","onScoreBelow","onScoreAtLeast"]),
  threshold: z.number().optional(),
  goTo: z.string() // node id
});

export const AdaptivePathSchema = z.object({
  nodeId: z.string(),
  rules: z.array(AdaptiveRuleSchema)
});
 
// Schema for stage 2 enhancements (only the enhancement types)
const Stage2EnhancedContentSchema = z.object({
  math: MathContentSchema.optional(),
  diagram: DiagramContentSchema.optional(),
  simulation: SimulationContentSchema.optional(),
  video: VideoContentSchema.optional(),
  interactive: InteractiveContentSchema.optional(),
  threeD: ThreeDContentSchema.optional(),
  particleEffects: ParticleEffectsContentSchema.optional().nullable(),
  assessment: AssessmentContentSchema.optional().nullable()
});

const ConstraintsSchema = z.object({
  mustUseContext: z.boolean().default(true),
  forbiddenTopics: z.array(z.string()).default([]),
  locale: z.string().default("en"),
});

const LessonConstraints = ConstraintsSchema.extend({
  conceptId: z.string(),
  conceptTitle: z.string(),
  canonicalExample: z.string().optional(),
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
  particleEffects: ParticleEffectsContentSchema.optional().nullable(),
  assessment: AssessmentContentSchema.optional().nullable(),
  metadata: z.object({
    difficulty: z.string(),
    estimatedTime: z.number(),
    learningStyle: z.string(),
    subject: z.string(),
    topic: z.string(),
    generatedAt: z.string(),
    version: z.string(),
    locale: z.string().default('en'),
    voice: z.string().optional(),      // for TTS
    ssml: z.boolean().default(false),  // if narration should be SSML
  }),
  constraints: LessonConstraints
});

// === Content type names & map ===
export const AllSchemaNames = [
  "text","audio","math","diagram","simulation","video","interactive","threeD","particleEffects","assessment"
] as const;
export type SchemaName = typeof AllSchemaNames[number];

// IMPORTANT: export your schemas so other modules can import; change `const` -> `export const`
export const SchemaMap: Record<SchemaName, z.ZodTypeAny> = {
  text: TextReadingContentSchema,         // rename "TextReadingContentSchema" to "TextContentSchema" if you prefer
  audio: AudioContentSchema,
  math: MathContentSchema,
  diagram: DiagramContentSchema,
  simulation: SimulationContentSchema,
  video: VideoContentSchema,
  interactive: InteractiveContentSchema,
  threeD: ThreeDContentSchema,
  particleEffects: ParticleEffectsContentSchema,
  assessment: AssessmentContentSchema,
};

export type SmartTeachingContent = z.infer<typeof SmartTeachingContentSchema>;
export type Stage2EnhancedContent = z.infer<typeof Stage2EnhancedContentSchema>;
export type MathContent = z.infer<typeof MathContentSchema>;
export type DiagramContent = z.infer<typeof DiagramContentSchema>;
export type SimulationContent = z.infer<typeof SimulationContentSchema>;
export type VideoContent = z.infer<typeof VideoContentSchema>;
export type InteractiveContent = z.infer<typeof InteractiveContentSchema>;
export type ThreeDContent = z.infer<typeof ThreeDContentSchema>;
export type ParticleEffectsContent = z.infer<typeof ParticleEffectsContentSchema>;
export type AssessmentContent = z.infer<typeof AssessmentContentSchema>;

export class SmartTeachingContentGenerator {
  private cache = new Map<string, SmartTeachingContent>();
  private cacheTimestamps = new Map<string, number>();
  private readonly CACHE_DURATION = 48 * 60 * 60 * 1000; // 2 hours
  
  // Cache for schema selections to avoid multiple GPT-4o calls
  private schemaSelectionCache = new Map<string, string[]>();
  private schemaSelectionTimestamps = new Map<string, number>();

  // Generate a hash from content to ensure unique cache keys
  private generateContentHash(lessonContent: string, title: string, objectives: string[]): string {
    const contentString = `${title}-${lessonContent.substring(0, 100)}-${objectives.join(',')}`;
    let hash = 0;
    for (let i = 0; i < contentString.length; i++) {
      const char = contentString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  async generateContent(
    lessonContent: string,
    title: string,
    objectives: string[],
    subject: string,
    topic: string,
    difficulty: string,
    learningStyle: 'visual' | 'audio' | 'kinesthetic' | 'analytical' = 'visual',
    lessonId?: string,
    forceRegenerate: boolean = false
  ): Promise<SmartTeachingContent> {
    // Create a unique cache key that includes lesson ID and content hash to prevent conflicts
    const contentHash = this.generateContentHash(lessonContent, title, objectives);
    const cacheKey = `${lessonId || 'no-id'}-${contentHash}-${subject}-${topic}-${difficulty}-${learningStyle}`;
    
    // Check cache first (unless force regenerate)
    if (!forceRegenerate && this.cache.has(cacheKey)) {
      const timestamp = this.cacheTimestamps.get(cacheKey);
      if (timestamp && Date.now() - timestamp < this.CACHE_DURATION) {
        console.log(`Using cached content for ${cacheKey}`);
        return this.cache.get(cacheKey)!;
      } else {
        this.cache.delete(cacheKey);          // remove expired Cache
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
      const content = await this.generateProgressiveContent(lessonContent, subject, topic, title, objectives, difficulty, learningStyle);
      
      // Validate that we have multimodal content, if not enhance it
      const hasMultimodal = !!(content.math || content.diagram || content.simulation || 
                              content.video || content.interactive || content.threeD || 
                              content.particleEffects);
      
      if (!hasMultimodal) {
        console.warn('Generated content lacks multimodal elements, enhancing with fallback content...');
        const requiredTypes = this.detectRequiredContentTypes(subject);
        const enhancedContent = await this.generateFallbackMultimodalContent(
          lessonContent, title, objectives, subject, topic, difficulty, learningStyle, requiredTypes
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
        if (errorMessage && (errorMessage.includes('schema') || errorMessage.includes('validation')  || errorMessage.includes('metadata'))) {
          console.warn('Schema validation error detected, using fallback content generation...');
        }
        
        // Return fallback multimodal content with enhanced types
        const requiredTypes = this.detectRequiredContentTypes(subject);
        const enhancedTypes = [...requiredTypes, 'diagram', 'interactive']; // Always include these
        return await this.generateFallbackMultimodalContent(lessonContent, title, objectives, subject, topic, difficulty, learningStyle, enhancedTypes);
    }
  }

  private async generateProgressiveContent(
    lessonContent: string,
    subject: string,
    topic: string,
    title: string,
    objectives: string[],
    difficulty: string,
    learningStyle: string
  ): Promise<SmartTeachingContent> {
    console.log('🎯 Starting PROGRESSIVE content generation pipeline...');
    console.log('[Step 1] Generate Required Content and text subject ONLY first');
    
    // STEP 1: Generate only base content (text) first for immediate display
    const baseContent = {
      title: title,
      text: lessonContent,
      objectives: objectives,
      keyConcepts: this.extractKeyConcepts(lessonContent),
      summary: this.generateSummary(lessonContent)
    };

    const metadata = {
      difficulty: difficulty,
      estimatedTime: 30,
      learningStyle: learningStyle,
      subject: subject,
      topic: topic,
      generatedAt: new Date().toISOString(),
      version: '1.0',
      locale: 'en',
      ssml: false,
      voice: 'en-US-Standard-A'
    };

    const constraints = {
      mustUseContext: true,
      forbiddenTopics: [],
      locale: 'en',
      conceptId: '',
      conceptTitle: title,
      canonicalExample: ''
    };

    // Return minimal content first for immediate display
    const initialContent: SmartTeachingContent = {
      baseContent,
      metadata,
      constraints
    };

    console.log('✅ [STEP 1] Base content generated for immediate display');
    return initialContent;
  }

  // New method for generating additional content types progressively with caching
  async generateAdditionalContentType(
    lessonContent: string,
    subject: string,
    topic: string,
    title: string,
    objectives: string[],
    difficulty: string,
    learningStyle: string,
    contentType: string,
    lessonId?: string
  ): Promise<any> {
    console.log(`🎯 Generating additional ${contentType} content with caching...`);
    
    // Create cache key for this specific content type that includes lesson ID and content hash
    const contentHash = this.generateContentHash(lessonContent, title, objectives);
    const cacheKey = `${lessonId || 'no-id'}-${contentHash}-${subject}-${topic}-${difficulty}-${learningStyle}-${contentType}`;
    
    // Check cache first - this prevents expensive API calls
    if (this.cache.has(cacheKey)) {
      const timestamp = this.cacheTimestamps.get(cacheKey);
      if (timestamp && Date.now() - timestamp < this.CACHE_DURATION) {
        console.log(`✅ Using cached ${contentType} content for ${cacheKey}`);
        return this.cache.get(cacheKey);
      } else {
        this.cache.delete(cacheKey);
        this.cacheTimestamps.delete(cacheKey);
      }
    }
    
    try {
      // Only make expensive API calls if not in cache
      const requiredTypes = await this.selectSchemas(title, topic, subject, difficulty, learningStyle);
      console.log('Required types by GPT-4o: ', requiredTypes);
      
      let generatedContent = null;
      
      if (contentType === 'video' && requiredTypes.includes('video')) {
        console.log('🎥 [CACHED] Searching for video content...');
        const videoSearchResult = await this.generateStaticVideoContent(subject, topic, title);
        if (videoSearchResult) {
          const keyConcepts = this.generateKeyConceptsForSubject(subject, topic);
          generatedContent = {
            title: videoSearchResult.title,
            description: videoSearchResult.description,
            keyConcepts: keyConcepts,
            duration: 10,
            narration: `This video will help you understand ${title} better. Watch carefully and take notes on the key concepts.`,
            transcript: `This educational video covers ${title}. The instructor will explain the main concepts step by step, making it easy to understand. Key points include: ${keyConcepts.join(', ')}.`,
            src: videoSearchResult.url,
            poster: '',
            isValidUrl: true,
            license: 'CC-BY'
          };
        }
      } else if (contentType === 'math' && requiredTypes.includes('math')) {
        console.log('🧮 [CACHED] Generating math content...');
        generatedContent = await this.generateSpecificContentType(
          lessonContent,
          'math' as any,
          { title, subject, topic, difficulty, learningStyle }
        );
      } else if (contentType === 'diagram' && requiredTypes.includes('diagram')) {
        console.log('📊 [CACHED] Generating diagram content...');
        generatedContent = await this.generateSpecificContentType(
          lessonContent,
          'diagram' as any,
          { title, subject, topic, difficulty, learningStyle }
        );
      } else if (contentType === 'interactive' && requiredTypes.includes('interactive')) {
        console.log('🎯 [CACHED] Generating interactive content...');
        generatedContent = await this.generateSpecificContentType(
          lessonContent,
          'interactive' as any,
          { title, subject, topic, difficulty, learningStyle }
        );
      } else if (contentType === 'assessment' && requiredTypes.includes('assessment')) {
        console.log('📝 [CACHED] Generating assessment content...');
        generatedContent = await this.generateSpecificContentType(
          lessonContent,
          'assessment' as any,
          { title, subject, topic, difficulty, learningStyle }
        );
      }
      
      // Cache the result to prevent future expensive API calls
      if (generatedContent) {
        this.cache.set(cacheKey, generatedContent);
        this.cacheTimestamps.set(cacheKey, Date.now());
        console.log(`✅ Cached ${contentType} content for future use`);
      }
      
      return generatedContent;
    } catch (error) {
      console.error(`❌ Error generating ${contentType} content:`, error);
      return null;
    }
  }
  
  private async selectSchemas(
    title: string,
    subject: string,
    topic: string,
    difficulty: string,
    learningStyle: string
  ): Promise<string[]> {
    // Create cache key for schema selection
    const schemaCacheKey = `${title}-${subject}-${topic}-${difficulty}-${learningStyle}`;
    
    // Check cache first to avoid multiple GPT-4o calls
    if (this.schemaSelectionCache.has(schemaCacheKey)) {
      const timestamp = this.schemaSelectionTimestamps.get(schemaCacheKey);
      if (timestamp && Date.now() - timestamp < this.CACHE_DURATION) {
        console.log('🎯 [CACHED] Using cached schema selection for:', schemaCacheKey);
        return this.schemaSelectionCache.get(schemaCacheKey)!;
      } else {
        // Remove expired cache entry
        this.schemaSelectionCache.delete(schemaCacheKey);
        this.schemaSelectionTimestamps.delete(schemaCacheKey);
      }
    }
    
    console.log('🎯 [GPT-4o] Making schema selection call for:', schemaCacheKey);
    
  // Utility: dynamic enum from a runtime array (non-empty)
    function enumFrom<T extends string>(vals: readonly T[]) {
      if (!vals.length) throw new Error("Candidates must be non-empty");
      return z.enum(vals as [T, ...T[]]);
    }
    console.log(learningStyle);
    //const { title, subject, topic, difficulty } = params;
    const candidates =  AllSchemaNames;
    const max = 7;

    const CandidateEnum = enumFrom(candidates);
    const SelectionSchema = z.object({selected: z.array(CandidateEnum).min(1).max(max)});

    const { object } = await generateObject({
      model: openai('gpt-4o'),
      temperature: 0.1,
      schema: SelectionSchema,
      system: [
        "You are a pedagogy planner for K-12 and university.",
        "Choose the best subset of content schemas for a single lesson.",
        "Return STRICT JSON that matches the schema. No prose."
      ].join("\n"),
      prompt: [
        `TITLE: ${title}`,
        `SUBJECT: ${subject}`,
        `TOPIC: ${topic}`,
        `DIFFICULTY: ${difficulty}`,
        `CANDIDATES: ${candidates.join(", ")}`,
        "",
        "Rules:",
        `- Pick ≤ ${max} that best teach this lesson.`,
        "- Prefer math+diagram for symbolic/derivation topics.",
        "- Prefer simulation for phenomena/process/physics/econ.",
        "- Use interactive for practice/assess-on-the-fly.",
        "- Include video only if an illustrative demo helps.",
        "- Include threeD for spatial/geometry/molecular/3D calculus.",
        "- Include assessment only if formative check is useful (short).",
        "- Do NOT select anything outside the candidates list."
      ].join("\n")
    });
    
    const selectedTypes = object.selected;
    console.log('🎯 [GPT-4o] Selected types:', selectedTypes);
    
    // Cache the result
    this.schemaSelectionCache.set(schemaCacheKey, selectedTypes);
    this.schemaSelectionTimestamps.set(schemaCacheKey, Date.now());
    
    return selectedTypes;
  }


  private async generateStaticVideoContent(subject: string, topic: string, title: string): Promise<any> {
    console.log('🎬 [DEBUG] generateStaticVideo called with:', { subject, topic, title });
    
    try {
      // Using generateText with Perplexity provider
      const result: { text: string } = await generateText({
        model: perplexity('sonar'),
        system: VIDEO_SEARCH_SYSTEM_PROMPT(title, topic, subject),
        prompt: VIDEO_SEARCH_USER_PROMPT(title, topic, subject)
      });
      
      const response = result.text;
      
      const urlMatch = response.match(/URL:\s*(.+)/);
      const titleMatch = response.match(/TITLE:\s*(.+)/);
      const descMatch = response.match(/DESCRIPTION:\s*(.+)/);
      
      const url = urlMatch?.[1]?.trim();
      const v_title = titleMatch?.[1]?.trim() || TEMPLATES.videoTitle(title);
      const description = descMatch?.[1]?.trim() || TEMPLATES.videoDescription(title);
      
      if (url && url !== 'NOTFOUND' && (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com'))) {
        console.log('✅ [DEBUG] Valid video URL found:', url);
        return { url, v_title, description };
      } else {
        console.log('❌ [DEBUG] Invalid or NOTFOUND URL:', url);
      }
    } catch (error) { console.warn('💥 Perplexity search failed:', error);}
    
    console.log('❌ [DEBUG] Invalid or NOTFOUND URL:');
    return null;
  }

  private detectRequiredContentTypes(subject: string): string[] {
    // Simplified and faster content type detection
    const types = []; // Always include text
    const subjectLower = subject.toLowerCase();
    //const contentLower = lessonContent.toLowerCase();
    
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
    console.log(`Content types for ${subject}: ${types.join(', ')}`);
    return uniqueTypes;
  }

  private optimizeContentTypesForLearningStyle(contentTypes: string[], learningStyle: string, subject: string): string[] {
    // Subject-aware learning style optimization
    const subjectLower = subject?.toLowerCase() || '';
    
    // Define which subjects are appropriate for 3D content
    const subjectsAppropriateFor3D = [
      'science', 'physics', 'chemistry', 'biology', 'geometry', 
      'anatomy', 'architecture', 'engineering', 'astronomy', 'geology'
    ];
    
    const isSubjectAppropriateFor3D = subjectsAppropriateFor3D.some(appropriateSubject => 
      subjectLower.indexOf(appropriateSubject) !== -1
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
    const allowed = new Set(['text','math','diagram','simulation','interactive','threeD','model3D','particleEffects','assessment']);

    const optimizedTypes = [...new Set([
      ...contentTypes.map(normalize),
      ...additions.map(normalize)
    ])].filter(t => allowed.has(t));

    //console.log(`Optimized content types for ${learningStyle} (${subject}): ${optimizedTypes.join(', ')}`);
    if (!isSubjectAppropriateFor3D && learningStyle === 'visual') {
      console.log(`✅ 3D content filtered out for ${subject} - not appropriate for this subject`);
    }
    return optimizedTypes;
  }

  private async generateOptimizedContent(
    lessonContent: string,
  title: string,
    objectives: string[],
  subject: string,
  topic: string,
  difficulty: string,
  learningStyle: string,
    optimizedTypes: string[]
  ): Promise<SmartTeachingContent> {
    console.log('📝 Generating optimized content with all required types...');
    
    const subjectGuidelines = getSubjectSpecificGuidelines(subject);
    const learningStyleGuidelines = getLearningStyleGuidelines(learningStyle);
    const contentTypeInstructions = getContentTypeInstructions(optimizedTypes, title);
    const systemPrompt = buildOptimizedSystemPrompt(subject, topic, title, difficulty, learningStyle, optimizedTypes, subjectGuidelines, learningStyleGuidelines, contentTypeInstructions);
    
    // Use the main schema for optimized generation
    let result;
    try {
      result = await generateObject({
        model: openai('gpt-4o'),
        system: systemPrompt,
        prompt: MAIN_CONTENT_GENERATION_PROMPT(title, subject, topic, difficulty, learningStyle, optimizedTypes, lessonContent, objectives),
        schema: SmartTeachingContentSchema,
        temperature: 0.1,
      });
      console.log('🔍 [DEBUG] ===================================');
      console.log('🔍 [DEBUG] The Result of the content by AI Teacher:', result.object);
    } catch (schemaError: any) {
      const issues = schemaError?.cause?.issues ?? schemaError?.issues;
      if (issues) {
        console.warn("Zod issues:", JSON.stringify(issues, null, 2));
      } else {
        console.warn("Schema error:", schemaError);
      }
      const errorMessage = schemaError instanceof Error ? schemaError.message : String(schemaError);
      console.log('🔍 [DEBUG] error ======> result:', result);
      console.warn('Schema validation failed, falling back to basic content generation:', errorMessage);
      // Fall back to basic content generation without strict schema validation
      return await this.generateFallbackMultimodalContent(lessonContent, title, objectives, subject, topic, difficulty, learningStyle, optimizedTypes);
    }

    const generatedContent = result.object;

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
        version: '1.0',
        locale: 'en',
        ssml: false,
        voice: 'en-US-Standard-A'
      };
    }
    
    // Validate that we have multimodal content
    const hasMultimodal = !!(generatedContent.math || generatedContent.diagram || 
                            generatedContent.simulation || generatedContent.video || 
                            generatedContent.interactive || generatedContent.threeD );
    
    if (!hasMultimodal) {
      console.warn('Generated content lacks multimodal elements, enhancing with fallback content...');
      return await this.generateFallbackMultimodalContent(lessonContent, title, objectives, subject, topic, difficulty, learningStyle, optimizedTypes);
    }
    
    console.log('✅ Optimized content generation completed');
    return generatedContent;
  }

  private async enhanceMissingContent(content: SmartTeachingContent, subject: string, topic: string, title: string, missingTypes: string[]): Promise<SmartTeachingContent> {
    if (missingTypes.length === 0) {
      return content;
    }
    
    //console.log( `Enhancing missing content types: ${types.join(', ')}`);
    
    const systemPrompt = CONTENT_ENHANCEMENT_SYSTEM_PROMPT(title, subject, topic, missingTypes) + '\n\nExisting Content:\n' + JSON.stringify(content, null, 2);
    
    const result = await generateObject({
      model: openai('gpt-4o'),
      system: systemPrompt,
      prompt: CONTENT_ENHANCEMENT_USER_PROMPT,
      schema: Stage2EnhancedContentSchema
    });
    
    // Merge the enhanced content with the existing content
    const enhancedContent: SmartTeachingContent = {
      ...content,
      ...result.object
    };
    
    return enhancedContent;
  }

  private async validateAndEnhanceContent(
    content: SmartTeachingContent,
  subject: string,
  topic: string,
    title: string
  ): Promise<SmartTeachingContent> {
    console.log('🔍 Stage 4: Validating and enhancing content quality...');
    
    // Validate content completeness and quality
    const validationResults = this.validateContentCompleteness(content, subject);
    const qualityValidation = this.validateContentQuality(content, subject);
    console.log('Content validation results:', validationResults);
    console.log('Content quality validation:', qualityValidation);
    
    // If content is complete and meets quality standards, return as is
    if (validationResults.isComplete && qualityValidation.isValid) {
      console.log('✅ Stage 4 completed - Content validation and quality check passed');
      return content;
    }
    
    // Enhance missing content and apply quality recommendations
    const allMissingTypes = [...validationResults.missingTypes, ...qualityValidation.missingTypes];
    const enhancedContent = await this.enhanceMissingContent(content, subject, topic, title, allMissingTypes);
    
    console.log('✅ Stage 4 completed - Content enhanced and validated');
    return enhancedContent;
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

  private async generateFallbackMultimodalContent(
    lessonContent: string,
  title: string,
    objectives: string[],
  subject: string,
  topic: string,
  difficulty: string,
  learningStyle: string,
    requiredTypes: string[]
  ): Promise<SmartTeachingContent> {
    console.log('Generating fallback multimodal content for types:', requiredTypes);
    
    const baseContent = {
      title: title,
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
        version: '1.0',
        locale: 'en',
        ssml: false,
        voice: 'en-US-Standard-A'
      },
      constraints: {
        mustUseContext: true,
        forbiddenTopics: [],
        locale: 'en',
        conceptId: '',
        conceptTitle: '',
        canonicalExample: ''
      }
    };

    // Generate static fallback content for multimodal experience
    try {
      // Always generate diagram content based on learning style
      if (requiredTypes.includes('diagram') || learningStyle === 'visual' || learningStyle === 'kinesthetic') {
        content.diagram = this.generateStaticDiagramContent(title, subject, topic);
      }
      
      // Always generate interactive content for kinesthetic learners
      if (requiredTypes.includes('interactive') || learningStyle === 'kinesthetic' || learningStyle === 'analytical') {
        content.interactive = this.generateStaticInteractiveContent(title, subject, topic, difficulty);
      }
      
      // Generate 3D content for visual learners
      if (requiredTypes.includes('3d') || (learningStyle === 'visual' && this.is3DSubject(subject))) {
        content.threeD = this.generateStatic3DContent(title, subject, topic);
      }
      
      // Generate math content for math subjects
      if (requiredTypes.includes('math') || this.isMathSubject(subject)) {
        content.math = this.generateStaticMathContent(title, subject, topic, difficulty, lessonContent);
      }
      
      // Generate simulation content for science subjects
      if (requiredTypes.includes('simulation') || this.isScienceSubject(subject)) {
        content.simulation = this.generateStaticSimulationContent(title, subject, topic);
      }

      // Validate we have minimum required content
      const validation = this.validateGeneratedContent(content, requiredTypes);
      if (!validation.isComplete) {
        console.warn(`Still missing content after fallback generation:`);
      }
      
    } catch (error) {
      console.error('Error generating fallback content:', error);
    }

    return content;
  }

  private validateContentCompleteness(content: SmartTeachingContent, subject: string): { isComplete: boolean; missingTypes: string[] } {
    const requiredTypes = this.detectRequiredContentTypes(subject);
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

  private validateContentQuality(content: SmartTeachingContent, subject: string): { 
    isValid: boolean; 
    qualityScore: number; 
    missingTypes: string[]; 
    recommendations: string[] 
  } {
    console.log('🔍 Validating content quality...');
    
    const requiredTypes = this.detectRequiredContentTypes(subject);
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
      recommendations.push(LOG_MESSAGES.addMissingTypes(missingTypes));
    }
    
    if (contentRichness < 0.7) {
      recommendations.push('Enhance content richness with more detailed explanations and examples');
    }
    
    if (multimodalDiversity < 0.6) {
      recommendations.push('Increase multimodal diversity with more visual and interactive elements');
    }
    
    const isValid = qualityScore >= 0.7 && missingTypes.length === 0;
    
    console.log(LOG_MESSAGES.contentQualityValidation(isValid, qualityScore));
    console.log(LOG_MESSAGES.missingTypes(missingTypes));
    console.log(LOG_MESSAGES.recommendations(recommendations));
    
    return {
      isValid,
      qualityScore,
      missingTypes,
      recommendations
    };
  }

  private generateStaticDiagramContent(title: string, subject: string, topic: string): any {
    return {
      title: TEMPLATES.diagramTitle(title),
      chart: this.generateMermaidDiagram(subject, topic, title),
      theme: 'neutral',
      explanation: TEMPLATES.diagramExplanation(title),
      keyPoints: TEMPLATES.diagramKeyPoints(topic),
      narration: TEMPLATES.diagramNarration(title)
    };
  }

  private generateMermaidDiagram(subject: string, topic: string, title: string): string {
    const subjectLower = subject.toLowerCase();
    console.log(title);
    if (subjectLower.includes('math') || subjectLower.includes('algebra')) {
      return MERMAID_TEMPLATES.math;
    }
    
    if (subjectLower.includes('science') || subjectLower.includes('physics') || subjectLower.includes('chemistry')) {
      return MERMAID_TEMPLATES.science;
    }
    
    return MERMAID_TEMPLATES.general(topic);
  }

  private generateStaticInteractiveContent(title: string, subject: string, topic: string, difficulty: string): any {
    return {
      title: TEMPLATES.interactiveTitle(title),
      type: 'quiz',
      instructions: TEMPLATES.interactiveInstructions(topic, subject, title),
      questions: this.generateQuizQuestions(title, subject, topic, difficulty),
      narration: TEMPLATES.interactiveNarration(title)
    };
  }

  private generateQuizQuestions(title: string, subject: string, topic: string, difficulty: string): any[] {
    const subjectLower = subject.toLowerCase();
    
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
      TEMPLATES.primaryFocusQuestion(topic),
      TEMPLATES.learningApproachQuestion(topic)
    ];

    if (difficulty === 'advanced') {
      questions.push(TEMPLATES.advancedSkillQuestion(topic));
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
      title: TEMPLATES.threeDTitle(title),
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
      description: TEMPLATES.threeDDescription(topic),
      interactions: ['rotate', 'zoom', 'pan', 'highlight'],
      narration: TEMPLATES.threeDNarration(title)
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
        
        explanation = TEMPLATES.mathExplanation(equation, steps);
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
        ? TEMPLATES.mathNarrationLinear(equation)
        : TEMPLATES.mathNarrationGeneral(title)
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

  private getPresentContentTypes(content: SmartTeachingContent): string[] {
    const types: string[] = ['text']; // Always present
    
    if (content.diagram) {
      types.push('diagram');
    }
    
    if (content.threeD) {
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
      title: string;
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
        system: SPECIFIC_CONTENT_SYSTEM_PROMPT(contentType, context.subject, context.topic, context.difficulty, context.learningStyle),
        prompt: SPECIFIC_CONTENT_USER_PROMPT(contentType, context.topic, baseContent),
        schema: schema,
        temperature: 0.1,
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
        explanation: TEMPLATES.fallbackExplanation(context.topic),
        graphExpression: "x",
        graphTitle: `Graph for ${context.topic}`,
        narration: TEMPLATES.fallbackNarration(context.topic, context.subject)
      };

    switch (contentType) {
      case 'text':
        return {
          content: TEMPLATES.fallbackTextContent(context.topic, context.subject),
          summary: TEMPLATES.fallbackSummary(context.topic),
          keyPoints: TEMPLATES.fallbackKeyPoints(context.topic)
        };
      case 'math':
        return {
          ...baseFallback,
          equation: context.topic.toLowerCase().includes('linear') ? "2x + 3 = 11" : "x = 1",
          explanation: `This is fallback content for ${context.topic}. We're working on generating better content for this topic.`,
          graphExpression: context.topic.toLowerCase().includes('linear') ? "2*x + 3" : "x",
          graphTitle: `Graph for ${context.topic}`,
          narration: TEMPLATES.fallbackNarration(context.topic, context.subject)
        };
      case 'diagram':
        return {
          title: TEMPLATES.diagramTitle(context.topic),
          chart: MERMAID_TEMPLATES.fallback(context.topic),
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
    this.schemaSelectionCache.clear();
    this.schemaSelectionTimestamps.clear();
  }

  clearCacheForLesson(lessonId: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      // Check if the cache key starts with the lesson ID (new format) or contains it (old format)
      if (key.startsWith(`${lessonId}-`) || key.startsWith(`no-id-`) && key.includes(lessonId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
    });
    
    // Also clear schema selection cache for this lesson
    const schemaKeysToDelete: string[] = [];
    for (const key of this.schemaSelectionCache.keys()) {
      // Clear schema cache entries that might be related to this lesson
      // Since schema cache doesn't include lesson ID, we'll clear all for safety
      schemaKeysToDelete.push(key);
    }
    schemaKeysToDelete.forEach(key => {
      this.schemaSelectionCache.delete(key);
      this.schemaSelectionTimestamps.delete(key);
    });
    
    console.log(LOG_MESSAGES.clearedCacheEntries(keysToDelete.length, lessonId));
    console.log(`🎯 [DEBUG] Also cleared ${schemaKeysToDelete.length} schema selection cache entries`);
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  // Clear cache for a specific lesson when switching lessons
  clearCacheForLessonSwitch(lessonId: string): void {
    console.log(`🎯 [DEBUG] Clearing cache for lesson switch to: ${lessonId}`);
    this.clearCacheForLesson(lessonId);
  }
}

// Singleton instance
export const smartTeachingContentGenerator = new SmartTeachingContentGenerator();
