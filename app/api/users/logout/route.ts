/**
 * POST /api/users/logout
 * Invalidate refresh token
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

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
      // Token not found, but we'll return success anyway (idempotent)
      return NextResponse.json({ message: 'Logged out successfully' })
    }

    const user = users.docs[0]

    // Remove the refresh token
    const updatedTokens = user.refreshTokens?.filter((t: any) => t.token !== refreshToken) || []
    await payload.update({
      collection: 'users',
      id: String(user.id),
      data: {
        refreshTokens: updatedTokens,
      },
    })

    return NextResponse.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
