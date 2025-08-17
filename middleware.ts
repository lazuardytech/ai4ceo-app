import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { guestRegex, isDevelopmentEnvironment } from './lib/constants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  // Publicly allowed routes for auth flow and billing
  const allowAuth = pathname.startsWith('/api/auth');
  const allowLoginRegister = pathname === '/login' || pathname === '/register';
  const allowOnboarding = pathname.startsWith('/onboarding');
  const allowBilling = pathname.startsWith('/billing') || pathname.startsWith('/api/billing');
  const allowStatic = pathname.startsWith('/_next') || pathname.startsWith('/public');
  if (allowAuth || allowStatic) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  // Admin route protection: allow only superadmin
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // @ts-ignore role injected into JWT in auth
    if (token.role !== 'superadmin') {
      return new NextResponse('Forbidden', { status: 403 });
    }
    return NextResponse.next();
  }

  // Require authentication for everything except login/register and auth assets
  if (!token) {
    if (allowLoginRegister) {
      return NextResponse.next();
    }
    // unauthenticated -> login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const isGuest = guestRegex.test(token?.email ?? '');

  // Prevent logged-in users from accessing login/register
  if (token && !isGuest && ['/login', '/register'].includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Guests are forced to register
  if (isGuest) {
    if (!allowLoginRegister) {
      return NextResponse.redirect(new URL('/register', request.url));
    }
    return NextResponse.next();
  }

  // If user hasn't completed onboarding (missing name in JWT), send to onboarding
  // token.name is set in auth callbacks from DB user.name
  const missingName = !((token as any).name && String((token as any).name).trim().length > 0);
  if (missingName && !allowOnboarding) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // Require active subscription for general app usage; allow billing and onboarding pages explicitly
  const isGeneralAppPage = !allowBilling && !allowOnboarding && !allowLoginRegister;
  if (isGeneralAppPage) {
    try {
      const url = new URL('/api/billing/status', request.url);
      const res = await fetch(url, {
        headers: { cookie: request.headers.get('cookie') || '' },
      });
      if (res.ok) {
        const data = await res.json();
        if (!data?.hasActiveSubscription) {
          return NextResponse.redirect(new URL('/billing', request.url));
        }
      } else {
        // If status endpoint fails, be conservative and redirect to billing
        return NextResponse.redirect(new URL('/billing', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/billing', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/chat/:id',
    '/api/:path*',
    '/login',
    '/register',
    '/onboarding',
    '/billing',

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    '/images'
  ],
};
