/**
 * Multi-Dimensional Content Generator
 * Revolutionary AI system that creates personalized learning content
 * across multiple dimensions: cognitive, emotional, social, and creative
 */

import OpenAI from 'openai';
import { NeuralPathway, LearningDimensions } from './neural-pathways';

const openai = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy_key_for_build' 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

// Content generation types
export interface GeneratedContent {
  id: string;
  studentId: string;
  originalContent: string;
  adaptedContent: string;
  adaptationType: 'cognitive' | 'emotional' | 'social' | 'creative' | 'cross-domain' | 'predictive';
  pathway: NeuralPathway;
  dimensions: LearningDimensions;
  crossDomainConnections: string[];
  emotionalSupport: string;
  interactiveElements: InteractiveElement[];
  successMetrics: string[];
  generatedAt: Date;
}

export interface InteractiveElement {
  type: 'visualization' | 'simulation' | 'game' | 'story' | 'music' | 'art' | 'movement';
  content: string;
  purpose: string;
  engagement: number; // 0-1
}

export interface CrossDomainContent {
  sourceDomain: string;
  targetDomain: string;
  connectionType: string;
  content: string;
  explanation: string;
  effectiveness: number; // 0-1
}

export class MultiDimensionalContentGenerator {
  /**
   * Generate revolutionary personalized content based on neural pathways
   */
  async generatePersonalizedContent(
    studentId: string,
    originalContent: string,
    subject: string,
    pathway: NeuralPathway,
    dimensions: LearningDimensions
  ): Promise<GeneratedContent> {
    
    // Generate content for each dimension
    const cognitiveContent = await this.generateCognitiveContent(
      originalContent, 
      pathway, 
      dimensions.cognitive
    );
    
    const emotionalContent = await this.generateEmotionalContent(
      cognitiveContent, 
      dimensions.emotional
    );
    
    const socialContent = await this.generateSocialContent(
      emotionalContent, 
      dimensions.social
    );
    
    const creativeContent = await this.generateCreativeContent(
      socialContent, 
      dimensions.creative
    );
    
    // Create cross-domain connections
    const crossDomainConnections = await this.generateCrossDomainConnections(
      creativeContent, 
      subject, 
      studentId
    );
    
    // Generate interactive elements
    const interactiveElements = await this.generateInteractiveElements(
      creativeContent, 
      pathway, 
      dimensions
    );
    
    // Create emotional support content
    const emotionalSupport = await this.generateEmotionalSupport(
      dimensions.emotional
    );
    
    return {
      id: `content_${Date.now()}`,
      studentId,
      originalContent,
      adaptedContent: creativeContent,
      adaptationType: 'creative',
      pathway,
      dimensions,
      crossDomainConnections,
      emotionalSupport,
      interactiveElements,
      successMetrics: this.generateSuccessMetrics(pathway, dimensions),
      generatedAt: new Date()
    };
  }

