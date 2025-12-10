import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { logDataModification } from '@/lib/audit'
import { verifyPayloadToken } from '@/lib/auth/tokens'

/**
 * PATCH /api/meal-orders/:id
 * Update a meal order with optimistic locking (version checking)
 * Returns both versions on conflict for resolution
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const { id } = await params

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

      // Log the update to audit logs
      try {
        console.log(`[Audit] Attempting to log data_update for meal order ${id}`)
        
        // Since we can't reliably get user context, log with available info
        // The collection hook should capture proper user info when triggered by Payload
        // This API endpoint logs serves as a secondary audit trail
        const token = request.cookies.get('accessToken')?.value
        
        let userId = 'api-unknown'
        let userEmail = 'api-unknown@system.local'
        
        console.log(`[Audit] Token exists: ${!!token}`)
        
        // Try to decode token to get user info
        if (token) {
          try {
            // First try to just decode without verification to see what's in it
            const jwt = await import('jsonwebtoken')
            const decodedUnverified = jwt.default.decode(token)
            console.log(`[Audit] Unverified decoded token:`, JSON.stringify(decodedUnverified))
            
            // Now try verified decode
            const decoded = verifyPayloadToken(token)
            console.log(`[Audit] Verified decoded token type:`, typeof decoded)
            console.log(`[Audit] Verified decoded token keys:`, decoded ? Object.keys(decoded).join(', ') : 'null')
            console.log(`[Audit] Verified decoded token full:`, JSON.stringify(decoded))
            
            if (decoded) {
              // Payload tokens have structure: { id, collection, email, iat, exp }
              if (decoded.id) {
                userId = String(decoded.id)
                console.log(`[Audit] Extracted userId: ${userId}`)
              }
              if (decoded.email) {
                userEmail = decoded.email
                console.log(`[Audit] Extracted email: ${userEmail}`)
              }
              
              // Fallback: if email not in token, query user by ID
              if (!decoded.email && decoded.id) {
                console.log(`[Audit] Email not in token, querying user by ID...`)
                try {
                  const user = await payload.findByID({
                    collection: 'users',
                    id: decoded.id,
                  })
                  if (user?.email) {
                    userEmail = user.email
                    console.log(`[Audit] Retrieved email from DB: ${userEmail}`)
                  }
                } catch (e) {
                  console.log(`[Audit] Could not fetch user email from DB`)
                }
              }
            } else {
              console.log(`[Audit] ⚠️  Verified token is null, trying unverified data...`)
              // Use unverified data as fallback
              if (decodedUnverified && typeof decodedUnverified === 'object') {
                const unverified = decodedUnverified as any
                if (unverified.id) {
                  userId = String(unverified.id)
                  console.log(`[Audit] Using unverified userId: ${userId}`)
                }
                if (unverified.email) {
                  userEmail = unverified.email
                  console.log(`[Audit] Using unverified email: ${userEmail}`)
                }
              }
            }
          } catch (tokenError) {
            console.log(`[Audit] Could not decode token:`, tokenError instanceof Error ? tokenError.message : String(tokenError))
          }
        } else {
          console.log(`[Audit] ⚠️  No token in cookies`)
        }
        
        console.log(`[Audit] Final values - userId: ${userId}, email: ${userEmail}`)
        
        const auditData = {
          action: 'data_update' as const,
          userId,
          email: userEmail,
          status: 'success' as const,
          resource: 'meal-orders',
          resourceId: id,
          details: {
            mealType: updatedDoc.mealType,
            status: updatedDoc.status,
            urgent: updatedDoc.urgent,
            resident: updatedDoc.resident,
            date: updatedDoc.date,
            source: 'api-endpoint'
          }
        }
        
        console.log(`[Audit] About to save audit log with data:`, JSON.stringify(auditData))
        
        await logDataModification(
          payload,
          'data_update',
          'meal-orders',
          id,
          userId,
          userEmail,
          request,
          {
            mealType: updatedDoc.mealType,
            status: updatedDoc.status,
            urgent: updatedDoc.urgent,
            resident: updatedDoc.resident,
            date: updatedDoc.date,
            source: 'api-endpoint'
          }
        )
        console.log(`[Audit] ✅ Logged data_update for meal order ${id}`)
      } catch (auditError) {
        console.error(`[Audit] ❌ Error during audit logging:`, auditError instanceof Error ? auditError.message : String(auditError))
        console.error(`[Audit] ❌ Full error:`, auditError)
      }

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getPayload({ config })
    const { id } = await params

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

/**
 * DELETE /api/meal-orders/:id
 * Delete a meal order by ID
 * Only allowed for pending orders
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getPayload({ config })
    const { id } = await params

    // Check if order exists and is pending
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

    // Only allow deletion of pending orders
    if (doc.status !== 'pending') {
      return NextResponse.json(
        { 
          error: 'Forbidden', 
          message: 'Only pending orders can be deleted' 
        },
        { status: 403 }
      )
    }

    await payload.delete({
      collection: 'meal-orders',
      id,
    })

    return NextResponse.json(
      { message: 'Meal order deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error deleting meal order:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
