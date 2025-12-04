/**
 * Archived Data Retrieval Endpoint
 * GET /api/archived/:collection/:id
 * 
 * Retrieves archived data for a specific document.
 * Requires admin authorization.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { retrieveArchivedData } from '../../../../../lib/retention/archival'

/**
 * GET /api/archived/:collection/:id
 * Retrieve archived data by collection and document ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { collection: string; id: string } }
) {
  try {
    const payload = await getPayload({ config })
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing or invalid authorization token' },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    
    // Verify the token and get user
    let user
    try {
      const jwt = await import('jsonwebtoken')
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as any
      
      // Get user from database
      const userResult = await payload.find({
        collection: 'users',
        where: {
          id: {
            equals: decoded.id,
          },
        },
        limit: 1,
      })
      
      if (userResult.docs.length === 0) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'User not found' },
          { status: 401 }
        )
      }
      
      user = userResult.docs[0]
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired token' },
        { status: 401 }
      )
    }
    
    // Verify admin authorization
    if (user.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Only administrators can access archived data',
        },
        { status: 403 }
      )
    }
    
    const { collection, id } = params
    
    // Validate collection name
    const validCollections = [
      'users',
      'residents',
      'meal-orders',
      'versioned-records',
      'alerts',
    ]
    
    if (!validCollections.includes(collection)) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: `Invalid collection name. Must be one of: ${validCollections.join(', ')}`,
        },
        { status: 400 }
      )
    }
    
    // Retrieve archived data
    const archivedData = await retrieveArchivedData(payload, collection, id)
    
    if (!archivedData) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: `No archived data found for ${collection}/${id}`,
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      collection,
      documentId: id,
      data: archivedData,
      retrievedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Archived Data Retrieval] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An error occurred while retrieving archived data',
      },
      { status: 500 }
    )
  }
}
