/**
 * Unit Tests for Ingredient Aggregation Edge Cases
 * 
 * Tests specific edge cases for ingredient aggregation:
 * - Empty order sets
 * - Single order
 * - Orders with no ingredients selected
 * 
 * Requirements: 4.3
 */

import {
  aggregateBreakfastIngredients,
  aggregateLunchIngredients,
  aggregateDinnerIngredients,
  type MealOrder,
} from '../lib/aggregation'

describe('Ingredient Aggregation Edge Cases', () => {
  describe('Empty order sets', () => {
    test('should return empty array for empty breakfast orders', () => {
      const result = aggregateBreakfastIngredients([])
      expect(result).toEqual([])
    })

    test('should return empty array for empty lunch orders', () => {
      const result = aggregateLunchIngredients([])
      expect(result).toEqual([])
    })

    test('should return empty array for empty dinner orders', () => {
      const result = aggregateDinnerIngredients([])
      expect(result).toEqual([])
    })
  })

  describe('Single order', () => {
    test('should correctly aggregate single breakfast order', () => {
      const orders: MealOrder[] = [
        {
          id: '1',
          status: 'pending',
          breakfastOptions: {
            followsPlan: false,
            breadItems: ['brötchen', 'graubrot'],
            breadPreparation: ['geschnitten'],
            spreads: ['butter', 'konfitüre'],
            porridge: true,
            beverages: ['kaffee'],
            additions: ['zucker'],
          },
        },
      ]

      const result = aggregateBreakfastIngredients(orders)
      
      expect(result).toContainEqual({ name: 'brötchen', category: 'bread', quantity: 1, unit: 'count' })
      expect(result).toContainEqual({ name: 'graubrot', category: 'bread', quantity: 1, unit: 'count' })
      expect(result).toContainEqual({ name: 'geschnitten', category: 'preparation', quantity: 1, unit: 'count' })
      expect(result).toContainEqual({ name: 'butter', category: 'spread', quantity: 1, unit: 'count' })
      expect(result).toContainEqual({ name: 'konfitüre', category: 'spread', quantity: 1, unit: 'count' })
      expect(result).toContainEqual({ name: 'porridge', category: 'porridge', quantity: 1, unit: 'count' })
      expect(result).toContainEqual({ name: 'kaffee', category: 'beverage', quantity: 1, unit: 'count' })
      expect(result).toContainEqual({ name: 'zucker', category: 'addition', quantity: 1, unit: 'count' })
      expect(result.length).toBe(8)
    })

    test('should correctly aggregate single lunch order', () => {
      const orders: MealOrder[] = [
        {
          id: '1',
          status: 'pending',
          lunchOptions: {
            portionSize: 'large',
            soup: true,
            dessert: true,
            specialPreparations: ['passierte_kost'],
            restrictions: ['ohne_fisch'],
          },
        },
      ]

      const result = aggregateLunchIngredients(orders)
      
      expect(result).toContainEqual({ name: 'large', category: 'portion', quantity: 1, unit: 'count' })
      expect(result).toContainEqual({ name: 'soup', category: 'soup', quantity: 1, unit: 'count' })
      expect(result).toContainEqual({ name: 'dessert', category: 'dessert', quantity: 1, unit: 'count' })
      expect(result).toContainEqual({ name: 'passierte_kost', category: 'preparation', quantity: 1, unit: 'count' })
      expect(result).toContainEqual({ name: 'ohne_fisch', category: 'restriction', quantity: 1, unit: 'count' })
      expect(result.length).toBe(5)
    })

    test('should correctly aggregate single dinner order', () => {
      const orders: MealOrder[] = [
        {
          id: '1',
          status: 'pending',
          dinnerOptions: {
            followsPlan: false,
            breadItems: ['graubrot'],
            breadPreparation: ['geschmiert'],
            spreads: ['butter'],
            soup: true,
            porridge: false,
            noFish: true,
            beverages: ['tee'],
            additions: ['zucker'],
          },
        },
      ]

      const result = aggregateDinnerIngredients(orders)
      
      expect(result).toContainEqual({ name: 'graubrot', category: 'bread', quantity: 1, unit: 'count' })
      expect(result).toContainEqual({ name: 'geschmiert', category: 'preparation', quantity: 1, unit: 'count' })
      expect(result).toContainEqual({ name: 'butter', category: 'spread', quantity: 1, unit: 'count' })
      expect(result).toContainEqual({ name: 'soup', category: 'soup', quantity: 1, unit: 'count' })
      expect(result).toContainEqual({ name: 'no_fish', category: 'restriction', quantity: 1, unit: 'count' })
      expect(result).toContainEqual({ name: 'tee', category: 'beverage', quantity: 1, unit: 'count' })
      expect(result).toContainEqual({ name: 'zucker', category: 'addition', quantity: 1, unit: 'count' })
      expect(result.length).toBe(7)
    })
  })

  describe('Orders with no ingredients selected', () => {
    test('should return empty array for breakfast order with no ingredients', () => {
      const orders: MealOrder[] = [
        {
          id: '1',
          status: 'pending',
          breakfastOptions: {
            followsPlan: false,
            breadItems: [],
            breadPreparation: [],
            spreads: [],
            porridge: false,
            beverages: [],
            additions: [],
          },
        },
      ]

      const result = aggregateBreakfastIngredients(orders)
      expect(result).toEqual([])
    })

    test('should return empty array for lunch order with no ingredients', () => {
      const orders: MealOrder[] = [
        {
          id: '1',
          status: 'pending',
          lunchOptions: {
            portionSize: undefined,
            soup: false,
            dessert: false,
            specialPreparations: [],
            restrictions: [],
          },
        },
      ]

      const result = aggregateLunchIngredients(orders)
      expect(result).toEqual([])
    })

    test('should return empty array for dinner order with no ingredients', () => {
      const orders: MealOrder[] = [
        {
          id: '1',
          status: 'pending',
          dinnerOptions: {
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
        },
      ]

      const result = aggregateDinnerIngredients(orders)
      expect(result).toEqual([])
    })

    test('should handle mix of orders with and without ingredients', () => {
      const orders: MealOrder[] = [
        {
          id: '1',
          status: 'pending',
          breakfastOptions: {
            followsPlan: false,
            breadItems: ['brötchen'],
            breadPreparation: [],
            spreads: [],
            porridge: false,
            beverages: [],
            additions: [],
          },
        },
        {
          id: '2',
          status: 'pending',
          breakfastOptions: {
            followsPlan: false,
            breadItems: [],
            breadPreparation: [],
            spreads: [],
            porridge: false,
            beverages: [],
            additions: [],
          },
        },
        {
          id: '3',
          status: 'pending',
          breakfastOptions: {
            followsPlan: false,
            breadItems: ['brötchen'],
            breadPreparation: [],
            spreads: [],
            porridge: false,
            beverages: [],
            additions: [],
          },
        },
      ]

      const result = aggregateBreakfastIngredients(orders)
      expect(result).toContainEqual({ name: 'brötchen', category: 'bread', quantity: 2, unit: 'count' })
      expect(result.length).toBe(1)
    })
  })

  describe('Status filtering', () => {
    test('should only count pending and prepared orders, not completed', () => {
      const orders: MealOrder[] = [
        {
          id: '1',
          status: 'pending',
          breakfastOptions: {
            followsPlan: false,
            breadItems: ['brötchen'],
            breadPreparation: [],
            spreads: [],
            porridge: false,
            beverages: [],
            additions: [],
          },
        },
        {
          id: '2',
          status: 'prepared',
          breakfastOptions: {
            followsPlan: false,
            breadItems: ['brötchen'],
            breadPreparation: [],
            spreads: [],
            porridge: false,
            beverages: [],
            additions: [],
          },
        },
        {
          id: '3',
          status: 'completed',
          breakfastOptions: {
            followsPlan: false,
            breadItems: ['brötchen'],
            breadPreparation: [],
            spreads: [],
            porridge: false,
            beverages: [],
            additions: [],
          },
        },
      ]

      const result = aggregateBreakfastIngredients(orders)
      expect(result).toContainEqual({ name: 'brötchen', category: 'bread', quantity: 2, unit: 'count' })
      expect(result.length).toBe(1)
    })

    test('should return empty array when all orders are completed', () => {
      const orders: MealOrder[] = [
        {
          id: '1',
          status: 'completed',
          breakfastOptions: {
            followsPlan: false,
            breadItems: ['brötchen'],
            breadPreparation: [],
            spreads: [],
            porridge: false,
            beverages: [],
            additions: [],
          },
        },
        {
          id: '2',
          status: 'completed',
          breakfastOptions: {
            followsPlan: false,
            breadItems: ['graubrot'],
            breadPreparation: [],
            spreads: [],
            porridge: false,
            beverages: [],
            additions: [],
          },
        },
      ]

      const result = aggregateBreakfastIngredients(orders)
      expect(result).toEqual([])
    })
  })

  describe('Missing options', () => {
    test('should handle orders without breakfastOptions', () => {
      const orders: MealOrder[] = [
        {
          id: '1',
          status: 'pending',
        },
      ]

      const result = aggregateBreakfastIngredients(orders)
      expect(result).toEqual([])
    })

    test('should handle orders without lunchOptions', () => {
      const orders: MealOrder[] = [
        {
          id: '1',
          status: 'pending',
        },
      ]

      const result = aggregateLunchIngredients(orders)
      expect(result).toEqual([])
    })

    test('should handle orders without dinnerOptions', () => {
      const orders: MealOrder[] = [
        {
          id: '1',
          status: 'pending',
        },
      ]

      const result = aggregateDinnerIngredients(orders)
      expect(result).toEqual([])
    })
  })
})
