/**
 * Analytics API Endpoint
 * 
 * GET /api/reports/analytics
 * 
 * Returns ingredient consumption trends over time with visual data for charts.
 * Supports filtering by date range and meal type.
 * 
 * Requirements: 17.1, 17.4
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { calculateIngredientTrends } from '@/lib/reports'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const mealType = searchParams.get('mealType') as 'breakfast' | 'lunch' | 'dinner' | undefined

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required parameters' },
        { status: 400 }
      )
    }

    // Validate date format (basic check)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: 'Dates must be in YYYY-MM-DD format' },
        { status: 400 }
      )
    }

    // Validate meal type if provided
    if (mealType && !['breakfast', 'lunch', 'dinner'].includes(mealType)) {
      return NextResponse.json(
        { error: 'Invalid meal type. Must be breakfast, lunch, or dinner.' },
        { status: 400 }
      )
    }

    // Validate date range
    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'startDate must be before or equal to endDate' },
        { status: 400 }
      )
    }

    // Calculate ingredient trends
    const trends = await calculateIngredientTrends(payload, startDate, endDate, mealType)

    // Return analytics data
    return NextResponse.json({
      startDate,
      endDate,
      mealType: mealType || 'all',
      trends,
      generatedAt: new Date().toISOString(),
    }, { status: 200 })
  } catch (error) {
    console.error('Error generating analytics:', error)
    return NextResponse.json(
      { error: 'Failed to generate analytics', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
