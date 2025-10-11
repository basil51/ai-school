import OpenAI from 'openai';

interface QuestionHint {
  id: string;
  level: 'subtle' | 'moderate' | 'strong';
  text: string;
  type: 'concept' | 'approach' | 'formula' | 'example';
}

interface QuestionSolution {
  id: string;
  stepByStep: string[];
  explanation: string;
  keyConcepts: string[];
  relatedTopics: string[];
}

interface AIHintsResult {
  hints: QuestionHint[];
  solution: QuestionSolution;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
}

export class AIHintsGenerator {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateHintsAndSolution(
    questionText: string,
    questionType: string,
    difficulty: string,
    context?: string,
    correctAnswer?: string
  ): Promise<AIHintsResult> {
    try {
      const prompt = this.buildPrompt(questionText, questionType, difficulty, context, correctAnswer);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert educational tutor. Generate helpful hints and a complete solution for student questions. Provide progressive hints that guide students without giving away the answer immediately."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      return this.parseAIResponse(content, questionText, difficulty);

    } catch (error) {
      console.error('Error generating AI hints:', error);
      return this.getFallbackHints(questionText, difficulty);
    }
  }

  private buildPrompt(
    questionText: string,
    questionType: string,
    difficulty: string,
    context?: string,
    correctAnswer?: string
  ): string {
    let prompt = `Generate educational hints and a solution for this ${questionType} question:

Question: "${questionText}"
Difficulty: ${difficulty}
Question Type: ${questionType}`;

    if (context) {
      prompt += `\nContext: ${context}`;
    }

    if (correctAnswer) {
      prompt += `\nCorrect Answer: ${correctAnswer}`;
    }

    prompt += `\n\nPlease provide:

1. THREE PROGRESSIVE HINTS (subtle, moderate, strong):
   - Subtle: A gentle nudge without revealing much
   - Moderate: More specific guidance
   - Strong: Almost gives away the approach but not the final answer

2. COMPLETE SOLUTION:
   - Step-by-step explanation
   - Key concepts involved
   - Related topics to study

Format your response as JSON:
{
  "hints": [
    {
      "level": "subtle",
      "text": "hint text",
      "type": "concept|approach|formula|example"
    }
  ],
  "solution": {
    "stepByStep": ["step 1", "step 2", "step 3"],
    "explanation": "complete explanation",
    "keyConcepts": ["concept1", "concept2"],
    "relatedTopics": ["topic1", "topic2"]
  },
  "difficulty": "beginner|intermediate|advanced",
  "estimatedTime": 5
}`;

    return prompt;
  }

  private parseAIResponse(content: string, questionText: string, difficulty: string): AIHintsResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          hints: parsed.hints || [],
          solution: parsed.solution || this.getDefaultSolution(questionText),
          difficulty: parsed.difficulty || difficulty,
          estimatedTime: parsed.estimatedTime || 5
        };
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
    }

    // Fallback if JSON parsing fails
    return this.getFallbackHints(questionText, difficulty);
  }

  private getFallbackHints(questionText: string, difficulty: string): AIHintsResult {
    return {
      hints: [
        {
          id: 'hint_1',
          level: 'subtle',
          text: 'Read the question carefully and identify what is being asked.',
          type: 'approach'
        },
        {
          id: 'hint_2',
          level: 'moderate',
          text: 'Think about the key concepts related to this topic.',
          type: 'concept'
        },
        {
          id: 'hint_3',
          level: 'strong',
          text: 'Consider the most common approach to solving this type of problem.',
          type: 'approach'
        }
      ],
      solution: this.getDefaultSolution(questionText),
      difficulty: difficulty as any,
      estimatedTime: 5
    };
  }

  private getDefaultSolution(questionText: string): QuestionSolution {
    return {
      id: 'solution_1',
      stepByStep: [
        'Read and understand the question',
        'Identify the key concepts involved',
        'Apply the appropriate method or formula',
        'Check your answer for reasonableness'
      ],
      explanation: 'This question requires careful analysis of the given information and application of the relevant concepts.',
      keyConcepts: ['Problem solving', 'Critical thinking'],
      relatedTopics: ['Study the related chapter', 'Practice similar problems']
    };
  }

  async generateAdaptiveHint(
    questionText: string,
    studentAttempts: number,
    previousHints: string[],
    studentLevel: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<QuestionHint> {
    try {
      const prompt = `Generate an adaptive hint for a student who has attempted this question ${studentAttempts} times.

Question: "${questionText}"
Student Level: ${studentLevel}
Previous Hints Given: ${previousHints.join(', ')}

Generate a hint that:
- Is appropriate for attempt #${studentAttempts}
- Builds on previous hints without repeating them
- Matches the student's level
- Provides just enough guidance to help without giving away the answer

Return as JSON:
{
  "level": "subtle|moderate|strong",
  "text": "hint text",
  "type": "concept|approach|formula|example"
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an adaptive tutor. Generate hints that progressively help students based on their attempts and level."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 300
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            id: `adaptive_hint_${Date.now()}`,
            level: parsed.level || 'moderate',
            text: parsed.text || 'Think about this step by step.',
            type: parsed.type || 'approach'
          };
        }
      }
    } catch (error) {
      console.error('Error generating adaptive hint:', error);
    }

    // Fallback adaptive hint
    return {
      id: `adaptive_hint_${Date.now()}`,
      level: studentAttempts <= 1 ? 'subtle' : studentAttempts <= 3 ? 'moderate' : 'strong',
      text: studentAttempts <= 1 
        ? 'Start by understanding what the question is asking for.'
        : studentAttempts <= 3
        ? 'Consider the key concepts and how they relate to each other.'
        : 'Try breaking this down into smaller, manageable steps.',
      type: 'approach'
    };
  }
}

export type { QuestionHint, QuestionSolution, AIHintsResult };
