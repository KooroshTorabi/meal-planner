import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import {
  ValidationError,
  NotFoundError,
  withErrorHandler,
  ErrorMessages,
} from '@/lib/errors'
import { startTimer, logInfo } from '@/lib/logging'

/**
 * POST /api/meal-orders
 * Create a new meal order
 * 
 * Validates required fields and handles duplicate order errors
 * Requirements: 2.2, 2.3, 2.5
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const timer = startTimer('Create Meal Order')
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const payload = await getPayload({ config })
  const body = await request.json()

  // Validate required fields
  if (!body.resident) {
    throw new ValidationError(
      ErrorMessages.VALIDATION.REQUIRED_FIELD('resident'),
      'resident'
    )
  }

  if (!body.date) {
    throw new ValidationError(
      ErrorMessages.VALIDATION.REQUIRED_FIELD('date'),
      'date'
    )
  }

  if (!body.mealType) {
    throw new ValidationError(
      ErrorMessages.VALIDATION.REQUIRED_FIELD('meal type'),
      'mealType'
    )
  }

  // Validate meal type
  if (!['breakfast', 'lunch', 'dinner'].includes(body.mealType)) {
    throw new ValidationError(
      ErrorMessages.VALIDATION.INVALID_VALUE('meal type', ['breakfast', 'lunch', 'dinner']),
      'mealType',
      undefined,
      { allowedValues: ['breakfast', 'lunch', 'dinner'] }
    )
  }

  // Validate meal-specific options are provided
  if (body.mealType === 'breakfast' && !body.breakfastOptions) {
    throw new ValidationError(
      ErrorMessages.VALIDATION.MISSING_OPTIONS('breakfast'),
      'breakfastOptions'
    )
  }

  if (body.mealType === 'lunch' && !body.lunchOptions) {
    throw new ValidationError(
      ErrorMessages.VALIDATION.MISSING_OPTIONS('lunch'),
      'lunchOptions'
    )
  }

  if (body.mealType === 'dinner' && !body.dinnerOptions) {
    throw new ValidationError(
      ErrorMessages.VALIDATION.MISSING_OPTIONS('dinner'),
      'dinnerOptions'
    )
  }

  // Check if resident is active
  try {
    const resident = await payload.findByID({
      collection: 'residents',
      id: body.resident,
    })

    if (!resident.active) {
      throw new ValidationError(
        ErrorMessages.VALIDATION.INACTIVE_RESIDENT(),
        'resident',
        undefined,
        { residentId: body.resident }
      )
    }
  } catch (err) {
    if (err instanceof ValidationError) {
      throw err
    }
    throw new NotFoundError(
      ErrorMessages.NOT_FOUND.RESIDENT(),
      'resident',
      body.resident
    )
  }

  // Create the meal order
  const doc = await payload.create({
    collection: 'meal-orders',
    data: body,
  })

  // Log successful creation
  logInfo('Meal order created', {
    orderId: doc.id,
    residentId: body.resident,
    mealType: body.mealType,
    date: body.date,
  }, requestId)

  timer.end()

  return NextResponse.json(doc, { status: 201 })
})

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
export const GET = withErrorHandler(async (request: NextRequest) => {
  const timer = startTimer('Fetch Meal Orders')
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

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

  logInfo('Meal orders fetched', {
    count: result.docs.length,
    page,
    filters: { date, mealType, resident, status },
  }, requestId)

  timer.end()

  return NextResponse.json(result, { status: 200 })
})
