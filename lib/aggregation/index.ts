/**
 * Ingredient Aggregation Service
 * 
 * This module provides functions to aggregate ingredient quantities from meal orders.
 * It processes breakfast, lunch, and dinner orders separately, counting each ingredient
 * across all orders with pending or prepared status.
 */

export interface IngredientSummary {
  name: string
  category: string
  quantity: number
  unit: string
}

export interface MealOrder {
  id: string
  status: 'pending' | 'prepared' | 'completed'
  breakfastOptions?: {
    followsPlan?: boolean
    breadItems?: string[]
    breadPreparation?: string[]
    spreads?: string[]
    porridge?: boolean
    beverages?: string[]
    additions?: string[]
  }
  lunchOptions?: {
    portionSize?: 'small' | 'large' | 'vegetarian'
    soup?: boolean
    dessert?: boolean
    specialPreparations?: string[]
    restrictions?: string[]
  }
  dinnerOptions?: {
    followsPlan?: boolean
    breadItems?: string[]
    breadPreparation?: string[]
    spreads?: string[]
    soup?: boolean
    porridge?: boolean
    noFish?: boolean
    beverages?: string[]
    additions?: string[]
  }
}

/**
 * Aggregates breakfast ingredients from meal orders
 * Only includes orders with status 'pending' or 'prepared'
 */
export function aggregateBreakfastIngredients(orders: MealOrder[]): IngredientSummary[] {
  const ingredientCounts = new Map<string, number>()
  
  // Filter orders by status
  const validOrders = orders.filter(
    order => order.status === 'pending' || order.status === 'prepared'
  )
  
  for (const order of validOrders) {
    if (!order.breakfastOptions) continue
    
    const options = order.breakfastOptions
    
    // Count bread items
    if (options.breadItems) {
      for (const item of options.breadItems) {
        ingredientCounts.set(item, (ingredientCounts.get(item) || 0) + 1)
      }
    }
    
    // Count bread preparations
    if (options.breadPreparation) {
      for (const prep of options.breadPreparation) {
        ingredientCounts.set(prep, (ingredientCounts.get(prep) || 0) + 1)
      }
    }
    
    // Count spreads
    if (options.spreads) {
      for (const spread of options.spreads) {
        ingredientCounts.set(spread, (ingredientCounts.get(spread) || 0) + 1)
      }
    }
    
    // Count porridge
    if (options.porridge) {
      ingredientCounts.set('porridge', (ingredientCounts.get('porridge') || 0) + 1)
    }
    
    // Count beverages
    if (options.beverages) {
      for (const beverage of options.beverages) {
        ingredientCounts.set(beverage, (ingredientCounts.get(beverage) || 0) + 1)
      }
    }
    
    // Count additions
    if (options.additions) {
      for (const addition of options.additions) {
        ingredientCounts.set(addition, (ingredientCounts.get(addition) || 0) + 1)
      }
    }
  }
  
  // Convert map to array of IngredientSummary
  return Array.from(ingredientCounts.entries()).map(([name, quantity]) => ({
    name,
    category: categorizeBreakfastIngredient(name),
    quantity,
    unit: 'count',
  }))
}

/**
 * Aggregates lunch ingredients from meal orders
 * Only includes orders with status 'pending' or 'prepared'
 */
export function aggregateLunchIngredients(orders: MealOrder[]): IngredientSummary[] {
  const ingredientCounts = new Map<string, number>()
  
  // Filter orders by status
  const validOrders = orders.filter(
    order => order.status === 'pending' || order.status === 'prepared'
  )
  
  for (const order of validOrders) {
    if (!order.lunchOptions) continue
    
    const options = order.lunchOptions
    
    // Count portion sizes
    if (options.portionSize) {
      ingredientCounts.set(options.portionSize, (ingredientCounts.get(options.portionSize) || 0) + 1)
    }
    
    // Count soup
    if (options.soup) {
      ingredientCounts.set('soup', (ingredientCounts.get('soup') || 0) + 1)
    }
    
    // Count dessert
    if (options.dessert) {
      ingredientCounts.set('dessert', (ingredientCounts.get('dessert') || 0) + 1)
    }
    
    // Count special preparations
    if (options.specialPreparations) {
      for (const prep of options.specialPreparations) {
        ingredientCounts.set(prep, (ingredientCounts.get(prep) || 0) + 1)
      }
    }
    
    // Count restrictions (these are informational, not ingredients)
    if (options.restrictions) {
      for (const restriction of options.restrictions) {
        ingredientCounts.set(restriction, (ingredientCounts.get(restriction) || 0) + 1)
      }
    }
  }
  
  // Convert map to array of IngredientSummary
  return Array.from(ingredientCounts.entries()).map(([name, quantity]) => ({
    name,
    category: categorizeLunchIngredient(name),
    quantity,
    unit: 'count',
  }))
}

/**
 * Aggregates dinner ingredients from meal orders
 * Only includes orders with status 'pending' or 'prepared'
 */
export function aggregateDinnerIngredients(orders: MealOrder[]): IngredientSummary[] {
  const ingredientCounts = new Map<string, number>()
  
  // Filter orders by status
  const validOrders = orders.filter(
    order => order.status === 'pending' || order.status === 'prepared'
  )
  
  for (const order of validOrders) {
    if (!order.dinnerOptions) continue
    
    const options = order.dinnerOptions
    
    // Count bread items
    if (options.breadItems) {
      for (const item of options.breadItems) {
        ingredientCounts.set(item, (ingredientCounts.get(item) || 0) + 1)
      }
    }
    
    // Count bread preparations
    if (options.breadPreparation) {
      for (const prep of options.breadPreparation) {
        ingredientCounts.set(prep, (ingredientCounts.get(prep) || 0) + 1)
      }
    }
    
    // Count spreads
    if (options.spreads) {
      for (const spread of options.spreads) {
        ingredientCounts.set(spread, (ingredientCounts.get(spread) || 0) + 1)
      }
    }
    
    // Count soup
    if (options.soup) {
      ingredientCounts.set('soup', (ingredientCounts.get('soup') || 0) + 1)
    }
    
    // Count porridge
    if (options.porridge) {
      ingredientCounts.set('porridge', (ingredientCounts.get('porridge') || 0) + 1)
    }
    
    // Count noFish restriction
    if (options.noFish) {
      ingredientCounts.set('no_fish', (ingredientCounts.get('no_fish') || 0) + 1)
    }
    
    // Count beverages
    if (options.beverages) {
      for (const beverage of options.beverages) {
        ingredientCounts.set(beverage, (ingredientCounts.get(beverage) || 0) + 1)
      }
    }
    
    // Count additions
    if (options.additions) {
      for (const addition of options.additions) {
        ingredientCounts.set(addition, (ingredientCounts.get(addition) || 0) + 1)
      }
    }
  }
  
  // Convert map to array of IngredientSummary
  return Array.from(ingredientCounts.entries()).map(([name, quantity]) => ({
    name,
    category: categorizeDinnerIngredient(name),
    quantity,
    unit: 'count',
  }))
}

/**
 * Helper function to categorize breakfast ingredients
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

/**
 * Helper function to categorize lunch ingredients
 */
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

/**
 * Helper function to categorize dinner ingredients
 */
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
