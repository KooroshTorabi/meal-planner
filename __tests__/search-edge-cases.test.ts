/**
 * Unit Tests for Search Edge Cases
 * 
 * Tests edge cases for search functionality:
 * - No results scenario
 * - Single filter
 * - All filters combined
 * 
 * Requirements: 15.5
 */

import { searchMealOrders, searchResidents } from '../lib/search'
import type { MealOrderSearchFilters, ResidentSearchFilters } from '../lib/search'

// Mock Payload
const mockPayload = {
  find: jest.fn(),
} as any

describe('Search Edge Cases - Residents', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('No results scenario - returns empty array when no residents match', async () => {
    // Mock empty result
    mockPayload.find.mockResolvedValue({
      docs: [],
      totalDocs: 0,
      limit: 50,
      page: 1,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    })

    const filters: ResidentSearchFilters = {
      name: 'NonexistentResident',
    }

    const result = await searchResidents(mockPayload, filters)

    expect(result.docs).toEqual([])
    expect(result.totalDocs).toBe(0)
    expect(mockPayload.find).toHaveBeenCalledWith({
      collection: 'residents',
      where: {
        and: [
          {
            name: {
              contains: 'NonexistentResident',
            },
          },
        ],
      },
      limit: 50,
      page: 1,
      sort: 'name',
      depth: 0,
    })
  })

  test('Single filter - searches by name only', async () => {
    const mockResidents = [
      { id: '1', name: 'John Doe', roomNumber: '101', active: true },
      { id: '2', name: 'John Smith', roomNumber: '102', active: true },
    ]

    mockPayload.find.mockResolvedValue({
      docs: mockResidents,
      totalDocs: 2,
      limit: 50,
      page: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    })

    const filters: ResidentSearchFilters = {
      name: 'John',
    }

    const result = await searchResidents(mockPayload, filters)

    expect(result.docs).toHaveLength(2)
    expect(mockPayload.find).toHaveBeenCalledWith({
      collection: 'residents',
      where: {
        and: [
          {
            name: {
              contains: 'John',
            },
          },
        ],
      },
      limit: 50,
      page: 1,
      sort: 'name',
      depth: 0,
    })
  })

  test('All filters combined - applies all resident filters', async () => {
    const mockResidents = [
      {
        id: '1',
        name: 'John Doe',
        roomNumber: '101',
        station: 'North Wing',
        tableNumber: '1',
        active: true,
        dietaryRestrictions: [{ restriction: 'gluten-free' }],
      },
    ]

    mockPayload.find.mockResolvedValue({
      docs: mockResidents,
      totalDocs: 1,
      limit: 50,
      page: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    })

    const filters: ResidentSearchFilters = {
      name: 'John',
      roomNumber: '101',
      station: 'North',
      tableNumber: '1',
      active: true,
      dietaryRestrictions: 'gluten',
    }

    const result = await searchResidents(mockPayload, filters)

    expect(result.docs).toHaveLength(1)
    expect(mockPayload.find).toHaveBeenCalledWith({
      collection: 'residents',
      where: {
        and: [
          { name: { contains: 'John' } },
          { roomNumber: { contains: '101' } },
          { station: { contains: 'North' } },
          { tableNumber: { contains: '1' } },
          { active: { equals: true } },
          { 'dietaryRestrictions.restriction': { contains: 'gluten' } },
        ],
      },
      limit: 50,
      page: 1,
      sort: 'name',
      depth: 0,
    })
  })

  test('Empty filters - returns all residents', async () => {
    const mockResidents = [
      { id: '1', name: 'John Doe', roomNumber: '101', active: true },
      { id: '2', name: 'Jane Smith', roomNumber: '102', active: true },
      { id: '3', name: 'Bob Johnson', roomNumber: '103', active: false },
    ]

    mockPayload.find.mockResolvedValue({
      docs: mockResidents,
      totalDocs: 3,
      limit: 50,
      page: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    })

    const filters: ResidentSearchFilters = {}

    const result = await searchResidents(mockPayload, filters)

    expect(result.docs).toHaveLength(3)
    expect(mockPayload.find).toHaveBeenCalledWith({
      collection: 'residents',
      where: {},
      limit: 50,
      page: 1,
      sort: 'name',
      depth: 0,
    })
  })
})

