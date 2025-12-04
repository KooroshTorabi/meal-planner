/**
 * Centralized Error Handler
 * 
 * Provides consistent error handling and response formatting
 * Requirements: NFR-2, NFR-5, NFR-8
 */

import type { NextResponse } from 'next/server'
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  DatabaseError,
  ExternalServiceError,
} from './types'
import { logError } from '../logging'

/**
 * Error response interface
 */
interface ErrorResponse {
  error: string
  message: string
  statusCode: number
  [key: string]: any
}

/**
 * Format error for client response
 * Ensures sensitive information is not exposed
 */
function formatErrorResponse(error: AppError): ErrorResponse {
  const response: ErrorResponse = {
    error: getErrorType(error),
    message: error.message,
    statusCode: error.statusCode,
  }

  // Add specific error details based on error type
  if (error instanceof ValidationError) {
    if (error.field) {
      response.field = error.field
    }
    if (error.errors) {
      response.errors = error.errors
    }
  } else if (error instanceof AuthenticationError) {
    if (error.requiresTwoFactor) {
      response.requiresTwoFactor = true
    }
    if (error.remainingAttempts !== undefined) {
      response.remainingAttempts = error.remainingAttempts
    }
  } else if (error instanceof AuthorizationError) {
    if (error.requiredRole) {
      response.requiredRole = error.requiredRole
    }
    if (error.requiredPermission) {
      response.requiredPermission = error.requiredPermission
    }
  } else if (error instanceof NotFoundError) {
    if (error.resourceType) {
      response.resourceType = error.resourceType
    }
    // Don't expose resourceId for security reasons
  } else if (error instanceof ConflictError) {
    if (error.conflictType) {
      response.conflictType = error.conflictType
    }
    if (error.existingResource) {
      // Only expose safe fields from existing resource
      response.existingResourceId = error.existingResource.id
    }
  } else if (error instanceof RateLimitError) {
    if (error.retryAfter) {
      response.retryAfter = error.retryAfter
    }
  } else if (error instanceof ExternalServiceError) {
    if (error.service) {
      response.service = error.service
    }
    if (error.retryable !== undefined) {
      response.retryable = error.retryable
    }
  }

  return response
}

/**
 * Get user-friendly error type string
 */
function getErrorType(error: AppError): string {
  if (error instanceof ValidationError) return 'Validation Error'
  if (error instanceof AuthenticationError) return 'Authentication Error'
  if (error instanceof AuthorizationError) return 'Authorization Error'
  if (error instanceof NotFoundError) return 'Not Found'
  if (error instanceof ConflictError) return 'Conflict'
  if (error instanceof RateLimitError) return 'Rate Limit Exceeded'
  if (error instanceof DatabaseError) return 'Database Error'
  if (error instanceof ExternalServiceError) return 'Service Unavailable'
  if (error instanceof InternalServerError) return 'Internal Server Error'
  return 'Application Error'
}

/**
 * Handle application errors and return appropriate response
 */
export async function handleError(
  error: Error | AppError,
  requestId?: string,
  context?: Record<string, any>
): Promise<any> {
  // Convert unknown errors to AppError
  let appError: AppError

  if (error instanceof AppError) {
    appError = error
  } else {
    // Wrap unknown errors as InternalServerError
    appError = new InternalServerError(
      'An unexpected error occurred',
      error,
      context
    )
  }

  // Log the error
  await logError(appError, requestId, context)

  // Format response
  const response = formatErrorResponse(appError)

  // Add request ID if available
  if (requestId) {
    response.requestId = requestId
  }

  // Import NextResponse dynamically to avoid issues in test environment
  const { NextResponse } = await import('next/server')
  
  // Return NextResponse with appropriate status code
  return NextResponse.json(response, { status: appError.statusCode })
}

/**
 * Parse Payload CMS errors and convert to AppError
 */
export function parsePayloadError(error: any): AppError {
  const message = error.message || 'An error occurred'

  // Check for duplicate key errors
  if (message.includes('already exists') || message.includes('duplicate')) {
    return new ConflictError(
      message,
      'duplicate',
      undefined,
      { originalError: error }
    )
  }

  // Check for validation errors
  if (
    message.includes('must include') ||
    message.includes('is required') ||
    message.includes('invalid')
  ) {
    return new ValidationError(message, undefined, undefined, {
      originalError: error,
    })
  }

  // Check for authorization errors
  if (
    message.includes('cannot modify') ||
    message.includes('not authorized') ||
    message.includes('permission denied')
  ) {
    return new AuthorizationError(message, undefined, undefined, {
      originalError: error,
    })
  }

  // Check for not found errors
  if (message.includes('not found') || message.includes('does not exist')) {
    return new NotFoundError(message, undefined, undefined, {
      originalError: error,
    })
  }

  // Check for conflict errors (version mismatch)
  if (message.includes('Conflict detected') || message.includes('version')) {
    try {
      // Try to parse conflict details from error message
      const conflictData = JSON.parse(message)
      return new ConflictError(
        conflictData.message || 'Conflict detected',
        'version',
        conflictData.currentVersion ? { version: conflictData.currentVersion } : undefined,
        { originalError: error }
      )
    } catch {
      return new ConflictError('Conflict detected', 'version', undefined, {
        originalError: error,
      })
    }
  }

  // Default to internal server error
  return new InternalServerError(
    'An unexpected error occurred',
    error,
    { originalError: error }
  )
}

/**
 * Wrap async route handlers with error handling
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | any> => {
    try {
      return await handler(...args)
    } catch (error) {
      // Generate request ID
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Handle the error
      if (error instanceof AppError) {
        return handleError(error, requestId)
      } else if (error instanceof Error) {
        // Try to parse as Payload error
        const appError = parsePayloadError(error)
        return handleError(appError, requestId)
      } else {
        // Unknown error type
        return handleError(
          new InternalServerError('An unexpected error occurred'),
          requestId
        )
      }
    }
  }
}

/**
 * Check if error is operational (expected) or programming error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational
  }
  return false
}
