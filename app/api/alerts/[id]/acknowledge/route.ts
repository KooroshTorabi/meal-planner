/**
 * POST /api/alerts/:id/acknowledge
 * Acknowledge an alert and record the acknowledging user and timestamp
 * Requirements: 10.3
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import jwt from 'jsonwebtoken'

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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const alertId = params.id

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

    // Only kitchen staff and admin can acknowledge alerts
    if (user.role !== 'kitchen' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only kitchen staff and administrators can acknowledge alerts' },
        { status: 403 }
      )
    }

    const payload = await getPayload({ config })

    // Check if alert exists
    const alert = await payload.findByID({
      collection: 'alerts',
      id: alertId,
    })

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      )
    }

    // Check if alert is already acknowledged
    if (alert.acknowledged) {
      return NextResponse.json(
        { 
          error: 'Alert already acknowledged',
          acknowledgedBy: alert.acknowledgedBy,
          acknowledgedAt: alert.acknowledgedAt,
        },
        { status: 409 }
      )
    }

    // Update alert with acknowledgment information
    const updatedAlert = await payload.update({
      collection: 'alerts',
      id: alertId,
      data: {
        acknowledged: true,
        acknowledgedBy: user.id,
        acknowledgedAt: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      alert: {
        id: updatedAlert.id,
        acknowledged: updatedAlert.acknowledged,
        acknowledgedBy: updatedAlert.acknowledgedBy,
        acknowledgedAt: updatedAlert.acknowledgedAt,
      },
    })
  } catch (error) {
    console.error('Alert acknowledgment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
