import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateCompletionSchema = z.object({
  score: z.number().min(0).max(100).optional(),
  feedback: z.string().optional(),
  certificateUrl: z.string().url().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const completion = await prisma.accessibilityTrainingCompletion.findUnique({
      where: { id },
      include: {
        training: {
          select: {
            id: true,
            title: true,
            trainingType: true,
            difficulty: true,
            duration: true,
            organizationId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!completion) {
      return NextResponse.json({ error: 'Completion not found' }, { status: 404 });
    }

    // Check if user has access to this completion
    if (session.user.role !== 'admin' && 
        session.user.role !== 'super-admin' && 
        completion.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(completion);
  } catch (error) {
    console.error('Error fetching training completion:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training completion' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateCompletionSchema.parse(body);

    // Check if completion exists and user has access
    const completion = await prisma.accessibilityTrainingCompletion.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!completion) {
      return NextResponse.json({ error: 'Completion not found' }, { status: 404 });
    }

    // Check if user has admin role or is the completion owner
    if (session.user.role !== 'admin' && 
        session.user.role !== 'super-admin' && 
        completion.userId !== session.user.id) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const updatedCompletion = await prisma.accessibilityTrainingCompletion.update({
      where: { id },
      data: validatedData,
      include: {
        training: {
          select: {
            id: true,
            title: true,
            trainingType: true,
            difficulty: true,
            duration: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedCompletion);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating training completion:', error);
    return NextResponse.json(
      { error: 'Failed to update training completion' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    if (session.user.role !== 'admin' && session.user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.accessibilityTrainingCompletion.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Completion deleted successfully' });
  } catch (error) {
    console.error('Error deleting training completion:', error);
    return NextResponse.json(
      { error: 'Failed to delete training completion' },
      { status: 500 }
    );
  }
}
