import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const CreateFindingSchema = z.object({
  auditId: z.string(),
  category: z.enum(['pacing_timing', 'visual_design', 'content_complexity', 'interaction_patterns', 'feedback_mechanisms', 'navigation_structure', 'language_clarity', 'cultural_representation', 'assistive_technology', 'cognitive_load']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  currentState: z.string().min(1),
  recommendedAction: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  estimatedEffort: z.string().optional(),
});

const UpdateFindingSchema = CreateFindingSchema.partial().extend({
  id: z.string(),
  isImplemented: z.boolean().optional(),
});

// GET /api/inclusivity/findings - Get inclusivity findings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const auditId = searchParams.get('auditId');
    const category = searchParams.get('category');
    const severity = searchParams.get('severity');
    const isImplemented = searchParams.get('isImplemented');

    const where: any = {};
    
    if (auditId) {
      where.auditId = auditId;
    }
    
    if (category) {
      where.category = category;
    }
    
    if (severity) {
      where.severity = severity;
    }
    
    if (isImplemented !== null) {
      where.isImplemented = isImplemented === 'true';
    }

    const findings = await prisma.inclusivityFinding.findMany({
      where,
      include: {
        audit: {
          select: { id: true, auditType: true, targetAudience: true }
        },
        implementedByUser: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: [
        { severity: 'desc' },
        { priority: 'desc' }
      ]
    });

    return NextResponse.json({ findings });
  } catch (error) {
    console.error('Error fetching inclusivity findings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/inclusivity/findings - Create new inclusivity finding
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and super_admins can create findings
    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = CreateFindingSchema.parse(body);

    // Verify the audit exists and user has access
    const audit = await prisma.inclusivityAudit.findUnique({
      where: { id: validatedData.auditId },
      select: { auditorId: true, organizationId: true }
    });

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    if (audit.auditorId !== session.user.id && 
        !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const finding = await prisma.inclusivityFinding.create({
      data: {
        auditId: validatedData.auditId,
        category: validatedData.category,
        severity: validatedData.severity,
        title: validatedData.title,
        description: validatedData.description,
        currentState: validatedData.currentState,
        recommendedAction: validatedData.recommendedAction,
        priority: validatedData.priority,
        estimatedEffort: validatedData.estimatedEffort,
      },
      include: {
        audit: {
          select: { id: true, auditType: true, targetAudience: true }
        },
        implementedByUser: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(finding, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Error creating inclusivity finding:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/inclusivity/findings - Update inclusivity finding
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = UpdateFindingSchema.parse(body);

    // Check if finding exists and user has permission
    const existingFinding = await prisma.inclusivityFinding.findUnique({
      where: { id: validatedData.id },
      include: {
        audit: {
          select: { auditorId: true, organizationId: true }
        }
      }
    });

    if (!existingFinding) {
      return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
    }

    // Only the auditor, admins, or super_admins can update
    if (existingFinding.audit.auditorId !== session.user.id && 
        !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: any = { ...validatedData };
    delete updateData.id;

    // If marking as implemented, set the implementation details
    if (updateData.isImplemented === true && !existingFinding.isImplemented) {
      updateData.implementedAt = new Date();
      updateData.implementedBy = session.user.id;
    }

    const finding = await prisma.inclusivityFinding.update({
      where: { id: validatedData.id },
      data: updateData,
      include: {
        audit: {
          select: { id: true, auditType: true, targetAudience: true }
        },
        implementedByUser: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(finding);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Error updating inclusivity finding:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
