/**
 * POST /api/users/login
 * Authenticate user with email/password and optional 2FA code
 * Returns access token and refresh token
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import bcrypt from 'bcrypt'
import speakeasy from 'speakeasy'
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/tokens'
import {
  isRateLimited,
  recordFailedAttempt,
  resetRateLimit,
  getRemainingAttempts,
  getTimeUntilUnlock,
} from '@/lib/auth/rate-limiter'
import { logAuthAttempt, log2FAVerify } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, twoFactorCode } = body

    // Get client IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Check rate limit
    if (isRateLimited(ip)) {
      const timeUntilUnlock = getTimeUntilUnlock(ip)
      console.warn(`Rate limit exceeded for IP: ${ip}`)
      return NextResponse.json(
        { 
          error: 'Too many failed login attempts. Please try again later.',
          retryAfter: timeUntilUnlock,
        },
        { status: 429 }
      )
    }

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })

    // Find user by email
    const users = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: email,
        },
      },
      limit: 1,
    })

    if (users.docs.length === 0) {
      // Log failed authentication attempt
      console.warn(`Failed login attempt for email: ${email} - User not found`)
      recordFailedAttempt(ip)
      await logAuthAttempt(payload, email, false, request, 'User not found')
      return NextResponse.json(
        { 
          error: 'Invalid credentials',
          remainingAttempts: getRemainingAttempts(ip),
        },
        { status: 401 }
      )
    }

    const user = users.docs[0]

    // Check if user is active
    if (!user.active) {
      console.warn(`Failed login attempt for email: ${email} - User is inactive`)
      recordFailedAttempt(ip)
      await logAuthAttempt(payload, email, false, request, 'Account is inactive')
      return NextResponse.json(
        { 
          error: 'Account is inactive',
          remainingAttempts: getRemainingAttempts(ip),
        },
        { status: 401 }
      )
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      console.warn(`Failed login attempt for email: ${email} - Invalid password`)
      recordFailedAttempt(ip)
      await logAuthAttempt(payload, email, false, request, 'Invalid password')
      return NextResponse.json(
        { 
          error: 'Invalid credentials',
          remainingAttempts: getRemainingAttempts(ip),
        },
        { status: 401 }
      )
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return NextResponse.json(
          { error: '2FA code required', requiresTwoFactor: true },
          { status: 401 }
        )
      }

      if (!user.twoFactorSecret) {
        return NextResponse.json(
          { error: '2FA not properly configured' },
          { status: 500 }
        )
      }

      // Verify 2FA code
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2, // Allow 2 time steps before/after
      })

      if (!verified) {
        console.warn(`Failed login attempt for email: ${email} - Invalid 2FA code`)
        recordFailedAttempt(ip)
        await log2FAVerify(payload, email, false, request, 'Invalid 2FA code')
        return NextResponse.json(
          { 
            error: 'Invalid 2FA code',
            remainingAttempts: getRemainingAttempts(ip),
          },
          { status: 401 }
        )
      }
      
      // Log successful 2FA verification
      await log2FAVerify(payload, email, true, request)
    }

    // Successful login - reset rate limit
    resetRateLimit(ip)

    // Generate tokens
    const accessToken = generateAccessToken({
      id: String(user.id),
      email: user.email,
      role: user.role,
    })

    const refreshTokenData = generateRefreshToken()

    // Store refresh token in user document
    const existingTokens = user.refreshTokens || []
    await payload.update({
      collection: 'users',
      id: String(user.id),
      data: {
        refreshTokens: [
          ...existingTokens,
          refreshTokenData,
        ],
      },
    })

    // Log successful authentication
    await logAuthAttempt(payload, email, true, request)

    return NextResponse.json({
      accessToken,
      refreshToken: refreshTokenData.token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
