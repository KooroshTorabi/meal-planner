/**
 * POST /api/alerts/escalate
 * Manually trigger alert escalation check
 * This endpoint is primarily for testing and manual intervention
 * Requirements: 10.5
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import jwt from 'jsonwebtoken'
import { escalateUnacknowledgedAlerts } from '@/lib/alerts/escalation'

interface JWTPayload {
  id: string
  email: string
  role: string
}

/**
 * Verify JWT token and extract user information
 */
function verifyToken(token: string): JWTPayload | null {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key'
    const decoded = jwt.verify(token, secret) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Only admin can manually trigger escalation
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can trigger alert escalation' },
        { status: 403 }
      )
    }

    const payload = await getPayload({ config })

    // Run escalation
    const escalatedCount = await escalateUnacknowledgedAlerts(payload)

    return NextResponse.json({
      success: true,
      escalatedCount,
      message: `Escalated ${escalatedCount} unacknowledged alerts`,
    })
  } catch (error) {
    console.error('Alert escalation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
