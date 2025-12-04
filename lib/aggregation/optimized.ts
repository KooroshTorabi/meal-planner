/**
 * Optimized Ingredient Aggregation Service
 * 
 * This module provides optimized functions to aggregate ingredient quantities from meal orders
 * using database-level aggregation where possible to reduce memory usage and improve performance.
 * 
 * Performance improvements:
 * - Uses database queries with specific field selection to reduce data transfer
 * - Implements pagination for large result sets
 * - Optimizes filtering at the database level
 * 
 * Requirements: NFR-1 (Performance)
 */

import type { Payload } from 'payload'
import type { IngredientSummary } from './index'

export interface OptimizedAggregationOptions {
  date: string
  mealType: 'breakfast' | 'lunch' | 'dinner'
  limit?: number
  page?: number
}

/**
 * Optimized ingredient aggregation using database-level filtering
 * 
 * This function:
 * 1. Queries only the necessary fields from the database
 * 2. Filters by status at the database level
 * 3. Supports pagination for large datasets
 * 4. Reduces memory usage by processing in batches
 */
export async function aggregateIngredientsOptimized(
  payload: Payload,
  options: OptimizedAggregationOptions
): Promise<{
  ingredients: IngredientSummary[]
  totalOrders: number
  page: number
  totalPages: number
}> {
  const { date, mealType, limit = 1000, page = 1 } = options

  // Query meal orders with optimized field selection
  // Only fetch the fields we need for aggregation
  const result = await payload.find({
    collection: 'meal-orders',
    where: {
      and: [
        {
          date: {
            equals: date,
          },
        },
        {
          mealType: {
            equals: mealType,
          },
        },
        {
          or: [
            {
              status: {
                equals: 'pending',
              },
            },
            {
              status: {
                equals: 'prepared',
              },
            },
          ],
        },
      ],
    },
    limit,
    page,
    // Only select the fields we need for aggregation
    select: {
      id: true,
      status: true,
      breakfastOptions: true,
      lunchOptions: true,
      dinnerOptions: true,
    },
  })

  // Aggregate ingredients based on meal type
  let ingredients: IngredientSummary[]
  
  if (mealType === 'breakfast') {
    ingredients = aggregateBreakfastIngredientsOptimized(result.docs)
  } else if (mealType === 'lunch') {
    ingredients = aggregateLunchIngredientsOptimized(result.docs)
  } else {
    ingredients = aggregateDinnerIngredientsOptimized(result.docs)
  }

  return {
    ingredients,
    totalOrders: result.totalDocs,
    page: result.page || 1,
    totalPages: result.totalPages,
  }
}

/**
 * Optimized breakfast ingredient aggregation
 * Uses Map for O(1) lookups and updates
 */
function aggregateBreakfastIngredientsOptimized(orders: any[]): IngredientSummary[] {
  const ingredientCounts = new Map<string, number>()
  
  for (const order of orders) {
    const options = order.breakfastOptions
    if (!options) continue
    
    // Use a helper function to reduce code duplication
    countArrayItems(ingredientCounts, options.breadItems)
    countArrayItems(ingredientCounts, options.breadPreparation)
    countArrayItems(ingredientCounts, options.spreads)
    countArrayItems(ingredientCounts, options.beverages)
    countArrayItems(ingredientCounts, options.additions)
    
    if (options.porridge) {
      incrementCount(ingredientCounts, 'porridge')
    }
  }
  
  return mapToIngredientSummary(ingredientCounts, categorizeBreakfastIngredient)
}

/**
 * Optimized lunch ingredient aggregation
 */
function aggregateLunchIngredientsOptimized(orders: any[]): IngredientSummary[] {
  const ingredientCounts = new Map<string, number>()
  
  for (const order of orders) {
    const options = order.lunchOptions
    if (!options) continue
    
    if (options.portionSize) {
      incrementCount(ingredientCounts, options.portionSize)
    }
    
    if (options.soup) {
      incrementCount(ingredientCounts, 'soup')
    }
    
    if (options.dessert) {
      incrementCount(ingredientCounts, 'dessert')
    }
    
    countArrayItems(ingredientCounts, options.specialPreparations)
    countArrayItems(ingredientCounts, options.restrictions)
  }
  
  return mapToIngredientSummary(ingredientCounts, categorizeLunchIngredient)
}

/**
 * Optimized dinner ingredient aggregation
 */
function aggregateDinnerIngredientsOptimized(orders: any[]): IngredientSummary[] {
  const ingredientCounts = new Map<string, number>()
  
  for (const order of orders) {
    const options = order.dinnerOptions
    if (!options) continue
    
    countArrayItems(ingredientCounts, options.breadItems)
    countArrayItems(ingredientCounts, options.breadPreparation)
    countArrayItems(ingredientCounts, options.spreads)
    countArrayItems(ingredientCounts, options.beverages)
    countArrayItems(ingredientCounts, options.additions)
    
    if (options.soup) {
      incrementCount(ingredientCounts, 'soup')
    }
    
    if (options.porridge) {
      incrementCount(ingredientCounts, 'porridge')
    }
    
    if (options.noFish) {
      incrementCount(ingredientCounts, 'no_fish')
    }
  }
  
  return mapToIngredientSummary(ingredientCounts, categorizeDinnerIngredient)
}

