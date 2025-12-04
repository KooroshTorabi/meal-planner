/**
 * Meal Orders Search API Endpoint
 * 
 * GET /api/meal-orders/search
 * 
 * Supports real-time filtering with multiple criteria:
 * - residentName: Filter by resident name (partial match)
 * - roomNumber: Filter by room number (partial match)
 * - mealType: Filter by meal type (breakfast, lunch, dinner)
 * - status: Filter by order status (pending, prepared, completed)
 * - dietaryRestrictions: Filter by dietary restrictions (partial match)
 * - startDate: Filter by start date (inclusive)
 * - endDate: Filter by end date (inclusive)
 * - urgent: Filter by urgent flag (true/false)
 * - page: Page number for pagination (default: 1)
 * - limit: Number of results per page (default: 50)
 * 
 * Requirements: 15.1, 15.2, 15.3
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { searchMealOrders, type MealOrderSearchFilters } from '@/lib/search'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Extract filter parameters
    const filters: MealOrderSearchFilters = {}

    const residentName = searchParams.get('residentName')
    if (residentName) filters.residentName = residentName

    const roomNumber = searchParams.get('roomNumber')
    if (roomNumber) filters.roomNumber = roomNumber

    const mealType = searchParams.get('mealType')
    if (mealType) {
      if (!['breakfast', 'lunch', 'dinner'].includes(mealType)) {
        return NextResponse.json(
          { error: 'Invalid mealType. Must be one of: breakfast, lunch, dinner' },
          { status: 400 }
        )
      }
      filters.mealType = mealType as 'breakfast' | 'lunch' | 'dinner'
    }

    const status = searchParams.get('status')
    if (status) {
      if (!['pending', 'prepared', 'completed'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: pending, prepared, completed' },
          { status: 400 }
        )
      }
      filters.status = status as 'pending' | 'prepared' | 'completed'
    }

    const dietaryRestrictions = searchParams.get('dietaryRestrictions')
    if (dietaryRestrictions) filters.dietaryRestrictions = dietaryRestrictions

    const startDate = searchParams.get('startDate')
    if (startDate) {
      const dateObj = new Date(startDate)
      if (isNaN(dateObj.getTime())) {
        return NextResponse.json(
          { error: 'Invalid startDate format. Expected ISO date string (YYYY-MM-DD)' },
          { status: 400 }
        )
      }
      filters.startDate = startDate
    }

    const endDate = searchParams.get('endDate')
    if (endDate) {
      const dateObj = new Date(endDate)
      if (isNaN(dateObj.getTime())) {
        return NextResponse.json(
          { error: 'Invalid endDate format. Expected ISO date string (YYYY-MM-DD)' },
          { status: 400 }
        )
      }
      filters.endDate = endDate
    }

    const urgent = searchParams.get('urgent')
    if (urgent !== null) {
      if (urgent !== 'true' && urgent !== 'false') {
        return NextResponse.json(
          { error: 'Invalid urgent value. Must be true or false' },
          { status: 400 }
        )
      }
      filters.urgent = urgent === 'true'
    }

    // Extract pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    if (page < 1) {
      return NextResponse.json(
        { error: 'Invalid page number. Must be >= 1' },
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit. Must be between 1 and 100' },
        { status: 400 }
      )
    }

    // Get Payload instance
    const payload = await getPayload({ config })

    // Execute search
    const results = await searchMealOrders(payload, filters, limit, page)

    // Return results
    return NextResponse.json({
      docs: results.docs,
      totalDocs: results.totalDocs,
      limit: results.limit,
      page: results.page,
      totalPages: results.totalPages,
      hasNextPage: results.hasNextPage,
      hasPrevPage: results.hasPrevPage,
      filters: filters, // Echo back the applied filters
    })
  } catch (error) {
    console.error('Error searching meal orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
