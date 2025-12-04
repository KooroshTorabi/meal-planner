/**
 * Property-Based Tests for Report Export Formats
 * 
 * **Feature: meal-planner-system, Property 32: Report export format validity**
 * **Validates: Requirements 17.3**
 * 
 * Property: For any report export request, the system must generate valid
 * CSV or Excel format output containing all report data
 */

import * as fc from 'fast-check'
import { generateMealOrderReport, exportToCSV, exportToExcel, type ReportResponse } from '../lib/reports'
import type { Payload } from 'payload'

describe('Report Export Format Property Tests', () => {
  // Mock Payload instance for testing
  const createMockPayload = (mockOrders: any[]): Payload => {
    return {
      find: async () => ({
        docs: mockOrders,
        totalDocs: mockOrders.length,
        limit: 10000,
        page: 1,
        totalPages: 1,
      }),
      findByID: async ({ collection, id }: any) => {
        if (collection === 'residents') {
          return {
            id,
            name: `Resident ${id.slice(0, 8)}`,
            roomNumber: `Room ${id.slice(0, 3)}`,
          }
        }
        if (collection === 'users') {
          return {
            id,
            name: `User ${id.slice(0, 8)}`,
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
      specialNotes: fc.option(fc.string({ minLength: 0, maxLength: 50 })),
      preparedAt: fc.option(fc.constant(new Date('2024-01-01').toISOString())),
      preparedBy: fc.option(fc.uuid()),
      createdAt: fc.constant(new Date('2024-01-01').toISOString()),
    })
  })

  test('Property 32: CSV export contains all report data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(mealOrderGenerator, { minLength: 1, maxLength: 20 }),
        async (orders) => {
          const mockPayload = createMockPayload(orders)
          const report = await generateMealOrderReport(mockPayload, {})
          
          const csv = exportToCSV(report)
          
          // CSV should not be empty
          if (csv.length === 0) {
            return false
          }
          
          // CSV should have header row
          const lines = csv.split('\n')
          if (lines.length < 2) { // At least header + 1 data row
            return false
          }
          
          // Header should contain expected columns
          const header = lines[0]
          const requiredColumns = ['ID', 'Resident Name', 'Room', 'Date', 'Meal Type', 'Status']
          for (const col of requiredColumns) {
            if (!header.includes(col)) {
              return false
            }
          }
          
          // Number of data rows should match report data length
          // (lines.length - 1 because of header, but may have trailing newline)
          const dataRows = lines.filter((line, idx) => idx > 0 && line.trim().length > 0)
          if (dataRows.length !== report.data.length) {
            return false
          }
          
          // Each order ID should appear in the CSV
          for (const order of report.data) {
            if (!csv.includes(order.id)) {
              return false
            }
          }
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Property 32: CSV export properly escapes special characters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(mealOrderGenerator, { minLength: 1, maxLength: 10 }),
        async (orders) => {
          const mockPayload = createMockPayload(orders)
          const report = await generateMealOrderReport(mockPayload, {})
          
          const csv = exportToCSV(report)
          
          // CSV should be parseable (basic check - no unmatched quotes)
          const lines = csv.split('\n')
          for (const line of lines) {
            // Count quotes - should be even number
            const quoteCount = (line.match(/"/g) || []).length
            if (quoteCount % 2 !== 0) {
              return false
            }
          }
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Property 32: Excel export includes UTF-8 BOM', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(mealOrderGenerator, { minLength: 1, maxLength: 20 }),
        async (orders) => {
          const mockPayload = createMockPayload(orders)
          const report = await generateMealOrderReport(mockPayload, {})
          
          const excel = exportToExcel(report)
          
          // Excel format should start with UTF-8 BOM
          if (!excel.startsWith('\uFEFF')) {
            return false
          }
          
          // Rest should be valid CSV
          const csvPart = excel.substring(1)
          const lines = csvPart.split('\n')
          if (lines.length < 2) {
            return false
          }
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Property 32: CSV and Excel exports contain same data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(mealOrderGenerator, { minLength: 1, maxLength: 20 }),
        async (orders) => {
          const mockPayload = createMockPayload(orders)
          const report = await generateMealOrderReport(mockPayload, {})
          
          const csv = exportToCSV(report)
          const excel = exportToExcel(report)
          
          // Excel should be CSV with BOM prepended
          const excelWithoutBOM = excel.substring(1)
          
          return csv === excelWithoutBOM
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Property 32: Export handles empty reports', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant([]),
        async (orders) => {
          const mockPayload = createMockPayload(orders)
          const report = await generateMealOrderReport(mockPayload, {})
          
          const csv = exportToCSV(report)
          const excel = exportToExcel(report)
          
          // Should still have header row
          const csvLines = csv.split('\n')
          if (csvLines.length < 1) {
            return false
          }
          
          // Excel should have BOM
          if (!excel.startsWith('\uFEFF')) {
            return false
          }
          
          return true
        }
      ),
      { numRuns: 10 }
    )
  })

  test('Property 32: Export preserves all field data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(mealOrderGenerator, { minLength: 1, maxLength: 20 }),
        async (orders) => {
          const mockPayload = createMockPayload(orders)
          const report = await generateMealOrderReport(mockPayload, {})
          
          const csv = exportToCSV(report)
          
          // Check that key data from each order appears in CSV
          for (const order of report.data) {
            // Check resident name appears
            if (!csv.includes(order.residentName)) {
              return false
            }
            
            // Check meal type appears
            if (!csv.includes(order.mealType)) {
              return false
            }
            
            // Check status appears
            if (!csv.includes(order.status)) {
              return false
            }
            
            // Check date appears
            if (!csv.includes(order.date)) {
              return false
            }
          }
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Property 32: CSV row count matches report data count', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(mealOrderGenerator, { minLength: 1, maxLength: 30 }),
        async (orders) => {
          const mockPayload = createMockPayload(orders)
          const report = await generateMealOrderReport(mockPayload, {})
          
          const csv = exportToCSV(report)
          const lines = csv.split('\n').filter(line => line.trim().length > 0)
          
          // Should have header + data rows
          // lines[0] is header, rest are data
          const dataRowCount = lines.length - 1
          
          return dataRowCount === report.data.length
        }
      ),
      { numRuns: 100 }
    )
  })
})
