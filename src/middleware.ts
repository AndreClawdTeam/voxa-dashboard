import { type NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/register'];

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('accessToken')?.value;
  const userRole = request.cookies.get('userRole')?.value;

  // Logado tentando acessar rota pública → redirecionar para dashboard
  if (PUBLIC_PATHS.includes(pathname) && accessToken) {
    const dest = userRole === 'admin' ? '/admin/customers' : '/dashboard';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // /dashboard/* → requer autenticação
  if (pathname.startsWith('/dashboard')) {
    if (!accessToken) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  // /admin/* → requer autenticação + role admin
  if (pathname.startsWith('/admin')) {
    if (!accessToken) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
