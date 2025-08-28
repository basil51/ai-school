import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { getTenantFromHeaders } from '@/middleware/tenant';
//import { OrganizationTier } from '@prisma/client';

export interface OrganizationContext {
  organizationId: string | null;
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  userId: string;
  userRole: string;
}

/**
 * Get organization context from the current session
 * Optionally use tenant context from middleware
 */
export async function getOrganizationContext(request?: NextRequest): Promise<OrganizationContext | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: {
      id: true,
      role: true,
      organizationId: true,
    },
  });

  if (!user) {
    return null;
  }

  let organizationId = user.organizationId;

  // If tenant middleware is available and user is super admin, use tenant context
  if (request && user.role === 'super_admin') {
    const tenantContext = getTenantFromHeaders(request);
    
    // Resolve organization ID from tenant context
    if (tenantContext.organizationId) {
      organizationId = tenantContext.organizationId;
    } else if (tenantContext.organizationSlug) {
      // Resolve slug to ID
      const org = await prisma.organization.findUnique({
        where: { slug: tenantContext.organizationSlug },
        select: { id: true },
      });
      organizationId = org?.id || null;
    }
  }

  return {
    organizationId,
    isSuperAdmin: user.role === 'super_admin',
    isOrgAdmin: user.role === 'admin',
    userId: user.id,
    userRole: user.role,
  };
}

/**
 * Check if user has permission to access a specific organization
 */
export async function hasOrganizationAccess(
  organizationId: string,
  context?: OrganizationContext
): Promise<boolean> {
  const ctx = context || await getOrganizationContext();
  
  if (!ctx) {
    return false;
  }

  // Super admins can access any organization
  if (ctx.isSuperAdmin) {
    return true;
  }

  // Users can only access their own organization
  return ctx.organizationId === organizationId;
}

/**
 * Get organization by slug or ID
 */
export async function getOrganization(identifier: string) {
  return prisma.organization.findFirst({
    where: {
      OR: [
        { id: identifier },
        { slug: identifier },
        { domain: identifier },
      ],
    },
    include: {
      settings: true,
    },
  });
}

/**
 * Create a new organization with default settings
 */
export async function createOrganization(data: {
  name: string;
  slug: string;
  description?: string;
  domain?: string;
  tier?: 'free' | 'basic' | 'premium' | 'enterprise';
}) {
  const org = await prisma.organization.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      domain: data.domain,
      tier: data.tier || 'free',
      settings: {
        create: {
          // Default settings based on tier
          maxUsers: data.tier === 'enterprise' ? 1000 : data.tier === 'premium' ? 500 : data.tier === 'basic' ? 100 : 50,
          maxDocuments: data.tier === 'enterprise' ? 1000 : data.tier === 'premium' ? 100 : data.tier === 'basic' ? 50 : 10,
          maxQuestionsPerMonth: data.tier === 'enterprise' ? 100000 : data.tier === 'premium' ? 10000 : data.tier === 'basic' ? 5000 : 1000,
          maxStorageBytes: data.tier === 'enterprise' ? BigInt(100 * 1024 * 1024 * 1024) : // 100GB
                          data.tier === 'premium' ? BigInt(10 * 1024 * 1024 * 1024) : // 10GB
                          data.tier === 'basic' ? BigInt(5 * 1024 * 1024 * 1024) : // 5GB
                          BigInt(1 * 1024 * 1024 * 1024), // 1GB
          evaluationsEnabled: data.tier !== 'free',
        },
      },
    },
    include: {
      settings: true,
    },
  });

  return org;
}

/**
 * Get organization usage statistics
 */
export async function getOrganizationUsage(organizationId: string) {
  const [userCount, documentCount, currentMonth] = await Promise.all([
    prisma.user.count({
      where: { organizationId },
    }),
    prisma.ragDocument.count({
      where: { organizationId },
    }),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        monthlyQuestions: true,
        monthlyDocuments: true,
        storageUsed: true,
      },
    }),
  ]);

  return {
    users: userCount,
    documents: documentCount,
    monthlyQuestions: currentMonth?.monthlyQuestions || 0,
    monthlyDocuments: currentMonth?.monthlyDocuments || 0,
    storageUsed: currentMonth?.storageUsed ?? BigInt(0),
  };
}

/**
 * Check if organization has reached limits
 */
export async function checkOrganizationLimits(organizationId: string) {
  const [usage, settings] = await Promise.all([
    getOrganizationUsage(organizationId),
    prisma.organizationSettings.findUnique({
      where: { organizationId },
    }),
  ]);

  if (!settings) {
    return { withinLimits: false, errors: ['Organization settings not found'] };
  }

  const errors: string[] = [];

  if (usage.users >= settings.maxUsers) {
    errors.push('Maximum user limit reached');
  }

  if (usage.documents >= settings.maxDocuments) {
    errors.push('Maximum document limit reached');
  }

  if (usage.monthlyQuestions >= settings.maxQuestionsPerMonth) {
    errors.push('Monthly question limit reached');
  }

  if (usage.storageUsed >= settings.maxStorageBytes) {
    errors.push('Storage limit reached');
  }

  return {
    withinLimits: errors.length === 0,
    errors,
    usage,
    limits: {
      maxUsers: settings.maxUsers,
      maxDocuments: settings.maxDocuments,
      maxQuestionsPerMonth: settings.maxQuestionsPerMonth,
      maxStorageBytes: settings.maxStorageBytes,
    },
  };
}

/**
 * Log audit activity
 */
export async function logAuditActivity(
  organizationId: string | null,
  userId: string | null,
  action: string,
  resource?: string,
  resourceId?: string,
  details?: any,
  request?: NextRequest
) {
  await prisma.auditLog.create({
    data: {
      organizationId,
      userId,
      action,
      resource,
      resourceId,
      details: details ? JSON.parse(JSON.stringify(details)) : null,
      ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || null,
      userAgent: request?.headers.get('user-agent') || null,
    },
  });
}

/**
 * Apply organization filter to Prisma queries
 * This ensures tenant isolation
 */
export function withOrganizationFilter(organizationId: string | null, isSuperAdmin: boolean = false) {
  if (isSuperAdmin) {
    // Super admins can see everything
    return {};
  }

  if (!organizationId) {
    // Users without an organization can only see null organization data
    return { organizationId: null };
  }

  return { organizationId };
}

/**
 * Slug generator utility
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Check if slug is available
 */
export async function isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await prisma.organization.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!existing) {
    return true;
  }

  return excludeId ? existing.id === excludeId : false;
}
