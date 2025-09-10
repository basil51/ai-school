import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const CreateAuditSchema = z.object({
  pageUrl: z.string().url(),
  auditType: z.enum(['automated', 'manual', 'user_testing', 'expert_review']),
  wcagLevel: z.enum(['A', 'AA', 'AAA']),
  auditData: z.record(z.string(), z.any()),
  issues: z.array(z.object({
    issueType: z.string(),
    severity: z.enum(['minor', 'moderate', 'serious', 'critical']),
    description: z.string(),
    wcagCriteria: z.string(),
    elementSelector: z.string().optional(),
    recommendation: z.string(),
  }))
});

const UpdateIssueSchema = z.object({
  issueId: z.string(),
  isFixed: z.boolean(),
  fixedBy: z.string().optional(),
});

// GET /api/accessibility/audits - List accessibility audits
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and super_admins can view accessibility audits
    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const pageUrl = searchParams.get('pageUrl');
    const auditType = searchParams.get('auditType');
    const wcagLevel = searchParams.get('wcagLevel');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (pageUrl) where.pageUrl = pageUrl;
    if (auditType) where.auditType = auditType;
    if (wcagLevel) where.wcagLevel = wcagLevel;

    const [audits, total] = await Promise.all([
      prisma.accessibilityAudit.findMany({
        where,
        include: {
          auditedByUser: {
            select: { id: true, name: true, email: true }
          },
          issues: {
            select: {
              id: true,
              issueType: true,
              severity: true,
              isFixed: true,
              fixedAt: true
            }
          },
          _count: {
            select: { issues: true }
          }
        },
        orderBy: { auditedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.accessibilityAudit.count({ where })
    ]);

    return NextResponse.json({
      audits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching accessibility audits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/accessibility/audits - Create accessibility audit
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and super_admins can create accessibility audits
    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = CreateAuditSchema.parse(body);

    // Calculate issue counts and score
    const totalIssues = validatedData.issues.length;
    const criticalIssues = validatedData.issues.filter(i => i.severity === 'critical').length;
    const seriousIssues = validatedData.issues.filter(i => i.severity === 'serious').length;
    const moderateIssues = validatedData.issues.filter(i => i.severity === 'moderate').length;
    const minorIssues = validatedData.issues.filter(i => i.severity === 'minor').length;

    // Calculate accessibility score (0-100)
    const score = Math.max(0, 100 - (criticalIssues * 20 + seriousIssues * 10 + moderateIssues * 5 + minorIssues * 1));

    // Generate recommendations
    const recommendations = [];
    if (criticalIssues > 0) {
      recommendations.push('Address critical accessibility issues immediately');
    }
    if (seriousIssues > 0) {
      recommendations.push('Fix serious accessibility barriers');
    }
    if (moderateIssues > 0) {
      recommendations.push('Improve moderate accessibility issues');
    }
    if (minorIssues > 0) {
      recommendations.push('Consider minor accessibility improvements');
    }
    if (score >= 90) {
      recommendations.push('Excellent accessibility compliance');
    } else if (score >= 80) {
      recommendations.push('Good accessibility compliance with room for improvement');
    } else if (score >= 60) {
      recommendations.push('Moderate accessibility compliance - significant improvements needed');
    } else {
      recommendations.push('Poor accessibility compliance - major improvements required');
    }

    const audit = await prisma.accessibilityAudit.create({
      data: {
        pageUrl: validatedData.pageUrl,
        auditType: validatedData.auditType,
        wcagLevel: validatedData.wcagLevel,
        totalIssues,
        criticalIssues,
        seriousIssues,
        moderateIssues,
        minorIssues,
        score,
        recommendations,
        auditData: validatedData.auditData,
        auditedBy: session.user.id,
        issues: {
          create: validatedData.issues.map(issue => ({
            issueType: issue.issueType,
            severity: issue.severity,
            description: issue.description,
            wcagCriteria: issue.wcagCriteria,
            elementSelector: issue.elementSelector,
            recommendation: issue.recommendation,
          }))
        }
      },
      include: {
        auditedByUser: {
          select: { id: true, name: true, email: true }
        },
        issues: true
      }
    });

    return NextResponse.json(audit, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Error creating accessibility audit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/accessibility/audits/issues - Update accessibility issue
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and super_admins can update accessibility issues
    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = UpdateIssueSchema.parse(body);

    const issue = await prisma.accessibilityIssue.update({
      where: { id: validatedData.issueId },
      data: {
        isFixed: validatedData.isFixed,
        fixedAt: validatedData.isFixed ? new Date() : null,
        fixedBy: validatedData.isFixed ? (validatedData.fixedBy || session.user.id) : null,
      },
      include: {
        audit: {
          select: { id: true, pageUrl: true, score: true }
        },
        fixedByUser: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(issue);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Error updating accessibility issue:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
