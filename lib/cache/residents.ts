/**
 * Resident Data Caching Service
 * 
 * Provides caching for resident data to reduce database queries.
 * Residents data changes infrequently, making it ideal for caching.
 * 
 * Requirements: NFR-1 (Performance)
 */

import type { Payload } from 'payload'
import cache, { CacheKeys, CacheTTL, getOrSet } from './index'

/**
 * Get a resident by ID with caching
 * Caches for 5 minutes
 */
export async function getCachedResident(payload: Payload, id: string): Promise<any> {
  const key = CacheKeys.resident(id)
  
  return getOrSet(
    key,
    async () => {
      return await payload.findByID({
        collection: 'residents',
        id,
      })
    },
    CacheTTL.RESIDENT
  )
}

/**
 * Get all active residents with caching
 * Caches for 5 minutes
 */
export async function getCachedActiveResidents(payload: Payload): Promise<any> {
  const key = CacheKeys.residents('active')
  
  return getOrSet(
    key,
    async () => {
      const result = await payload.find({
        collection: 'residents',
        where: {
          active: {
            equals: true,
          },
        },
        limit: 1000,
        sort: 'name',
      })
      
      return result.docs
    },
    CacheTTL.RESIDENT
  )
}

/**
 * Get all residents with caching
 * Caches for 5 minutes
 */
export async function getCachedResidents(
  payload: Payload,
  limit: number = 100,
  page: number = 1
): Promise<any> {
  const key = CacheKeys.residents(`limit:${limit}:page:${page}`)
  
  return getOrSet(
    key,
    async () => {
      return await payload.find({
        collection: 'residents',
        limit,
        page,
        sort: 'name',
      })
    },
    CacheTTL.RESIDENT
  )
}

/**
 * Invalidate resident cache
 * Call this when a resident is created, updated, or deleted
 */
export function invalidateResidentCache(residentId?: string): void {
  if (residentId) {
    // Invalidate specific resident
    cache.delete(CacheKeys.resident(residentId))
  }
  
  // Invalidate all resident list caches
  cache.deletePattern('^residents:')
}