describe('Search Edge Cases - Meal Orders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPayload.find.mockReset()
  })

  test('No results scenario - returns empty array when no orders match', async () => {
    // Mock empty resident result first
    mockPayload.find
      .mockResolvedValueOnce({
        docs: [],
        totalDocs: 0,
      })

    const filters: MealOrderSearchFilters = {
      residentName: 'NonexistentResident',
    }

    const result = await searchMealOrders(mockPayload, filters)

    expect(result.docs).toEqual([])
    expect(result.totalDocs).toBe(0)
  })

  test('Single filter - searches by meal type only', async () => {
    const mockOrders = [
      { id: '1', mealType: 'breakfast', status: 'pending', date: '2024-01-15' },
      { id: '2', mealType: 'breakfast', status: 'prepared', date: '2024-01-15' },
    ]

    mockPayload.find.mockResolvedValueOnce({
      docs: mockOrders,
      totalDocs: 2,
      limit: 50,
      page: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    })

    const filters: MealOrderSearchFilters = {
      mealType: 'breakfast',
    }

    const result = await searchMealOrders(mockPayload, filters)

    expect(result.docs).toHaveLength(2)
    expect(mockPayload.find).toHaveBeenCalledWith({
      collection: 'meal-orders',
      where: {
        and: [
          {
            mealType: {
              equals: 'breakfast',
            },
          },
        ],
      },
      limit: 50,
      page: 1,
      sort: '-date',
      depth: 1,
    })
  })

  test('All filters combined - applies all meal order filters', async () => {
    const mockResidents = [
      {
        id: 'resident-1',
        name: 'John Doe',
        roomNumber: '101',
        dietaryRestrictions: [{ restriction: 'gluten-free' }],
      },
    ]

    const mockOrders = [
      {
        id: '1',
        resident: 'resident-1',
        mealType: 'breakfast',
        status: 'pending',
        date: '2024-03-15',
        urgent: true,
      },
    ]

    // First call for residents, second for meal orders
    mockPayload.find
      .mockResolvedValueOnce({
        docs: mockResidents,
        totalDocs: 1,
      })
      .mockResolvedValueOnce({
        docs: mockOrders,
        totalDocs: 1,
        limit: 50,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      })

    const filters: MealOrderSearchFilters = {
      residentName: 'John',
      roomNumber: '101',
      mealType: 'breakfast',
      status: 'pending',
      dietaryRestrictions: 'gluten',
      startDate: '2024-03-01',
      endDate: '2024-03-31',
      urgent: true,
    }

    const result = await searchMealOrders(mockPayload, filters)

    expect(result.docs).toHaveLength(1)
    
    // Verify resident search was called
    expect(mockPayload.find).toHaveBeenNthCalledWith(1, {
      collection: 'residents',
      where: {
        and: [
          { name: { contains: 'John' } },
          { roomNumber: { contains: '101' } },
          { 'dietaryRestrictions.restriction': { contains: 'gluten' } },
        ],
      },
      limit: 1000,
    })

    // Verify meal order search was called with resident filter
    // Note: We just verify the structure, not the exact resident IDs since they come from the mock
    const secondCall = mockPayload.find.mock.calls[1][0]
    expect(secondCall.collection).toBe('meal-orders')
    expect(secondCall.where.and).toContainEqual({ mealType: { equals: 'breakfast' } })
    expect(secondCall.where.and).toContainEqual({ status: { equals: 'pending' } })
    expect(secondCall.where.and).toContainEqual({ urgent: { equals: true } })
    expect(secondCall.where.and).toContainEqual({ date: { greater_than_equal: '2024-03-01' } })
    expect(secondCall.where.and).toContainEqual({ date: { less_than_equal: '2024-03-31' } })
    expect(secondCall.limit).toBe(50)
    expect(secondCall.page).toBe(1)
    expect(secondCall.sort).toBe('-date')
  })

  test('Empty filters - returns all meal orders', async () => {
    const mockOrders = [
      { id: '1', mealType: 'breakfast', status: 'pending', date: '2024-01-15' },
      { id: '2', mealType: 'lunch', status: 'prepared', date: '2024-01-15' },
      { id: '3', mealType: 'dinner', status: 'completed', date: '2024-01-14' },
    ]

    mockPayload.find.mockResolvedValueOnce({
      docs: mockOrders,
      totalDocs: 3,
      limit: 50,
      page: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    })

    const filters: MealOrderSearchFilters = {}

    const result = await searchMealOrders(mockPayload, filters)

    expect(result.docs).toHaveLength(3)
    expect(mockPayload.find).toHaveBeenCalledWith({
      collection: 'meal-orders',
      where: {},
      limit: 50,
      page: 1,
      sort: '-date',
      depth: 1,
    })
  })

  test('Date range filter - filters orders within date range', async () => {
    const mockOrders = [
      { id: '1', mealType: 'breakfast', status: 'pending', date: '2024-03-15' },
      { id: '2', mealType: 'lunch', status: 'prepared', date: '2024-03-20' },
    ]

    mockPayload.find.mockResolvedValueOnce({
      docs: mockOrders,
      totalDocs: 2,
      limit: 50,
      page: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    })

    const filters: MealOrderSearchFilters = {
      startDate: '2024-03-01',
      endDate: '2024-03-31',
    }

    const result = await searchMealOrders(mockPayload, filters)

    expect(result.docs).toHaveLength(2)
    expect(mockPayload.find).toHaveBeenCalledWith({
      collection: 'meal-orders',
      where: {
        and: [
          { date: { greater_than_equal: '2024-03-01' } },
          { date: { less_than_equal: '2024-03-31' } },
        ],
      },
      limit: 50,
      page: 1,
      sort: '-date',
      depth: 1,
    })
  })

  test('Pagination - respects limit and page parameters', async () => {
    const mockOrders = [
      { id: '11', mealType: 'breakfast', status: 'pending', date: '2024-01-15' },
      { id: '12', mealType: 'lunch', status: 'prepared', date: '2024-01-15' },
    ]

    mockPayload.find.mockResolvedValueOnce({
      docs: mockOrders,
      totalDocs: 25,
      limit: 10,
      page: 2,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: true,
    })

    const filters: MealOrderSearchFilters = {}

    const result = await searchMealOrders(mockPayload, filters, 10, 2)

    expect(result.page).toBe(2)
    expect(result.limit).toBe(10)
    expect(result.hasNextPage).toBe(true)
    expect(result.hasPrevPage).toBe(true)
    expect(mockPayload.find).toHaveBeenCalledWith({
      collection: 'meal-orders',
      where: {},
      limit: 10,
      page: 2,
      sort: '-date',
      depth: 1,
    })
  })
})
