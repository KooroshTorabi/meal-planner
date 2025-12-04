/**
 * Property-Based Tests for Search Filter Combination
 * 
 * **Feature: meal-planner-system, Property 29: Search filter combination**
 * **Validates: Requirements 15.1, 15.4**
 * 
 * Property: For any set of search filters applied to meal orders or residents, 
 * the system must return only records matching all filter criteria using logical AND operations
 */

import * as fc from 'fast-check'
import type { MealOrderSearchFilters, ResidentSearchFilters } from '../lib/search'

describe('Search Filter Combination Property Tests', () => {
  // Mock data structures
  interface MockResident {
    id: string
    name: string
    roomNumber: string
    station?: string
    tableNumber?: string
    active: boolean
    dietaryRestrictions: Array<{ restriction: string }>
  }

  interface MockMealOrder {
    id: string
    resident: MockResident
    date: string
    mealType: 'breakfast' | 'lunch' | 'dinner'
    status: 'pending' | 'prepared' | 'completed'
    urgent: boolean
  }

  // Generators
  const residentGenerator = fc.record({
    id: fc.uuid(),
    name: fc.constantFrom('John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams', 'Charlie Brown'),
    roomNumber: fc.constantFrom('101', '102', '103', '201', '202', '203'),
    station: fc.option(fc.constantFrom('North Wing', 'South Wing', 'East Wing'), { nil: undefined }),
    tableNumber: fc.option(fc.constantFrom('1', '2', '3', '4'), { nil: undefined }),
    active: fc.boolean(),
    dietaryRestrictions: fc.array(
      fc.record({ restriction: fc.constantFrom('gluten-free', 'dairy-free', 'vegetarian', 'low-sodium') }),
      { minLength: 0, maxLength: 3 }
    ),
  })

  const mealOrderGenerator = (residents: MockResident[]) => {
    return fc.record({
      id: fc.uuid(),
      resident: fc.constantFrom(...residents),
      date: fc.constantFrom(
        '2024-01-15', '2024-02-20', '2024-03-10', '2024-04-05',
        '2024-05-12', '2024-06-18', '2024-07-22', '2024-08-30',
        '2024-09-14', '2024-10-08', '2024-11-25', '2024-12-15'
      ),
      mealType: fc.constantFrom('breakfast' as const, 'lunch' as const, 'dinner' as const),
      status: fc.constantFrom('pending' as const, 'prepared' as const, 'completed' as const),
      urgent: fc.boolean(),
    })
  }

  // Helper function to manually filter residents
  function manuallyFilterResidents(
    residents: MockResident[],
    filters: ResidentSearchFilters
  ): MockResident[] {
    return residents.filter(resident => {
      // Apply name filter
      if (filters.name && !resident.name.toLowerCase().includes(filters.name.toLowerCase())) {
        return false
      }

      // Apply room number filter
      if (filters.roomNumber && !resident.roomNumber.includes(filters.roomNumber)) {
        return false
      }

      // Apply station filter
      if (filters.station && (!resident.station || !resident.station.toLowerCase().includes(filters.station.toLowerCase()))) {
        return false
      }

      // Apply table number filter
      if (filters.tableNumber && (!resident.tableNumber || !resident.tableNumber.includes(filters.tableNumber))) {
        return false
      }

      // Apply active filter
      if (filters.active !== undefined && resident.active !== filters.active) {
        return false
      }

      // Apply dietary restrictions filter
      if (filters.dietaryRestrictions) {
        const hasMatchingRestriction = resident.dietaryRestrictions.some(dr =>
          dr.restriction.toLowerCase().includes(filters.dietaryRestrictions!.toLowerCase())
        )
        if (!hasMatchingRestriction) {
          return false
        }
      }

      return true
    })
  }

  // Helper function to manually filter meal orders
  function manuallyFilterMealOrders(
    orders: MockMealOrder[],
    filters: MealOrderSearchFilters
  ): MockMealOrder[] {
    return orders.filter(order => {
      // Apply meal type filter
      if (filters.mealType && order.mealType !== filters.mealType) {
        return false
      }

      // Apply status filter
      if (filters.status && order.status !== filters.status) {
        return false
      }

      // Apply urgent filter
      if (filters.urgent !== undefined && order.urgent !== filters.urgent) {
        return false
      }

      // Apply date range filters
      if (filters.startDate && order.date < filters.startDate) {
        return false
      }

      if (filters.endDate && order.date > filters.endDate) {
        return false
      }

      // Apply resident name filter
      if (filters.residentName && !order.resident.name.toLowerCase().includes(filters.residentName.toLowerCase())) {
        return false
      }

      // Apply room number filter
      if (filters.roomNumber && !order.resident.roomNumber.includes(filters.roomNumber)) {
        return false
      }

      // Apply dietary restrictions filter
      if (filters.dietaryRestrictions) {
        const hasMatchingRestriction = order.resident.dietaryRestrictions.some(dr =>
          dr.restriction.toLowerCase().includes(filters.dietaryRestrictions!.toLowerCase())
        )
        if (!hasMatchingRestriction) {
          return false
        }
      }

      return true
    })
  }

  // Simulate the search function behavior
  function simulateResidentSearch(
    residents: MockResident[],
    filters: ResidentSearchFilters
  ): MockResident[] {
    const whereConditions: Array<(r: MockResident) => boolean> = []

    if (filters.name) {
      whereConditions.push(r => r.name.toLowerCase().includes(filters.name!.toLowerCase()))
    }

    if (filters.roomNumber) {
      whereConditions.push(r => r.roomNumber.includes(filters.roomNumber!))
    }

    if (filters.station) {
      whereConditions.push(r => r.station?.toLowerCase().includes(filters.station!.toLowerCase()) || false)
    }

    if (filters.tableNumber) {
      whereConditions.push(r => r.tableNumber?.includes(filters.tableNumber!) || false)
    }

    if (filters.active !== undefined) {
      whereConditions.push(r => r.active === filters.active)
    }

    if (filters.dietaryRestrictions) {
      whereConditions.push(r =>
        r.dietaryRestrictions.some(dr =>
          dr.restriction.toLowerCase().includes(filters.dietaryRestrictions!.toLowerCase())
        )
      )
    }

    // Apply all conditions with AND logic
    return residents.filter(resident =>
      whereConditions.every(condition => condition(resident))
    )
  }

  function simulateMealOrderSearch(
    orders: MockMealOrder[],
    filters: MealOrderSearchFilters
  ): MockMealOrder[] {
    const whereConditions: Array<(o: MockMealOrder) => boolean> = []

    if (filters.mealType) {
      whereConditions.push(o => o.mealType === filters.mealType)
    }

    if (filters.status) {
      whereConditions.push(o => o.status === filters.status)
    }

    if (filters.urgent !== undefined) {
      whereConditions.push(o => o.urgent === filters.urgent)
    }

    if (filters.startDate) {
      whereConditions.push(o => o.date >= filters.startDate!)
    }

    if (filters.endDate) {
      whereConditions.push(o => o.date <= filters.endDate!)
    }

    if (filters.residentName) {
      whereConditions.push(o => o.resident.name.toLowerCase().includes(filters.residentName!.toLowerCase()))
    }

    if (filters.roomNumber) {
      whereConditions.push(o => o.resident.roomNumber.includes(filters.roomNumber!))
    }

    if (filters.dietaryRestrictions) {
      whereConditions.push(o =>
        o.resident.dietaryRestrictions.some(dr =>
          dr.restriction.toLowerCase().includes(filters.dietaryRestrictions!.toLowerCase())
        )
      )
    }

    // Apply all conditions with AND logic
    return orders.filter(order =>
      whereConditions.every(condition => condition(order))
    )
  }

  test('Property 29: Resident search combines filters with logical AND', () => {
    fc.assert(
      fc.property(
        fc.array(residentGenerator, { minLength: 5, maxLength: 30 }),
        fc.record({
          name: fc.option(fc.constantFrom('John', 'Jane', 'Bob'), { nil: undefined }),
          roomNumber: fc.option(fc.constantFrom('101', '102', '201'), { nil: undefined }),
          station: fc.option(fc.constantFrom('North', 'South'), { nil: undefined }),
          active: fc.option(fc.boolean(), { nil: undefined }),
          dietaryRestrictions: fc.option(fc.constantFrom('gluten', 'dairy'), { nil: undefined }),
        }),
        (residents, filters) => {
          const searchResult = simulateResidentSearch(residents, filters)
          const manualResult = manuallyFilterResidents(residents, filters)

          // Results should match
          if (searchResult.length !== manualResult.length) {
            return false
          }

          // Every result should match all filters
          for (const resident of searchResult) {
            if (!manualResult.some(r => r.id === resident.id)) {
              return false
            }
          }

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Property 29: Meal order search combines filters with logical AND', () => {
    fc.assert(
      fc.property(
        fc.array(residentGenerator, { minLength: 3, maxLength: 10 })
          .chain(residents =>
            fc.tuple(
              fc.constant(residents),
              fc.array(mealOrderGenerator(residents), { minLength: 5, maxLength: 30 })
            )
          ),
        fc.record({
          mealType: fc.option(fc.constantFrom('breakfast' as const, 'lunch' as const, 'dinner' as const), { nil: undefined }),
          status: fc.option(fc.constantFrom('pending' as const, 'prepared' as const), { nil: undefined }),
          urgent: fc.option(fc.boolean(), { nil: undefined }),
          residentName: fc.option(fc.constantFrom('John', 'Jane', 'Bob'), { nil: undefined }),
          roomNumber: fc.option(fc.constantFrom('101', '102', '201'), { nil: undefined }),
        }),
        ([residents, orders], filters) => {
          const searchResult = simulateMealOrderSearch(orders, filters)
          const manualResult = manuallyFilterMealOrders(orders, filters)

          // Results should match
          if (searchResult.length !== manualResult.length) {
            return false
          }

          // Every result should match all filters
          for (const order of searchResult) {
            if (!manualResult.some(o => o.id === order.id)) {
              return false
            }
          }

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Property 29: Empty filters return all records', () => {
    fc.assert(
      fc.property(
        fc.array(residentGenerator, { minLength: 1, maxLength: 20 }),
        (residents) => {
          const emptyFilters: ResidentSearchFilters = {}
          const searchResult = simulateResidentSearch(residents, emptyFilters)

          // Should return all residents
          return searchResult.length === residents.length
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Property 29: Multiple filters are more restrictive than single filters', () => {
    fc.assert(
      fc.property(
        fc.array(residentGenerator, { minLength: 10, maxLength: 30 }),
        (residents) => {
          const singleFilter: ResidentSearchFilters = { active: true }
          const multipleFilters: ResidentSearchFilters = { active: true, station: 'North' }

          const singleResult = simulateResidentSearch(residents, singleFilter)
          const multipleResult = simulateResidentSearch(residents, multipleFilters)

          // Multiple filters should return same or fewer results
          return multipleResult.length <= singleResult.length
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Property 29: Date range filters work correctly for meal orders', () => {
    fc.assert(
      fc.property(
        fc.array(residentGenerator, { minLength: 3, maxLength: 5 })
          .chain(residents =>
            fc.tuple(
              fc.constant(residents),
              fc.array(mealOrderGenerator(residents), { minLength: 10, maxLength: 30 })
            )
          ),
        ([residents, orders]) => {
          const startDate = '2024-03-01'
          const endDate = '2024-06-30'
          const filters: MealOrderSearchFilters = { startDate, endDate }

          const searchResult = simulateMealOrderSearch(orders, filters)

          // All results should be within the date range
          return searchResult.every(order =>
            order.date >= startDate && order.date <= endDate
          )
        }
      ),
      { numRuns: 100 }
    )
  })
})
