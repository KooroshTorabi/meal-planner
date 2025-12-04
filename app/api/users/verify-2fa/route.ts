/**
 * POST /api/users/verify-2fa
 * Verify 2FA code during login (alternative to including in login request)
 * This endpoint can be used for a two-step login flow
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import speakeasy from 'speakeasy'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and 2FA code are required' },
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
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = users.docs[0]

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA is not enabled for this user' },
        { status: 400 }
      )
    }

    // Verify 2FA code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    })

    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid 2FA code' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      verified: true,
      message: '2FA code verified successfully',
    })
  } catch (error) {
    console.error('Verify 2FA error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
