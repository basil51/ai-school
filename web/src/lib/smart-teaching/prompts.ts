/**
 * AI Content Generator Prompts
 * 
 * This file contains all the system prompts, user prompts, and template strings
 * used by the SmartTeachingContentGenerator class.
 */

// ============================================================================
// VIDEO SEARCH PROMPTS
// ============================================================================

export const VIDEO_SEARCH_SYSTEM_PROMPT = (title: string, topic: string, subject: string) => 
`You are an expert AI teacher specializing in finding high-quality educational videos.
Your task is to find a high-quality educational video specifically about 
"${title}" in topic: ${topic} and in subject: ${subject}.
Prefer channels known for education (Khan Academy, 3Blue1Brown, MIT OCW, CrashCourse, etc.) when relevant.`;

export const VIDEO_SEARCH_USER_PROMPT = (title: string, topic: string, subject: string) => 
`Find a high-quality educational video specifically about 
 "${title}" in topic: ${topic} and in subject: ${subject}. 
  
Requirements:
- Must be from YouTube or Vimeo
- Must be educational/instructional content
- Must be appropriate for students
- Must be specifically about "${title}" (not general topic ${topic} or subject ${subject})
- prefer 5-20 minutes if possible
  
Return ONLY in this exact format:
- URL: [complete URL]
- TITLE: [video title]
- DESCRIPTION: [brief description]
  
If you cannot find a specific video about "${title}", return:
- URL: NOTFOUND
- TITLE: NOTFOUND
- DESCRIPTION: NOTFOUND`;

// ============================================================================
// MAIN CONTENT GENERATION PROMPTS
// ============================================================================

export const MAIN_CONTENT_GENERATION_PROMPT = (
  title: string,
  subject: string,
  topic: string,
  difficulty: string,
  learningStyle: string,
  optimizedTypes: string[],
  lessonContent: string,
  objectives: string[]
) => 
`Generate comprehensive educational content for this lesson:
Title: ${title}
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}
Learning Style: ${learningStyle}
Required Content Types: ${optimizedTypes.join(', ')}

Lesson Content: ${lessonContent}

Learning Objectives: ${objectives.map(obj => `- ${obj}`).join('\n')}

CRITICAL REQUIREMENTS:
1- All generated content must be directly related to the the Title: ${title} 
2. Generate content for ALL required types: ${optimizedTypes.join(', ')}
3. Include the baseContent object with ALL required fields:
    - title: "${title}"
    - text: comprehensive lesson content
    - objectives: array of learning objectives
    - keyConcepts: array of key concepts
    - summary: brief summary of the lesson
4. Include the constraints object with ALL required fields:
    - mustUseContext: true
    - forbiddenTopics: []
    - locale: "en"
    - conceptId: unique identifier
    - conceptTitle: "${title}"
    - canonicalExample: example related to the lesson
5. Include the metadata object with ALL required fields:
    - generatedAt: current timestamp
    - version: "1.0"
6. Do not skip any required content types, baseContent, constraints, or metadata fields.`;

// ============================================================================
// SYSTEM PROMPT BUILDERS
// ============================================================================

