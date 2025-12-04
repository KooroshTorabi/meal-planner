/**
 * Ingredient Aggregation API Endpoint
 * 
 * GET /api/kitchen/aggregate-ingredients
 * 
 * Accepts date and mealType parameters and returns aggregated ingredient quantities
 * for all meal orders with pending or prepared status.
 * 
 * Uses optimized database-level aggregation for improved performance.
 * 
 * Requirements: 4.1, 4.2, NFR-1
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { aggregateIngredientsOptimized } from '@/lib/aggregation/optimized'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date')
    const mealType = searchParams.get('mealType')

    // Validate required parameters
    if (!date) {
      return NextResponse.json(
        { error: 'Missing required parameter: date' },
        { status: 400 }
      )
    }

    if (!mealType) {
      return NextResponse.json(
        { error: 'Missing required parameter: mealType' },
        { status: 400 }
      )
    }

    // Validate mealType
    if (!['breakfast', 'lunch', 'dinner'].includes(mealType)) {
      return NextResponse.json(
        { error: 'Invalid mealType. Must be one of: breakfast, lunch, dinner' },
        { status: 400 }
      )
    }

    // Validate date format (ISO date string)
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected ISO date string (YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    // Get Payload instance
    const payload = await getPayload({ config })

    // Use optimized aggregation with database-level filtering
    const result = await aggregateIngredientsOptimized(payload, {
      date,
      mealType: mealType as 'breakfast' | 'lunch' | 'dinner',
      limit: 1000, // Process up to 1000 orders per page
    })

    // Return the aggregated results
    return NextResponse.json({
      date,
      mealType,
      totalOrders: result.totalOrders,
      ingredients: result.ingredients,
      page: result.page,
      totalPages: result.totalPages,
    })
  } catch (error) {
    console.error('Error aggregating ingredients:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
