import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

/**
 * POST /api/meal-orders/:id/resolve-conflict
 * Resolve a version conflict by accepting a merged result
 * Creates a versioned record to track the conflict resolution
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const { id } = params

    // Validate that merged data is provided
    if (!body.mergedData) {
      return NextResponse.json(
        {
          error: 'Bad request',
          message: 'Merged data is required for conflict resolution',
        },
        { status: 400 }
      )
    }

    // Get the current document to verify it exists
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

    // Store the previous state before resolution
    const previousState = { ...currentDoc }

    // Update the document with the merged data
    // The version will be automatically incremented by the beforeChange hook
    const resolvedDoc = await payload.update({
      collection: 'meal-orders',
      id,
      data: {
        ...body.mergedData,
        // Ensure we use the current version for the update
        version: currentDoc.version,
      },
    })

    // Create a special versioned record to track the conflict resolution
    // Get the current version count
    const existingVersions = await payload.find({
      collection: 'versioned-records',
      where: {
        and: [
          {
            collectionName: {
              equals: 'meal-orders',
            },
          },
          {
            documentId: {
              equals: id,
            },
          },
        ],
      },
      limit: 1,
      sort: '-version',
    })

    const nextVersion =
      existingVersions.docs.length > 0
        ? (existingVersions.docs[0].version as number) + 1
        : 1

    // Determine which fields were changed in the resolution
    const changedFields: string[] = []
    const fieldsToCheck = [
      'resident',
      'date',
      'mealType',
      'status',
      'urgent',
      'breakfastOptions',
      'lunchOptions',
      'dinnerOptions',
      'specialNotes',
    ]

    for (const field of fieldsToCheck) {
      if (
        JSON.stringify(previousState[field]) !==
        JSON.stringify(body.mergedData[field])
      ) {
        changedFields.push(field)
      }
    }

    // Create a versioned record marking this as a conflict resolution
    await payload.create({
      collection: 'versioned-records',
      data: {
        collectionName: 'meal-orders',
        documentId: id,
        version: nextVersion,
        snapshot: previousState,
        changeType: 'update',
        changedFields: changedFields.map((field) => ({ field })),
        changedBy: body.resolvedBy || null,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Conflict resolved successfully',
        resolvedDocument: resolvedDoc,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error resolving conflict:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