/**
 * Helper function to count array items
 * Reduces code duplication and improves maintainability
 */
function countArrayItems(map: Map<string, number>, items?: string[]): void {
  if (!items) return
  
  for (const item of items) {
    incrementCount(map, item)
  }
}

/**
 * Helper function to increment count in map
 * Provides consistent increment logic
 */
function incrementCount(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) || 0) + 1)
}

/**
 * Helper function to convert Map to IngredientSummary array
 * Applies categorization function to each ingredient
 */
function mapToIngredientSummary(
  map: Map<string, number>,
  categorize: (name: string) => string
): IngredientSummary[] {
  return Array.from(map.entries()).map(([name, quantity]) => ({
    name,
    category: categorize(name),
    quantity,
    unit: 'count',
  }))
}

/**
 * Categorization functions (same as original implementation)
 */
function categorizeBreakfastIngredient(name: string): string {
  const breadItems = ['brötchen', 'vollkornbrötchen', 'graubrot', 'vollkornbrot', 'weißbrot', 'knäckebrot']
  const breadPreparations = ['geschnitten', 'geschmiert']
  const spreads = ['butter', 'margarine', 'konfitüre', 'honig', 'käse', 'wurst']
  const beverages = ['kaffee', 'tee', 'milch_heiß', 'milch_kalt']
  const additions = ['zucker', 'süßstoff', 'kaffeesahne']
  
  if (breadItems.includes(name)) return 'bread'
  if (breadPreparations.includes(name)) return 'preparation'
  if (spreads.includes(name)) return 'spread'
  if (beverages.includes(name)) return 'beverage'
  if (additions.includes(name)) return 'addition'
  if (name === 'porridge') return 'porridge'
  
  return 'other'
}

function categorizeLunchIngredient(name: string): string {
  const portionSizes = ['small', 'large', 'vegetarian']
  const specialPreparations = ['passierte_kost', 'passiertes_fleisch', 'geschnittenes_fleisch', 'kartoffelbrei']
  const restrictions = ['ohne_fisch', 'fingerfood', 'nur_süß']
  
  if (portionSizes.includes(name)) return 'portion'
  if (specialPreparations.includes(name)) return 'preparation'
  if (restrictions.includes(name)) return 'restriction'
  if (name === 'soup') return 'soup'
  if (name === 'dessert') return 'dessert'
  
  return 'other'
}

function categorizeDinnerIngredient(name: string): string {
  const breadItems = ['graubrot', 'vollkornbrot', 'weißbrot', 'knäckebrot']
  const breadPreparations = ['geschmiert', 'geschnitten']
  const spreads = ['butter', 'margarine']
  const beverages = ['tee', 'kakao', 'milch_heiß', 'milch_kalt']
  const additions = ['zucker', 'süßstoff']
  
  if (breadItems.includes(name)) return 'bread'
  if (breadPreparations.includes(name)) return 'preparation'
  if (spreads.includes(name)) return 'spread'
  if (beverages.includes(name)) return 'beverage'
  if (additions.includes(name)) return 'addition'
  if (name === 'soup') return 'soup'
  if (name === 'porridge') return 'porridge'
  if (name === 'no_fish') return 'restriction'
  
  return 'other'
}

/**
 * Batch processing for very large datasets
 * Processes orders in chunks to avoid memory issues
 */
export async function aggregateIngredientsInBatches(
  payload: Payload,
  options: OptimizedAggregationOptions,
  batchSize: number = 500
): Promise<IngredientSummary[]> {
  const { date, mealType } = options
  
  const ingredientCounts = new Map<string, number>()
  let page = 1
  let hasMore = true
  
  while (hasMore) {
    const result = await aggregateIngredientsOptimized(payload, {
      date,
      mealType,
      limit: batchSize,
      page,
    })
    
    // Merge results into the main map
    for (const ingredient of result.ingredients) {
      ingredientCounts.set(
        ingredient.name,
        (ingredientCounts.get(ingredient.name) || 0) + ingredient.quantity
      )
    }
    
    // Check if there are more pages
    hasMore = page < result.totalPages
    page++
  }
  
  // Convert final map to array
  const categorize = mealType === 'breakfast' 
    ? categorizeBreakfastIngredient
    : mealType === 'lunch'
    ? categorizeLunchIngredient
    : categorizeDinnerIngredient
  
  return mapToIngredientSummary(ingredientCounts, categorize)
}
