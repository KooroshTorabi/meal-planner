/**
 * POST /api/users/enable-2fa
 * Enable two-factor authentication for a user
 * Returns QR code data and secret for user to scan
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import speakeasy from 'speakeasy'
import { verifyAccessToken } from '@/lib/auth/tokens'
import { log2FAEnable } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    // Get user from access token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const tokenPayload = verifyAccessToken(token)

    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const payload = await getPayload({ config })

    // Get user
    const user = await payload.findByID({
      collection: 'users',
      id: tokenPayload.id,
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Generate 2FA secret
    const secret = speakeasy.generateSecret({
      name: `Meal Planner (${user.email})`,
      issuer: 'Meal Planner System',
    })

    // Update user with 2FA secret and enable 2FA
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        twoFactorSecret: secret.base32,
        twoFactorEnabled: true,
      },
    })

    // Log 2FA enable
    await log2FAEnable(payload, String(user.id), user.email, request)

    return NextResponse.json({
      secret: secret.base32,
      qrCode: secret.otpauth_url,
      message: '2FA enabled successfully. Please scan the QR code with your authenticator app.',
    })
  } catch (error) {
    console.error('Enable 2FA error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
