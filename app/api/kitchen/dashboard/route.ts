/**
 * Kitchen Dashboard API Endpoint
 * 
 * GET /api/kitchen/dashboard
 * 
 * Accepts date and mealType parameters and returns:
 * - Summary statistics (total, pending, prepared, completed orders)
 * - Aggregated ingredient quantities
 * - List of meal orders
 * - Active alerts
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  aggregateBreakfastIngredients,
  aggregateLunchIngredients,
  aggregateDinnerIngredients,
  type MealOrder,
  type IngredientSummary,
} from '@/lib/aggregation'

interface DashboardSummary {
  totalOrders: number
  pendingOrders: number
  preparedOrders: number
  completedOrders: number
}

interface DashboardResponse {
  summary: DashboardSummary
  ingredients: IngredientSummary[]
  orders: any[]
  alerts: any[]
}

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

    // Query meal orders for the specified date and meal type
    // Note: Date comparison needs to handle both date strings and timestamps
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const ordersResult = await payload.find({
      collection: 'meal-orders',
      where: {
        and: [
          {
            date: {
              greater_than_equal: startOfDay.toISOString(),
            },
          },
          {
            date: {
              less_than_equal: endOfDay.toISOString(),
            },
          },
          {
            mealType: {
              equals: mealType,
            },
          },
        ],
      },
      limit: 1000,
      depth: 2, // Include resident information
    })

    // Calculate summary statistics
    const summary: DashboardSummary = {
      totalOrders: ordersResult.docs.length,
      pendingOrders: ordersResult.docs.filter((doc: any) => doc.status === 'pending').length,
      preparedOrders: ordersResult.docs.filter((doc: any) => doc.status === 'prepared').length,
      completedOrders: ordersResult.docs.filter((doc: any) => doc.status === 'completed').length,
    }

    // Transform orders for aggregation
    const orders: MealOrder[] = ordersResult.docs.map((doc: any) => ({
      id: doc.id,
      status: doc.status,
      breakfastOptions: doc.breakfastOptions,
      lunchOptions: doc.lunchOptions,
      dinnerOptions: doc.dinnerOptions,
    }))

    // Aggregate ingredients based on meal type
    let ingredients: IngredientSummary[]
    if (mealType === 'breakfast') {
      ingredients = aggregateBreakfastIngredients(orders)
    } else if (mealType === 'lunch') {
      ingredients = aggregateLunchIngredients(orders)
    } else {
      ingredients = aggregateDinnerIngredients(orders)
    }

    // Query active alerts (unacknowledged alerts)
    const alertsResult = await payload.find({
      collection: 'alerts',
      where: {
        acknowledged: {
          equals: false,
        },
      },
      limit: 100,
      sort: '-createdAt',
      depth: 2, // Include meal order and user information
    })

    // Filter alerts to only include those related to orders for this date and meal type
    const relevantAlerts = alertsResult.docs.filter((alert: any) => {
      const mealOrder = alert.mealOrder
      if (typeof mealOrder === 'object' && mealOrder !== null) {
        return mealOrder.date === date && mealOrder.mealType === mealType
      }
      return false
    })

    // Return the dashboard data
    const response: DashboardResponse = {
      summary,
      ingredients,
      orders: ordersResult.docs,
      alerts: relevantAlerts,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching kitchen dashboard data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
