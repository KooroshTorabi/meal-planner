'use client'

/**
 * Kitchen Dashboard UI Component
 * 
 * Provides kitchen staff with:
 * - Date and meal type selector
 * - Ingredient report display
 * - Order list with status indicators
 * - Alert notifications
 * 
 * Requirements: 6.1, 6.2, 6.3
 */

import { useState, useEffect } from 'react'

interface IngredientSummary {
  name: string
  category: string
  quantity: number
  unit: string
}

interface DashboardSummary {
  totalOrders: number
  pendingOrders: number
  preparedOrders: number
  completedOrders: number
}

interface MealOrder {
  id: string
  resident: {
    name: string
    roomNumber: string
  }
  date: string
  mealType: string
  status: string
  urgent: boolean
  specialNotes?: string
}

interface Alert {
  id: string
  message: string
  severity: string
  createdAt: string
  mealOrder: any
}

interface DashboardData {
  summary: DashboardSummary
  ingredients: IngredientSummary[]
  orders: MealOrder[]
  alerts: Alert[]
}

export default function KitchenDashboard() {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [mealType, setMealType] = useState<string>('breakfast')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  // Fetch dashboard data when date or mealType changes
  useEffect(() => {
    fetchDashboardData()
  }, [date, mealType])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/kitchen/dashboard?date=${date}&mealType=${mealType}`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch dashboard data')
      }

      const data = await response.json()
      setDashboardData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId)
    try {
      // In a real implementation, this would call the Payload API
      // For now, we'll simulate the update
      const response = await fetch(`/api/collections/meal-orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update order status')
      }

      // Refresh dashboard data
      await fetchDashboardData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  // Filter orders based on status filter
  const filteredOrders = dashboardData?.orders.filter((order) => {
    if (statusFilter === 'all') return true
    return order.status === statusFilter
  }) || []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 xs:p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header - Responsive text sizes */}
        <div className="mb-6 xs:mb-6 sm:mb-8">
          <h1 className="text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Kitchen Dashboard
          </h1>
          <p className="text-sm xs:text-sm sm:text-base text-gray-600 dark:text-gray-400">
            View meal orders, ingredient requirements, and alerts
          </p>
        </div>

        {/* Date and Meal Type Selector - Touch-friendly on mobile */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 xs:p-4 sm:p-6 mb-4 xs:mb-4 sm:mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Date
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 xs:py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         min-h-touch text-base xs:text-base sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="mealType"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Meal Type
              </label>
              <select
                id="mealType"
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full px-4 py-3 xs:py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         min-h-touch text-base xs:text-base sm:text-sm"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && !error && dashboardData && (
          <>
            {/* Alert Notifications */}
            {dashboardData.alerts.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Active Alerts
                </h2>
                <div className="space-y-3">
                  {dashboardData.alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        alert.severity === 'critical'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                          : alert.severity === 'high'
                          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
                          : alert.severity === 'medium'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {alert.message}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {new Date(alert.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            alert.severity === 'critical'
                              ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                              : alert.severity === 'high'
                              ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                              : alert.severity === 'medium'
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                          }`}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Statistics - Responsive grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 xs:gap-3 sm:gap-4 mb-4 xs:mb-4 sm:mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 xs:p-4 sm:p-6">
                <p className="text-xs xs:text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Total Orders</p>
                <p className="text-2xl xs:text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.summary.totalOrders}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 xs:p-4 sm:p-6">
                <p className="text-xs xs:text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Pending</p>
                <p className="text-2xl xs:text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {dashboardData.summary.pendingOrders}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 xs:p-4 sm:p-6">
                <p className="text-xs xs:text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Prepared</p>
                <p className="text-2xl xs:text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {dashboardData.summary.preparedOrders}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 xs:p-4 sm:p-6">
                <p className="text-xs xs:text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
                <p className="text-2xl xs:text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                  {dashboardData.summary.completedOrders}
                </p>
              </div>
            </div>

            {/* Ingredient Report */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Ingredient Requirements
              </h2>
              {dashboardData.ingredients.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  No ingredients to display for this date and meal type.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Ingredient
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Quantity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {dashboardData.ingredients.map((ingredient, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {ingredient.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {ingredient.category}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right font-medium">
                            {ingredient.quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Order List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Meal Orders
                </h2>
                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="statusFilter"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Filter:
                  </label>
                  <select
                    id="statusFilter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Orders</option>
                    <option value="pending">Pending</option>
                    <option value="prepared">Prepared</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              {filteredOrders.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  {statusFilter === 'all'
                    ? 'No orders found for this date and meal type.'
                    : `No ${statusFilter} orders found.`}
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className={`p-4 rounded-lg border ${
                        order.status === 'pending'
                          ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
                          : order.status === 'prepared'
                          ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {order.resident.name}
                            </h3>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Room {order.resident.roomNumber}
                            </span>
                            {order.urgent && (
                              <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-medium rounded">
                                URGENT
                              </span>
                            )}
                          </div>
                          {order.specialNotes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Note: {order.specialNotes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              order.status === 'pending'
                                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                : order.status === 'prepared'
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            }`}
                          >
                            {order.status.toUpperCase()}
                          </span>
                          {/* Status Update Buttons */}
                          {order.status === 'pending' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'prepared')}
                              disabled={updatingOrderId === order.id}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[120px]"
                            >
                              {updatingOrderId === order.id ? 'Updating...' : 'Mark Prepared'}
                            </button>
                          )}
                          {order.status === 'prepared' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'completed')}
                              disabled={updatingOrderId === order.id}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 min-w-[120px]"
                            >
                              {updatingOrderId === order.id ? 'Updating...' : 'Mark Completed'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