export const buildOptimizedSystemPrompt = (
  subject: string, 
  topic: string, 
  title: string,
  difficulty: string, 
  learningStyle: string, 
  requiredTypes: string[],
  subjectGuidelines: string,
  learningStyleGuidelines: string,
  contentTypeInstructions: string
): string => { 
  return `You are an expert AI teacher specializing in creating engaging, multimodal educational content.
Your task is to transform basic lesson content into rich, 
interactive learning experiences that surpass traditional search engine results.

🎯 CONTEXT & OBJECTIVES:
Title: ${title}
Subject: ${subject}
Topic: ${topic}
Difficulty Level: ${difficulty}
Learning Style: ${learningStyle}
Required Content Types: ${requiredTypes.join(', ')}

🚨 CRITICAL REQUIREMENTS - NON-NEGOTIABLE:
1. You MUST generate content for ALL required types: ${requiredTypes.join(', ')}
2. You MUST include the baseContent object with title, text, objectives, keyConcepts, and summary
3. You MUST include the constraints object with mustUseContext, forbiddenTopics, locale, conceptId, conceptTitle, and canonicalExample
4. You MUST include the metadata object with all required fields
5. Do not skip any required content types or objects - this is mandatory and will be validated
6. Each content type must be substantial and educationally valuable
7. Content must be more engaging and effective than a simple search engine result
8. All content must be age-appropriate and educationally sound
9. For optional fields like particleEffects and assessment, you may set them to null if not needed

📚 SUBJECT-SPECIFIC GUIDELINES: ${subjectGuidelines}

🎨 LEARNING STYLE OPTIMIZATION: ${learningStyleGuidelines}

🔧 CONTENT TYPE INSTRUCTIONS: ${contentTypeInstructions}

      📊 QUALITY STANDARDS & VALIDATION:
      - Mathematical expressions: Use proper LaTeX formatting with clear notation and solution steps
      - Diagrams: Create clear, educational Mermaid diagrams that support learning objectives and explaination steps
      - Simulations: Generate realistic parameters with clear instructions and expected outcomes
      - Interactive elements: Design intuitive, educational activities that encourage participation
      - Narration: Write engaging, clear explanations that build understanding progressively
      - 3D models: Provide detailed specifications for realistic, educational 3D representations
      - Assessments: Create meaningful questions that test understanding, not just memorization

      🎯 RELEVANCE & ALIGNMENT REQUIREMENTS:
      - All content MUST be directly grounded in the provided lesson content and topic
      - Do NOT produce generic placeholders (e.g., "y = f(x)", "Math.sin(x)") unless explicitly present in the lesson
      - For math, base equations, graphs, and examples on the lesson's equations 
      - Use the title, topic and subject to keep all modalities strictly on-topic

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
};

// ============================================================================
// CONTENT ENHANCEMENT PROMPTS
// ============================================================================

export const CONTENT_ENHANCEMENT_SYSTEM_PROMPT = (
  title: string,
  subject: string,
  topic: string,
  missingTypes: string[]
) => 
`You are an expert AI teacher. Add the missing content types to the existing educational content.
Title: ${title}
Subject: ${subject}
Topic: ${topic}
Missing Content Types: ${missingTypes.join(', ')}

CRITICAL: 
1- Add content for the missing types: ${missingTypes.join(', ')}. 
2- Do not remove any existing content.`;

export const CONTENT_ENHANCEMENT_USER_PROMPT = 
`Add the missing content types to the existing educational content.`;

// ============================================================================
// SPECIFIC CONTENT TYPE GENERATION PROMPTS
// ============================================================================

export const SPECIFIC_CONTENT_SYSTEM_PROMPT = (
  contentType: string,
  subject: string,
  topic: string,
  difficulty: string,
  learningStyle: string
) => 
`You are an expert AI teacher creating ${contentType} content for ${subject} - ${topic}. 
Difficulty: ${difficulty}
Learning Style: ${learningStyle}
        
CRITICAL REQUIREMENTS:
- Generate content that is DIRECTLY RELATED to the lesson topic: "${topic}"
- For math content: Create equations, graphs, and examples that match the specific topic
- For diagrams: Create visual representations that illustrate the lesson concepts
- Ensure all content is educationally relevant and age-appropriate
- Make content engaging and interactive for the specified learning style
        
Create engaging, educational ${contentType} content that helps students learn effectively.`;

export const SPECIFIC_CONTENT_USER_PROMPT = (
  contentType: string,
  topic: string,
  baseContent: string
) => 
`Generate ${contentType} content based on this lesson material for the topic "${topic}":
        
${baseContent}
        
IMPORTANT: The content must be specifically about "${topic}" and not generic content. For math content, create equations and graphs that directly relate to this topic. For diagrams, create visualizations that illustrate concepts from this specific lesson.`;

// ============================================================================
// SUBJECT-SPECIFIC GUIDELINES
// ============================================================================

export const getSubjectSpecificGuidelines = (subject: string): string => {
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
};

// ============================================================================
// LEARNING STYLE GUIDELINES
// ============================================================================

export const getLearningStyleGuidelines = (learningStyle: string): string => {
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
};

// ============================================================================
// CONTENT TYPE INSTRUCTIONS
// ============================================================================

export const getContentTypeInstructions = (requiredTypes: string[], title: string): string => {
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
- CRITICAL: Base all equations, graphs, and examples on the specific lesson topic: ${title}
- For geometry lessons: use specific geometric formulas and shapes from the lesson
- Graph expressions must relate to the lesson title: ${title}`);
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
};

// ============================================================================
// TEMPLATE STRINGS FOR STATIC CONTENT
// ============================================================================