  /**
   * Generate cognitive-optimized content based on neural pathways
   */
  private async generateCognitiveContent(
    content: string, 
    pathway: NeuralPathway, 
    cognitive: any
  ): Promise<string> {
    // If OpenAI is not available, return adapted content based on pathway type
    if (!openai) {
      return this.generateSampleCognitiveContent(content, pathway);
    }

    const prompt = `
    Transform this educational content to match the student's cognitive processing pattern.

    Original Content: ${content}
    Neural Pathway: ${pathway.pathwayType}
    Pathway Strength: ${pathway.strength}
    Cognitive Dimensions: ${JSON.stringify(cognitive)}

    Adapt the content based on their pathway type:
    - Sequential: Step-by-step logical progression
    - Parallel: Multiple simultaneous concepts
    - Hierarchical: Top-down conceptual approach
    - Network: Interconnected web of ideas
    - Hybrid: Combination of approaches

    Optimize for:
    - Processing Speed: ${cognitive.processingSpeed}
    - Working Memory: ${cognitive.workingMemory}
    - Attention Span: ${cognitive.attentionSpan}
    - Pattern Recognition: ${cognitive.patternRecognition}

    Return the adapted content that matches their cognitive style.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }]
      });

      return response.choices[0]?.message?.content || content;
    } catch (error) {
      console.warn('OpenAI API error, falling back to sample content:', error);
      return this.generateSampleCognitiveContent(content, pathway);
    }
  }

  private generateSampleCognitiveContent(content: string, pathway: NeuralPathway): string {
    const pathwayPrefixes = {
      sequential: "Step 1: ",
      parallel: "Let's explore multiple aspects: ",
      hierarchical: "Main Concept: ",
      network: "Connecting ideas: ",
      hybrid: "Multi-approach: "
    };

    const prefix = pathwayPrefixes[pathway.pathwayType] || "Adapted: ";
    return `${prefix}${content}\n\nThis content has been adapted for your ${pathway.pathwayType} learning style with ${Math.round(pathway.strength * 100)}% effectiveness.`;
  }

  /**
   * Generate emotionally supportive content
   */
  private async generateEmotionalContent(
    content: string, 
    emotional: any
  ): Promise<string> {
    if (!openai) {
      return `${content}\n\n[Emotional support: You're doing great! Keep up the excellent work!]`;
    }

    const prompt = `
    Enhance this content with emotional intelligence and support.

    Content: ${content}
    Emotional State: ${JSON.stringify(emotional)}

    Add emotional support based on:
    - Motivation Level: ${emotional.motivation}
    - Confidence Level: ${emotional.confidence}
    - Frustration Level: ${emotional.frustration}
    - Curiosity Level: ${emotional.curiosity}

    Include:
    - Encouraging language
    - Confidence-building elements
    - Stress-reduction techniques
    - Curiosity-sparking questions
    - Emotional validation

    Make the content emotionally engaging and supportive.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.8,
        messages: [{ role: "user", content: prompt }]
      });

      return response.choices[0]?.message?.content || content;
    } catch (error) {
      console.warn('OpenAI API error, falling back to sample emotional content:', error);
      return `${content}\n\n[Emotional support: You're doing great! Keep up the excellent work!]`;
    }
  }

