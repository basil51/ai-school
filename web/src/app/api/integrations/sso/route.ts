import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSSOIntegrationSchema = z.object({
  ssoType: z.enum([
    'saml',
    'oauth2',
    'openid_connect',
    'ldap',
    'active_directory',
    'google_workspace',
    'microsoft_azure',
    'custom',
  ]),
  ssoName: z.string().min(1),
  entityId: z.string().optional(),
  ssoUrl: z.string().url().optional(),
  certificate: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  redirectUri: z.string().url().optional(),
  scopes: z.array(z.string()).default([]),
  configuration: z.record(z.string(), z.any()),
  autoProvision: z.boolean().default(false),
});

//const updateSSOIntegrationSchema = createSSOIntegrationSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ssoType = searchParams.get('ssoType');
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
      organizationId: user.organizationId,
    };

    if (ssoType) {
      where.ssoType = ssoType;
    }

    if (status) {
      where.status = status;
    }

    const integrations = await prisma.sSOIntegration.findMany({
      where,
      include: {
        _count: {
          select: {
            ssoUsers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.sSOIntegration.count({ where });

    return NextResponse.json({
      integrations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching SSO integrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SSO integrations' },
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
    const validatedData = createSSOIntegrationSchema.parse(body);

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'User not associated with organization' }, { status: 400 });
    }

    const integration = await prisma.sSOIntegration.create({
      data: {
        ...validatedData,
        organizationId: user.organizationId,
        status: 'pending',
      },
      include: {
        _count: {
          select: {
            ssoUsers: true,
          },
        },
      },
    });

    return NextResponse.json(integration, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating SSO integration:', error);
    return NextResponse.json(
      { error: 'Failed to create SSO integration' },
      { status: 500 }
    );
  }
}
