'use client'

import { useState } from 'react'
import ResidentSelector from '@/components/caregiver/ResidentSelector'
import MealOrderForm from '@/components/caregiver/MealOrderForm'
import MealOrderList from '@/components/caregiver/MealOrderList'

/**
 * Caregiver Interface - Main Page
 * 
 * Provides caregivers with tools to:
 * - Select residents
 * - Create meal orders
 * - View and edit existing orders
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export default function CaregiverPage() {
  const [selectedResident, setSelectedResident] = useState<any>(null)
  const [refreshOrders, setRefreshOrders] = useState(0)

  const handleOrderCreated = () => {
    // Trigger refresh of order list
    setRefreshOrders(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Meal Order Management
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Resident Selection and Order Form */}
          <div className="space-y-6">
            <ResidentSelector
              selectedResident={selectedResident}
              onSelectResident={setSelectedResident}
            />

            {selectedResident && (
              <MealOrderForm
                resident={selectedResident}
                onOrderCreated={handleOrderCreated}
              />
            )}
          </div>

          {/* Right Column: Order List */}
          <div>
            <MealOrderList
              key={refreshOrders}
              selectedResident={selectedResident}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
