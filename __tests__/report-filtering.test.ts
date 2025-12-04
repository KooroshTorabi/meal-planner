/**
 * Property-Based Tests for Report Filtering and Aggregation
 * 
 * **Feature: meal-planner-system, Property 31: Report filtering and aggregation**
 * **Validates: Requirements 17.1, 17.2**
 * 
 * Property: For any report generation request with date range and filters,
 * the system must return only matching records with correct summary totals
 * for ingredients and meal types
 */

import * as fc from 'fast-check'
import { generateMealOrderReport, type ReportFilters, type ReportResponse } from '../lib/reports'
import type { Payload } from 'payload'

describe('Report Filtering Property Tests', () => {
  // Mock Payload instance for testing
  const createMockPayload = (mockOrders: any[]): Payload => {
    return {
      find: async ({ collection, where, limit, sort }: any) => {
        if (collection !== 'meal-orders') {
          return { docs: [], totalDocs: 0, limit: 0, page: 1, totalPages: 0 }
        }

        let filteredOrders = [...mockOrders]

        // Apply filters
        if (where && where.and) {
          for (const condition of where.and) {
            // Date range filters
            if (condition.date?.greater_than_equal) {
              filteredOrders = filteredOrders.filter(
                order => order.date >= condition.date.greater_than_equal
              )
            }
            if (condition.date?.less_than_equal) {
              filteredOrders = filteredOrders.filter(
                order => order.date <= condition.date.less_than_equal
              )
            }

            // Meal type filter
            if (condition.mealType?.equals) {
              filteredOrders = filteredOrders.filter(
                order => order.mealType === condition.mealType.equals
              )
            }

            // Resident filter
            if (condition.resident?.equals) {
              filteredOrders = filteredOrders.filter(
                order => order.resident === condition.resident.equals
              )
            }

            // Status filter
            if (condition.status?.equals) {
              filteredOrders = filteredOrders.filter(
                order => order.status === condition.status.equals
              )
            }
          }
        }

        return {
          docs: filteredOrders,
          totalDocs: filteredOrders.length,
          limit,
          page: 1,
          totalPages: 1,
        }
      },
      findByID: async ({ collection, id }: any) => {
        if (collection === 'residents') {
          return {
            id,
            name: `Resident ${id}`,
            roomNumber: `Room ${id.slice(0, 3)}`,
          }
        }
        if (collection === 'users') {
          return {
            id,
            name: `User ${id}`,
          }
        }
        return null
      },
    } as any
  }

  // Generators for meal order data
  const dateGenerator = fc.integer({ min: 0, max: 364 }).map(days => {
    const date = new Date('2024-01-01')
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  })

  const breakfastOptionsGenerator = fc.record({
    followsPlan: fc.boolean(),
    breadItems: fc.array(
      fc.constantFrom('brötchen', 'vollkornbrötchen', 'graubrot'),
      { minLength: 0, maxLength: 3 }
    ),
    breadPreparation: fc.array(
      fc.constantFrom('geschnitten', 'geschmiert'),
      { minLength: 0, maxLength: 2 }
    ),
    spreads: fc.array(
      fc.constantFrom('butter', 'margarine', 'konfitüre'),
      { minLength: 0, maxLength: 3 }
    ),
    porridge: fc.boolean(),
    beverages: fc.array(
      fc.constantFrom('kaffee', 'tee', 'milch_heiß'),
      { minLength: 0, maxLength: 2 }
    ),
    additions: fc.array(
      fc.constantFrom('zucker', 'süßstoff'),
      { minLength: 0, maxLength: 2 }
    ),
  })

  const lunchOptionsGenerator = fc.record({
    portionSize: fc.constantFrom('small', 'large', 'vegetarian'),
    soup: fc.boolean(),
    dessert: fc.boolean(),
    specialPreparations: fc.array(
      fc.constantFrom('passierte_kost', 'geschnittenes_fleisch'),
      { minLength: 0, maxLength: 2 }
    ),
    restrictions: fc.array(
      fc.constantFrom('ohne_fisch', 'fingerfood'),
      { minLength: 0, maxLength: 2 }
    ),
  })

  const dinnerOptionsGenerator = fc.record({
    followsPlan: fc.boolean(),
    breadItems: fc.array(
      fc.constantFrom('graubrot', 'vollkornbrot', 'weißbrot'),
      { minLength: 0, maxLength: 3 }
    ),
    breadPreparation: fc.array(
      fc.constantFrom('geschmiert', 'geschnitten'),
      { minLength: 0, maxLength: 2 }
    ),
    spreads: fc.array(
      fc.constantFrom('butter', 'margarine'),
      { minLength: 0, maxLength: 2 }
    ),
    soup: fc.boolean(),
    porridge: fc.boolean(),
    noFish: fc.boolean(),
    beverages: fc.array(
      fc.constantFrom('tee', 'kakao'),
      { minLength: 0, maxLength: 2 }
    ),
    additions: fc.array(
      fc.constantFrom('zucker', 'süßstoff'),
      { minLength: 0, maxLength: 2 }
    ),
  })

  const mealOrderGenerator = fc.constantFrom('breakfast' as const, 'lunch' as const, 'dinner' as const).chain(mealType => {
    return fc.record({
      id: fc.uuid(),
      resident: fc.uuid(),
      date: dateGenerator,
      mealType: fc.constant(mealType),
      status: fc.constantFrom('pending' as const, 'prepared' as const, 'completed' as const),
      urgent: fc.boolean(),
      breakfastOptions: mealType === 'breakfast' ? breakfastOptionsGenerator : fc.constant(undefined),
      lunchOptions: mealType === 'lunch' ? lunchOptionsGenerator : fc.constant(undefined),
      dinnerOptions: mealType === 'dinner' ? dinnerOptionsGenerator : fc.constant(undefined),
      specialNotes: fc.option(fc.string()),
      preparedAt: fc.option(fc.constant(new Date('2024-01-01').toISOString())),
      preparedBy: fc.option(fc.uuid()),
      createdAt: fc.constant(new Date('2024-01-01').toISOString()),
    })
  })

  test('Property 31: Date range filtering returns only orders within range', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(mealOrderGenerator, { minLength: 5, maxLength: 30 }),
        dateGenerator,
        dateGenerator,
        async (orders, startDate, endDate) => {
          // Ensure startDate <= endDate
          const [actualStart, actualEnd] = startDate <= endDate 
            ? [startDate, endDate] 
            : [endDate, startDate]

          const mockPayload = createMockPayload(orders)
          const filters: ReportFilters = {
            startDate: actualStart,
            endDate: actualEnd,
          }

          const report = await generateMealOrderReport(mockPayload, filters)

          // All returned orders must be within the date range
          for (const order of report.data) {
            if (order.date < actualStart || order.date > actualEnd) {
              return false
            }
          }

          // Count how many orders should be in range
          const expectedCount = orders.filter(
            o => o.date >= actualStart && o.date <= actualEnd
          ).length

          return report.data.length === expectedCount
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Property 31: Meal type filtering returns only matching meal types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(mealOrderGenerator, { minLength: 5, maxLength: 30 }),
        fc.constantFrom('breakfast' as const, 'lunch' as const, 'dinner' as const),
        async (orders, mealType) => {
          const mockPayload = createMockPayload(orders)
          const filters: ReportFilters = {
            mealType,
          }

          const report = await generateMealOrderReport(mockPayload, filters)

          // All returned orders must match the meal type
          for (const order of report.data) {
            if (order.mealType !== mealType) {
              return false
            }
          }

          // Count how many orders should match
          const expectedCount = orders.filter(o => o.mealType === mealType).length

          return report.data.length === expectedCount
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Property 31: Status filtering returns only matching statuses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(mealOrderGenerator, { minLength: 5, maxLength: 30 }),
        fc.constantFrom('pending' as const, 'prepared' as const, 'completed' as const),
        async (orders, status) => {
          const mockPayload = createMockPayload(orders)
          const filters: ReportFilters = {
            status,
          }

          const report = await generateMealOrderReport(mockPayload, filters)

          // All returned orders must match the status
          for (const order of report.data) {
            if (order.status !== status) {
              return false
            }
          }

          // Count how many orders should match
          const expectedCount = orders.filter(o => o.status === status).length

          return report.data.length === expectedCount
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Property 31: Resident filtering returns only orders for that resident', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(mealOrderGenerator, { minLength: 5, maxLength: 30 }),
        fc.uuid(),
        async (orders, residentId) => {
          const mockPayload = createMockPayload(orders)
          const filters: ReportFilters = {
            residentId,
          }

          const report = await generateMealOrderReport(mockPayload, filters)

          // All returned orders must be for the specified resident
          // Note: In the report, we don't have direct access to resident ID,
          // but we can check the count matches
          const expectedCount = orders.filter(o => o.resident === residentId).length

          return report.data.length === expectedCount
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Property 31: Combined filters use logical AND', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(mealOrderGenerator, { minLength: 10, maxLength: 40 }),
        dateGenerator,
        dateGenerator,
        fc.constantFrom('breakfast' as const, 'lunch' as const, 'dinner' as const),
        fc.constantFrom('pending' as const, 'prepared' as const, 'completed' as const),
        async (orders, startDate, endDate, mealType, status) => {
          // Ensure startDate <= endDate
          const [actualStart, actualEnd] = startDate <= endDate 
            ? [startDate, endDate] 
            : [endDate, startDate]

          const mockPayload = createMockPayload(orders)
          const filters: ReportFilters = {
            startDate: actualStart,
            endDate: actualEnd,
            mealType,
            status,
          }

          const report = await generateMealOrderReport(mockPayload, filters)

          // All returned orders must match ALL filters
          for (const order of report.data) {
            if (order.date < actualStart || order.date > actualEnd) {
              return false
            }
            if (order.mealType !== mealType) {
              return false
            }
            if (order.status !== status) {
              return false
            }
          }

          // Count how many orders should match all filters
          const expectedCount = orders.filter(
            o => o.date >= actualStart && 
                 o.date <= actualEnd && 
                 o.mealType === mealType && 
                 o.status === status
          ).length

          return report.data.length === expectedCount
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Property 31: Summary totals match filtered data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(mealOrderGenerator, { minLength: 5, maxLength: 30 }),
        async (orders) => {
          const mockPayload = createMockPayload(orders)
          const filters: ReportFilters = {}

          const report = await generateMealOrderReport(mockPayload, filters)

          // Total orders should match data length
          if (report.summary.totalOrders !== report.data.length) {
            return false
          }

          // Count meal types manually
          const mealTypeCounts: Record<string, number> = {}
          for (const order of report.data) {
            mealTypeCounts[order.mealType] = (mealTypeCounts[order.mealType] || 0) + 1
          }

          // Check meal type counts match
          for (const [mealType, count] of Object.entries(mealTypeCounts)) {
            if (report.summary.byMealType[mealType] !== count) {
              return false
            }
          }

          // Count statuses manually
          const statusCounts: Record<string, number> = {}
          for (const order of report.data) {
            statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
          }

          // Check status counts match
          for (const [status, count] of Object.entries(statusCounts)) {
            if (report.summary.byStatus[status] !== count) {
              return false
            }
          }

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Property 31: Ingredient aggregation in summary is correct', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(mealOrderGenerator, { minLength: 5, maxLength: 30 }),
        async (orders) => {
          const mockPayload = createMockPayload(orders)
          const filters: ReportFilters = {}

          const report = await generateMealOrderReport(mockPayload, filters)

          // Manually count ingredients from report data
          const ingredientCounts: Record<string, number> = {}
          for (const order of report.data) {
            for (const ingredient of order.ingredients) {
              ingredientCounts[ingredient] = (ingredientCounts[ingredient] || 0) + 1
            }
          }

          // Check ingredient counts match
          for (const [ingredient, count] of Object.entries(ingredientCounts)) {
            if (report.summary.byIngredient[ingredient] !== count) {
              return false
            }
          }

          // Check no extra ingredients in summary
          for (const ingredient of Object.keys(report.summary.byIngredient)) {
            if (!ingredientCounts[ingredient]) {
              return false
            }
          }

          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})
