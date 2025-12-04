/**
 * Caching Service
 * 
 * Provides in-memory caching with TTL (Time To Live) support for frequently accessed data.
 * 
 * Cached data:
 * 1. Resident data - rarely changes, cached for 5 minutes
 * 2. User role permissions - changes infrequently, cached for 10 minutes
 * 3. Meal order aggregations - cached for 1 minute (real-time updates needed)
 * 
 * Cache invalidation:
 * - Automatic expiration based on TTL
 * - Manual invalidation on data updates
 * - Collection-level invalidation
 * 
 * Requirements: NFR-1 (Performance)
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class Cache {
  private cache: Map<string, CacheEntry<any>>
  private defaultTTL: number

  constructor(defaultTTL: number = 300000) { // Default 5 minutes
    this.cache = new Map()
    this.defaultTTL = defaultTTL
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000)
  }

  /**
   * Get a value from the cache
   * Returns undefined if the key doesn't exist or has expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return undefined
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }
    
    return entry.data as T
  }

  /**
   * Set a value in the cache with optional TTL
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in milliseconds (optional, uses default if not provided)
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL)
    
    this.cache.set(key, {
      data,
      expiresAt,
    })
  }

  /**
   * Delete a specific key from the cache
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Delete all keys matching a pattern
   * Useful for invalidating all cached data for a collection
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    const keys = Array.from(this.cache.keys())
    
    for (const key of keys) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())
    
    for (const [key, entry] of entries) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

// Create a singleton cache instance
const cache = new Cache()

export default cache

/**
 * Cache key generators for consistent key naming
 */
export const CacheKeys = {
  resident: (id: string) => `resident:${id}`,
  residents: (filters?: string) => `residents:${filters || 'all'}`,
  userPermissions: (userId: string) => `user:${userId}:permissions`,
  mealOrderAggregation: (date: string, mealType: string) => `aggregation:${date}:${mealType}`,
  mealOrders: (date: string, mealType: string) => `meal-orders:${date}:${mealType}`,
}

/**
 * Cache TTL constants (in milliseconds)
 */
export const CacheTTL = {
  RESIDENT: 5 * 60 * 1000, // 5 minutes
  USER_PERMISSIONS: 10 * 60 * 1000, // 10 minutes
  MEAL_ORDER_AGGREGATION: 1 * 60 * 1000, // 1 minute
  MEAL_ORDERS: 2 * 60 * 1000, // 2 minutes
}

/**
 * Helper function to get or set cached data
 * If data is not in cache, fetches it using the provided function and caches it
 */
export async function getOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache
  const cached = cache.get<T>(key)
  
  if (cached !== undefined) {
    return cached
  }
  
  // Fetch data
  const data = await fetchFn()
  
  // Cache it
  cache.set(key, data, ttl)
  
  return data
}

/**
 * Invalidate cache for a specific collection
 * Call this when data in a collection is created, updated, or deleted
 */
export function invalidateCollection(collection: string): void {
  cache.deletePattern(`^${collection}:`)
}

/**
 * Invalidate cache for residents
 */
export function invalidateResidents(): void {
  cache.deletePattern('^resident')
}

/**
 * Invalidate cache for meal orders
 */
export function invalidateMealOrders(): void {
  cache.deletePattern('^meal-order')
  cache.deletePattern('^aggregation:')
}

/**
 * Invalidate cache for a specific user's permissions
 */
export function invalidateUserPermissions(userId: string): void {
  cache.delete(CacheKeys.userPermissions(userId))
}
