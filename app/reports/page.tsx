'use client'

/**
 * Reports UI Component
 * 
 * Provides interface for generating and exporting meal order reports.
 * Features:
 * - Date range selector
 * - Filter controls (meal type, status, resident)
 * - Summary display
 * - Export buttons (JSON, CSV, Excel)
 * 
 * Requirements: 17.1, 17.2, 17.3
 */

import { useState } from 'react'
import AuthGuard from '@/components/AuthGuard'

interface ReportSummary {
  totalOrders: number
  byMealType: Record<string, number>
  byStatus: Record<string, number>
  byIngredient: Record<string, number>
}

interface ReportData {
  data: any[]
  summary: ReportSummary
  filters: any
  generatedAt: string
}

export default function ReportsPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [mealType, setMealType] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reportData, setReportData] = useState<ReportData | null>(null)

  const generateReport = async () => {
    setLoading(true)
    setError('')
    
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (mealType) params.append('mealType', mealType)
      if (status) params.append('status', status)
      params.append('format', 'json')

      const response = await fetch(`/api/reports/meal-orders?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate report')
      }

      const data = await response.json()
      setReportData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: 'csv' | 'excel') => {
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (mealType) params.append('mealType', mealType)
      if (status) params.append('status', status)
      params.append('format', format)

      const response = await fetch(`/api/reports/meal-orders?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to export report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meal-orders-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    }
  }

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setMealType('')
    setStatus('')
    setReportData(null)
    setError('')
  }

  return (
    <AuthGuard allowedRoles={['admin', 'caregiver', 'kitchen']}>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 xs:p-4 sm:p-6" role="main" aria-label="Meal Orders Reports">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 xs:mb-6 sm:mb-8">
          Meal Orders Reports
        </h1>

        {/* Filter Controls - Responsive */}
        <section aria-labelledby="filters-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 xs:p-4 sm:p-6 mb-4 xs:mb-4 sm:mb-6">
          <h2 id="filters-heading" className="text-lg xs:text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Filters
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="start-date"
                name="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                aria-label="Report start date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="end-date"
                name="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                aria-label="Report end date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Meal Type */}
            <div>
              <label htmlFor="report-meal-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meal Type
              </label>
              <select
                id="report-meal-type"
                name="report-meal-type"
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                aria-label="Filter by meal type"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="report-status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                id="report-status"
                name="report-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                aria-label="Filter by order status"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="prepared">Prepared</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Action Buttons - Stack on mobile, inline on larger screens */}
          <div className="flex flex-col xs:flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={generateReport}
              disabled={loading}
              className="px-6 py-3 xs:py-3 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                       disabled:bg-gray-400 disabled:cursor-not-allowed min-h-touch
                       text-base xs:text-base sm:text-sm font-medium"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
            
            <button
              onClick={clearFilters}
              className="px-6 py-3 xs:py-3 sm:py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white 
                       rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 min-h-touch
                       text-base xs:text-base sm:text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6" role="alert" aria-live="assertive">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Report Summary */}
        {reportData && (
          <>
            <section aria-labelledby="summary-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 id="summary-heading" className="text-xl font-semibold text-gray-900 dark:text-white">
                  Summary
                </h2>
                
                {/* Export Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => exportReport('csv')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => exportReport('excel')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                  >
                    Export Excel
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 xs:gap-4 sm:gap-6">
                {/* Total Orders */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-xs xs:text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                    Total Orders
                  </p>
                  <p className="text-2xl xs:text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {reportData.summary.totalOrders}
                  </p>
                </div>

                {/* By Meal Type */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-2">
                    By Meal Type
                  </p>
                  <div className="space-y-1">
                    {Object.entries(reportData.summary.byMealType).map(([type, count]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300 capitalize">{type}:</span>
                        <span className="font-semibold text-purple-900 dark:text-purple-100">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* By Status */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-2">
                    By Status
                  </p>
                  <div className="space-y-1">
                    {Object.entries(reportData.summary.byStatus).map(([statusKey, count]) => (
                      <div key={statusKey} className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300 capitalize">{statusKey}:</span>
                        <span className="font-semibold text-green-900 dark:text-green-100">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Top Ingredients */}
            <section aria-labelledby="ingredients-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h2 id="ingredients-heading" className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Top Ingredients
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 xs:gap-3 sm:gap-4">
                {Object.entries(reportData.summary.byIngredient)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 12)
                  .map(([ingredient, count]) => (
                    <div key={ingredient} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-xs xs:text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 truncate" title={ingredient}>
                        {ingredient}
                      </p>
                      <p className="text-xl xs:text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                    </div>
                  ))}
              </div>
            </section>

            {/* Order Details Table */}
            <section aria-labelledby="orders-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 id="orders-heading" className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Order Details ({reportData.data.length} orders)
              </h2>
              
              <div className="overflow-x-auto -mx-4 xs:-mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Resident
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Room
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Meal Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Urgent
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {reportData.data.slice(0, 50).map((order) => (
                      <tr key={order.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {order.date}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {order.residentName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {order.residentRoom}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 capitalize">
                          {order.mealType}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            order.status === 'prepared' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {order.urgent ? '⚠️ Yes' : 'No'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                    </table>
                  </div>
                </div>
                
                {reportData.data.length > 50 && (
                  <p className="text-xs xs:text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-4 text-center px-4">
                    Showing first 50 of {reportData.data.length} orders. Export to see all data.
                  </p>
                )}
              </div>
            </section>
          </>
        )}

        {/* Empty State */}
        {!reportData && !loading && !error && (
          <aside className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center" role="status">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Select filters and click "Generate Report" to view meal order data
            </p>
          </aside>
        )}
      </div>
    </main>
    </AuthGuard>
  )
}
