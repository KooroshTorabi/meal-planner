/**
 * Meal Orders Report API Endpoint
 * 
 * GET /api/reports/meal-orders
 * 
 * Generates reports for meal orders with filtering and export capabilities.
 * Supports filtering by date range, meal type, resident, and status.
 * Can export in JSON, CSV, or Excel formats.
 * 
 * Requirements: 17.1, 17.2, 17.3
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { generateMealOrderReport, exportToCSV, exportToExcel, type ReportFilters } from '@/lib/reports'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const mealType = searchParams.get('mealType') as 'breakfast' | 'lunch' | 'dinner' | undefined
    const residentId = searchParams.get('residentId') || undefined
    const status = searchParams.get('status') as 'pending' | 'prepared' | 'completed' | undefined
    const format = searchParams.get('format') || 'json'

    // Validate meal type if provided
    if (mealType && !['breakfast', 'lunch', 'dinner'].includes(mealType)) {
      return NextResponse.json(
        { error: 'Invalid meal type. Must be breakfast, lunch, or dinner.' },
        { status: 400 }
      )
    }

    // Validate status if provided
    if (status && !['pending', 'prepared', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be pending, prepared, or completed.' },
        { status: 400 }
      )
    }

    // Validate format
    if (!['json', 'csv', 'excel'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be json, csv, or excel.' },
        { status: 400 }
      )
    }

    // Build filters
    const filters: ReportFilters = {
      startDate,
      endDate,
      mealType,
      residentId,
      status,
    }

    // Generate report
    const report = await generateMealOrderReport(payload, filters)

    // Return in requested format
    if (format === 'csv') {
      const csv = exportToCSV(report)
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="meal-orders-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    if (format === 'excel') {
      const excel = exportToExcel(report)
      return new NextResponse(excel, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="meal-orders-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    // Default: JSON format
    return NextResponse.json(report, { status: 200 })
  } catch (error) {
    console.error('Error generating meal orders report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
