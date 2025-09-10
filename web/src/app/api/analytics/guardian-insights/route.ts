import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const guardianId = searchParams.get('guardianId');
    const studentId = searchParams.get('studentId');
    const isRead = searchParams.get('isRead');
    const priority = searchParams.get('priority');

    // For guardians, guardianId is required and must match their own ID
    if (session.user.role === 'guardian') {
      if (!guardianId || guardianId !== session.user.id) {
        return NextResponse.json({ error: 'Guardian ID is required and must match your own ID' }, { status: 400 });
      }
    }
    // For other roles, guardianId is optional - they can view all insights
    else if (!guardianId) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No guardian ID provided - showing all accessible insights (empty for demo)'
      });
    }

    // Get guardian insights
    const insights = await prisma.guardianInsight.findMany({
      where: {
        guardianId,
        ...(studentId && { studentId }),
        ...(isRead !== null && { isRead: isRead === 'true' }),
        ...(priority && { priority: priority as any })
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { generatedAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: insights
    });

  } catch (error) {
    console.error('Error fetching guardian insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guardian insights' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, insightType, priority = 'MEDIUM' } = body;

    if (!studentId || !insightType) {
      return NextResponse.json({ 
        error: 'Student ID and insight type are required' 
      }, { status: 400 });
    }

    // Check permissions - only admins and teachers can generate insights
    if (!['admin', 'teacher', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get guardian relationships for this student
    const guardianRelationships = await prisma.guardianRelationship.findMany({
      where: {
        studentId,
        status: 'approved'
      },
      include: {
        guardian: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (guardianRelationships.length === 0) {
      return NextResponse.json({ 
        error: 'No approved guardians found for this student' 
      }, { status: 404 });
    }

    // Generate insights for each guardian
    const generatedInsights = [];
    
    for (const relationship of guardianRelationships) {
      const insight = await generateGuardianInsight(
        studentId, 
        relationship.guardian.id, 
        insightType, 
        priority
      );
      
      if (insight) {
        generatedInsights.push(insight);
      }
    }

    return NextResponse.json({
      success: true,
      data: generatedInsights
    });

  } catch (error) {
    console.error('Error generating guardian insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate guardian insights' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { insightId, isRead, actionTaken, actionNotes } = body;

    if (!insightId) {
      return NextResponse.json({ error: 'Insight ID is required' }, { status: 400 });
    }

    // Check permissions
    const insight = await prisma.guardianInsight.findUnique({
      where: { id: insightId }
    });

    if (!insight) {
      return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
    }

    if (session.user.role === 'guardian' && session.user.id !== insight.guardianId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update insight
    const updatedInsight = await prisma.guardianInsight.update({
      where: { id: insightId },
      data: {
        ...(isRead !== undefined && { isRead }),
        ...(actionTaken !== undefined && { actionTaken }),
        ...(actionNotes !== undefined && { actionNotes })
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedInsight
    });

  } catch (error) {
    console.error('Error updating guardian insight:', error);
    return NextResponse.json(
      { error: 'Failed to update guardian insight' },
      { status: 500 }
    );
  }
}

async function generateGuardianInsight(
  studentId: string,
  guardianId: string,
  insightType: string,
  priority: string
) {
  try {
    // Gather comprehensive student data
    const [
      student,
      recentProgress,
      assessmentData,
      learningPatterns,
      performanceKPIs,
      emotionalStates
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }),
      prisma.studentProgress.findMany({
        where: { studentId },
        orderBy: { updatedAt: 'desc' },
        take: 10,
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
        }
      }),
      prisma.assessmentAttempt.findMany({
        where: { studentId },
        orderBy: { startedAt: 'desc' },
        take: 10,
        include: {
          assessment: {
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
            }
          }
        }
      }),
      prisma.learningPattern.findMany({
        where: { studentId }
      }),
      prisma.performanceKPI.findMany({
        where: { studentId },
        orderBy: { startDate: 'desc' },
        take: 5
      }),
      prisma.emotionalState.findMany({
        where: { studentId },
        orderBy: { detectedAt: 'desc' },
        take: 5
      })
    ]);

    if (!student) {
      throw new Error('Student not found');
    }

    // Generate AI-powered insight
    const insightPrompt = `
      Generate a comprehensive guardian insight for ${student.name} based on the following data:

      Student: ${JSON.stringify(student)}
      Recent Progress: ${JSON.stringify(recentProgress)}
      Assessment Data: ${JSON.stringify(assessmentData)}
      Learning Patterns: ${JSON.stringify(learningPatterns)}
      Performance KPIs: ${JSON.stringify(performanceKPIs)}
      Emotional States: ${JSON.stringify(emotionalStates)}

      Insight Type: ${insightType}
      Priority: ${priority}

      Please provide:
      1. A clear, actionable title
      2. A detailed description of what's happening
      3. Specific, actionable recommendations for the guardian
      4. Expected outcomes if recommendations are followed

      Focus on practical, actionable advice that guardians can implement at home.
      Use a supportive, encouraging tone while being honest about challenges.
      Include specific strategies and activities.

      Return as a JSON object with: title, description, recommendations (array of strings)
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational consultant specializing in parent/guardian guidance. Provide clear, actionable insights that help guardians support their child\'s learning at home.'
        },
        {
          role: 'user',
          content: insightPrompt
        }
      ],
      temperature: 0.4,
      max_tokens: 1500
    });

    const insightData = JSON.parse(response.choices[0].message.content || '{}');

    // Create the insight record
    const insight = await prisma.guardianInsight.create({
      data: {
        guardianId,
        studentId,
        insightType: insightType as any,
        title: insightData.title || `${insightType} Insight for ${student.name}`,
        description: insightData.description || 'No description available',
        recommendations: insightData.recommendations || [],
        priority: priority as any,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    });

    return insight;

  } catch (error) {
    console.error('Error generating guardian insight:', error);
    return null;
  }
}
