import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { toSerializable } from '@/lib/utils';
import { z } from 'zod';

const updateBrandingSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  logoUrl: z.string().url().optional(),
  customDomain: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if ((session as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const organizationId = params.id;
    const body = await request.json();
    const { primaryColor, logoUrl, customDomain, isActive } = updateBrandingSchema.parse(body);

    // Check if organization exists
    const existingOrg = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!existingOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if custom domain is already taken (if provided)
    if (customDomain && customDomain !== existingOrg.domain) {
      const existingDomain = await prisma.organization.findUnique({
        where: { domain: customDomain },
      });
      if (existingDomain) {
        return NextResponse.json(
          { error: 'Domain already in use' },
          { status: 409 }
        );
      }
    }

    // Update organization
    const updatedOrg = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(primaryColor && { primaryColor }),
        ...(logoUrl && { logoUrl }),
        ...(customDomain !== undefined && { domain: customDomain }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        settings: true,
        _count: {
          select: {
            users: true,
            documents: true,
          },
        },
      },
    });

    // Log audit activity
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });

    if (user) {
      await prisma.auditLog.create({
        data: {
          organizationId,
          userId: user.id,
          action: 'organization_updated',
          resourceType: 'organization',
          resourceId: organizationId,
          details: {
            primaryColor,
            logoUrl,
            customDomain,
            isActive,
          },
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });
    }

    return NextResponse.json(toSerializable(updatedOrg));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating organization branding:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if ((session as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const organizationId = params.id;

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        primaryColor: true,
        logoUrl: true,
        domain: true,
        isActive: true,
        tier: true,
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(toSerializable(organization));
  } catch (error) {
    console.error('Error fetching organization branding:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
