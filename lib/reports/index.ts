/**
 * Report Generation Service
 * 
 * This module provides functions to generate reports and analytics for meal orders.
 * It supports filtering by date range, meal type, resident, and status, and can
 * export data in multiple formats (JSON, CSV, Excel).
 * 
 * Requirements: 17.1, 17.2, 17.3
 */

import type { Payload } from 'payload'

/**
 * Report filters for meal orders
 */
export interface ReportFilters {
  startDate?: string
  endDate?: string
  mealType?: 'breakfast' | 'lunch' | 'dinner'
  residentId?: string
  status?: 'pending' | 'prepared' | 'completed'
}

/**
 * Meal order report data
 */
export interface MealOrderReport {
  id: string
  residentName: string
  residentRoom: string
  date: string
  mealType: string
  status: string
  urgent: boolean
  ingredients: string[]
  specialNotes?: string
  preparedAt?: string
  preparedBy?: string
  createdAt: string
}

/**
 * Report summary with aggregated totals
 */
export interface ReportSummary {
  totalOrders: number
  byMealType: Record<string, number>
  byStatus: Record<string, number>
  byIngredient: Record<string, number>
}

/**
 * Complete report response
 */
export interface ReportResponse {
  data: MealOrderReport[]
  summary: ReportSummary
  filters: ReportFilters
  generatedAt: string
}

/**
 * Generate a meal order report with filtering and aggregation
 * Requirements: 17.1, 17.2
 */
