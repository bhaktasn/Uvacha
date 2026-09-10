import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { authDestination } from '@/lib/auth-destination'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes
  const protectedPrefixes = ['/profile', '/dashboard']
  const path = request.nextUrl.pathname
  const isVideoRoute = path.startsWith('/videos')
  const isVideoDetailRoute = /^\/videos\/[^/]+$/.test(path)
  // Outcome screens contain no private account data and must remain reachable if
  // an upload failure was caused by an expired session.
  const isUploadOutcomeRoute = path === '/videos/upload/success' || path === '/videos/upload/error'

  const isProtectedRoute =
    protectedPrefixes.some((prefix) => path.startsWith(prefix)) || (isVideoRoute && !isVideoDetailRoute && !isUploadOutcomeRoute)

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', authDestination(path))
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = authDestination(request.nextUrl.searchParams.get('next'))
    url.search = ''
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
