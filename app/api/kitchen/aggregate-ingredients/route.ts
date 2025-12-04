/**
 * Ingredient Aggregation API Endpoint
 * 
 * GET /api/kitchen/aggregate-ingredients
 * 
 * Accepts date and mealType parameters and returns aggregated ingredient quantities
 * for all meal orders with pending or prepared status.
 * 
 * Requirements: 4.1, 4.2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  aggregateBreakfastIngredients,
  aggregateLunchIngredients,
  aggregateDinnerIngredients,
  type MealOrder,
} from '@/lib/aggregation'

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
    const result = await payload.find({
      collection: 'meal-orders',
      where: {
        and: [
          {
            date: {
              equals: date,
            },
          },
          {
            mealType: {
              equals: mealType,
            },
          },
          {
            or: [
              {
                status: {
                  equals: 'pending',
                },
              },
              {
                status: {
                  equals: 'prepared',
                },
              },
            ],
          },
        ],
      },
      limit: 1000, // Set a reasonable limit
    })

    // Transform the orders to match the MealOrder interface
    const orders: MealOrder[] = result.docs.map((doc: any) => ({
      id: doc.id,
      status: doc.status,
      breakfastOptions: doc.breakfastOptions,
      lunchOptions: doc.lunchOptions,
      dinnerOptions: doc.dinnerOptions,
    }))

    // Aggregate ingredients based on meal type
    let ingredients
    if (mealType === 'breakfast') {
      ingredients = aggregateBreakfastIngredients(orders)
    } else if (mealType === 'lunch') {
      ingredients = aggregateLunchIngredients(orders)
    } else {
      ingredients = aggregateDinnerIngredients(orders)
    }

    // Return the aggregated results
    return NextResponse.json({
      date,
      mealType,
      totalOrders: orders.length,
      ingredients,
    })
  } catch (error) {
    console.error('Error aggregating ingredients:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
