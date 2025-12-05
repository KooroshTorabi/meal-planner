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
  breakfastOptions?: any
  lunchOptions?: any
  dinnerOptions?: any
  createdAt: string
  updatedAt: string
}

interface BreakfastOptions {
  followsPlan: boolean
  breadItems: string[]
  breadPreparation: string[]
  spreads: string[]
  porridge: boolean
  beverages: string[]
  additions: string[]
}

interface LunchOptions {
  portionSize: string
  soup: boolean
  dessert: boolean
  specialPreparations: string[]
  restrictions: string[]
}

interface DinnerOptions {
  followsPlan: boolean
  breadItems: string[]
  breadPreparation: string[]
  spreads: string[]
  soup: boolean
  porridge: boolean
  noFish: boolean
  beverages: string[]
  additions: string[]
}

interface MealOrderListProps {
  selectedResident?: any
}

export default function MealOrderList({ selectedResident }: MealOrderListProps) {
  const [orders, setOrders] = useState<MealOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'today' | 'pending'>('all')
  const [editingOrder, setEditingOrder] = useState<MealOrder | null>(null)
  const [editFormData, setEditFormData] = useState<any>(null)

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

  const handleEditOrder = async (order: MealOrder) => {
    try {
      // Fetch full order details
      const response = await fetch(`/api/meal-orders/${order.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch order details')
      }
      const fullOrder = await response.json()
      setEditingOrder(fullOrder)
      
      // Initialize form data with all order fields
      setEditFormData({
        date: fullOrder.date.split('T')[0], // Convert to YYYY-MM-DD format
        mealType: fullOrder.mealType,
        urgent: fullOrder.urgent || false,
        specialNotes: fullOrder.specialNotes || '',
        breakfastOptions: fullOrder.breakfastOptions || {
          followsPlan: false,
          breadItems: [],
          breadPreparation: [],
          spreads: [],
          porridge: false,
          beverages: [],
          additions: [],
        },
        lunchOptions: fullOrder.lunchOptions || {
          portionSize: '',
          soup: false,
          dessert: false,
          specialPreparations: [],
          restrictions: [],
        },
        dinnerOptions: fullOrder.dinnerOptions || {
          followsPlan: false,
          breadItems: [],
          breadPreparation: [],
          spreads: [],
          soup: false,
          porridge: false,
          noFish: false,
          beverages: [],
          additions: [],
        },
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load order for editing')
      console.error('Error loading order:', err)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingOrder || !editFormData) return

    try {
      // Prepare update data with only the meal-specific options for the selected meal type
      const updateData: any = {
        date: editFormData.date,
        mealType: editFormData.mealType,
        urgent: editFormData.urgent,
        specialNotes: editFormData.specialNotes,
      }

      // Add meal-specific options based on meal type
      if (editFormData.mealType === 'breakfast') {
        updateData.breakfastOptions = editFormData.breakfastOptions
      } else if (editFormData.mealType === 'lunch') {
        // Clean up lunch options - remove empty portionSize
        const cleanedLunchOptions = { ...editFormData.lunchOptions }
        if (!cleanedLunchOptions.portionSize) {
          delete cleanedLunchOptions.portionSize
        }
        updateData.lunchOptions = cleanedLunchOptions
      } else if (editFormData.mealType === 'dinner') {
        updateData.dinnerOptions = editFormData.dinnerOptions
      }

      const response = await fetch(`/api/meal-orders/${editingOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update meal order')
      }

      // Close modal and refresh list
      setEditingOrder(null)
      setEditFormData(null)
      fetchOrders()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update order')
      console.error('Error updating meal order:', err)
    }
  }

  const handleCancelEdit = () => {
    setEditingOrder(null)
    setEditFormData(null)
  }

  const toggleArrayValue = (array: string[], value: string, optionsKey: string, mealOptionsKey: string) => {
    if (!editFormData) return
    
    const newArray = array.includes(value)
      ? array.filter((item) => item !== value)
      : [...array, value]

    setEditFormData({
      ...editFormData,
      [mealOptionsKey]: {
        ...editFormData[mealOptionsKey],
        [optionsKey]: newArray,
      },
    })
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
                      onClick={() => handleEditOrder(order)}
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

      {/* Edit Modal */}
      {editingOrder && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Edit Meal Order
              </h3>

              {/* Resident Info (Read-only) */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Resident:</span> {getResidentName(editingOrder.resident)}
                  {' - Room '}{getResidentRoom(editingOrder.resident)}
                </p>
              </div>

              <div className="space-y-4">
                {/* Date Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Meal Type Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Meal Type *
                  </label>
                  <select
                    value={editFormData.mealType}
                    onChange={(e) => setEditFormData({ ...editFormData, mealType: e.target.value as 'breakfast' | 'lunch' | 'dinner' })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                  </select>
                </div>

                {/* Breakfast Options */}
                {editFormData.mealType === 'breakfast' && (
                  <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white">Breakfast Options</h4>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editFormData.breakfastOptions.followsPlan}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          breakfastOptions: { ...editFormData.breakfastOptions, followsPlan: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Follows standard breakfast plan
                      </span>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bread Items
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['brötchen', 'vollkornbrötchen', 'graubrot', 'vollkornbrot', 'weißbrot', 'knäckebrot'].map((item) => (
                          <label key={item} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editFormData.breakfastOptions.breadItems.includes(item)}
                              onChange={() => toggleArrayValue(editFormData.breakfastOptions.breadItems, item, 'breadItems', 'breakfastOptions')}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bread Preparation
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['geschnitten', 'geschmiert'].map((item) => (
                          <label key={item} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editFormData.breakfastOptions.breadPreparation.includes(item)}
                              onChange={() => toggleArrayValue(editFormData.breakfastOptions.breadPreparation, item, 'breadPreparation', 'breakfastOptions')}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Spreads
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['butter', 'margarine', 'konfitüre', 'honig', 'käse', 'wurst'].map((item) => (
                          <label key={item} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editFormData.breakfastOptions.spreads.includes(item)}
                              onChange={() => toggleArrayValue(editFormData.breakfastOptions.spreads, item, 'spreads', 'breakfastOptions')}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editFormData.breakfastOptions.porridge}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          breakfastOptions: { ...editFormData.breakfastOptions, porridge: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Porridge/Brei</span>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Beverages
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['kaffee', 'tee', 'milch_heiß', 'milch_kalt'].map((item) => (
                          <label key={item} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editFormData.breakfastOptions.beverages.includes(item)}
                              onChange={() => toggleArrayValue(editFormData.breakfastOptions.beverages, item, 'beverages', 'breakfastOptions')}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{item.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Additions
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['zucker', 'süßstoff', 'kaffeesahne'].map((item) => (
                          <label key={item} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editFormData.breakfastOptions.additions.includes(item)}
                              onChange={() => toggleArrayValue(editFormData.breakfastOptions.additions, item, 'additions', 'breakfastOptions')}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Lunch Options */}
                {editFormData.mealType === 'lunch' && (
                  <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white">Lunch Options</h4>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Portion Size
                      </label>
                      <select
                        value={editFormData.lunchOptions.portionSize}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          lunchOptions: { ...editFormData.lunchOptions, portionSize: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select portion size</option>
                        <option value="small">Small</option>
                        <option value="large">Large</option>
                        <option value="vegetarian">Vegetarian</option>
                      </select>
                    </div>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editFormData.lunchOptions.soup}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          lunchOptions: { ...editFormData.lunchOptions, soup: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Include Soup</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editFormData.lunchOptions.dessert}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          lunchOptions: { ...editFormData.lunchOptions, dessert: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Include Dessert</span>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Special Preparations
                      </label>
                      <div className="space-y-2">
                        {['passierte_kost', 'passiertes_fleisch', 'geschnittenes_fleisch', 'kartoffelbrei'].map((item) => (
                          <label key={item} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editFormData.lunchOptions.specialPreparations.includes(item)}
                              onChange={() => toggleArrayValue(editFormData.lunchOptions.specialPreparations, item, 'specialPreparations', 'lunchOptions')}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{item.replace(/_/g, ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Restrictions
                      </label>
                      <div className="space-y-2">
                        {['ohne_fisch', 'fingerfood', 'nur_süß'].map((item) => (
                          <label key={item} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editFormData.lunchOptions.restrictions.includes(item)}
                              onChange={() => toggleArrayValue(editFormData.lunchOptions.restrictions, item, 'restrictions', 'lunchOptions')}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{item.replace(/_/g, ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Dinner Options */}
                {editFormData.mealType === 'dinner' && (
                  <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white">Dinner Options</h4>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editFormData.dinnerOptions.followsPlan}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          dinnerOptions: { ...editFormData.dinnerOptions, followsPlan: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Follows standard dinner plan
                      </span>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bread Items
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['graubrot', 'vollkornbrot', 'weißbrot', 'knäckebrot'].map((item) => (
                          <label key={item} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editFormData.dinnerOptions.breadItems.includes(item)}
                              onChange={() => toggleArrayValue(editFormData.dinnerOptions.breadItems, item, 'breadItems', 'dinnerOptions')}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bread Preparation
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['geschmiert', 'geschnitten'].map((item) => (
                          <label key={item} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editFormData.dinnerOptions.breadPreparation.includes(item)}
                              onChange={() => toggleArrayValue(editFormData.dinnerOptions.breadPreparation, item, 'breadPreparation', 'dinnerOptions')}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Spreads
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['butter', 'margarine'].map((item) => (
                          <label key={item} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editFormData.dinnerOptions.spreads.includes(item)}
                              onChange={() => toggleArrayValue(editFormData.dinnerOptions.spreads, item, 'spreads', 'dinnerOptions')}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editFormData.dinnerOptions.soup}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          dinnerOptions: { ...editFormData.dinnerOptions, soup: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Include Soup</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editFormData.dinnerOptions.porridge}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          dinnerOptions: { ...editFormData.dinnerOptions, porridge: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Porridge/Brei</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editFormData.dinnerOptions.noFish}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          dinnerOptions: { ...editFormData.dinnerOptions, noFish: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">No Fish</span>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Beverages
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['tee', 'kakao', 'milch_heiß', 'milch_kalt'].map((item) => (
                          <label key={item} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editFormData.dinnerOptions.beverages.includes(item)}
                              onChange={() => toggleArrayValue(editFormData.dinnerOptions.beverages, item, 'beverages', 'dinnerOptions')}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{item.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Additions
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['zucker', 'süßstoff'].map((item) => (
                          <label key={item} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editFormData.dinnerOptions.additions.includes(item)}
                              onChange={() => toggleArrayValue(editFormData.dinnerOptions.additions, item, 'additions', 'dinnerOptions')}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Special Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Special Notes
                  </label>
                  <textarea
                    value={editFormData.specialNotes}
                    onChange={(e) => setEditFormData({ ...editFormData, specialNotes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add any special notes or instructions..."
                  />
                </div>

                {/* Urgent Checkbox */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editFormData.urgent}
                      onChange={(e) => setEditFormData({ ...editFormData, urgent: e.target.checked })}
                      className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Mark as Urgent (will alert kitchen staff)
                    </span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 
                             text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
