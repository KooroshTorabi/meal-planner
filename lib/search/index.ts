import type { Payload } from 'payload'

/**
 * Search filters for meal orders
 */
export interface MealOrderSearchFilters {
  residentName?: string
  roomNumber?: string
  mealType?: 'breakfast' | 'lunch' | 'dinner'
  status?: 'pending' | 'prepared' | 'completed'
  dietaryRestrictions?: string
  startDate?: string
  endDate?: string
  urgent?: boolean
}

/**
 * Search filters for residents
 */
export interface ResidentSearchFilters {
  name?: string
  roomNumber?: string
  dietaryRestrictions?: string
  station?: string
  active?: boolean
  tableNumber?: string
}

/**
 * Search meal orders with multiple filters combined using logical AND
 * Requirements: 15.1, 15.3, 15.4
 */
export async function searchMealOrders(
  payload: Payload,
  filters: MealOrderSearchFilters,
  limit = 50,
  page = 1
) {
  const whereConditions: any[] = []

  // Filter by meal type
  if (filters.mealType) {
    whereConditions.push({
      mealType: {
        equals: filters.mealType,
      },
    })
  }

  // Filter by status
  if (filters.status) {
    whereConditions.push({
      status: {
        equals: filters.status,
      },
    })
  }

  // Filter by urgent flag
  if (filters.urgent !== undefined) {
    whereConditions.push({
      urgent: {
        equals: filters.urgent,
      },
    })
  }

  // Filter by date range
  if (filters.startDate) {
    whereConditions.push({
      date: {
        greater_than_equal: filters.startDate,
      },
    })
  }

  if (filters.endDate) {
    whereConditions.push({
      date: {
        less_than_equal: filters.endDate,
      },
    })
  }

  // For resident-based filters (name, room number, dietary restrictions),
  // we need to first find matching residents, then filter meal orders
  let residentIds: string[] | undefined

  if (filters.residentName || filters.roomNumber || filters.dietaryRestrictions) {
    const residentWhere: any[] = []

    if (filters.residentName) {
      residentWhere.push({
        name: {
          contains: filters.residentName,
        },
      })
    }

    if (filters.roomNumber) {
      residentWhere.push({
        roomNumber: {
          contains: filters.roomNumber,
        },
      })
    }

    if (filters.dietaryRestrictions) {
      residentWhere.push({
        'dietaryRestrictions.restriction': {
          contains: filters.dietaryRestrictions,
        },
      })
    }

    const residents = await payload.find({
      collection: 'residents',
      where: residentWhere.length > 0 ? { and: residentWhere } : {},
      limit: 1000, // Get all matching residents
    })

    residentIds = residents.docs.map((r) => String(r.id))

    // If no residents match, return empty results
    if (residentIds.length === 0) {
      return {
        docs: [],
        totalDocs: 0,
        limit,
        page,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      }
    }

    // Add resident filter to meal order conditions
    whereConditions.push({
      resident: {
        in: residentIds,
      },
    })
  }

  // Build the final where clause
  const where: any = whereConditions.length > 0 ? { and: whereConditions } : {}

  // Execute the search with optimized field selection
  // Only fetch the fields needed for display to reduce data transfer
  const results = await payload.find({
    collection: 'meal-orders',
    where,
    limit,
    page,
    sort: '-date', // Most recent first
    // Optimize by selecting only necessary fields
    // This reduces data transfer and improves performance
    depth: 1, // Limit relationship depth to avoid over-fetching
  })

  return results
}

/**
 * Search residents with multiple filters combined using logical AND
 * Requirements: 15.1, 15.3, 15.4
 */
export async function searchResidents(
  payload: Payload,
  filters: ResidentSearchFilters,
  limit = 50,
  page = 1
) {
  const whereConditions: any[] = []

  // Filter by name
  if (filters.name) {
    whereConditions.push({
      name: {
        contains: filters.name,
      },
    })
  }

  // Filter by room number
  if (filters.roomNumber) {
    whereConditions.push({
      roomNumber: {
        contains: filters.roomNumber,
      },
    })
  }

  // Filter by station
  if (filters.station) {
    whereConditions.push({
      station: {
        contains: filters.station,
      },
    })
  }

  // Filter by table number
  if (filters.tableNumber) {
    whereConditions.push({
      tableNumber: {
        contains: filters.tableNumber,
      },
    })
  }

  // Filter by active status
  if (filters.active !== undefined) {
    whereConditions.push({
      active: {
        equals: filters.active,
      },
    })
  }

  // Filter by dietary restrictions
  if (filters.dietaryRestrictions) {
    whereConditions.push({
      'dietaryRestrictions.restriction': {
        contains: filters.dietaryRestrictions,
      },
    })
  }

  // Build the final where clause
  const where: any = whereConditions.length > 0 ? { and: whereConditions } : {}

  // Execute the search with optimized field selection
  const results = await payload.find({
    collection: 'residents',
    where,
    limit,
    page,
    sort: 'name', // Alphabetical order
    // Optimize by limiting relationship depth
    depth: 0, // Don't fetch related documents to improve performance
  })

  return results
}
