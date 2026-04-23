import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require APPROVED status
const PROTECTED_ROUTES = [
  '/buyer',
  '/seller',
  '/admin',
  '/chatbot',
  '/messages',
  '/profile',
  '/orders',
  '/payment',
  '/export-analytics',
  '/market-analysis',
  '/ai-blend-creator',
  '/analytics-dashboard'
];

// Routes that are public
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/pending',
  '/auth/rejected',
  '/auth/forgot-password',
  '/'
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for public routes
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));

  if (isProtectedRoute) {
    // Get token from cookies or localStorage won't work in middleware
    // We'll need to rely on client-side checks
    // This middleware just allows the request, client-side checks handle redirects
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