  /**
   * Generate socially engaging content
   */
  private async generateSocialContent(
    content: string, 
    social: any
  ): Promise<string> {
    if (!openai) {
      return `${content}\n\n[Social learning: Try discussing this with classmates or teachers!]`;
    }

    const prompt = `
    Transform this content to include social learning elements.

    Content: ${content}
    Social Preferences: ${JSON.stringify(social)}

    Add social elements based on:
    - Collaboration Preference: ${social.collaboration}
    - Competition Preference: ${social.competition}
    - Mentorship Preference: ${social.mentorship}
    - Independence Preference: ${social.independence}

    Include:
    - Collaborative activities
    - Peer learning opportunities
    - Mentorship connections
    - Community building
    - Social validation

    Make the content socially engaging and interactive.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.8,
        messages: [{ role: "user", content: prompt }]
      });

      return response.choices[0]?.message?.content || content;
    } catch (error) {
      console.warn('OpenAI API error, falling back to sample social content:', error);
      return `${content}\n\n[Social learning: Try discussing this with classmates or teachers!]`;
    }
  }

  /**
   * Generate creative and innovative content
   */
  private async generateCreativeContent(
    content: string, 
    creative: any
  ): Promise<string> {
    if (!openai) {
      return `${content}\n\n[Creative approach: Try thinking about this in a new and innovative way!]`;
    }

    const prompt = `
    Transform this content into a creative and innovative learning experience.

    Content: ${content}
    Creative Dimensions: ${JSON.stringify(creative)}

    Enhance creativity based on:
    - Imagination Level: ${creative.imagination}
    - Innovation Level: ${creative.innovation}
    - Artistic Preference: ${creative.artistic}
    - Analytical Preference: ${creative.analytical}

    Include:
    - Creative problem-solving
    - Artistic expressions
    - Innovative approaches
    - Imaginative scenarios
    - Creative challenges

    Make the content spark creativity and innovation.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.9,
        messages: [{ role: "user", content: prompt }]
      });

      return response.choices[0]?.message?.content || content;
    } catch (error) {
      console.warn('OpenAI API error, falling back to sample creative content:', error);
      return `${content}\n\n[Creative approach: Try thinking about this in a new and innovative way!]`;
    }
  }

  /**
   * Generate cross-domain connections
   */
  private async generateCrossDomainConnections(
    content: string, 
    subject: string, 
    _studentId: string
  ): Promise<string[]> {
    if (!openai) {
      return [
        `Connect ${subject} to real-world applications`,
        `Use creative analogies to understand ${subject}`,
        `Apply ${subject} in hands-on projects`,
        `Explore ${subject} through different perspectives`,
        `Link ${subject} to other subjects you enjoy`
      ];
    }

    const prompt = `
    Create revolutionary cross-domain connections for this learning content.

    Content: ${content}
    Subject: ${subject}

    Generate 5-7 creative connections that link this content to other domains:
    - Science ↔ Art (e.g., "Learn physics through dance movements")
    - Math ↔ Music (e.g., "Understand fractions through rhythm patterns")
    - History ↔ Gaming (e.g., "Experience historical events through role-play")
    - Literature ↔ Technology (e.g., "Create digital stories")
    - Geography ↔ Cooking (e.g., "Explore cultures through cuisine")

    Make connections that are:
    - Unexpected and creative
    - Personally engaging
    - Educationally valuable
    - Memorable and fun

    Return as JSON array of connection strings.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.9,
        messages: [{ role: "user", content: prompt }]
      });

      const content = response.choices[0]?.message?.content || "[]";
      // Clean markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanContent);
    } catch (error) {
      console.warn('OpenAI API error, falling back to sample cross-domain connections:', error);
      return [
        `Connect ${subject} to real-world applications`,
        `Use creative analogies to understand ${subject}`,
        `Apply ${subject} in hands-on projects`,
        `Explore ${subject} through different perspectives`,
        `Link ${subject} to other subjects you enjoy`
      ];
    }
  }

  /**
   * Generate interactive elements
   */
  private async generateInteractiveElements(
    content: string, 
    pathway: NeuralPathway, 
    _dimensions: LearningDimensions
  ): Promise<InteractiveElement[]> {
    if (!openai) {
      return [
        {
          type: 'visualization',
          content: 'Create a visual diagram of the key concepts',
          purpose: 'Help visualize complex information',
          engagement: 0.8
        },
        {
          type: 'game',
          content: 'Turn this into a learning game or quiz',
          purpose: 'Make learning fun and interactive',
          engagement: 0.9
        }
      ];
    }

    const prompt = `
    Create interactive elements that match this student's learning style.

    Content: ${content}
    Neural Pathway: ${pathway.pathwayType}
    Learning Dimensions: ${JSON.stringify(_dimensions)}

    Generate interactive elements of these types:
    - Visualization: Charts, graphs, diagrams
    - Simulation: Interactive models, experiments
    - Game: Educational games, challenges
    - Story: Narrative elements, characters
    - Music: Rhythmic elements, songs
    - Art: Creative expressions, drawings
    - Movement: Physical activities, gestures

    For each element, provide:
    - Type
    - Content description
    - Purpose
    - Engagement level (0-1)

    Return as JSON array of interactive elements.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.8,
        messages: [{ role: "user", content: prompt }]
      });

      const content = response.choices[0]?.message?.content || "[]";
      // Clean markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanContent);
    } catch (error) {
      console.warn('OpenAI API error, falling back to sample interactive elements:', error);
      return [
        {
          type: 'visualization',
          content: 'Create a visual diagram of the key concepts',
          purpose: 'Help visualize complex information',
          engagement: 0.8
        },
        {
          type: 'game',
          content: 'Turn this into a learning game or quiz',
          purpose: 'Make learning fun and interactive',
          engagement: 0.9
        }
      ];
    }
  }

  /**
   * Generate emotional support content
   */
  private async generateEmotionalSupport(emotional: any): Promise<string> {
    if (!openai) {
      return "You're doing great! Keep learning and growing! Remember that every step forward is progress.";
    }

    const prompt = `
    Create personalized emotional support content for this student.

    Emotional State: ${JSON.stringify(emotional)}

    Generate supportive content that:
    - Builds confidence if low
    - Manages stress if high
    - Maintains motivation
    - Encourages curiosity
    - Provides emotional validation

    Include:
    - Encouraging messages
    - Stress-reduction techniques
    - Confidence-building affirmations
    - Motivational quotes
    - Emotional check-ins

    Make it warm, supportive, and personalized.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.8,
        messages: [{ role: "user", content: prompt }]
      });

      return response.choices[0]?.message?.content || "You're doing great! Keep learning and growing!";
    } catch (error) {
      console.warn('OpenAI API error, falling back to sample emotional support:', error);
      return "You're doing great! Keep learning and growing! Remember that every step forward is progress.";
    }
  }

  /**
   * Generate success metrics
   */
  private generateSuccessMetrics(
    pathway: NeuralPathway, 
    _dimensions: LearningDimensions
  ): string[] {
    const metrics = [
      `Learning velocity through ${pathway.pathwayType} pathway`,
      `Retention rate improvement`,
      `Emotional engagement level`,
      `Cross-domain transfer success`,
      `Confidence level increase`,
      `Motivation maintenance`,
      `Curiosity stimulation`,
      `Stress reduction`,
      `Social interaction quality`,
      `Creative expression level`
    ];

    return metrics;
  }

  /**
   * Generate alternative explanations for struggling students
   */
  async generateAlternativeExplanation(
    originalContent: string,
    studentId: string,
    struggleType: 'conceptual' | 'procedural' | 'emotional' | 'motivational',
    pathway: NeuralPathway,
    dimensions: LearningDimensions
  ): Promise<GeneratedContent> {
    
    if (!openai) {
      return {
        id: `alt_content_${Date.now()}`,
        studentId,
        originalContent,
        adaptedContent: `${originalContent}\n\n[Alternative explanation: Let's try a different approach to understand this concept.]`,
        adaptationType: 'creative',
        pathway,
        dimensions,
        crossDomainConnections: ['Real-world applications', 'Visual learning'],
        emotionalSupport: 'Take your time, you\'re doing great!',
        interactiveElements: [
          {
            type: 'visualization',
            content: 'Create a visual diagram',
            purpose: 'Help understand the concept',
            engagement: 0.8
          }
        ],
        successMetrics: ['Improved understanding', 'Increased confidence'],
        generatedAt: new Date()
      };
    }

    const prompt = `
    Create an alternative explanation for a student who is struggling.

    Original Content: ${originalContent}
    Struggle Type: ${struggleType}
    Neural Pathway: ${pathway.pathwayType}
    Learning Dimensions: ${JSON.stringify(dimensions)}

    Create a completely different approach that:
    - Uses a different neural pathway
    - Addresses the specific struggle type
    - Incorporates their strengths
    - Provides multiple entry points
    - Includes emotional support
    - Uses creative analogies
    - Connects to their interests

    Make it:
    - Simpler and clearer
    - More engaging
    - Emotionally supportive
    - Visually rich
    - Interactive
    - Connected to real life

    Return the alternative explanation.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.9,
        messages: [{ role: "user", content: prompt }]
      });

      const alternativeContent = response.choices[0]?.message?.content || originalContent;

      return {
        id: `alt_content_${Date.now()}`,
        studentId,
        originalContent,
        adaptedContent: alternativeContent,
        adaptationType: 'creative',
        pathway,
        dimensions,
        crossDomainConnections: await this.generateCrossDomainConnections(alternativeContent, 'General', studentId),
        emotionalSupport: await this.generateEmotionalSupport(dimensions.emotional),
        interactiveElements: await this.generateInteractiveElements(alternativeContent, pathway, dimensions),
        successMetrics: this.generateSuccessMetrics(pathway, dimensions),
        generatedAt: new Date()
      };
    } catch (error) {
      console.warn('OpenAI API error, falling back to sample alternative explanation:', error);
      return {
        id: `alt_content_${Date.now()}`,
        studentId,
        originalContent,
        adaptedContent: `${originalContent}\n\n[Alternative explanation: Let's try a different approach to understand this concept.]`,
        adaptationType: 'creative',
        pathway,
        dimensions,
        crossDomainConnections: ['Real-world applications', 'Visual learning'],
        emotionalSupport: 'Take your time, you\'re doing great!',
        interactiveElements: [
          {
            type: 'visualization',
            content: 'Create a visual diagram',
            purpose: 'Help understand the concept',
            engagement: 0.8
          }
        ],
        successMetrics: ['Improved understanding', 'Increased confidence'],
        generatedAt: new Date()
      };
    }
  }

  /**
   * Generate predictive content for upcoming challenges
   */
  async generatePredictiveContent(
    studentId: string,
    upcomingTopic: string,
    predictedDifficulty: number,
    pathway: NeuralPathway,
    dimensions: LearningDimensions
  ): Promise<GeneratedContent> {
    
    if (!openai) {
      return {
        id: `predictive_content_${Date.now()}`,
        studentId,
        originalContent: `Preparatory content for: ${upcomingTopic}`,
        adaptedContent: `Let's prepare for ${upcomingTopic}! This topic will help you build important skills.`,
        adaptationType: 'predictive',
        pathway,
        dimensions,
        crossDomainConnections: ['Real-world applications', 'Previous knowledge'],
        emotionalSupport: 'You\'re ready for this challenge!',
        interactiveElements: [
          {
            type: 'visualization',
            content: 'Create a mind map of related concepts',
            purpose: 'Prepare for the upcoming topic',
            engagement: 0.8
          }
        ],
        successMetrics: ['Improved preparation', 'Increased confidence'],
        generatedAt: new Date()
      };
    }

    const prompt = `
    Create predictive content to prepare a student for an upcoming challenging topic.

    Upcoming Topic: ${upcomingTopic}
    Predicted Difficulty: ${predictedDifficulty}/10
    Neural Pathway: ${pathway.pathwayType}
    Learning Dimensions: ${JSON.stringify(dimensions)}

    Create preparatory content that:
    - Pre-teaches key concepts
    - Builds necessary background knowledge
    - Addresses potential emotional challenges
    - Uses their strongest learning pathway
    - Provides confidence-building elements
    - Creates positive associations
    - Includes success strategies

    Make it:
    - Proactive and preventive
    - Confidence-building
    - Engaging and interesting
    - Connected to their interests
    - Emotionally supportive
    - Visually appealing

    Return the predictive content.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.8,
        messages: [{ role: "user", content: prompt }]
      });

      const predictiveContent = response.choices[0]?.message?.content || '';

      return {
        id: `predictive_content_${Date.now()}`,
        studentId,
        originalContent: `Preparatory content for: ${upcomingTopic}`,
        adaptedContent: predictiveContent,
        adaptationType: 'predictive',
        pathway,
        dimensions,
        crossDomainConnections: await this.generateCrossDomainConnections(predictiveContent, 'General', studentId),
        emotionalSupport: await this.generateEmotionalSupport(dimensions.emotional),
        interactiveElements: await this.generateInteractiveElements(predictiveContent, pathway, dimensions),
        successMetrics: this.generateSuccessMetrics(pathway, dimensions),
        generatedAt: new Date()
      };
    } catch (error) {
      console.warn('OpenAI API error, falling back to sample predictive content:', error);
      return {
        id: `predictive_content_${Date.now()}`,
        studentId,
        originalContent: `Preparatory content for: ${upcomingTopic}`,
        adaptedContent: `Let's prepare for ${upcomingTopic}! This topic will help you build important skills.`,
        adaptationType: 'predictive',
        pathway,
        dimensions,
        crossDomainConnections: ['Real-world applications', 'Previous knowledge'],
        emotionalSupport: 'You\'re ready for this challenge!',
        interactiveElements: [
          {
            type: 'visualization',
            content: 'Create a mind map of related concepts',
            purpose: 'Prepare for the upcoming topic',
            engagement: 0.8
          }
        ],
        successMetrics: ['Improved preparation', 'Increased confidence'],
        generatedAt: new Date()
      };
    }
  }
}

export const contentGenerator = new MultiDimensionalContentGenerator();
