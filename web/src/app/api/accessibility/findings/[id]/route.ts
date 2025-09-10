import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateFindingSchema = z.object({
  findingType: z.enum([
    'keyboard_navigation',
    'screen_reader',
    'color_contrast',
    'text_scaling',
    'focus_management',
    'aria_labels',
    'semantic_html',
    'multimedia_accessibility',
    'form_accessibility',
    'error_handling',
  ]).optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'minor']).optional(),
  wcagCriteria: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  impact: z.string().min(1).optional(),
  remediation: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'verified', 'closed']).optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  verifiedDate: z.string().datetime().optional(),
  notes: z.string().optional(),
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

    const finding = await prisma.accessibilityFinding.findUnique({
      where: { id },
      include: {
        compliance: {
          select: {
            id: true,
            auditDate: true,
            status: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!finding) {
      return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
    }

    return NextResponse.json(finding);
  } catch (error) {
    console.error('Error fetching accessibility finding:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accessibility finding' },
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

    // Check if user has admin role or is assigned to the finding
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateFindingSchema.parse(body);

    // Check if user is assigned to this finding or has admin role
    const finding = await prisma.accessibilityFinding.findUnique({
      where: { id },
      select: { assignedTo: true },
    });

    if (!finding) {
      return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
    }

    if (session.user.role !== 'admin' && 
        session.user.role !== 'super-admin' && 
        finding.assignedTo !== session.user.id) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const updateData: any = { ...validatedData };
    if (validatedData.dueDate) {
      updateData.dueDate = new Date(validatedData.dueDate);
    }
    if (validatedData.verifiedDate) {
      updateData.verifiedDate = new Date(validatedData.verifiedDate);
    }

    const updatedFinding = await prisma.accessibilityFinding.update({
      where: { id },
      data: updateData,
      include: {
        compliance: {
          select: {
            id: true,
            auditDate: true,
            status: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedFinding);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating accessibility finding:', error);
    return NextResponse.json(
      { error: 'Failed to update accessibility finding' },
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

    await prisma.accessibilityFinding.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Finding deleted successfully' });
  } catch (error) {
    console.error('Error deleting accessibility finding:', error);
    return NextResponse.json(
      { error: 'Failed to delete accessibility finding' },
      { status: 500 }
    );
  }
}
