import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { toSerializable } from '@/lib/utils';
import { neuralPathwayEngine } from '@/lib/adaptive/neural-pathways';
import { predictiveEngine } from '@/lib/adaptive/predictive-engine';
import { contentGenerator } from '@/lib/adaptive/content-generator';

// POST - Generate learning interventions for a student
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session as any).role;
    const userId = (session as any).user?.id;

    const data = await request.json();
    const { 
      studentId, 
      interventionType = 'predictive',
      content,
      subject,
      struggleType 
    } = data;

    // Students can only generate interventions for themselves
    if (userRole === 'student') {
      if (studentId && studentId !== userId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const targetStudentId = userRole === 'student' ? userId : studentId;

    if (!targetStudentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Get student's neural pathways and learning dimensions
    const pathways = await neuralPathwayEngine.getStudentPathways(targetStudentId);
    const dimensions = await neuralPathwayEngine.analyzeLearningDimensions(targetStudentId);

    if (pathways.length === 0) {
      return NextResponse.json({ 
        error: 'No neural pathways found. Please run analysis first.' 
      }, { status: 400 });
    }

    const strongestPathway = pathways.reduce((prev, current) => 
      prev.strength > current.strength ? prev : current
    );

    let intervention;

    switch (interventionType) {
      case 'predictive':
        // Generate proactive intervention
        intervention = await neuralPathwayEngine.predictOptimalApproach(
          targetStudentId, 
          content || 'General learning content', 
          subject || 'General'
        );
        break;

      case 'remedial':
        // Generate alternative explanation for struggling students
        if (!content) {
          return NextResponse.json({ 
            error: 'Content is required for remedial interventions' 
          }, { status: 400 });
        }
        
        const alternativeContent = await contentGenerator.generateAlternativeExplanation(
          content,
          targetStudentId,
          struggleType || 'conceptual',
          strongestPathway,
          dimensions
        );
        
        intervention = {
          id: `remedial_${Date.now()}`,
          studentId: targetStudentId,
          interventionType: 'remedial',
          trigger: 'Student struggling with content',
          approach: 'Alternative explanation with different approach',
          expectedOutcome: 'Improved understanding and confidence',
          confidence: 0.8,
          personalizedContent: alternativeContent.adaptedContent,
          crossDomainConnections: alternativeContent.crossDomainConnections,
          emotionalSupport: alternativeContent.emotionalSupport,
          successMetrics: alternativeContent.successMetrics
        };
        break;

      case 'accelerative':
        // Generate content for advanced students
        if (!content) {
          return NextResponse.json({ 
            error: 'Content is required for accelerative interventions' 
          }, { status: 400 });
        }
        
        const acceleratedContent = await contentGenerator.generatePersonalizedContent(
          targetStudentId,
          content,
          subject || 'General',
          strongestPathway,
          dimensions
        );
        
        intervention = {
          id: `accelerative_${Date.now()}`,
          studentId: targetStudentId,
          interventionType: 'accelerative',
          trigger: 'Student ready for advanced content',
          approach: 'Accelerated learning with advanced concepts',
          expectedOutcome: 'Faster mastery and deeper understanding',
          confidence: 0.7,
          personalizedContent: acceleratedContent.adaptedContent,
          crossDomainConnections: acceleratedContent.crossDomainConnections,
          emotionalSupport: acceleratedContent.emotionalSupport,
          successMetrics: acceleratedContent.successMetrics
        };
        break;

      case 'creative':
        // Generate creative learning approach
        if (!content) {
          return NextResponse.json({ 
            error: 'Content is required for creative interventions' 
          }, { status: 400 });
        }
        
        const creativeContent = await contentGenerator.generatePersonalizedContent(
          targetStudentId,
          content,
          subject || 'General',
          strongestPathway,
          dimensions
        );
        
        intervention = {
          id: `creative_${Date.now()}`,
          studentId: targetStudentId,
          interventionType: 'creative',
          trigger: 'Need for creative engagement',
          approach: 'Creative and artistic learning approach',
          expectedOutcome: 'Increased engagement and creative expression',
          confidence: 0.8,
          personalizedContent: creativeContent.adaptedContent,
          crossDomainConnections: creativeContent.crossDomainConnections,
          emotionalSupport: creativeContent.emotionalSupport,
          successMetrics: creativeContent.successMetrics
        };
        break;

      case 'emotional':
        // Generate emotional support intervention
        intervention = {
          id: `emotional_${Date.now()}`,
          studentId: targetStudentId,
          interventionType: 'emotional',
          trigger: 'Emotional support needed',
          approach: 'Emotional support and confidence building',
          expectedOutcome: 'Improved emotional state and confidence',
          confidence: 0.9,
          personalizedContent: 'Emotional support content will be generated based on current state',
          crossDomainConnections: ['Mindfulness', 'Stress Management', 'Confidence Building'],
          emotionalSupport: 'Personalized emotional support and encouragement',
          successMetrics: ['Improved confidence', 'Reduced stress', 'Increased motivation']
        };
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid intervention type' 
        }, { status: 400 });
    }

    return NextResponse.json({
      intervention: toSerializable(intervention),
      pathway: toSerializable(strongestPathway),
      dimensions: toSerializable(dimensions),
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating intervention:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get existing interventions for a student
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session as any).role;
    const userId = (session as any).user?.id;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    // Students can only view their own interventions
    if (userRole === 'student') {
      if (studentId && studentId !== userId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const targetStudentId = userRole === 'student' ? userId : studentId;

    if (!targetStudentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Get proactive interventions
    const proactiveInterventions = await predictiveEngine.generateProactiveInterventions(targetStudentId);

    return NextResponse.json({
      interventions: toSerializable(proactiveInterventions),
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching interventions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
