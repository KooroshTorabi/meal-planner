/**
 * Property-Based Tests for Ingredient Aggregation
 * 
 * **Feature: meal-planner-system, Property 8: Ingredient aggregation correctness**
 * **Validates: Requirements 4.1, 4.4, 4.5**
 * 
 * Property: For any set of meal orders for a given date and meal type, 
 * the aggregated ingredient quantities must equal the sum of each ingredient 
 * across all orders with pending or prepared status
 */

import * as fc from 'fast-check'
import {
  aggregateBreakfastIngredients,
  aggregateLunchIngredients,
  aggregateDinnerIngredients,
  type MealOrder,
  type IngredientSummary,
} from '../lib/aggregation'

describe('Ingredient Aggregation Property Tests', () => {
  // Generators for meal order options
  const breakfastOptionsGenerator = fc.record({
    followsPlan: fc.boolean(),
    breadItems: fc.array(
      fc.constantFrom('brötchen', 'vollkornbrötchen', 'graubrot', 'vollkornbrot', 'weißbrot', 'knäckebrot'),
      { minLength: 0, maxLength: 3 }
    ),
    breadPreparation: fc.array(
      fc.constantFrom('geschnitten', 'geschmiert'),
      { minLength: 0, maxLength: 2 }
    ),
    spreads: fc.array(
      fc.constantFrom('butter', 'margarine', 'konfitüre', 'honig', 'käse', 'wurst'),
      { minLength: 0, maxLength: 3 }
    ),
    porridge: fc.boolean(),
    beverages: fc.array(
      fc.constantFrom('kaffee', 'tee', 'milch_heiß', 'milch_kalt'),
      { minLength: 0, maxLength: 2 }
    ),
    additions: fc.array(
      fc.constantFrom('zucker', 'süßstoff', 'kaffeesahne'),
      { minLength: 0, maxLength: 2 }
    ),
  })

  const lunchOptionsGenerator = fc.record({
    portionSize: fc.constantFrom('small', 'large', 'vegetarian'),
    soup: fc.boolean(),
    dessert: fc.boolean(),
    specialPreparations: fc.array(
      fc.constantFrom('passierte_kost', 'passiertes_fleisch', 'geschnittenes_fleisch', 'kartoffelbrei'),
      { minLength: 0, maxLength: 2 }
    ),
    restrictions: fc.array(
      fc.constantFrom('ohne_fisch', 'fingerfood', 'nur_süß'),
      { minLength: 0, maxLength: 2 }
    ),
  })

  const dinnerOptionsGenerator = fc.record({
    followsPlan: fc.boolean(),
    breadItems: fc.array(
      fc.constantFrom('graubrot', 'vollkornbrot', 'weißbrot', 'knäckebrot'),
      { minLength: 0, maxLength: 3 }
    ),
    breadPreparation: fc.array(
      fc.constantFrom('geschmiert', 'geschnitten'),
      { minLength: 0, maxLength: 2 }
    ),
    spreads: fc.array(
      fc.constantFrom('butter', 'margarine'),
      { minLength: 0, maxLength: 2 }
    ),
    soup: fc.boolean(),
    porridge: fc.boolean(),
    noFish: fc.boolean(),
    beverages: fc.array(
      fc.constantFrom('tee', 'kakao', 'milch_heiß', 'milch_kalt'),
      { minLength: 0, maxLength: 2 }
    ),
    additions: fc.array(
      fc.constantFrom('zucker', 'süßstoff'),
      { minLength: 0, maxLength: 2 }
    ),
  })

  // Generator for meal orders
  const mealOrderGenerator = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    return fc.record({
      id: fc.uuid(),
      status: fc.constantFrom('pending' as const, 'prepared' as const, 'completed' as const),
      breakfastOptions: mealType === 'breakfast' ? breakfastOptionsGenerator : fc.constant(undefined),
      lunchOptions: mealType === 'lunch' ? lunchOptionsGenerator : fc.constant(undefined),
      dinnerOptions: mealType === 'dinner' ? dinnerOptionsGenerator : fc.constant(undefined),
    })
  }

  // Helper function to manually count ingredients
  function manuallyCountBreakfastIngredients(orders: MealOrder[]): Map<string, number> {
    const counts = new Map<string, number>()
    
    for (const order of orders) {
      // Only count pending or prepared orders
      if (order.status !== 'pending' && order.status !== 'prepared') continue
      if (!order.breakfastOptions) continue
      
      const options = order.breakfastOptions
      
      if (options.breadItems) {
        for (const item of options.breadItems) {
          counts.set(item, (counts.get(item) || 0) + 1)
        }
      }
      
      if (options.breadPreparation) {
        for (const prep of options.breadPreparation) {
          counts.set(prep, (counts.get(prep) || 0) + 1)
        }
      }
      
      if (options.spreads) {
        for (const spread of options.spreads) {
          counts.set(spread, (counts.get(spread) || 0) + 1)
        }
      }
      
      if (options.porridge) {
        counts.set('porridge', (counts.get('porridge') || 0) + 1)
      }
      
      if (options.beverages) {
        for (const beverage of options.beverages) {
          counts.set(beverage, (counts.get(beverage) || 0) + 1)
        }
      }
      
      if (options.additions) {
        for (const addition of options.additions) {
          counts.set(addition, (counts.get(addition) || 0) + 1)
        }
      }
    }
    
    return counts
  }

  function manuallyCountLunchIngredients(orders: MealOrder[]): Map<string, number> {
    const counts = new Map<string, number>()
    
    for (const order of orders) {
      // Only count pending or prepared orders
      if (order.status !== 'pending' && order.status !== 'prepared') continue
      if (!order.lunchOptions) continue
      
      const options = order.lunchOptions
      
      if (options.portionSize) {
        counts.set(options.portionSize, (counts.get(options.portionSize) || 0) + 1)
      }
      
      if (options.soup) {
        counts.set('soup', (counts.get('soup') || 0) + 1)
      }
      
      if (options.dessert) {
        counts.set('dessert', (counts.get('dessert') || 0) + 1)
      }
      
      if (options.specialPreparations) {
        for (const prep of options.specialPreparations) {
          counts.set(prep, (counts.get(prep) || 0) + 1)
        }
      }
      
      if (options.restrictions) {
        for (const restriction of options.restrictions) {
          counts.set(restriction, (counts.get(restriction) || 0) + 1)
        }
      }
    }
    
    return counts
  }

  function manuallyCountDinnerIngredients(orders: MealOrder[]): Map<string, number> {
    const counts = new Map<string, number>()
    
    for (const order of orders) {
      // Only count pending or prepared orders
      if (order.status !== 'pending' && order.status !== 'prepared') continue
      if (!order.dinnerOptions) continue
      
      const options = order.dinnerOptions
      
      if (options.breadItems) {
        for (const item of options.breadItems) {
          counts.set(item, (counts.get(item) || 0) + 1)
        }
      }
      
      if (options.breadPreparation) {
        for (const prep of options.breadPreparation) {
          counts.set(prep, (counts.get(prep) || 0) + 1)
        }
      }
      
      if (options.spreads) {
        for (const spread of options.spreads) {
          counts.set(spread, (counts.get(spread) || 0) + 1)
        }
      }
      
      if (options.soup) {
        counts.set('soup', (counts.get('soup') || 0) + 1)
      }
      
      if (options.porridge) {
        counts.set('porridge', (counts.get('porridge') || 0) + 1)
      }
      
      if (options.noFish) {
        counts.set('no_fish', (counts.get('no_fish') || 0) + 1)
      }
      
      if (options.beverages) {
        for (const beverage of options.beverages) {
          counts.set(beverage, (counts.get(beverage) || 0) + 1)
        }
      }
      
      if (options.additions) {
        for (const addition of options.additions) {
          counts.set(addition, (counts.get(addition) || 0) + 1)
        }
      }
    }
    
    return counts
  }

  test('Property 8: Breakfast ingredient aggregation correctness', () => {
    fc.assert(
      fc.property(
        fc.array(mealOrderGenerator('breakfast'), { minLength: 0, maxLength: 20 }),
        (orders) => {
          const aggregated = aggregateBreakfastIngredients(orders)
          const manualCounts = manuallyCountBreakfastIngredients(orders)
          
          // Check that all manually counted ingredients are in the aggregated result
          for (const [name, expectedCount] of manualCounts.entries()) {
            const aggregatedItem = aggregated.find(item => item.name === name)
            if (!aggregatedItem) {
              return false
            }
            if (aggregatedItem.quantity !== expectedCount) {
              return false
            }
          }
          
          // Check that aggregated result doesn't have extra ingredients
          if (aggregated.length !== manualCounts.size) {
            return false
          }
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Property 8: Lunch ingredient aggregation correctness', () => {
    fc.assert(
      fc.property(
        fc.array(mealOrderGenerator('lunch'), { minLength: 0, maxLength: 20 }),
        (orders) => {
          const aggregated = aggregateLunchIngredients(orders)
          const manualCounts = manuallyCountLunchIngredients(orders)
          
          // Check that all manually counted ingredients are in the aggregated result
          for (const [name, expectedCount] of manualCounts.entries()) {
            const aggregatedItem = aggregated.find(item => item.name === name)
            if (!aggregatedItem) {
              return false
            }
            if (aggregatedItem.quantity !== expectedCount) {
              return false
            }
          }
          
          // Check that aggregated result doesn't have extra ingredients
          if (aggregated.length !== manualCounts.size) {
            return false
          }
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Property 8: Dinner ingredient aggregation correctness', () => {
    fc.assert(
      fc.property(
        fc.array(mealOrderGenerator('dinner'), { minLength: 0, maxLength: 20 }),
        (orders) => {
          const aggregated = aggregateDinnerIngredients(orders)
          const manualCounts = manuallyCountDinnerIngredients(orders)
          
          // Check that all manually counted ingredients are in the aggregated result
          for (const [name, expectedCount] of manualCounts.entries()) {
            const aggregatedItem = aggregated.find(item => item.name === name)
            if (!aggregatedItem) {
              return false
            }
            if (aggregatedItem.quantity !== expectedCount) {
              return false
            }
          }
          
          // Check that aggregated result doesn't have extra ingredients
          if (aggregated.length !== manualCounts.size) {
            return false
          }
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Property 8: Aggregation filters by order status (only pending and prepared)', () => {
    fc.assert(
      fc.property(
        fc.array(mealOrderGenerator('breakfast'), { minLength: 1, maxLength: 20 }),
        (orders) => {
          // Ensure we have at least one completed order
          const ordersWithCompleted = [
            ...orders,
            {
              id: 'completed-order',
              status: 'completed' as const,
              breakfastOptions: {
                followsPlan: false,
                breadItems: ['brötchen'],
                breadPreparation: [],
                spreads: ['butter'],
                porridge: false,
                beverages: ['kaffee'],
                additions: [],
              },
            },
          ]
          
          const aggregated = aggregateBreakfastIngredients(ordersWithCompleted)
          const manualCounts = manuallyCountBreakfastIngredients(ordersWithCompleted)
          
          // The aggregated result should match manual counts (which also filters by status)
          for (const [name, expectedCount] of manualCounts.entries()) {
            const aggregatedItem = aggregated.find(item => item.name === name)
            if (!aggregatedItem) {
              return false
            }
            if (aggregatedItem.quantity !== expectedCount) {
              return false
            }
          }
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})
