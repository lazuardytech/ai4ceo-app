import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = getSessionCookie(request);

  // Allow auth endpoints and static assets to pass through
  const allowAuth = pathname.startsWith('/api/auth');
  const allowStatic =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname.startsWith('/images') ||
    pathname === '/favicon.ico' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt';
  if (allowAuth || allowStatic) {
    return NextResponse.next();
  }

  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

  // If unauthenticated, only allow login/register
  if (!session) {
    if (isAuthPage) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Do not hard-redirect authenticated users away from auth pages in middleware.
  // The auth pages or server routes will decide where to send the user.
  // This avoids redirect loops when cookies are present but sessions are invalid.

  // If authenticated but not onboarded, force onboarding and block other routes
  try {
    const user = (session as any)?.user;
    const isOnboarding = pathname === '/onboarding';
    if (user && user.onboarded === false && !isOnboarding) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  } catch { }

  // Defer other checks to route-level logic
  return NextResponse.next();
}

export const config = {
  // runtime: 'nodejs',
  matcher: [
    '/',
    '/chat/:id',
    '/api/:path*',
    '/login',
    '/register',
    '/onboarding',
    '/billing',
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
