# Caching Service

## Overview

This directory contains the caching service for the Meal Planner System. The caching layer reduces database queries and improves response times for frequently accessed data.

## Architecture

### In-Memory Cache

The system uses an in-memory cache with TTL (Time To Live) support:

- **Storage**: JavaScript Map for O(1) lookups
- **Expiration**: Automatic cleanup of expired entries every minute
- **Invalidation**: Manual invalidation on data updates

### Cached Data

1. **Resident Data** (TTL: 5 minutes)
   - Individual residents by ID
   - List of active residents
   - Paginated resident lists
   - Rationale: Resident data changes infrequently

2. **User Permissions** (TTL: 10 minutes)
   - User role-based permissions
   - Permission checks
   - Rationale: User roles change very infrequently

3. **Meal Order Aggregations** (TTL: 1 minute)
   - Ingredient aggregations by date and meal type
   - Rationale: Needs to be relatively fresh for kitchen operations

## Usage

### Basic Cache Operations

```typescript
import cache, { CacheKeys, CacheTTL } from '@/lib/cache'

// Set a value
cache.set('my-key', { data: 'value' }, CacheTTL.RESIDENT)

// Get a value
const value = cache.get('my-key')

// Delete a value
cache.delete('my-key')

// Delete by pattern
cache.deletePattern('^resident:')

// Clear all cache
cache.clear()
```

### Get or Set Pattern

```typescript
import { getOrSet, CacheKeys, CacheTTL } from '@/lib/cache'

const resident = await getOrSet(
  CacheKeys.resident(id),
  async () => {
    // This function only runs if cache miss
    return await payload.findByID({
      collection: 'residents',
      id,
    })
  },
  CacheTTL.RESIDENT
)
```

### Resident Caching

```typescript
import { getCachedResident, getCachedActiveResidents } from '@/lib/cache/residents'

// Get a single resident with caching
const resident = await getCachedResident(payload, residentId)

// Get all active residents with caching
const activeResidents = await getCachedActiveResidents(payload)
```

### Permission Caching

```typescript
import { getCachedUserPermissions, hasPermission } from '@/lib/cache/permissions'

// Get user permissions
const permissions = await getCachedUserPermissions(payload, userId)

// Check specific permission
const canCreate = await hasPermission(payload, userId, 'canCreateMealOrders')
```

## Cache Invalidation

### Automatic Invalidation

Cache invalidation is automatically triggered by collection hooks:

1. **Residents Collection**
   - `afterChange`: Invalidates resident cache after create/update
   - `afterDelete`: Invalidates resident cache after deletion

2. **Meal Orders Collection**
   - `afterChange`: Invalidates meal order and aggregation caches

3. **Users Collection**
   - `afterChange`: Invalidates user permissions cache when role changes

### Manual Invalidation

```typescript
import { 
  invalidateResidents, 
  invalidateMealOrders,
  invalidateUserPermissions 
} from '@/lib/cache'

// Invalidate all resident caches
invalidateResidents()

// Invalidate all meal order caches
invalidateMealOrders()

// Invalidate specific user permissions
invalidateUserPermissions(userId)
```

## Cache Keys

Consistent cache key naming using the `CacheKeys` helper:

```typescript
import { CacheKeys } from '@/lib/cache'

CacheKeys.resident(id)                    // 'resident:{id}'
CacheKeys.residents('active')             // 'residents:active'
CacheKeys.userPermissions(userId)         // 'user:{userId}:permissions'
CacheKeys.mealOrderAggregation(date, type) // 'aggregation:{date}:{type}'
```

## TTL Configuration

Cache TTL values are defined in `CacheTTL`:

```typescript
import { CacheTTL } from '@/lib/cache'

CacheTTL.RESIDENT                // 5 minutes
CacheTTL.USER_PERMISSIONS        // 10 minutes
CacheTTL.MEAL_ORDER_AGGREGATION  // 1 minute
CacheTTL.MEAL_ORDERS             // 2 minutes
```

## Performance Impact

Expected performance improvements with caching:

- **Resident Queries**: 70-90% faster for cached data
- **Permission Checks**: 80-95% faster for cached permissions
- **Aggregation Queries**: 40-60% faster for cached aggregations
- **Database Load**: 50-70% reduction in database queries

## Monitoring

Get cache statistics:

```typescript
import cache from '@/lib/cache'

const stats = cache.getStats()
console.log(`Cache size: ${stats.size}`)
console.log(`Cached keys: ${stats.keys.join(', ')}`)
```

## Production Considerations

### Current Implementation

The current implementation uses in-memory caching, which is suitable for:
- Single-server deployments
- Development and testing
- Small to medium-scale applications

### Scaling to Production

For production deployments with multiple servers, consider:

1. **Redis Cache**
   - Distributed caching across multiple servers
   - Persistent cache storage
   - Advanced features (pub/sub for cache invalidation)

2. **Cache Warming**
   - Pre-populate cache on server startup
   - Reduce initial cold-start latency

3. **Cache Monitoring**
   - Track hit/miss ratios
   - Monitor cache size and memory usage
   - Alert on cache performance issues

## Requirements

- Validates: NFR-1 (Performance Requirements)
- Related Tasks: Task 20.3 (Implement caching strategy)

## Future Enhancements

1. **Redis Integration**: Replace in-memory cache with Redis for distributed caching
2. **Cache Warming**: Pre-populate frequently accessed data on startup
3. **Cache Metrics**: Add detailed metrics for hit/miss ratios and performance tracking
4. **Adaptive TTL**: Adjust TTL based on data access patterns
5. **Cache Compression**: Compress large cached values to reduce memory usage
