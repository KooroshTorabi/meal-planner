/**
 * Custom Error Types for the Meal Planner System
 * 
 * Provides structured error classes for different error scenarios
 * Requirements: NFR-2, NFR-5
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: Record<string, any>

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor)
    
    // Set the prototype explicitly
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

/**
 * Validation Error (400 Bad Request)
 * Used for invalid input data, missing required fields, etc.
 */
export class ValidationError extends AppError {
  public readonly field?: string
  public readonly errors?: Array<{ field: string; message: string }>

  constructor(
    message: string,
    field?: string,
    errors?: Array<{ field: string; message: string }>,
    context?: Record<string, any>
  ) {
    super(message, 400, true, context)
    this.field = field
    this.errors = errors
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

/**
 * Authentication Error (401 Unauthorized)
 * Used for invalid credentials, expired tokens, etc.
 */
export class AuthenticationError extends AppError {
  public readonly requiresTwoFactor?: boolean
  public readonly remainingAttempts?: number

  constructor(
    message: string,
    requiresTwoFactor?: boolean,
    remainingAttempts?: number,
    context?: Record<string, any>
  ) {
    super(message, 401, true, context)
    this.requiresTwoFactor = requiresTwoFactor
    this.remainingAttempts = remainingAttempts
    Object.setPrototypeOf(this, AuthenticationError.prototype)
  }
}

/**
 * Authorization Error (403 Forbidden)
 * Used for insufficient permissions, role-based access denial, etc.
 */
export class AuthorizationError extends AppError {
  public readonly requiredRole?: string
  public readonly requiredPermission?: string

  constructor(
    message: string,
    requiredRole?: string,
    requiredPermission?: string,
    context?: Record<string, any>
  ) {
    super(message, 403, true, context)
    this.requiredRole = requiredRole
    this.requiredPermission = requiredPermission
    Object.setPrototypeOf(this, AuthorizationError.prototype)
  }
}

/**
 * Not Found Error (404 Not Found)
 * Used when a requested resource does not exist
 */
export class NotFoundError extends AppError {
  public readonly resourceType?: string
  public readonly resourceId?: string

  constructor(
    message: string,
    resourceType?: string,
    resourceId?: string,
    context?: Record<string, any>
  ) {
    super(message, 404, true, context)
    this.resourceType = resourceType
    this.resourceId = resourceId
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

/**
 * Conflict Error (409 Conflict)
 * Used for duplicate resources, version conflicts, etc.
 */
export class ConflictError extends AppError {
  public readonly conflictType?: 'duplicate' | 'version' | 'state'
  public readonly existingResource?: any
  public readonly currentVersion?: number
  public readonly attemptedVersion?: number

  constructor(
    message: string,
    conflictType?: 'duplicate' | 'version' | 'state',
    existingResource?: any,
    context?: Record<string, any>
  ) {
    super(message, 409, true, context)
    this.conflictType = conflictType
    this.existingResource = existingResource
    Object.setPrototypeOf(this, ConflictError.prototype)
  }
}

/**
 * Rate Limit Error (429 Too Many Requests)
 * Used when rate limits are exceeded
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number

  constructor(
    message: string,
    retryAfter?: number,
    context?: Record<string, any>
  ) {
    super(message, 429, true, context)
    this.retryAfter = retryAfter
    Object.setPrototypeOf(this, RateLimitError.prototype)
  }
}

/**
 * Internal Server Error (500 Internal Server Error)
 * Used for unexpected errors, database failures, etc.
 */
export class InternalServerError extends AppError {
  public readonly originalError?: Error

  constructor(
    message: string = 'An unexpected error occurred',
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(message, 500, false, context)
    this.originalError = originalError
    Object.setPrototypeOf(this, InternalServerError.prototype)
  }
}

/**
 * Database Error
 * Used for database connection failures, query errors, etc.
 */
export class DatabaseError extends AppError {
  public readonly operation?: string
  public readonly collection?: string

  constructor(
    message: string,
    operation?: string,
    collection?: string,
    context?: Record<string, any>
  ) {
    super(message, 500, false, context)
    this.operation = operation
    this.collection = collection
    Object.setPrototypeOf(this, DatabaseError.prototype)
  }
}

/**
 * External Service Error
 * Used when external services (email, push notifications, etc.) fail
 */
export class ExternalServiceError extends AppError {
  public readonly service?: string
  public readonly retryable?: boolean

  constructor(
    message: string,
    service?: string,
    retryable: boolean = true,
    context?: Record<string, any>
  ) {
    super(message, 503, true, context)
    this.service = service
    this.retryable = retryable
    Object.setPrototypeOf(this, ExternalServiceError.prototype)
  }
}
