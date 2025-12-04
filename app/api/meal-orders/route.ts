import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

/**
 * POST /api/meal-orders
 * Create a new meal order
 * 
 * Validates required fields and handles duplicate order errors
 * Requirements: 2.2, 2.3, 2.5
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    // Validate required fields
    if (!body.resident) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Resident is required' },
        { status: 400 }
      )
    }

    if (!body.date) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Date is required' },
        { status: 400 }
      )
    }

    if (!body.mealType) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Meal type is required' },
        { status: 400 }
      )
    }

    // Validate meal type
    if (!['breakfast', 'lunch', 'dinner'].includes(body.mealType)) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Invalid meal type' },
        { status: 400 }
      )
    }

    // Validate meal-specific options are provided
    if (body.mealType === 'breakfast' && !body.breakfastOptions) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Breakfast options are required for breakfast orders' },
        { status: 400 }
      )
    }

    if (body.mealType === 'lunch' && !body.lunchOptions) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Lunch options are required for lunch orders' },
        { status: 400 }
      )
    }

    if (body.mealType === 'dinner' && !body.dinnerOptions) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Dinner options are required for dinner orders' },
        { status: 400 }
      )
    }

    // Check if resident is active
    try {
      const resident = await payload.findByID({
        collection: 'residents',
        id: body.resident,
      })

      if (!resident.active) {
        return NextResponse.json(
          { 
            error: 'Validation error', 
            message: 'Cannot create meal orders for inactive residents' 
          },
          { status: 400 }
        )
      }
    } catch (err) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Resident not found' },
        { status: 404 }
      )
    }

    // Attempt to create the meal order
    try {
      const doc = await payload.create({
        collection: 'meal-orders',
        data: body,
      })

      return NextResponse.json(doc, { status: 201 })
    } catch (error: any) {
      // Check if this is a duplicate order error
      if (error.message && error.message.includes('already exists')) {
        return NextResponse.json(
          {
            error: 'Duplicate order',
            message: 'A meal order already exists for this resident, date, and meal type',
          },
          { status: 409 }
        )
      }

      // Check if this is a validation error from hooks
      if (error.message && (
        error.message.includes('must include') ||
        error.message.includes('cannot modify')
      )) {
        return NextResponse.json(
          { error: 'Validation error', message: error.message },
          { status: 400 }
        )
      }

      throw error
    }
  } catch (error: any) {
    console.error('Error creating meal order:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/meal-orders
 * Get meal orders with optional filtering
 * 
 * Query parameters:
 * - date: Filter by date (ISO format)
 * - mealType: Filter by meal type (breakfast, lunch, dinner)
 * - resident: Filter by resident ID
 * - status: Filter by status (pending, prepared, completed)
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const searchParams = request.nextUrl.searchParams

    // Build where clause
    const where: any = { and: [] }

    const date = searchParams.get('date')
    if (date) {
      where.and.push({
        date: {
          equals: date,
        },
      })
    }

    const mealType = searchParams.get('mealType')
    if (mealType) {
      where.and.push({
        mealType: {
          equals: mealType,
        },
      })
    }

    const resident = searchParams.get('resident')
    if (resident) {
      where.and.push({
        resident: {
          equals: resident,
        },
      })
    }

    const status = searchParams.get('status')
    if (status) {
      where.and.push({
        status: {
          equals: status,
        },
      })
    }

    // Get pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Fetch meal orders
    const result = await payload.find({
      collection: 'meal-orders',
      where: where.and.length > 0 ? where : undefined,
      page,
      limit,
      sort: '-createdAt',
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching meal orders:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
