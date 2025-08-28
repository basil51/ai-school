import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toSerializable } from '@/lib/utils';
import { z } from 'zod';
import { createOrganization, generateSlug, isSlugAvailable, logAuditActivity } from '@/lib/organization';

const createOrganizationSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  domain: z.string().optional(),
  tier: z.enum(['free', 'basic', 'premium', 'enterprise']).default('free'),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if ((session as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const organizations = await prisma.organization.findMany({
      include: {
        settings: true,
        _count: {
          select: {
            users: true,
            documents: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(toSerializable(organizations));
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if ((session as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, domain, tier } = createOrganizationSchema.parse(body);

    // Generate slug from name
    let slug = generateSlug(name);
    let counter = 1;
    while (!(await isSlugAvailable(slug))) {
      slug = `${generateSlug(name)}-${counter}`;
      counter++;
    }

    // Check if domain is already taken (if provided)
    if (domain) {
      const existingDomain = await prisma.organization.findUnique({
        where: { domain },
      });
      if (existingDomain) {
        return NextResponse.json(
          { error: 'Domain already in use' },
          { status: 409 }
        );
      }
    }

    // Create organization
    const organization = await createOrganization({
      name,
      slug,
      description,
      domain,
      tier,
    });

    // Log audit activity
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });

    if (user) {
      await logAuditActivity(
        organization.id,
        user.id,
        'organization_created',
        'organization',
        organization.id,
        { name, tier, slug },
        request
      );
    }

    // Fetch the organization with _count to match the GET endpoint format
    const organizationWithCount = await prisma.organization.findUnique({
      where: { id: organization.id },
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

    return NextResponse.json(toSerializable(organizationWithCount), { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: (error as any).errors },
        { status: 400 }
      );
    }

    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
