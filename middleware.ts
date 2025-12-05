import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that don't require authentication (exact matches)
const publicRoutes = [
  '/',
  '/login',
  '/favicon.ico',
  '/theme-test',
]

// Public route prefixes (startsWith matches)
const publicPrefixes = [
  '/_next',
  '/api/users/login',
  '/api/users/refresh',
  '/api-docs',
  '/api/swagger.json',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow exact public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Allow public prefixes
  if (publicPrefixes.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  // Check for access token in cookies
  const accessToken = request.cookies.get('accessToken')?.value

  // If no token, redirect to login
  if (!accessToken) {
    console.log(`[Middleware] No token found, redirecting ${pathname} to /login`)
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Token exists, allow the request
  console.log(`[Middleware] Token found, allowing access to ${pathname}`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
