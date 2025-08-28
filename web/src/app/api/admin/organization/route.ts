import { NextResponse } from 'next/server';
import { getOrganizationContext } from '@/lib/organization';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const context = await getOrganizationContext();
    
    if (!context || (!context.isOrgAdmin && !context.isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super admins don't have a specific organization context
    if (context.isSuperAdmin && !context.organizationId) {
      return NextResponse.json(null);
    }

    if (!context.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: context.organizationId },
      include: {
        settings: true,
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
