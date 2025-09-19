import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";
import { tenantMiddleware } from "./middleware/tenant";
import { locales } from "./lib/i18n";

// Get the preferred locale from Accept-Language header
function getLocale(request: NextRequest): string {
  // Always default to English
  // Only use Arabic if it's explicitly the first/preferred language
  const acceptLanguage = request.headers.get('accept-language');
  const referer = request.headers.get('referer');
  const pathname = request.nextUrl.pathname;
  
  // Only check for Arabic preference on initial page loads
  if ((!referer || pathname === '/' || pathname === '') && acceptLanguage) {
    // Parse Accept-Language header to get the first language
    const languages = acceptLanguage.split(',').map(lang => lang.split(';')[0].trim());
    const firstLanguage = languages[0];
    
    // Only use Arabic if it's explicitly the first language
    if (firstLanguage === 'ar') {
      return 'ar';
    }
  }
  
  return 'en'; // default to English
}

// Role-based route mapping
const roleBasedRoutes = {
  student: ['/student', '/shared'],
  teacher: ['/teacher', '/shared'],
  admin: ['/admin', '/shared'],
  super_admin: ['/super-admin', '/admin', '/shared'],
  guardian: ['/guardian', '/shared']
};

// Get role-specific dashboard path
function getRoleDashboard(role: string, locale: string): string {
  switch (role) {
    case 'student': return `/${locale}/student`;
    case 'teacher': return `/${locale}/teacher/dashboard`;
    case 'admin': return `/${locale}/admin/dashboard`;
    case 'super_admin': return `/${locale}/super-admin/dashboard`;
    case 'guardian': return `/${locale}/guardian/dashboard`;
    default: return `/${locale}/student`;
  }
}

// Check if user has access to a specific route
function hasRoleAccess(userRole: string, pathname: string): boolean {
  const allowedRoutes = roleBasedRoutes[userRole as keyof typeof roleBasedRoutes] || [];
  return allowedRoutes.some(route => pathname.includes(route));
}

// Combine auth middleware with tenant middleware and locale handling
export default withAuth(
  async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = (request as any).nextauth?.token;
    
    // Check if there is any supported locale in the pathname
    const pathnameHasLocale = locales.some(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    // Skip locale handling for API routes and static files
    if (pathname.startsWith('/api/') || 
        pathname.startsWith('/_next/') || 
        pathname.includes('.')) {
      return await tenantMiddleware(request);
    }

    // Redirect if there is no locale (only for root paths, not for navigation)
    if (!pathnameHasLocale) {
      // Only redirect if this is a root path or initial load
      // Don't redirect for internal navigation
      const isRootPath = pathname === '/' || pathname === '';
      const hasReferer = request.headers.get('referer');
      
      if (isRootPath || !hasReferer) {
        const locale = getLocale(request);
        const newUrl = new URL(`/${locale}${pathname}`, request.url);
        return NextResponse.redirect(newUrl);
      }
    }

    // Extract locale from pathname
    const locale = pathname.split('/')[1];
    
    // Role-based access control for authenticated users
    if (token && token.role) {
      const userRole = token.role as string;
      
      // Handle root dashboard redirects
      if (pathname === `/${locale}/dashboard` || pathname === `/${locale}/dashboard_new`) {
        const roleDashboard = getRoleDashboard(userRole, locale);
        return NextResponse.redirect(new URL(roleDashboard, request.url));
      }
      
      // Check role-based access for protected routes
      if (pathname.includes('/student') || 
          pathname.includes('/teacher') || 
          pathname.includes('/admin') || 
          pathname.includes('/super-admin') ||
          pathname.includes('/guardian')) {
        
        if (!hasRoleAccess(userRole, pathname)) {
          // Redirect to user's appropriate dashboard if they don't have access
          const roleDashboard = getRoleDashboard(userRole, locale);
          return NextResponse.redirect(new URL(roleDashboard, request.url));
        }
      }
    }

    // Apply tenant isolation
    return await tenantMiddleware(request);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Allow public paths
        if (pathname.startsWith('/api/auth') || 
            pathname.includes('/login') ||
            pathname.includes('/unsubscribe-success') ||
            pathname.match(/^\/(en|ar)(\/login)?$/)) {
          return true;
        }

        // Require authentication for protected paths
        if (pathname.includes('/student') || 
            pathname.includes('/teacher') || 
            pathname.includes('/admin') || 
            pathname.includes('/super-admin') ||
            pathname.includes('/guardian') ||
            pathname.includes('/tutor')) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = { 
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next).*)',
    // Skip API routes that don't need locale handling
    '/((?!api/auth).*)',
  ] 
};
