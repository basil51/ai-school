import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const CreateFeedbackSchema = z.object({
  feedbackType: z.enum([
    'bug_report',
    'feature_request',
    'improvement_suggestion',
    'general_feedback',
    'usability_issue',
    'accessibility_concern',
    'performance_issue',
    'content_feedback'
  ]),
  category: z.string().min(1).max(100),
  rating: z.number().min(1).max(5).optional(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  context: z.record(z.string(), z.any()).optional(),
  isAnonymous: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
});

const UpdateFeedbackSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'in_review', 'in_progress', 'resolved', 'closed', 'duplicate']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignedTo: z.string().optional(),
  response: z.string().max(5000).optional(),
});

// GET /api/feedback - List feedback
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const feedbackType = searchParams.get('feedbackType');
    const assignedTo = searchParams.get('assignedTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};

    // Regular users can only see their own feedback
    if (['student', 'teacher', 'guardian'].includes(session.user.role)) {
      where.userId = session.user.id;
    } else {
      // Admins can see all feedback with filters
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (feedbackType) where.feedbackType = feedbackType;
      if (assignedTo) where.assignedTo = assignedTo;
    }

    const [feedback, total] = await Promise.all([
      prisma.userFeedback.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          },
          assignedToUser: {
            select: { id: true, name: true, email: true }
          },
          tags: {
            select: { tag: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.userFeedback.count({ where })
    ]);

    return NextResponse.json({
      feedback,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/feedback - Create feedback
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreateFeedbackSchema.parse(body);

    // Create feedback
    const feedback = await prisma.userFeedback.create({
      data: {
        userId: session.user.id,
        feedbackType: validatedData.feedbackType,
        category: validatedData.category,
        rating: validatedData.rating,
        title: validatedData.title,
        description: validatedData.description,
        context: validatedData.context,
        isAnonymous: validatedData.isAnonymous,
        isPublic: validatedData.isPublic,
        tags: validatedData.tags ? {
          create: validatedData.tags.map(tag => ({ tag }))
        } : undefined
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        tags: {
          select: { tag: true }
        }
      }
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Error creating feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/feedback - Update feedback
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = UpdateFeedbackSchema.parse(body);

    // Check if feedback exists
    const existingFeedback = await prisma.userFeedback.findUnique({
      where: { id: validatedData.id },
      select: { id: true, userId: true, status: true }
    });

    if (!existingFeedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    // Check permissions
    const isOwner = existingFeedback.userId === session.user.id;
    const isAdmin = ['admin', 'super_admin'].includes(session.user.role);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Regular users can only update their own feedback status to 'closed'
    if (isOwner && !isAdmin) {
      if (validatedData.status && validatedData.status !== 'closed') {
        return NextResponse.json({ error: 'You can only close your own feedback' }, { status: 403 });
      }
    }

    const updateData: any = {};
    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.priority) updateData.priority = validatedData.priority;
    if (validatedData.assignedTo) updateData.assignedTo = validatedData.assignedTo;
    if (validatedData.response) {
      updateData.response = validatedData.response;
      updateData.respondedAt = new Date();
    }

    const feedback = await prisma.userFeedback.update({
      where: { id: validatedData.id },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        assignedToUser: {
          select: { id: true, name: true, email: true }
        },
        tags: {
          select: { tag: true }
        }
      }
    });

    return NextResponse.json(feedback);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Error updating feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
