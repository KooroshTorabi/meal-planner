/**
 * POST /api/users/refresh
 * Exchange refresh token for new access token
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { generateAccessToken, isRefreshTokenExpired } from '@/lib/auth/tokens'
import { logTokenRefresh } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })

    // Find user with this refresh token
    const users = await payload.find({
      collection: 'users',
      where: {
        'refreshTokens.token': {
          equals: refreshToken,
        },
      },
      limit: 1,
    })

    if (users.docs.length === 0) {
      await logTokenRefresh(payload, '', '', false, request, 'Invalid refresh token')
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      )
    }

    const user = users.docs[0]

    // Check if user is active
    if (!user.active) {
      await logTokenRefresh(payload, String(user.id), user.email, false, request, 'Account is inactive')
      return NextResponse.json(
        { error: 'Account is inactive' },
        { status: 401 }
      )
    }

    // Find the specific refresh token
    const tokenData = user.refreshTokens?.find((t: any) => t.token === refreshToken)

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      )
    }

    // Check if token is expired
    if (isRefreshTokenExpired(tokenData.expiresAt)) {
      // Remove expired token
      const updatedTokens = user.refreshTokens?.filter((t: any) => t.token !== refreshToken) || []
      await payload.update({
        collection: 'users',
        id: String(user.id),
        data: {
          refreshTokens: updatedTokens,
        },
      })

      await logTokenRefresh(payload, String(user.id), user.email, false, request, 'Refresh token expired')
      return NextResponse.json(
        { error: 'Refresh token expired' },
        { status: 401 }
      )
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      id: String(user.id),
      email: user.email,
      role: user.role,
    })

    // Log successful token refresh
    await logTokenRefresh(payload, String(user.id), user.email, true, request)

    return NextResponse.json({
      accessToken,
    })
  } catch (error) {
    console.error('Refresh token error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
