/**
 * Residents Search API Endpoint
 * 
 * GET /api/residents/search
 * 
 * Supports real-time filtering with multiple criteria:
 * - name: Filter by resident name (partial match)
 * - roomNumber: Filter by room number (partial match)
 * - dietaryRestrictions: Filter by dietary restrictions (partial match)
 * - station: Filter by station (partial match)
 * - tableNumber: Filter by table number (partial match)
 * - active: Filter by active status (true/false)
 * - page: Page number for pagination (default: 1)
 * - limit: Number of results per page (default: 50)
 * 
 * Requirements: 15.1, 15.2, 15.3
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { searchResidents, type ResidentSearchFilters } from '@/lib/search'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Extract filter parameters
    const filters: ResidentSearchFilters = {}

    const name = searchParams.get('name')
    if (name) filters.name = name

    const roomNumber = searchParams.get('roomNumber')
    if (roomNumber) filters.roomNumber = roomNumber

    const dietaryRestrictions = searchParams.get('dietaryRestrictions')
    if (dietaryRestrictions) filters.dietaryRestrictions = dietaryRestrictions

    const station = searchParams.get('station')
    if (station) filters.station = station

    const tableNumber = searchParams.get('tableNumber')
    if (tableNumber) filters.tableNumber = tableNumber

    const active = searchParams.get('active')
    if (active !== null) {
      if (active !== 'true' && active !== 'false') {
        return NextResponse.json(
          { error: 'Invalid active value. Must be true or false' },
          { status: 400 }
        )
      }
      filters.active = active === 'true'
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
    const results = await searchResidents(payload, filters, limit, page)

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
    console.error('Error searching residents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
