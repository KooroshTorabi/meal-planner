/**
 * Audit Logging Utilities
 * Functions to create audit log entries for authentication and authorization events
 */

import type { Payload } from 'payload'
import type { NextRequest } from 'next/server'

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest | Request): string {
  if ('headers' in request) {
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'
    )
  }
  return 'unknown'
}

/**
 * Get user agent from request
 */
function getUserAgent(request: NextRequest | Request): string {
  if ('headers' in request) {
    return request.headers.get('user-agent') || 'unknown'
  }
  return 'unknown'
}

/**
 * Log successful login
 */
export async function logLoginSuccess(
  payload: Payload,
  userId: string,
  email: string,
  ipAddress?: string,
  request?: NextRequest | Request
): Promise<void> {
  try {
    await payload.create({
      collection: 'audit-logs',
      data: {
        action: 'login_success',
        userId,
        email,
        status: 'success',
        ipAddress: ipAddress || (request ? getClientIp(request) : 'unknown'),
        userAgent: request ? getUserAgent(request) : undefined,
        resource: 'users',
      },
    })
  } catch (error) {
    console.error('Failed to log login success:', error)
  }
}

/**
 * Log failed login attempt
 */
export async function logLoginFailure(
  payload: Payload,
  email: string,
  ipAddress?: string,
  errorMessage?: string,
  request?: NextRequest | Request
): Promise<void> {
  try {
    await payload.create({
      collection: 'audit-logs',
      data: {
        action: 'login_failure',
        email,
        status: 'failure',
        ipAddress: ipAddress || (request ? getClientIp(request) : 'unknown'),
        userAgent: request ? getUserAgent(request) : undefined,
        resource: 'users',
        errorMessage: errorMessage || 'Invalid credentials',
      },
    })
  } catch (error) {
    console.error('Failed to log login failure:', error)
  }
}

/**
 * Log logout
 */
export async function logLogout(
  payload: Payload,
  userId: string,
  email: string,
  request?: NextRequest | Request
): Promise<void> {
  try {
    await payload.create({
      collection: 'audit-logs',
      data: {
        action: 'logout',
        userId,
        email,
        status: 'success',
        ipAddress: request ? getClientIp(request) : 'unknown',
        userAgent: request ? getUserAgent(request) : undefined,
        resource: 'users',
      },
    })
  } catch (error) {
    console.error('Failed to log logout:', error)
  }
}

/**
 * Log unauthorized access attempt
 */
export async function logUnauthorizedAccess(
  payload: Payload,
  resource: string,
  userId?: string,
  email?: string,
  request?: NextRequest | Request,
  details?: Record<string, any>
): Promise<void> {
  try {
    await payload.create({
      collection: 'audit-logs',
      data: {
        action: 'unauthorized_access',
        userId,
        email,
        status: 'denied',
        ipAddress: request ? getClientIp(request) : 'unknown',
        userAgent: request ? getUserAgent(request) : undefined,
        resource,
        details,
      },
    })
  } catch (error) {
    console.error('Failed to log unauthorized access:', error)
  }
}

/**
 * Log data modification (create, update, delete)
 */
export async function logDataModification(
  payload: Payload,
  action: 'data_create' | 'data_update' | 'data_delete',
  resource: string,
  resourceId: string,
  userId: string,
  email: string,
  request?: NextRequest | Request,
  details?: Record<string, any>
): Promise<void> {
  try {
    await payload.create({
      collection: 'audit-logs',
      data: {
        action,
        userId,
        email,
        status: 'success',
        ipAddress: request ? getClientIp(request) : 'unknown',
        userAgent: request ? getUserAgent(request) : undefined,
        resource,
        resourceId,
        details,
      },
    })
  } catch (error) {
    console.error('Failed to log data modification:', error)
  }
}
