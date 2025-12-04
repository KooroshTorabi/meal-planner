'use client'

import { useState, useEffect } from 'react'

/**
 * Resident Selector Component
 * 
 * Displays a searchable list of residents with their dietary restrictions
 * and preferences. Allows caregivers to select a resident for meal ordering.
 * 
 * Requirements: 2.1
 */

interface Resident {
  id: string
  name: string
  roomNumber: string
  tableNumber?: string
  station?: string
  dietaryRestrictions?: Array<{ restriction: string }>
  aversions?: string
  specialNotes?: string
  highCalorie: boolean
  active: boolean
}

interface ResidentSelectorProps {
  selectedResident: Resident | null
  onSelectResident: (resident: Resident | null) => void
}

export default function ResidentSelector({
  selectedResident,
  onSelectResident,
}: ResidentSelectorProps) {
  const [residents, setResidents] = useState<Resident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([])

  // Fetch residents on component mount
  useEffect(() => {
    fetchResidents()
  }, [])

  // Filter residents based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredResidents(residents)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = residents.filter(
        (resident) =>
          resident.name.toLowerCase().includes(term) ||
          resident.roomNumber.toLowerCase().includes(term) ||
          resident.station?.toLowerCase().includes(term)
      )
      setFilteredResidents(filtered)
    }
  }, [searchTerm, residents])

  const fetchResidents = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch only active residents
      const response = await fetch('/api/residents/search?active=true&limit=100')

      if (!response.ok) {
        throw new Error('Failed to fetch residents')
      }

      const data = await response.json()
      setResidents(data.docs || [])
      setFilteredResidents(data.docs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching residents:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectResident = (resident: Resident) => {
    if (selectedResident?.id === resident.id) {
      onSelectResident(null) // Deselect if clicking the same resident
    } else {
      onSelectResident(resident)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Select Resident
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
          Select Resident
        </h2>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={fetchResidents}
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
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Select Resident
        </h2>

        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name, room, or station..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Resident List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredResidents.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No residents found
            </p>
          ) : (
            filteredResidents.map((resident) => (
              <button
                key={resident.id}
                onClick={() => handleSelectResident(resident)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all
                  ${
                    selectedResident?.id === resident.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {resident.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Room {resident.roomNumber}
                      {resident.station && ` • ${resident.station}`}
                      {resident.tableNumber && ` • Table ${resident.tableNumber}`}
                    </p>
                  </div>
                  {resident.highCalorie && (
                    <span className="px-2 py-1 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 
                                   text-orange-800 dark:text-orange-200 rounded">
                      High Calorie
                    </span>
                  )}
                </div>

                {/* Dietary Restrictions */}
                {resident.dietaryRestrictions && resident.dietaryRestrictions.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Dietary Restrictions:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {resident.dietaryRestrictions.map((dr, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 
                                   text-red-800 dark:text-red-200 rounded"
                        >
                          {dr.restriction}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Aversions */}
                {resident.aversions && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Aversions:
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {resident.aversions}
                    </p>
                  </div>
                )}

                {/* Special Notes */}
                {resident.specialNotes && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Special Notes:
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {resident.specialNotes}
                    </p>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
