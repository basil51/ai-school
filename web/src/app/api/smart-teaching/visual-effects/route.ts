import { NextRequest, NextResponse } from 'next/server';
import { getToken } from "next-auth/jwt";
import { prisma } from '@/lib/prisma';
import { toSerializable } from '@/lib/utils';
import OpenAI from 'openai';

export const runtime = "nodejs";

// Lazy initialization of OpenAI client
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// POST - Generate 3D models and visual effects
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      lessonId, 
      contentType, 
      effectType, 
      parameters = {},
      learningStyle = 'visual'
    } = body;

    if (!lessonId || !contentType) {
      return NextResponse.json(
        { error: "Lesson ID and content type are required" },
        { status: 400 }
      );
    }

    // Verify the lesson exists and user has access
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        topic: {
          subject: {
            organizationId: token.organizationId as string
          }
        }
      },
      include: {
        topic: {
          include: {
            subject: true
          }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    // Generate 3D model or visual effect based on content type
    let generatedContent: any;

    if (contentType === '3d_model') {
      generatedContent = await generate3DModel(lesson, effectType, parameters, learningStyle);
    } else if (contentType === 'particle_effects') {
      generatedContent = await generateParticleEffects(lesson, effectType, parameters, learningStyle);
    } else if (contentType === 'visual_effects') {
      generatedContent = await generateVisualEffects(lesson, effectType, parameters, learningStyle);
    } else {
      return NextResponse.json(
        { error: "Unsupported content type" },
        { status: 400 }
      );
    }

    // Store generated content in database
    const storedContent = await prisma.generatedContent.create({
      data: {
        lessonId: lessonId,
        contentType: contentType as any,
        content: generatedContent,
        metadata: {
          learningStyle: learningStyle,
          parameters: parameters,
          generatedBy: token.sub
        },
        quality: calculateContentQuality(generatedContent)
      }
    });

    return NextResponse.json({
      success: true,
      content: toSerializable(storedContent),
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating visual effects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Retrieve generated visual effects
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');
    const contentType = searchParams.get('contentType');
    const learningStyle = searchParams.get('learningStyle');

    if (!lessonId) {
      return NextResponse.json(
        { error: "Lesson ID is required" },
        { status: 400 }
      );
    }

    // Build where clause
    const whereClause: any = {
      lessonId: lessonId,
      lesson: {
        topic: {
          subject: {
            organizationId: token.organizationId as string
          }
        }
      }
    };

    if (contentType) {
      whereClause.contentType = contentType;
    }

    if (learningStyle) {
      whereClause.learningStyle = learningStyle;
    }

    const generatedContent = await prisma.generatedContent.findMany({
      where: whereClause,
      include: {
        lesson: {
          include: {
            topic: {
              include: {
                subject: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(toSerializable(generatedContent));

  } catch (error) {
    console.error('Error fetching visual effects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate 3D model content
async function generate3DModel(lesson: any, effectType: string, parameters: any, learningStyle: string) {
  const openai = getOpenAI();

  const systemPrompt = `You are an expert 3D model generator for educational content. Generate a detailed 3D model specification based on the lesson content.

Lesson Details:
- Title: ${lesson.title}
- Subject: ${lesson.topic.subject.name}
- Topic: ${lesson.topic.name}
- Content: ${lesson.content}
- Learning Style: ${learningStyle}

Generate a 3D model that:
1. Represents key concepts from the lesson
2. Is appropriate for the subject matter
3. Supports the specified learning style
4. Includes interactive elements
5. Has educational value

Return your response as a JSON object with this structure:
{
  "title": "Model title",
  "visualizationType": "geometry|molecule|anatomy|architecture|physics",
  "config": {
    "type": "specific model type",
    "parameters": {
      "width": 1,
      "height": 1,
      "depth": 1,
      "color": "#ff0000",
      "metalness": 0.1,
      "roughness": 0.8
    }
  },
  "description": "Detailed description of the model",
  "interactions": ["rotate", "zoom", "click"],
  "narration": "Audio narration text",
  "learningObjectives": ["Objective 1", "Objective 2"],
  "difficulty": "beginner|intermediate|advanced"
}`;

  const userPrompt = `Generate a 3D model for the lesson: ${lesson.title}

Effect Type: ${effectType}
Parameters: ${JSON.stringify(parameters)}

Focus on creating an engaging, educational 3D visualization that helps students understand the lesson concepts.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
  });

  const generatedContent = response.choices[0]?.message?.content ?? "";
  
  try {
    return JSON.parse(generatedContent);
  } catch (parseError) {
    console.error('Error parsing 3D model content:', parseError);
    // Return fallback content
    return {
      title: `${lesson.title} - 3D Model`,
      visualizationType: 'geometry',
      config: {
        type: 'cube',
        parameters: {
          width: 1,
          height: 1,
          depth: 1,
          color: '#00ff00',
          metalness: 0.1,
          roughness: 0.8
        }
      },
      description: `Interactive 3D model for ${lesson.title}`,
      interactions: ['rotate', 'zoom'],
      narration: `Explore this 3D model to understand ${lesson.title}`,
      learningObjectives: ['Understand 3D representation', 'Explore interactive elements'],
      difficulty: 'beginner'
    };
  }
}

// Generate particle effects content
async function generateParticleEffects(lesson: any, effectType: string, parameters: any, learningStyle: string) {
  const openai = getOpenAI();

  const systemPrompt = `You are an expert particle effects generator for educational content. Generate particle effects that enhance learning.

Lesson Details:
- Title: ${lesson.title}
- Subject: ${lesson.topic.subject.name}
- Topic: ${lesson.topic.name}
- Content: ${lesson.content}
- Learning Style: ${learningStyle}

Generate particle effects that:
1. Illustrate key concepts from the lesson
2. Are visually engaging and educational
3. Support the learning objectives
4. Are appropriate for the subject matter

Return your response as a JSON object with this structure:
{
  "title": "Effect title",
  "effectType": "fire|smoke|stars|sparkles|rain|snow",
  "config": {
    "count": 100,
    "color": "#ff0000",
    "size": 0.1,
    "opacity": 0.8,
    "speed": 0.02,
    "amplitude": 0.5
  },
  "description": "Description of the particle effect",
  "learningObjectives": ["Objective 1", "Objective 2"],
  "educationalValue": "How this effect helps learning"
}`;

  const userPrompt = `Generate particle effects for the lesson: ${lesson.title}

Effect Type: ${effectType}
Parameters: ${JSON.stringify(parameters)}

Create particle effects that make the lesson more engaging and help students visualize concepts.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
  });

  const generatedContent = response.choices[0]?.message?.content ?? "";
  
  try {
    return JSON.parse(generatedContent);
  } catch (parseError) {
    console.error('Error parsing particle effects content:', parseError);
    // Return fallback content
    return {
      title: `${lesson.title} - Particle Effects`,
      effectType: 'sparkles',
      config: {
        count: 100,
        color: '#00ffff',
        size: 0.1,
        opacity: 0.8,
        speed: 0.02,
        amplitude: 0.5
      },
      description: `Particle effects for ${lesson.title}`,
      learningObjectives: ['Visualize concepts', 'Engage with content'],
      educationalValue: 'Enhances visual learning and engagement'
    };
  }
}

// Generate visual effects content
async function generateVisualEffects(lesson: any, effectType: string, parameters: any, learningStyle: string) {
  const openai = getOpenAI();

  const systemPrompt = `You are an expert visual effects generator for educational content. Generate visual effects that enhance learning.

Lesson Details:
- Title: ${lesson.title}
- Subject: ${lesson.topic.subject.name}
- Topic: ${lesson.topic.name}
- Content: ${lesson.content}
- Learning Style: ${learningStyle}

Generate visual effects that:
1. Highlight important concepts
2. Create engaging transitions
3. Support learning objectives
4. Are educationally valuable

Return your response as a JSON object with this structure:
{
  "title": "Effect title",
  "effectType": "glow|outline|pulse|transition|highlight",
  "config": {
    "color": "#ff0000",
    "intensity": 1.0,
    "duration": 2.0,
    "easing": "easeInOut"
  },
  "description": "Description of the visual effect",
  "learningObjectives": ["Objective 1", "Objective 2"],
  "educationalValue": "How this effect helps learning"
}`;

  const userPrompt = `Generate visual effects for the lesson: ${lesson.title}

Effect Type: ${effectType}
Parameters: ${JSON.stringify(parameters)}

Create visual effects that enhance the learning experience and highlight key concepts.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
  });

  const generatedContent = response.choices[0]?.message?.content ?? "";
  
  try {
    return JSON.parse(generatedContent);
  } catch (parseError) {
    console.error('Error parsing visual effects content:', parseError);
    // Return fallback content
    return {
      title: `${lesson.title} - Visual Effects`,
      effectType: 'glow',
      config: {
        color: '#00ff00',
        intensity: 1.0,
        duration: 2.0,
        easing: 'easeInOut'
      },
      description: `Visual effects for ${lesson.title}`,
      learningObjectives: ['Highlight key concepts', 'Enhance visual learning'],
      educationalValue: 'Draws attention to important information'
    };
  }
}

// Calculate content quality score
function calculateContentQuality(content: any): number {
  let score = 0.5; // Base score

  // Check for required fields
  if (content.title) score += 0.1;
  if (content.description) score += 0.1;
  if (content.learningObjectives && content.learningObjectives.length > 0) score += 0.1;
  if (content.config) score += 0.1;
  if (content.interactions && content.interactions.length > 0) score += 0.1;

  // Check for educational value
  if (content.educationalValue) score += 0.1;

  return Math.min(1.0, score);
}
