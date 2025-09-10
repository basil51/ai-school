import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const CreateAuditSchema = z.object({
  auditType: z.enum(['adhd_accommodations', 'learning_disabilities', 'cultural_sensitivity', 'language_barriers', 'cognitive_accessibility', 'comprehensive']),
  targetAudience: z.array(z.string()).min(1),
  recommendations: z.string().min(1),
  actionPlan: z.string().min(1),
  followUpDate: z.string().datetime().optional(),
});

const UpdateAuditSchema = CreateAuditSchema.partial().extend({
  id: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'needs_followup', 'archived']).optional(),
  overallScore: z.number().min(0).max(100).optional(),
});

// GET /api/inclusivity/audits - Get all inclusivity audits
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const auditType = searchParams.get('auditType');
    const status = searchParams.get('status');

    const where: any = {};
    
    if (organizationId) {
      where.organizationId = organizationId;
    }
    
    if (auditType) {
      where.auditType = auditType;
    }
    
    if (status) {
      where.status = status;
    }

    const audits = await prisma.inclusivityAudit.findMany({
      where,
      include: {
        auditor: {
          select: { id: true, name: true, email: true }
        },
        organization: {
          select: { id: true, name: true }
        },
        findings: {
          include: {
            implementedByUser: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { severity: 'desc' }
        },
        _count: {
          select: { findings: true }
        }
      },
      orderBy: { auditDate: 'desc' }
    });

    return NextResponse.json({ audits });
  } catch (error) {
    console.error('Error fetching inclusivity audits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/inclusivity/audits - Create new inclusivity audit
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and super_admins can create audits
    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = CreateAuditSchema.parse(body);

    const audit = await prisma.inclusivityAudit.create({
      data: {
        organizationId: (await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { organizationId: true }
        }))?.organizationId || '',
        auditorId: session.user.id,
        auditType: validatedData.auditType,
        targetAudience: validatedData.targetAudience,
        recommendations: validatedData.recommendations,
        actionPlan: validatedData.actionPlan,
        followUpDate: validatedData.followUpDate ? new Date(validatedData.followUpDate) : null,
      },
      include: {
        auditor: {
          select: { id: true, name: true, email: true }
        },
        organization: {
          select: { id: true, name: true }
        },
        findings: true,
        _count: {
          select: { findings: true }
        }
      }
    });

    return NextResponse.json(audit, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Error creating inclusivity audit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/inclusivity/audits - Update inclusivity audit
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = UpdateAuditSchema.parse(body);

    // Check if user has permission to update this audit
    const existingAudit = await prisma.inclusivityAudit.findUnique({
      where: { id: validatedData.id },
      select: { auditorId: true, organizationId: true }
    });

    if (!existingAudit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    // Only the auditor, admins, or super_admins can update
    if (existingAudit.auditorId !== session.user.id && 
        !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: any = { ...validatedData };
    delete updateData.id;

    if (updateData.followUpDate) {
      updateData.followUpDate = new Date(updateData.followUpDate);
    }

    if (updateData.status === 'completed') {
      updateData.completedAt = new Date();
    }

    const audit = await prisma.inclusivityAudit.update({
      where: { id: validatedData.id },
      data: updateData,
      include: {
        auditor: {
          select: { id: true, name: true, email: true }
        },
        organization: {
          select: { id: true, name: true }
        },
        findings: {
          include: {
            implementedByUser: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { severity: 'desc' }
        },
        _count: {
          select: { findings: true }
        }
      }
    });

    return NextResponse.json(audit);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Error updating inclusivity audit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
