import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";
import { tenantMiddleware } from "./middleware/tenant";
import { locales } from "./lib/i18n";

// Get the preferred locale from Accept-Language header
function getLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage?.includes('ar')) {
    return 'ar';
  }
  return 'en'; // default to English
}

// Combine auth middleware with tenant middleware and locale handling
export default withAuth(
  async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
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

    // Redirect if there is no locale
    if (!pathnameHasLocale) {
      const locale = getLocale(request);
      const newUrl = new URL(`/${locale}${pathname}`, request.url);
      return NextResponse.redirect(newUrl);
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
            pathname.includes('/signin') ||
            pathname.match(/^\/(en|ar)(\/signin)?$/)) {
          return true;
        }

        // Require authentication for protected paths
        if (pathname.includes('/dashboard') || 
            pathname.includes('/admin') || 
            pathname.includes('/super-admin') ||
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
