import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createFindingSchema = z.object({
  complianceId: z.string(),
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
  ]),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'minor']),
  wcagCriteria: z.string().min(1),
  description: z.string().min(1),
  location: z.string().min(1),
  impact: z.string().min(1),
  remediation: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'verified', 'closed']).default('open'),
  assignedTo: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const updateFindingSchema = createFindingSchema.partial().omit({ complianceId: true });

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const complianceId = searchParams.get('complianceId');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const findingType = searchParams.get('findingType');
    const assignedTo = searchParams.get('assignedTo');
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

    const where: any = {};

    if (complianceId) {
      where.complianceId = complianceId;
    } else {
      // Filter by organization through compliance
      where.compliance = {
        organizationId: user.organizationId,
      };
    }

    if (status) {
      where.status = status;
    }

    if (severity) {
      where.severity = severity;
    }

    if (findingType) {
      where.findingType = findingType;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    const findings = await prisma.accessibilityFinding.findMany({
      where,
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
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    const total = await prisma.accessibilityFinding.count({ where });

    return NextResponse.json({
      findings,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching accessibility findings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accessibility findings' },
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
    const validatedData = createFindingSchema.parse(body);

    const finding = await prisma.accessibilityFinding.create({
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      },
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

    return NextResponse.json(finding, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating accessibility finding:', error);
    return NextResponse.json(
      { error: 'Failed to create accessibility finding' },
      { status: 500 }
    );
  }
}
