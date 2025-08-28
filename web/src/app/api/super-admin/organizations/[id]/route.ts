import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { toSerializable } from '@/lib/utils';
import { z } from 'zod';
import { generateSlug, isSlugAvailable, logAuditActivity, getOrganizationUsage } from '@/lib/organization';

const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  domain: z.string().optional(),
  tier: z.enum(['free', 'basic', 'premium', 'enterprise']).optional(),
  isActive: z.boolean().optional(),
  primaryColor: z.string().optional(),
  logoUrl: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if ((session as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        settings: true,
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        },
        documents: {
          select: {
            id: true,
            title: true,
            length: true,
            createdAt: true,
          },
        },
        auditLogs: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get usage statistics
    const usage = await getOrganizationUsage(id);

    return NextResponse.json(toSerializable({
      ...organization,
      usage,
    }));
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if ((session as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const updateData = updateOrganizationSchema.parse(body);

    // Check if organization exists
    const { id } = await params;
    const existingOrg = await prisma.organization.findUnique({
      where: { id },
    });

    if (!existingOrg) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    let dataToUpdate: any = { ...updateData };

    // Handle name change (update slug)
    if (updateData.name && updateData.name !== existingOrg.name) {
      let newSlug = generateSlug(updateData.name);
      let counter = 1;
      while (!(await isSlugAvailable(newSlug, id))) {
        newSlug = `${generateSlug(updateData.name)}-${counter}`;
        counter++;
      }
      dataToUpdate.slug = newSlug;
    }

    // Check domain availability
    if (updateData.domain && updateData.domain !== existingOrg.domain) {
      const existingDomain = await prisma.organization.findFirst({
        where: {
          domain: updateData.domain,
          NOT: { id },
        },
      });
      if (existingDomain) {
        return NextResponse.json(
          { error: 'Domain already in use' },
          { status: 409 }
        );
      }
    }

    // Update organization settings if tier changed
    if (updateData.tier && updateData.tier !== existingOrg.tier) {
      const tierLimits = {
        free: {
          maxUsers: 50,
          maxDocuments: 10,
          maxQuestionsPerMonth: 1000,
          maxStorageBytes: BigInt(1 * 1024 * 1024 * 1024), // 1GB
          evaluationsEnabled: false,
        },
        basic: {
          maxUsers: 100,
          maxDocuments: 50,
          maxQuestionsPerMonth: 5000,
          maxStorageBytes: BigInt(5 * 1024 * 1024 * 1024), // 5GB
          evaluationsEnabled: true,
        },
        premium: {
          maxUsers: 500,
          maxDocuments: 100,
          maxQuestionsPerMonth: 10000,
          maxStorageBytes: BigInt(10 * 1024 * 1024 * 1024), // 10GB
          evaluationsEnabled: true,
        },
        enterprise: {
          maxUsers: 1000,
          maxDocuments: 1000,
          maxQuestionsPerMonth: 100000,
          maxStorageBytes: BigInt(100 * 1024 * 1024 * 1024), // 100GB
          evaluationsEnabled: true,
        },
      };

      const limits = tierLimits[updateData.tier];
      
      // Update organization settings
      await prisma.organizationSettings.update({
        where: { organizationId: id },
        data: limits,
      });
    }

    // Update organization
    const updatedOrganization = await prisma.organization.update({
      where: { id },
      data: dataToUpdate,
      include: {
        settings: true,
      },
    });

    // Log audit activity
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });

    if (user) {
      await logAuditActivity(
        id,
        user.id,
        'organization_updated',
        'organization',
        id,
        updateData,
        request
      );
    }

    return NextResponse.json(updatedOrganization);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if ((session as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    // Check if organization exists
    const { id } = await params;
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            documents: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Log audit activity before deletion
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });

    if (user) {
      await logAuditActivity(
        id,
        user.id,
        'organization_deleted',
        'organization',
        id,
        {
          name: organization.name,
          userCount: organization._count.users,
          documentCount: organization._count.documents,
        },
        request
      );
    }

    // Delete organization (cascade will handle related data)
    await prisma.organization.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