export const TEMPLATES = {
  // Video content templates
  videoNarration: (title: string) => 
    `This video will help you understand ${title} better. Watch carefully and take notes on the key concepts.`,
  
  videoTranscript: (title: string, keyConcepts: string[]) => 
    `This educational video covers ${title}. The instructor will explain the main concepts step by step, making it easy to understand. Key points include: ${keyConcepts.join(', ')}.`,
  
  videoTitle: (title: string) => `${title} Tutorial`,
  
  videoDescription: (title: string) => `Learn about ${title}`,
  
  // Diagram content templates
  diagramTitle: (title: string) => `${title} Overview`,
  
  diagramExplanation: (title: string) => 
    `This diagram shows the key concepts and relationships in ${title}.`,
  
  diagramKeyPoints: (topic: string) => [
    `Understanding the main concepts of ${topic}`,
    `Seeing how different elements connect`,
    `Visual representation for better comprehension`,
    `Step-by-step learning progression`
  ],
  
  diagramNarration: (title: string) => 
    `Let's explore this diagram to understand the key concepts in ${title}. 
    This visual representation will help you see how different elements relate to each other.`,
  
  // Interactive content templates
  interactiveTitle: (title: string) => `Interactive ${title} Exercise`,
  
  interactiveInstructions: (topic: string, subject: string, title: string) => 
    `Test your understanding of ${topic} -> ${subject} -> ${title} with this interactive quiz.`,
  
  interactiveNarration: (title: string) => 
    `Let's test your knowledge with some interactive questions about ${title}. Take your time and think through each answer.`,
  
  // 3D content templates
  threeDTitle: (title: string) => `3D Visualization: ${title}`,
  
  threeDDescription: (topic: string) => 
    `Explore ${topic} in three dimensions to better understand its structure and properties.`,
  
  threeDNarration: (title: string) => 
    `This 3D model helps you visualize ${title} from all angles. You can rotate, zoom, and explore different aspects of the concept.`,
  
  // Math content templates
  mathNarrationLinear: (equation: string) => 
    `Let's solve the linear equation ${equation} step by step.`,
  
  mathNarrationGeneral: (title: string) => 
    `Let's explore the mathematical concepts in ${title}. We'll work through examples and see how to apply these formulas.`,
  
  mathExplanation: (equation: string, steps: string[]) => 
    `Let's solve ${equation} step by step: ${steps.join('. ')}.`,
  
  // Quiz question templates
  primaryFocusQuestion: (topic: string) => ({
    question: `What is the primary focus of ${topic}?`,
    options: [
      `Understanding the core principles of ${topic}`,
      `Memorizing facts about ${topic}`,
      `Avoiding ${topic} concepts`,
      `Simplifying ${topic} unnecessarily`
    ],
    correctAnswer: `Understanding the core principles of ${topic}`,
    explanation: `The primary focus of ${topic} is to understand its core principles and how they apply to real-world situations.`
  }),
  
  learningApproachQuestion: (topic: string) => ({
    question: `Which approach best helps you learn ${topic}?`,
    options: [
      `Active practice and application`,
      `Passive reading only`,
      `Avoiding examples`,
      `Memorizing without understanding`
    ],
    correctAnswer: `Active practice and application`,
    explanation: `Active practice and application of ${topic} concepts helps build deeper understanding and retention.`
  }),
  
  advancedSkillQuestion: (topic: string) => ({
    question: `What advanced skill is most important for mastering ${topic}?`,
    options: [
      `Critical thinking and analysis`,
      `Simple memorization`,
      `Avoiding complexity`,
      `Following instructions blindly`
    ],
    correctAnswer: `Critical thinking and analysis`,
    explanation: `Advanced mastery of ${topic} requires critical thinking and the ability to analyze complex situations.`
  }),
  
  // Fallback content templates
  fallbackExplanation: (topic: string) => 
    `This is a fallback explanation for ${topic}. The content generation encountered an error, but we're providing basic educational content to keep the learning experience going.`,
  
  fallbackNarration: (topic: string, subject: string) => 
    `Let's explore ${topic} in ${subject}. This is fallback content to ensure learning continues.`,
  
  fallbackTextContent: (topic: string, subject: string) => 
    `This is educational content about ${topic} in ${subject}. The content generation encountered an error, but we're providing basic educational material to keep the learning experience going.`,
  
  fallbackSummary: (topic: string) => 
    `Overview of ${topic} concepts and applications.`,
  
  fallbackKeyPoints: (topic: string) => [
    `Understanding ${topic}`,
    `Key concepts and principles`,
    `Practical applications`
  ]
};

// ============================================================================
// MERMAID DIAGRAM TEMPLATES
// ============================================================================

export const MERMAID_TEMPLATES = {
  math: `graph TD
    A[Linear Equation] --> B[Combine Like Terms]
    B --> C[Move Variable Terms]
    C --> D[Move Constants]
    D --> E[Isolate Variable]
    E --> F[Solution]`,
  
  science: `graph LR
    A[Observation] --> B[Hypothesis]
    B --> C[Experiment]
    C --> D[Analysis]
    D --> E[Conclusion]
    E --> F[Application]`,
  
  general: (topic: string) => `graph TD
        A[${topic}] --> B[Learn]
        B --> C[Practice]
        C --> D[Apply]
        D --> E[Master]`,
  
  fallback: (topic: string) => `graph TD
    A[${topic}] --> B[Key Concepts]
    A --> C[Examples]
    A --> D[Applications]`
};

// ============================================================================
// CONSOLE LOG MESSAGES
// ============================================================================

export const LOG_MESSAGES = {
  addMissingTypes: (types: string[]) => `Add missing content types: ${types.join(', ')}`,
  contentQualityValidation: (isValid: boolean, score: number) => `Content quality validation: ${isValid ? 'PASSED' : 'FAILED'} (score: ${score.toFixed(2)})`,
  missingTypes: (types: string[]) => `Missing types: ${types.join(', ')}`,
  recommendations: (recs: string[]) => `Recommendations: ${recs.join('; ')}`,
  clearedCacheEntries: (count: number, lessonId: string) => `Cleared ${count} cache entries for lesson ${lessonId}`
};
  