import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createComplianceSchema = z.object({
  complianceLevel: z.enum(['A', 'AA', 'AAA']),
  wcagLevel: z.enum(['A', 'AA', 'AAA']),
  overallScore: z.number().min(0).max(100),
  status: z.enum(['pending', 'in_progress', 'compliant', 'non_compliant', 'needs_review']),
  auditScope: z.string().min(1),
  remediationPlan: z.string().optional(),
  nextAuditDate: z.string().datetime().optional(),
});

const updateComplianceSchema = createComplianceSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'User not associated with organization' }, { status: 400 });
    }

    const where: any = {
      organizationId: organizationId || user.organizationId,
    };

    if (status) {
      where.status = status;
    }

    const compliance = await prisma.accessibilityCompliance.findMany({
      where,
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
      orderBy: { auditDate: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.accessibilityCompliance.count({ where });

    return NextResponse.json({
      compliance,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching accessibility compliance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accessibility compliance' },
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

    // Check if user has admin role
    if (session.user.role !== 'admin' && session.user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createComplianceSchema.parse(body);

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'User not associated with organization' }, { status: 400 });
    }

    const compliance = await prisma.accessibilityCompliance.create({
      data: {
        ...validatedData,
        organizationId: user.organizationId,
        auditorId: session.user.id,
        nextAuditDate: validatedData.nextAuditDate ? new Date(validatedData.nextAuditDate) : null,
      },
      include: {
        auditor: {
          select: {
            id: true,
            name: true,
            email: true,
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

    return NextResponse.json(compliance, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating accessibility compliance:', error);
    return NextResponse.json(
      { error: 'Failed to create accessibility compliance' },
      { status: 500 }
    );
  }
}
