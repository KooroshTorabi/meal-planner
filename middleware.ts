import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { verifyAccessToken, verifyPayloadToken } from '@/lib/auth/tokens'

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

  console.log(`[Middleware] Checking ${pathname}, accessToken exists: ${!!accessToken}`)

  // If no token, redirect to login
  if (!accessToken) {
    console.log(`[Middleware] No token found, redirecting ${pathname} to /login`)
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Token exists, allow the request
  // If accessing admin routes, enforce admin role
  if (pathname.startsWith('/admin')) {
    let role: string | undefined
    let userId: string | undefined

    // Try custom accessToken first
    const accessTokenPayload = accessToken ? verifyAccessToken(accessToken) : null
    console.log(`[Middleware] verifyAccessToken result:`, accessTokenPayload)
    if (accessTokenPayload?.role) {
      role = accessTokenPayload.role
      userId = accessTokenPayload.id
    }

    // If verification failed, try decode without verification (for expired but valid tokens)
    if (!accessTokenPayload && accessToken) {
      try {
        const decoded = jwt.decode(accessToken) as { role?: string; id?: string | number } | null
        console.log(`[Middleware] jwt.decode result:`, decoded)
        if (decoded?.id) {
          userId = String(decoded.id)
          role = decoded.role
        }
      } catch {
        // ignore decode errors
      }
    }

    // If we have userId but no role (Payload CMS token), fetch user from DB
    if (userId && !role) {
      // For Payload tokens, we need to fetch the user to get the role
      // Since middleware can't be async with DB calls efficiently, 
      // we'll allow the request and let the page/API handle auth
      // OR we can check localStorage/session for cached role
      console.log(`[Middleware] Token has userId but no role, allowing request (will be checked by page)`)
      return NextResponse.next()
    }

    // Fallback to payload-token if present
    if (!role) {
      const payloadToken = request.cookies.get('payload-token')?.value
      if (payloadToken) {
        const payloadDecoded = verifyPayloadToken(payloadToken)
        if (payloadDecoded?.role) {
          role = payloadDecoded.role
        }
      }
    }

    console.log(`[Middleware] Admin check for ${pathname}: role=${role}`)

    if (role && role !== 'admin') {
      console.log(`[Middleware] Non-admin (role=${role}) blocked from ${pathname}`)
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

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
