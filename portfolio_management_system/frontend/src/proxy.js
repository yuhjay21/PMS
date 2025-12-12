import { NextResponse } from 'next/server';

export function proxy(req) {
  const isDashboardPath = req.nextUrl.pathname.startsWith('/dashboard');

  if (!isDashboardPath) {
    return NextResponse.next();
  }

  const hasSession = req.cookies.has('sessionid');

  if (!hasSession) {
    const loginUrl = new URL('/accounts/login', req.url);
    const redirectPath = req.nextUrl.pathname + req.nextUrl.search;

    if (redirectPath) {
        loginUrl.searchParams.set('next', redirectPath);
    }
    
    return NextResponse.redirect(loginUrl);
}

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};