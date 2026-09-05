import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development' && (request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/api/local-admin'))) {
    return new NextResponse('Not found', { status: 404 });
  }
  // Social crawlers and schedule reads must not depend on the auth service.
  if (request.nextUrl.pathname === '/opengraph-image' || request.nextUrl.pathname.startsWith('/api/local-admin') || request.nextUrl.pathname === '/api/competition') return NextResponse.next();
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
