'use client'

import { useState } from 'react'

/**
 * Meal Order Form Component
 * 
 * Provides a form for creating meal orders with:
 * - Date and meal type selectors
 * - Conditional fields based on meal type
 * - Multiple selection for arrays (bread, spreads, beverages)
 * - Special notes input
 * - Urgent flag checkbox
 * 
 * Requirements: 2.2, 3.1, 3.2, 3.3, 3.4, 3.5
 */

interface Resident {
  id: string
  name: string
  roomNumber: string
}

interface MealOrderFormProps {
  resident: Resident
  onOrderCreated: () => void
}

type MealType = 'breakfast' | 'lunch' | 'dinner'

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

export default function MealOrderForm({ resident, onOrderCreated }: MealOrderFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [urgent, setUrgent] = useState(false)
  const [specialNotes, setSpecialNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Breakfast options state
  const [breakfastOptions, setBreakfastOptions] = useState<BreakfastOptions>({
    followsPlan: false,
    breadItems: [],
    breadPreparation: [],
    spreads: [],
    porridge: false,
    beverages: [],
    additions: [],
  })

  // Lunch options state
  const [lunchOptions, setLunchOptions] = useState<LunchOptions>({
    portionSize: '',
    soup: false,
    dessert: false,
    specialPreparations: [],
    restrictions: [],
  })

  // Dinner options state
  const [dinnerOptions, setDinnerOptions] = useState<DinnerOptions>({
    followsPlan: false,
    breadItems: [],
    breadPreparation: [],
    spreads: [],
    soup: false,
    porridge: false,
    noFish: false,
    beverages: [],
    additions: [],
  })

  const validateForm = (): string | null => {
    // Validate required fields
    if (!date) {
      return 'Date is required'
    }

    if (!mealType) {
      return 'Meal type is required'
    }

    // Validate date is not in the past (optional, but good UX)
    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (selectedDate < today) {
      return 'Cannot create orders for past dates'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(false)

    // Client-side validation
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      setSubmitting(false)
      return
    }

    try {
      const orderData: any = {
        resident: resident.id,
        date,
        mealType,
        urgent,
        specialNotes: specialNotes || undefined,
        status: 'pending',
      }

      // Add meal-specific options
      if (mealType === 'breakfast') {
        orderData.breakfastOptions = breakfastOptions
      } else if (mealType === 'lunch') {
        orderData.lunchOptions = lunchOptions
      } else if (mealType === 'dinner') {
        orderData.dinnerOptions = dinnerOptions
      }

      const response = await fetch('/api/meal-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create meal order')
      }

      setSuccess(true)
      onOrderCreated()

      // Reset form after successful submission
      setTimeout(() => {
        setSuccess(false)
        resetForm()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error creating meal order:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setSpecialNotes('')
    setUrgent(false)
    setBreakfastOptions({
      followsPlan: false,
      breadItems: [],
      breadPreparation: [],
      spreads: [],
      porridge: false,
      beverages: [],
      additions: [],
    })
    setLunchOptions({
      portionSize: '',
      soup: false,
      dessert: false,
      specialPreparations: [],
      restrictions: [],
    })
    setDinnerOptions({
      followsPlan: false,
      breadItems: [],
      breadPreparation: [],
      spreads: [],
      soup: false,
      porridge: false,
      noFish: false,
      beverages: [],
      additions: [],
    })
  }

  const toggleArrayValue = (
    array: string[],
    value: string,
    setter: (value: any) => void,
    optionsKey: string
  ) => {
    const newArray = array.includes(value)
      ? array.filter((item) => item !== value)
      : [...array, value]

    if (mealType === 'breakfast') {
      setter({ ...breakfastOptions, [optionsKey]: newArray })
    } else if (mealType === 'lunch') {
      setter({ ...lunchOptions, [optionsKey]: newArray })
    } else if (mealType === 'dinner') {
      setter({ ...dinnerOptions, [optionsKey]: newArray })
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Create Meal Order for {resident.name}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
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
              value={mealType}
              onChange={(e) => setMealType(e.target.value as MealType)}
              required
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
          {mealType === 'breakfast' && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-white">Breakfast Options</h3>

              {/* Follows Plan */}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={breakfastOptions.followsPlan}
                  onChange={(e) =>
                    setBreakfastOptions({ ...breakfastOptions, followsPlan: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Follows standard breakfast plan
                </span>
              </label>

              {/* Bread Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bread Items
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['brötchen', 'vollkornbrötchen', 'graubrot', 'vollkornbrot', 'weißbrot', 'knäckebrot'].map(
                    (item) => (
                      <label key={item} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={breakfastOptions.breadItems.includes(item)}
                          onChange={() =>
                            toggleArrayValue(
                              breakfastOptions.breadItems,
                              item,
                              setBreakfastOptions,
                              'breadItems'
                            )
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                          {item}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Bread Preparation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bread Preparation
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['geschnitten', 'geschmiert'].map((item) => (
                    <label key={item} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={breakfastOptions.breadPreparation.includes(item)}
                        onChange={() =>
                          toggleArrayValue(
                            breakfastOptions.breadPreparation,
                            item,
                            setBreakfastOptions,
                            'breadPreparation'
                          )
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Spreads */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Spreads
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['butter', 'margarine', 'konfitüre', 'honig', 'käse', 'wurst'].map((item) => (
                    <label key={item} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={breakfastOptions.spreads.includes(item)}
                        onChange={() =>
                          toggleArrayValue(
                            breakfastOptions.spreads,
                            item,
                            setBreakfastOptions,
                            'spreads'
                          )
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Porridge */}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={breakfastOptions.porridge}
                  onChange={(e) =>
                    setBreakfastOptions({ ...breakfastOptions, porridge: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Porridge/Brei
                </span>
              </label>

              {/* Beverages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Beverages
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['kaffee', 'tee', 'milch_heiß', 'milch_kalt'].map((item) => (
                    <label key={item} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={breakfastOptions.beverages.includes(item)}
                        onChange={() =>
                          toggleArrayValue(
                            breakfastOptions.beverages,
                            item,
                            setBreakfastOptions,
                            'beverages'
                          )
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {item.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additions
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['zucker', 'süßstoff', 'kaffeesahne'].map((item) => (
                    <label key={item} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={breakfastOptions.additions.includes(item)}
                        onChange={() =>
                          toggleArrayValue(
                            breakfastOptions.additions,
                            item,
                            setBreakfastOptions,
                            'additions'
                          )
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Lunch Options */}
          {mealType === 'lunch' && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-white">Lunch Options</h3>

              {/* Portion Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Portion Size
                </label>
                <select
                  value={lunchOptions.portionSize}
                  onChange={(e) =>
                    setLunchOptions({ ...lunchOptions, portionSize: e.target.value })
                  }
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

              {/* Soup */}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={lunchOptions.soup}
                  onChange={(e) => setLunchOptions({ ...lunchOptions, soup: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Include Soup</span>
              </label>

              {/* Dessert */}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={lunchOptions.dessert}
                  onChange={(e) => setLunchOptions({ ...lunchOptions, dessert: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Include Dessert
                </span>
              </label>

              {/* Special Preparations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Special Preparations
                </label>
                <div className="space-y-2">
                  {[
                    'passierte_kost',
                    'passiertes_fleisch',
                    'geschnittenes_fleisch',
                    'kartoffelbrei',
                  ].map((item) => (
                    <label key={item} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={lunchOptions.specialPreparations.includes(item)}
                        onChange={() =>
                          toggleArrayValue(
                            lunchOptions.specialPreparations,
                            item,
                            setLunchOptions,
                            'specialPreparations'
                          )
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {item.replace(/_/g, ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Restrictions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Restrictions
                </label>
                <div className="space-y-2">
                  {['ohne_fisch', 'fingerfood', 'nur_süß'].map((item) => (
                    <label key={item} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={lunchOptions.restrictions.includes(item)}
                        onChange={() =>
                          toggleArrayValue(
                            lunchOptions.restrictions,
                            item,
                            setLunchOptions,
                            'restrictions'
                          )
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {item.replace(/_/g, ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Dinner Options */}
          {mealType === 'dinner' && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-white">Dinner Options</h3>

              {/* Follows Plan */}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={dinnerOptions.followsPlan}
                  onChange={(e) =>
                    setDinnerOptions({ ...dinnerOptions, followsPlan: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Follows standard dinner plan
                </span>
              </label>

              {/* Bread Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bread Items
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['graubrot', 'vollkornbrot', 'weißbrot', 'knäckebrot'].map((item) => (
                    <label key={item} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={dinnerOptions.breadItems.includes(item)}
                        onChange={() =>
                          toggleArrayValue(
                            dinnerOptions.breadItems,
                            item,
                            setDinnerOptions,
                            'breadItems'
                          )
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Bread Preparation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bread Preparation
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['geschmiert', 'geschnitten'].map((item) => (
                    <label key={item} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={dinnerOptions.breadPreparation.includes(item)}
                        onChange={() =>
                          toggleArrayValue(
                            dinnerOptions.breadPreparation,
                            item,
                            setDinnerOptions,
                            'breadPreparation'
                          )
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Spreads */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Spreads
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['butter', 'margarine'].map((item) => (
                    <label key={item} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={dinnerOptions.spreads.includes(item)}
                        onChange={() =>
                          toggleArrayValue(
                            dinnerOptions.spreads,
                            item,
                            setDinnerOptions,
                            'spreads'
                          )
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Soup */}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={dinnerOptions.soup}
                  onChange={(e) => setDinnerOptions({ ...dinnerOptions, soup: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Include Soup</span>
              </label>

              {/* Porridge */}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={dinnerOptions.porridge}
                  onChange={(e) =>
                    setDinnerOptions({ ...dinnerOptions, porridge: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Porridge/Brei
                </span>
              </label>

              {/* No Fish */}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={dinnerOptions.noFish}
                  onChange={(e) => setDinnerOptions({ ...dinnerOptions, noFish: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">No Fish</span>
              </label>

              {/* Beverages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Beverages
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['tee', 'kakao', 'milch_heiß', 'milch_kalt'].map((item) => (
                    <label key={item} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={dinnerOptions.beverages.includes(item)}
                        onChange={() =>
                          toggleArrayValue(
                            dinnerOptions.beverages,
                            item,
                            setDinnerOptions,
                            'beverages'
                          )
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {item.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additions
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['zucker', 'süßstoff'].map((item) => (
                    <label key={item} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={dinnerOptions.additions.includes(item)}
                        onChange={() =>
                          toggleArrayValue(
                            dinnerOptions.additions,
                            item,
                            setDinnerOptions,
                            'additions'
                          )
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {item}
                      </span>
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
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any additional notes or special instructions..."
            />
          </div>

          {/* Urgent Flag */}
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Mark as Urgent (will alert kitchen staff)
            </span>
          </label>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-green-800 dark:text-green-200">
                Meal order created successfully!
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                     text-white font-medium rounded-lg transition-colors
                     focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {submitting ? 'Creating Order...' : 'Create Meal Order'}
          </button>
        </form>
      </div>
    </div>
  )
}
