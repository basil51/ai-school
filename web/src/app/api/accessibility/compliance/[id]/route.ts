import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateComplianceSchema = z.object({
  complianceLevel: z.enum(['A', 'AA', 'AAA']).optional(),
  wcagLevel: z.enum(['A', 'AA', 'AAA']).optional(),
  overallScore: z.number().min(0).max(100).optional(),
  status: z.enum(['pending', 'in_progress', 'compliant', 'non_compliant', 'needs_review']).optional(),
  auditScope: z.string().min(1).optional(),
  remediationPlan: z.string().optional(),
  nextAuditDate: z.string().datetime().optional(),
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

    const compliance = await prisma.accessibilityCompliance.findUnique({
      where: { id },
      include: {
        auditor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        findings: {
          include: {
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { severity: 'desc' },
        },
        recommendations: {
          include: {
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { priority: 'desc' },
        },
        _count: {
          select: {
            findings: true,
            recommendations: true,
          },
        },
      },
    });

    if (!compliance) {
      return NextResponse.json({ error: 'Compliance record not found' }, { status: 404 });
    }

    return NextResponse.json(compliance);
  } catch (error) {
    console.error('Error fetching accessibility compliance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accessibility compliance' },
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

    // Check if user has admin role
    if (session.user.role !== 'admin' && session.user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateComplianceSchema.parse(body);

    const updateData: any = { ...validatedData };
    if (validatedData.nextAuditDate) {
      updateData.nextAuditDate = new Date(validatedData.nextAuditDate);
    }

    const compliance = await prisma.accessibilityCompliance.update({
      where: { id },
      data: updateData,
      include: {
        auditor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        findings: {
          include: {
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        recommendations: {
          include: {
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            findings: true,
            recommendations: true,
          },
        },
      },
    });

    return NextResponse.json(compliance);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating accessibility compliance:', error);
    return NextResponse.json(
      { error: 'Failed to update accessibility compliance' },
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

    await prisma.accessibilityCompliance.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Compliance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting accessibility compliance:', error);
    return NextResponse.json(
      { error: 'Failed to delete accessibility compliance' },
      { status: 500 }
    );
  }
}
