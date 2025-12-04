/**
 * Structured Logging System
 * 
 * Provides consistent logging with context, performance metrics, and security events
 * Requirements: NFR-5
 */

import { AppError } from '../errors/types'

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
}

/**
 * Log entry interface
 */
interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  error?: {
    name: string
    message: string
    stack?: string
    statusCode?: number
    isOperational?: boolean
  }
  performance?: {
    duration: number
    operation: string
  }
  security?: {
    event: string
    userId?: string
    ip?: string
    userAgent?: string
  }
  requestId?: string
}

/**
 * Format log entry as JSON string
 */
function formatLogEntry(entry: LogEntry): string {
  return JSON.stringify(entry, null, process.env.NODE_ENV === 'development' ? 2 : 0)
}

/**
 * Write log entry to appropriate output
 */
function writeLog(entry: LogEntry): void {
  const formatted = formatLogEntry(entry)

  // In production, you might want to send logs to a logging service
  // For now, we'll use console with appropriate methods
  switch (entry.level) {
    case LogLevel.ERROR:
    case LogLevel.SECURITY:
      console.error(formatted)
      break
    case LogLevel.WARN:
      console.warn(formatted)
      break
    case LogLevel.DEBUG:
      if (process.env.NODE_ENV === 'development') {
        console.debug(formatted)
      }
      break
    default:
      console.log(formatted)
  }
}

/**
 * Create base log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, any>,
  requestId?: string
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    requestId,
  }
}

/**
 * Log debug message
 */
export function logDebug(
  message: string,
  context?: Record<string, any>,
  requestId?: string
): void {
  const entry = createLogEntry(LogLevel.DEBUG, message, context, requestId)
  writeLog(entry)
}

/**
 * Log info message
 */
export function logInfo(
  message: string,
  context?: Record<string, any>,
  requestId?: string
): void {
  const entry = createLogEntry(LogLevel.INFO, message, context, requestId)
  writeLog(entry)
}

/**
 * Log warning message
 */
export function logWarn(
  message: string,
  context?: Record<string, any>,
  requestId?: string
): void {
  const entry = createLogEntry(LogLevel.WARN, message, context, requestId)
  writeLog(entry)
}

/**
 * Log error with full context
 */
export async function logError(
  error: Error | AppError,
  requestId?: string,
  context?: Record<string, any>
): Promise<void> {
  const entry = createLogEntry(
    LogLevel.ERROR,
    error.message,
    context,
    requestId
  )

  // Add error details
  entry.error = {
    name: error.name,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  }

  // Add AppError specific fields
  if (error instanceof AppError) {
    entry.error.statusCode = error.statusCode
    entry.error.isOperational = error.isOperational

    // Merge error context with provided context
    if (error.context) {
      entry.context = { ...entry.context, ...error.context }
    }
  }

  writeLog(entry)

  // In production, you might want to send critical errors to an alerting service
  if (error instanceof AppError && !error.isOperational) {
    // This is a programming error, not an operational error
    // You might want to alert developers
    console.error('CRITICAL: Non-operational error detected', {
      error: error.message,
      stack: error.stack,
    })
  }
}

/**
 * Log security event
 */
export function logSecurityEvent(
  event: string,
  details: {
    userId?: string
    email?: string
    ip?: string
    userAgent?: string
    success: boolean
    reason?: string
  },
  requestId?: string
): void {
  const entry = createLogEntry(
    LogLevel.SECURITY,
    `Security Event: ${event}`,
    {
      event,
      ...details,
    },
    requestId
  )

  entry.security = {
    event,
    userId: details.userId,
    ip: details.ip,
    userAgent: details.userAgent,
  }

  writeLog(entry)
}

/**
 * Log performance metric
 */
export function logPerformance(
  operation: string,
  duration: number,
  context?: Record<string, any>,
  requestId?: string
): void {
  const entry = createLogEntry(
    LogLevel.PERFORMANCE,
    `Performance: ${operation} completed in ${duration}ms`,
    context,
    requestId
  )

  entry.performance = {
    duration,
    operation,
  }

  writeLog(entry)

  // Warn if operation is slow
  if (duration > 2000) {
    logWarn(`Slow operation detected: ${operation} took ${duration}ms`, context, requestId)
  }
}

/**
 * Performance timer utility
 */
export class PerformanceTimer {
  private startTime: number
  private operation: string
  private context?: Record<string, any>
  private requestId?: string

  constructor(operation: string, context?: Record<string, any>, requestId?: string) {
    this.operation = operation
    this.context = context
    this.requestId = requestId
    this.startTime = Date.now()
  }

  /**
   * End timer and log performance
   */
  end(): number {
    const duration = Date.now() - this.startTime
    logPerformance(this.operation, duration, this.context, this.requestId)
    return duration
  }

  /**
   * Get elapsed time without logging
   */
  elapsed(): number {
    return Date.now() - this.startTime
  }
}

/**
 * Create performance timer
 */
export function startTimer(
  operation: string,
  context?: Record<string, any>,
  requestId?: string
): PerformanceTimer {
  return new PerformanceTimer(operation, context, requestId)
}

/**
 * Log database query
 */
export function logDatabaseQuery(
  collection: string,
  operation: string,
  duration: number,
  context?: Record<string, any>,
  requestId?: string
): void {
  logPerformance(
    `Database ${operation} on ${collection}`,
    duration,
    { collection, operation, ...context },
    requestId
  )
}

/**
 * Log API request
 */
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  context?: Record<string, any>,
  requestId?: string
): void {
  const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO

  const entry = createLogEntry(
    level,
    `${method} ${path} ${statusCode} ${duration}ms`,
    {
      method,
      path,
      statusCode,
      duration,
      ...context,
    },
    requestId
  )

  writeLog(entry)
}

/**
 * Log authentication attempt
 */
export function logAuthAttempt(
  email: string,
  success: boolean,
  ip?: string,
  userAgent?: string,
  reason?: string,
  requestId?: string
): void {
  logSecurityEvent(
    success ? 'Login Success' : 'Login Failed',
    {
      email,
      ip,
      userAgent,
      success,
      reason,
    },
    requestId
  )
}

/**
 * Log authorization failure
 */
export function logAuthorizationFailure(
  userId: string,
  resource: string,
  action: string,
  reason?: string,
  requestId?: string
): void {
  logSecurityEvent(
    'Authorization Failed',
    {
      userId,
      success: false,
      reason: `User ${userId} attempted ${action} on ${resource}: ${reason || 'Permission denied'}`,
    },
    requestId
  )
}

/**
 * Log data modification
 */
export function logDataModification(
  collection: string,
  documentId: string,
  operation: 'create' | 'update' | 'delete',
  userId?: string,
  context?: Record<string, any>,
  requestId?: string
): void {
  logInfo(
    `Data ${operation}: ${collection}/${documentId}`,
    {
      collection,
      documentId,
      operation,
      userId,
      ...context,
    },
    requestId
  )
}
