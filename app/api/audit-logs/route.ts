/**
 * GET /api/audit-logs
 * View audit logs with filtering (Admin only)
 * Supports filtering by user, action, date range
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { verifyAccessToken } from '@/lib/auth/tokens'

export async function GET(request: NextRequest) {
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

    // Get user to verify role
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

    // Only admin can view audit logs
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      )
    }

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')
    const action = searchParams.get('action')
    const status = searchParams.get('status')
    const resource = searchParams.get('resource')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Build query conditions
    const conditions: any[] = []

    if (userId) {
      conditions.push({
        userId: {
          equals: userId,
        },
      })
    }

    if (email) {
      conditions.push({
        email: {
          contains: email,
        },
      })
    }

    if (action) {
      conditions.push({
        action: {
          equals: action,
        },
      })
    }

    if (status) {
      conditions.push({
        status: {
          equals: status,
        },
      })
    }

    if (resource) {
      conditions.push({
        resource: {
          equals: resource,
        },
      })
    }

    if (startDate) {
      conditions.push({
        createdAt: {
          greater_than_equal: new Date(startDate).toISOString(),
        },
      })
    }

    if (endDate) {
      conditions.push({
        createdAt: {
          less_than_equal: new Date(endDate).toISOString(),
        },
      })
    }

    // Query audit logs with filters
    const auditLogs = await payload.find({
      collection: 'audit-logs',
      where: conditions.length > 0 ? { and: conditions } : undefined,
      limit,
      page,
      sort: '-createdAt',
    })

    return NextResponse.json({
      logs: auditLogs.docs,
      totalDocs: auditLogs.totalDocs,
      totalPages: auditLogs.totalPages,
      page: auditLogs.page,
      limit: auditLogs.limit,
      hasNextPage: auditLogs.hasNextPage,
      hasPrevPage: auditLogs.hasPrevPage,
    })
  } catch (error) {
    console.error('Audit logs retrieval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
