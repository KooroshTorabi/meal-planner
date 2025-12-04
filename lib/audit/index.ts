/**
 * Audit Logging Service
 * 
 * Provides functions to log authentication attempts, unauthorized access attempts,
 * and data modifications for audit trails and security monitoring.
 */

import type { Payload } from 'payload'
import type { NextRequest } from 'next/server'

export type AuditAction =
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'token_refresh'
  | '2fa_enable'
  | '2fa_verify'
  | 'unauthorized_access'
  | 'data_create'
  | 'data_update'
  | 'data_delete'
  | 'data_read'

export type AuditStatus = 'success' | 'failure' | 'denied'

export interface AuditLogData {
  action: AuditAction
  status: AuditStatus
  userId?: string
  email?: string
  ipAddress?: string
  userAgent?: string
  resource?: string
  resourceId?: string
  details?: Record<string, any>
  errorMessage?: string
}

/**
 * Extract client IP address from request
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Extract user agent from request
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown'
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  payload: Payload,
  data: AuditLogData
): Promise<void> {
  try {
    await payload.create({
      collection: 'audit-logs',
      data: {
        action: data.action,
        status: data.status,
        userId: data.userId,
        email: data.email,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        resource: data.resource,
        resourceId: data.resourceId,
        details: data.details,
        errorMessage: data.errorMessage,
      },
    })
  } catch (error) {
    // Log to console if audit log creation fails
    // Don't throw error to avoid breaking the main operation
    console.error('Failed to create audit log:', error)
  }
}

/**
 * Log authentication attempt
 */
export async function logAuthAttempt(
  payload: Payload,
  email: string,
  success: boolean,
  request: NextRequest,
  errorMessage?: string,
  details?: Record<string, any>
): Promise<void> {
  await createAuditLog(payload, {
    action: success ? 'login_success' : 'login_failure',
    status: success ? 'success' : 'failure',
    email,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
    errorMessage,
    details,
  })
}

/**
 * Log logout
 */
export async function logLogout(
  payload: Payload,
  userId: string,
  email: string,
  request: NextRequest
): Promise<void> {
  await createAuditLog(payload, {
    action: 'logout',
    status: 'success',
    userId,
    email,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  })
}

/**
 * Log token refresh
 */
export async function logTokenRefresh(
  payload: Payload,
  userId: string,
  email: string,
  success: boolean,
  request: NextRequest,
  errorMessage?: string
): Promise<void> {
  await createAuditLog(payload, {
    action: 'token_refresh',
    status: success ? 'success' : 'failure',
    userId,
    email,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
    errorMessage,
  })
}

/**
 * Log 2FA enable
 */
export async function log2FAEnable(
  payload: Payload,
  userId: string,
  email: string,
  request: NextRequest
): Promise<void> {
  await createAuditLog(payload, {
    action: '2fa_enable',
    status: 'success',
    userId,
    email,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  })
}

/**
 * Log 2FA verification
 */
export async function log2FAVerify(
  payload: Payload,
  email: string,
  success: boolean,
  request: NextRequest,
  errorMessage?: string
): Promise<void> {
  await createAuditLog(payload, {
    action: '2fa_verify',
    status: success ? 'success' : 'failure',
    email,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
    errorMessage,
  })
}

/**
 * Log unauthorized access attempt
 */
export async function logUnauthorizedAccess(
  payload: Payload,
  userId: string | undefined,
  email: string | undefined,
  resource: string,
  resourceId: string | undefined,
  request: NextRequest,
  details?: Record<string, any>
): Promise<void> {
  await createAuditLog(payload, {
    action: 'unauthorized_access',
    status: 'denied',
    userId,
    email,
    resource,
    resourceId,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
    details,
    errorMessage: 'Access denied due to insufficient permissions',
  })
}

/**
 * Log data modification (create, update, delete)
 */
export async function logDataModification(
  payload: Payload,
  action: 'data_create' | 'data_update' | 'data_delete',
  userId: string,
  email: string,
  resource: string,
  resourceId: string,
  details?: Record<string, any>
): Promise<void> {
  await createAuditLog(payload, {
    action,
    status: 'success',
    userId,
    email,
    resource,
    resourceId,
    details,
  })
}

/**
 * Log data read (for sensitive collections)
 */
export async function logDataRead(
  payload: Payload,
  userId: string,
  email: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, any>
): Promise<void> {
  await createAuditLog(payload, {
    action: 'data_read',
    status: 'success',
    userId,
    email,
    resource,
    resourceId,
    details,
  })
}

/**
 * Log unauthorized access from Payload access control
 * This is a simplified version that doesn't require NextRequest
 */
export async function logUnauthorizedAccessFromPayload(
  payload: Payload,
  userId: string | undefined,
  email: string | undefined,
  resource: string,
  operation: string,
  resourceId?: string,
  details?: Record<string, any>
): Promise<void> {
  await createAuditLog(payload, {
    action: 'unauthorized_access',
    status: 'denied',
    userId,
    email,
    resource,
    resourceId,
    details: {
      ...details,
      operation,
    },
    errorMessage: `Access denied for ${operation} operation on ${resource}`,
  })
}
