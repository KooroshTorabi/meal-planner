'use client'

import { useState, useEffect } from 'react'

/**
 * Meal Order List Component
 * 
 * Displays meal orders created by the caregiver or for the current date.
 * Allows editing of pending orders.
 * 
 * Requirements: 2.4
 */

interface Resident {
  id: string
  name: string
  roomNumber: string
}

interface MealOrder {
  id: string
  resident: Resident | string
  date: string
  mealType: 'breakfast' | 'lunch' | 'dinner'
  status: 'pending' | 'prepared' | 'completed'
  urgent: boolean
  specialNotes?: string
  createdAt: string
  updatedAt: string
}

interface MealOrderListProps {
  selectedResident?: any
}

export default function MealOrderList({ selectedResident }: MealOrderListProps) {
  const [orders, setOrders] = useState<MealOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'today' | 'pending'>('today')

  useEffect(() => {
    fetchOrders()
  }, [filter, selectedResident])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams()

      // Filter by current date for 'today' filter
      if (filter === 'today') {
        const today = new Date().toISOString().split('T')[0]
        params.append('date', today)
      }

      // Filter by status for 'pending' filter
      if (filter === 'pending') {
        params.append('status', 'pending')
      }

      // Filter by selected resident if provided
      if (selectedResident) {
        params.append('resident', selectedResident.id)
      }

      params.append('limit', '100')

      const response = await fetch(`/api/meal-orders?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch meal orders')
      }

      const data = await response.json()
      setOrders(data.docs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching meal orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this meal order?')) {
      return
    }

    try {
      const response = await fetch(`/api/meal-orders/${orderId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete meal order')
      }

      // Refresh the list
      fetchOrders()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete order')
      console.error('Error deleting meal order:', err)
    }
  }

  const getResidentName = (resident: Resident | string): string => {
    if (typeof resident === 'string') {
      return 'Unknown'
    }
    return resident.name
  }

  const getResidentRoom = (resident: Resident | string): string => {
    if (typeof resident === 'string') {
      return 'N/A'
    }
    return resident.roomNumber
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getMealTypeLabel = (mealType: string): string => {
    return mealType.charAt(0).toUpperCase() + mealType.slice(1)
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
      case 'prepared':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Meal Orders
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Meal Orders
        </h2>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={fetchOrders}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Meal Orders
          </h2>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('today')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                filter === 'today'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                filter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Order List */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {orders.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No meal orders found
            </p>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {getResidentName(order.resident)}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Room {getResidentRoom(order.resident)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {order.urgent && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded">
                        Urgent
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Date:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {formatDate(order.date)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Meal:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {getMealTypeLabel(order.mealType)}
                    </span>
                  </div>
                </div>

                {order.specialNotes && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Special Notes:
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {order.specialNotes}
                    </p>
                  </div>
                )}

                {/* Action Buttons - Only show for pending orders */}
                {order.status === 'pending' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        // TODO: Implement edit functionality
                        alert('Edit functionality coming soon')
                      }}
                      className="flex-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="flex-1 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
