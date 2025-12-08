/**
 * Role-based Access Control Policies
 * Centralized policy definitions used across the application
 */

type UserRole = 'admin' | 'kitchen' | 'caregiver'

export const RBAC_POLICIES = {
  // Caregiver Interface - Create and manage meal orders
  'caregiver.access': ['admin', 'caregiver'] as UserRole[],
  
  // Kitchen Dashboard - View orders and manage preparation
  'kitchen.access': ['admin', 'kitchen'] as UserRole[],
  
  // Reports - Generate and view reports
  'reports.access': ['admin', 'caregiver', 'kitchen'] as UserRole[],
  
  // Audit Logs - View system activity
  'audit.access': ['admin'] as UserRole[],
  
  // Meal Order Operations
  'meal.read': ['admin', 'kitchen', 'caregiver'] as UserRole[],
  'meal.create': ['admin', 'caregiver'] as UserRole[],
  'meal.update': ['admin', 'kitchen'] as UserRole[],
  'meal.delete': ['admin'] as UserRole[],
  
  // Resident Operations
  'resident.read': ['admin', 'caregiver', 'kitchen'] as UserRole[],
  'resident.create': ['admin'] as UserRole[],
  'resident.update': ['admin'] as UserRole[],
  'resident.delete': ['admin'] as UserRole[],
  
  // Audit Log Operations
  'audit.read': ['admin', 'caregiver'] as UserRole[],
  'audit.create': ['admin'] as UserRole[],
  
  // User Management
  'user.read': ['admin'] as UserRole[],
  'user.create': ['admin'] as UserRole[],
  'user.update': ['admin'] as UserRole[],
  'user.delete': ['admin'] as UserRole[],
}

/**
 * Check if a user has access to a specific policy
 * @param userRole - The user's role (string | undefined | null)
 * @param policyKey - The policy key to check
 * @returns true if user has access, false otherwise
 */
export function can(userRole: string | undefined | null, policyKey: keyof typeof RBAC_POLICIES): boolean {
  if (!userRole) return false
  const roles = RBAC_POLICIES[policyKey]
  return roles.includes(userRole as UserRole)
}

/**
 * Get all policies a user can access
 * @param userRole - The user's role (string | undefined | null)
 * @returns Array of policy keys the user can access
 */
export function getUserAccessiblePolicies(userRole: string | undefined | null): (keyof typeof RBAC_POLICIES)[] {
  if (!userRole) return []
  
  return Object.entries(RBAC_POLICIES).reduce((acc, [key, roles]) => {
    if (roles.includes(userRole as 'admin' | 'kitchen' | 'caregiver')) {
      acc.push(key as keyof typeof RBAC_POLICIES)
    }
    return acc
  }, [] as (keyof typeof RBAC_POLICIES)[])
}
