/**
 * User Permissions Caching Service
 * 
 * Provides caching for user role permissions to reduce database queries.
 * User roles change infrequently, making them ideal for caching.
 * 
 * Requirements: NFR-1 (Performance)
 */

import type { Payload } from 'payload'
import cache, { CacheKeys, CacheTTL, getOrSet } from './index'

export interface UserPermissions {
  userId: string
  role: 'admin' | 'caregiver' | 'kitchen'
  canCreateMealOrders: boolean
  canUpdateMealOrders: boolean
  canDeleteMealOrders: boolean
  canViewAllMealOrders: boolean
  canUpdateOrderStatus: boolean
  canManageResidents: boolean
  canViewResidents: boolean
  canManageUsers: boolean
  canViewAuditLogs: boolean
  canViewVersionHistory: boolean
}

/**
 * Get user permissions with caching
 * Caches for 10 minutes
 */
export async function getCachedUserPermissions(
  payload: Payload,
  userId: string
): Promise<UserPermissions> {
  const key = CacheKeys.userPermissions(userId)
  
  return getOrSet(
    key,
    async () => {
      // Fetch user data
      const user = await payload.findByID({
        collection: 'users',
        id: userId,
      })
      
      // Calculate permissions based on role
      return calculatePermissions(userId, user.role)
    },
    CacheTTL.USER_PERMISSIONS
  )
}

/**
 * Calculate permissions based on user role
 */
function calculatePermissions(
  userId: string,
  role: 'admin' | 'caregiver' | 'kitchen'
): UserPermissions {
  const basePermissions: UserPermissions = {
    userId,
    role,
    canCreateMealOrders: false,
    canUpdateMealOrders: false,
    canDeleteMealOrders: false,
    canViewAllMealOrders: false,
    canUpdateOrderStatus: false,
    canManageResidents: false,
    canViewResidents: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    canViewVersionHistory: false,
  }
  
  switch (role) {
    case 'admin':
      return {
        ...basePermissions,
        canCreateMealOrders: true,
        canUpdateMealOrders: true,
        canDeleteMealOrders: true,
        canViewAllMealOrders: true,
        canUpdateOrderStatus: true,
        canManageResidents: true,
        canViewResidents: true,
        canManageUsers: true,
        canViewAuditLogs: true,
        canViewVersionHistory: true,
      }
    
    case 'caregiver':
      return {
        ...basePermissions,
        canCreateMealOrders: true,
        canUpdateMealOrders: true, // Only pending orders
        canViewResidents: true,
      }
    
    case 'kitchen':
      return {
        ...basePermissions,
        canViewAllMealOrders: true,
        canUpdateOrderStatus: true,
        canViewResidents: true,
      }
    
    default:
      return basePermissions
  }
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
  payload: Payload,
  userId: string,
  permission: keyof Omit<UserPermissions, 'userId' | 'role'>
): Promise<boolean> {
  const permissions = await getCachedUserPermissions(payload, userId)
  return permissions[permission]
}

/**
 * Invalidate user permissions cache
 * Call this when a user's role is changed
 */
export function invalidateUserPermissionsCache(userId: string): void {
  cache.delete(CacheKeys.userPermissions(userId))
}

/**
 * Invalidate all user permissions caches
 * Call this when permission logic changes
 */
export function invalidateAllUserPermissions(): void {
  cache.deletePattern('^user:.*:permissions$')
}