export async function generateMealOrderReport(
  payload: Payload,
  filters: ReportFilters
): Promise<ReportResponse> {
  const whereConditions: any[] = []

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

  // Filter by meal type
  if (filters.mealType) {
    whereConditions.push({
      mealType: {
        equals: filters.mealType,
      },
    })
  }

  // Filter by resident
  if (filters.residentId) {
    whereConditions.push({
      resident: {
        equals: filters.residentId,
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

  // Build the where clause
  const where: any = whereConditions.length > 0 ? { and: whereConditions } : {}

  // Fetch meal orders with all filters applied
  const results = await payload.find({
    collection: 'meal-orders',
    where,
    limit: 10000, // High limit for reports
    sort: '-date',
  })

  // Transform data into report format
  const reportData: MealOrderReport[] = []
  const ingredientCounts: Record<string, number> = {}
  const mealTypeCounts: Record<string, number> = {}
  const statusCounts: Record<string, number> = {}

  for (const order of results.docs) {
    // Get resident information
    const resident = typeof order.resident === 'string'
      ? await payload.findByID({ collection: 'residents', id: order.resident })
      : order.resident

    const residentName = typeof resident === 'object' && resident !== null ? resident.name : 'Unknown'
    const residentRoom = typeof resident === 'object' && resident !== null ? resident.roomNumber : 'N/A'

    // Extract ingredients based on meal type
    const ingredients = extractIngredients(order)

    // Count ingredients for summary
    for (const ingredient of ingredients) {
      ingredientCounts[ingredient] = (ingredientCounts[ingredient] || 0) + 1
    }

    // Get preparedBy user name if available
    let preparedByName: string | undefined
    if (order.preparedBy) {
      const preparedByUser = typeof order.preparedBy === 'string'
        ? await payload.findByID({ collection: 'users', id: order.preparedBy })
        : order.preparedBy
      preparedByName = typeof preparedByUser === 'object' && preparedByUser !== null 
        ? preparedByUser.name 
        : undefined
    }

    reportData.push({
      id: order.id,
      residentName,
      residentRoom,
      date: order.date,
      mealType: order.mealType,
      status: order.status,
      urgent: order.urgent || false,
      ingredients,
      specialNotes: order.specialNotes,
      preparedAt: order.preparedAt,
      preparedBy: preparedByName,
      createdAt: order.createdAt,
    })

    // Count meal types
    mealTypeCounts[order.mealType] = (mealTypeCounts[order.mealType] || 0) + 1

    // Count statuses
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
  }

  // Build summary
  const summary: ReportSummary = {
    totalOrders: reportData.length,
    byMealType: mealTypeCounts,
    byStatus: statusCounts,
    byIngredient: ingredientCounts,
  }

  return {
    data: reportData,
    summary,
    filters,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Extract ingredients from a meal order based on meal type
 */
function extractIngredients(order: any): string[] {
  const ingredients: string[] = []

  if (order.mealType === 'breakfast' && order.breakfastOptions) {
    const opts = order.breakfastOptions
    if (opts.breadItems) ingredients.push(...opts.breadItems)
    if (opts.breadPreparation) ingredients.push(...opts.breadPreparation)
    if (opts.spreads) ingredients.push(...opts.spreads)
    if (opts.porridge) ingredients.push('porridge')
    if (opts.beverages) ingredients.push(...opts.beverages)
    if (opts.additions) ingredients.push(...opts.additions)
  }

  if (order.mealType === 'lunch' && order.lunchOptions) {
    const opts = order.lunchOptions
    if (opts.portionSize) ingredients.push(opts.portionSize)
    if (opts.soup) ingredients.push('soup')
    if (opts.dessert) ingredients.push('dessert')
    if (opts.specialPreparations) ingredients.push(...opts.specialPreparations)
    if (opts.restrictions) ingredients.push(...opts.restrictions)
  }

  if (order.mealType === 'dinner' && order.dinnerOptions) {
    const opts = order.dinnerOptions
    if (opts.breadItems) ingredients.push(...opts.breadItems)
    if (opts.breadPreparation) ingredients.push(...opts.breadPreparation)
    if (opts.spreads) ingredients.push(...opts.spreads)
    if (opts.soup) ingredients.push('soup')
    if (opts.porridge) ingredients.push('porridge')
    if (opts.noFish) ingredients.push('no_fish')
    if (opts.beverages) ingredients.push(...opts.beverages)
    if (opts.additions) ingredients.push(...opts.additions)
  }

  return ingredients
}

/**
 * Export report data to CSV format
 * Requirements: 17.3
 */
export function exportToCSV(report: ReportResponse): string {
  const headers = [
    'ID',
    'Resident Name',
    'Room',
    'Date',
    'Meal Type',
    'Status',
    'Urgent',
    'Ingredients',
    'Special Notes',
    'Prepared At',
    'Prepared By',
    'Created At',
  ]

  const rows = report.data.map(order => [
    order.id,
    order.residentName,
    order.residentRoom,
    order.date,
    order.mealType,
    order.status,
    order.urgent ? 'Yes' : 'No',
    order.ingredients.join('; '),
    order.specialNotes || '',
    order.preparedAt || '',
    order.preparedBy || '',
    order.createdAt,
  ])

  // Escape CSV values
  const escapeCSV = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  const csvLines = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(v => escapeCSV(String(v))).join(',')),
  ]

  return csvLines.join('\n')
}

/**
 * Export report data to Excel-compatible format (CSV with UTF-8 BOM)
 * Requirements: 17.3
 */
export function exportToExcel(report: ReportResponse): string {
  // Excel recognizes UTF-8 CSV files with BOM
  const BOM = '\uFEFF'
  return BOM + exportToCSV(report)
}

/**
 * Calculate ingredient consumption trends over time
 * Requirements: 17.4
 */
export interface IngredientTrend {
  ingredient: string
  dataPoints: Array<{
    date: string
    count: number
  }>
}

export async function calculateIngredientTrends(
  payload: Payload,
  startDate: string,
  endDate: string,
  mealType?: 'breakfast' | 'lunch' | 'dinner'
): Promise<IngredientTrend[]> {
  const whereConditions: any[] = [
    {
      date: {
        greater_than_equal: startDate,
      },
    },
    {
      date: {
        less_than_equal: endDate,
      },
    },
  ]

  if (mealType) {
    whereConditions.push({
      mealType: {
        equals: mealType,
      },
    })
  }

  const results = await payload.find({
    collection: 'meal-orders',
    where: { and: whereConditions },
    limit: 10000,
    sort: 'date',
  })

  // Group orders by date and count ingredients
  const dateIngredientMap: Record<string, Record<string, number>> = {}

  for (const order of results.docs) {
    const orderDate = order.date
    if (!dateIngredientMap[orderDate]) {
      dateIngredientMap[orderDate] = {}
    }

    const ingredients = extractIngredients(order)
    for (const ingredient of ingredients) {
      dateIngredientMap[orderDate][ingredient] = 
        (dateIngredientMap[orderDate][ingredient] || 0) + 1
    }
  }

  // Transform into trend format
  const ingredientSet = new Set<string>()
  for (const dateData of Object.values(dateIngredientMap)) {
    for (const ingredient of Object.keys(dateData)) {
      ingredientSet.add(ingredient)
    }
  }

  const trends: IngredientTrend[] = []
  for (const ingredient of Array.from(ingredientSet)) {
    const dataPoints = Object.entries(dateIngredientMap)
      .map(([date, ingredients]) => ({
        date,
        count: ingredients[ingredient] || 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    trends.push({
      ingredient,
      dataPoints,
    })
  }

  return trends.sort((a, b) => a.ingredient.localeCompare(b.ingredient))
}
