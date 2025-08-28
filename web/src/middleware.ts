import { withAuth } from "next-auth/middleware";
import { NextRequest } from "next/server";
import { tenantMiddleware } from "./middleware/tenant";

// Combine auth middleware with tenant middleware
export default withAuth(
  async function middleware(request: NextRequest) {
    // Apply tenant isolation
    return await tenantMiddleware(request);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Allow public paths
        if (pathname.startsWith('/api/auth') || pathname === '/signin') {
          return true;
        }

        // Require authentication for protected paths
        if (pathname.startsWith('/dashboard') || 
            pathname.startsWith('/admin') || 
            pathname.startsWith('/super-admin') ||
            pathname.startsWith('/teacher')) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = { 
  matcher: [
    "/dashboard/:path*", 
    "/admin/:path*", 
    "/super-admin/:path*",
    "/teacher/:path*",
    "/api/admin/:path*",
    "/api/super-admin/:path*"
  ] 
};
