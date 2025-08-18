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

  const isLoginOrRegister = pathname === '/login' || pathname === '/register';

  // If unauthenticated, only allow login/register
  if (!session) {
    if (isLoginOrRegister) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If authenticated, keep users away from login/register
  if (isLoginOrRegister && session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Defer all role/onboarding checks to route-level logic (edge-safe)
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
