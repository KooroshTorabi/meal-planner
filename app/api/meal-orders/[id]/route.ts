import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

/**
 * PATCH /api/meal-orders/:id
 * Update a meal order with optimistic locking (version checking)
 * Returns both versions on conflict for resolution
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const { id } = params

    // Get the current document to check version
    const currentDoc = await payload.findByID({
      collection: 'meal-orders',
      id,
    })

    if (!currentDoc) {
      return NextResponse.json(
        { error: 'Not found', message: 'Meal order not found' },
        { status: 404 }
      )
    }

    // Check if version is provided and matches
    if (body.version !== undefined && body.version !== currentDoc.version) {
      // Conflict detected - return both versions
      return NextResponse.json(
        {
          error: 'Conflict detected',
          message: 'This meal order has been modified by another user',
          currentVersion: currentDoc,
          yourVersion: body,
        },
        { status: 409 }
      )
    }

    // Attempt to update with version check
    try {
      const updatedDoc = await payload.update({
        collection: 'meal-orders',
        id,
        data: body,
      })

      return NextResponse.json(updatedDoc, { status: 200 })
    } catch (error: any) {
      // Check if this is a version conflict error from the hook
      if (error.message && error.message.includes('Conflict detected')) {
        try {
          const conflictData = JSON.parse(error.message)
          return NextResponse.json(conflictData, { status: 409 })
        } catch {
          // If parsing fails, return generic conflict error
          return NextResponse.json(
            {
              error: 'Conflict detected',
              message: 'This meal order has been modified by another user',
              currentVersion: currentDoc,
              yourVersion: body,
            },
            { status: 409 }
          )
        }
      }
      throw error
    }
  } catch (error: any) {
    console.error('Error updating meal order:', error)
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
 * GET /api/meal-orders/:id
 * Get a specific meal order by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await getPayload({ config })
    const { id } = params

    const doc = await payload.findByID({
      collection: 'meal-orders',
      id,
    })

    if (!doc) {
      return NextResponse.json(
        { error: 'Not found', message: 'Meal order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(doc, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching meal order:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
