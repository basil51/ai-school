import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export interface TenantContext {
  organizationId: string | null;
  organizationSlug: string | null;
  subdomain: string | null;
  customDomain: string | null;
  isSuperAdmin: boolean;
}

/**
 * Extract organization context from request
 */
export async function getTenantContext(request: NextRequest): Promise<TenantContext> {
  const url = new URL(request.url);
  const hostname = url.hostname;
  
  // Get user session to check for super admin
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isSuperAdmin = token?.role === 'super_admin';

  // Extract subdomain (e.g., demo-school.eduvibe.vip)
  const parts = hostname.split('.');
  const subdomain = parts.length > 2 ? parts[0] : null;
  
  // Check if it's a custom domain (not our main domain)
  const isCustomDomain = !hostname.includes('eduvibe.vip') && !hostname.includes('localhost');
  const customDomain = isCustomDomain ? hostname : null;

  // Organization from URL params (for super admin switching)
  const orgParam = url.searchParams.get('org');

  let organizationId: string | null = null;
  let organizationSlug: string | null = null;

  // Priority order for organization resolution:
  // 1. URL parameter (for super admin switching)
  // 2. Custom domain
  // 3. Subdomain
  
  if (orgParam && isSuperAdmin) {
    organizationId = orgParam;
  } else if (customDomain) {
    // Look up organization by custom domain
    organizationSlug = await getOrganizationByDomain(customDomain);
  } else if (subdomain && subdomain !== 'www') {
    // Look up organization by subdomain
    organizationSlug = subdomain;
  }

  return {
    organizationId,
    organizationSlug,
    subdomain,
    customDomain,
    isSuperAdmin,
  };
}

/**
 * Lookup organization by custom domain
 */
async function getOrganizationByDomain(domain: string): Promise<string | null> {
  try {
    // In a real implementation, this would query the database
    // For now, we'll return null since we don't have database access in middleware
    return null;
  } catch (error) {
    console.error('Error looking up organization by domain:', error);
    return null;
  }
}

/**
 * Tenant isolation middleware
 */
export async function tenantMiddleware(request: NextRequest) {
  const context = await getTenantContext(request);
  const url = new URL(request.url);
  
  // Add tenant context to request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-org-id', context.organizationId || '');
  requestHeaders.set('x-tenant-org-slug', context.organizationSlug || '');
  requestHeaders.set('x-tenant-subdomain', context.subdomain || '');
  requestHeaders.set('x-tenant-custom-domain', context.customDomain || '');
  requestHeaders.set('x-tenant-is-super-admin', context.isSuperAdmin.toString());

  // Handle organization-specific routing
  if (context.organizationSlug && !context.isSuperAdmin) {
    // For non-super admins, ensure they can only access their organization's data
    if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/admin')) {
      // Allow access but ensure organization context is maintained
    }
  }

  // Handle super admin organization switching
  if (context.isSuperAdmin && context.organizationId) {
    // Super admins can access any organization
    requestHeaders.set('x-tenant-target-org', context.organizationId);
  }

  // Custom domain redirects
  if (context.customDomain && context.organizationSlug) {
    // If accessing a custom domain, ensure proper organization context
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
    // Set organization context cookie for client-side access
    response.cookies.set('tenant-org-slug', context.organizationSlug, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    
    return response;
  }

  // Subdomain handling
  if (context.subdomain && context.subdomain !== 'www') {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
    // Set organization context cookie
    response.cookies.set('tenant-org-slug', context.subdomain, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    
    return response;
  }

  // Default response with tenant headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * Extract tenant context from request headers (for API routes)
 */
export function getTenantFromHeaders(request: NextRequest): TenantContext {
  return {
    organizationId: request.headers.get('x-tenant-org-id') || null,
    organizationSlug: request.headers.get('x-tenant-org-slug') || null,
    subdomain: request.headers.get('x-tenant-subdomain') || null,
    customDomain: request.headers.get('x-tenant-custom-domain') || null,
    isSuperAdmin: request.headers.get('x-tenant-is-super-admin') === 'true',
  };
}

/**
 * Get organization ID from tenant context
 */
export async function resolveOrganizationId(context: TenantContext): Promise<string | null> {
  if (context.organizationId) {
    return context.organizationId;
  }

  if (context.organizationSlug) {
    // This would typically query the database to resolve slug to ID
    // For now, we'll need to handle this in the API routes
    return null;
  }

  return null;
}
