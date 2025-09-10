import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const EnrollParticipantSchema = z.object({
  experimentId: z.string(),
  userId: z.string().optional(), // If not provided, uses current user
});

const RecordInteractionSchema = z.object({
  participantId: z.string(),
  interactionType: z.enum([
    'lesson_start',
    'lesson_complete',
    'assessment_start',
    'assessment_complete',
    'content_interaction',
    'navigation_action',
    'feedback_provided',
    'help_requested',
    'session_end'
  ]),
  action: z.string().min(1),
  context: z.record(z.string(), z.any()).optional(),
  duration: z.number().optional(),
  outcome: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// POST /api/ab-testing/participants/enroll - Enroll user in experiment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = EnrollParticipantSchema.parse(body);

    const userId = validatedData.userId || session.user.id;

    // Check if experiment exists and is active
    const experiment = await prisma.aBTestExperiment.findUnique({
      where: { id: validatedData.experimentId },
      include: {
        variants: {
          where: { isActive: true },
          orderBy: { trafficAllocation: 'desc' }
        }
      }
    });

    if (!experiment) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
    }

    if (experiment.status !== 'active' || !experiment.isActive) {
      return NextResponse.json({ error: 'Experiment is not active' }, { status: 400 });
    }

    // Check if user is already enrolled
    const existingParticipant = await prisma.aBTestParticipant.findUnique({
      where: {
        experimentId_userId: {
          experimentId: validatedData.experimentId,
          userId: userId
        }
      }
    });

    if (existingParticipant) {
      return NextResponse.json({ 
        message: 'User already enrolled',
        participant: existingParticipant
      });
    }

    // Check if user matches target audience
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        role: true, 
        organizationId: true,
        studentEnrollments: {
          select: { subject: { select: { name: true } } }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetAudience = experiment.targetAudience as any;
    
    // Check role filter
    if (targetAudience.roles && !targetAudience.roles.includes(user.role)) {
      return NextResponse.json({ error: 'User does not match target audience' }, { status: 400 });
    }

    // Check organization filter
    if (targetAudience.organizations && user.organizationId && 
        !targetAudience.organizations.includes(user.organizationId)) {
      return NextResponse.json({ error: 'User does not match target audience' }, { status: 400 });
    }

    // Check subject filter
    if (targetAudience.subjects) {
      const userSubjects = user.studentEnrollments.map(e => e.subject.name);
      const hasMatchingSubject = targetAudience.subjects.some((subject: string) => 
        userSubjects.includes(subject)
      );
      if (!hasMatchingSubject) {
        return NextResponse.json({ error: 'User does not match target audience' }, { status: 400 });
      }
    }

    // Assign variant based on traffic allocation
    const random = Math.random();
    let cumulativeAllocation = 0;
    let selectedVariant = null;

    for (const variant of experiment.variants) {
      cumulativeAllocation += variant.trafficAllocation;
      if (random <= cumulativeAllocation) {
        selectedVariant = variant;
        break;
      }
    }

    if (!selectedVariant) {
      selectedVariant = experiment.variants[0]; // Fallback to first variant
    }

    // Create participant
    const participant = await prisma.aBTestParticipant.create({
      data: {
        experimentId: validatedData.experimentId,
        variantId: selectedVariant.id,
        userId: userId,
        metadata: {
          enrolledAt: new Date().toISOString(),
          userRole: user.role,
          organizationId: user.organizationId,
          targetAudience: targetAudience
        }
      },
      include: {
        experiment: {
          select: { id: true, name: true, testType: true }
        },
        variant: {
          select: { id: true, name: true, variantType: true, configuration: true }
        },
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    return NextResponse.json(participant, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Error enrolling participant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/ab-testing/participants/interaction - Record interaction
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = RecordInteractionSchema.parse(body);

    // Verify participant exists and user has access
    const participant = await prisma.aBTestParticipant.findUnique({
      where: { id: validatedData.participantId },
      include: {
        user: { select: { id: true } },
        experiment: { select: { id: true, name: true } }
      }
    });

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Check if user has access to this participant
    if (participant.user.id !== session.user.id && !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Record interaction
    const interaction = await prisma.aBTestInteraction.create({
      data: {
        participantId: validatedData.participantId,
        interactionType: validatedData.interactionType,
        action: validatedData.action,
        context: validatedData.context,
        duration: validatedData.duration,
        outcome: validatedData.outcome,
        metadata: validatedData.metadata
      }
    });

    return NextResponse.json(interaction, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Error recording interaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
