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
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900" role="main" aria-label="Caregiver Meal Order Management">
      {/* Responsive container with proper padding for all screen sizes */}
      <div className="container mx-auto px-4 xs:px-4 sm:px-6 md:px-8 py-6 xs:py-6 sm:py-8 md:py-10">
        {/* Responsive heading */}
        <h1 className="text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 xs:mb-6 sm:mb-8">
          Meal Order Management
        </h1>

        {/* Responsive grid layout: stacked on mobile, side-by-side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xs:gap-4 sm:gap-6 md:gap-8">
          {/* Left Column: Resident Selection and Order Form */}
          <section aria-labelledby="order-creation-heading" className="space-y-4 xs:space-y-4 sm:space-y-6">
            <h2 id="order-creation-heading" className="sr-only">Create Meal Order</h2>
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
          </section>

          {/* Right Column: Order List */}
          <section aria-labelledby="order-list-heading">
            <h2 id="order-list-heading" className="sr-only">Meal Orders List</h2>
            <MealOrderList
              key={refreshOrders}
              selectedResident={selectedResident}
            />
          </section>
        </div>
      </div>
    </main>
  )
}
