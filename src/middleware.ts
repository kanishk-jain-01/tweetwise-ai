import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (token && pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Allow the request to continue
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes that don't require authentication
        const publicRoutes = [
          '/',
          '/auth/login',
          '/auth/register',
          '/auth/forgot-password',
          '/auth/reset-password',
        ];

        // API routes that don't require authentication
        const publicApiRoutes = ['/api/auth'];

        // Check if the route is public
        if (publicRoutes.includes(pathname)) {
          return true;
        }

        // Check if it's a public API route
        if (publicApiRoutes.some(route => pathname.startsWith(route))) {
          return true;
        }

        // For protected routes, require authentication
        if (
          pathname.startsWith('/dashboard') ||
          pathname.startsWith('/api/tweets') ||
          pathname.startsWith('/api/ai')
        ) {
          return !!token;
        }

        // Default to allowing the request (for static files, etc.)
        return true;
      },
    },
    pages: {
      signIn: '/auth/login',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
