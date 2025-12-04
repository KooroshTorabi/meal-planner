/**
 * Error Handling Examples
 * 
 * Demonstrates how to use the centralized error handling system
 * Requirements: NFR-2, NFR-5, NFR-8
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  withErrorHandler,
  ErrorMessages,
} from './index'
import { startTimer, logInfo, logError } from '../logging'

/**
 * Example 1: Validation Error
 * Use when input data is invalid
 */
export const exampleValidationError = withErrorHandler(
  async (request: NextRequest) => {
    const body = await request.json()

    if (!body.email) {
      throw new ValidationError(
        ErrorMessages.VALIDATION.REQUIRED_FIELD('email'),
        'email'
      )
    }

    if (!body.email.includes('@')) {
      throw new ValidationError(
        ErrorMessages.VALIDATION.INVALID_EMAIL(),
        'email'
      )
    }

    return NextResponse.json({ success: true })
  }
)

/**
 * Example 2: Authentication Error
 * Use when credentials are invalid or tokens are expired
 */
export const exampleAuthenticationError = withErrorHandler(
  async (request: NextRequest) => {
    const { email, password } = await request.json()

    // Simulate credential check
    const isValid = false // Replace with actual check

    if (!isValid) {
      throw new AuthenticationError(
        ErrorMessages.AUTHENTICATION.INVALID_CREDENTIALS(),
        false,
        4 // remaining attempts
      )
    }

    return NextResponse.json({ success: true })
  }
)

/**
 * Example 3: Authorization Error
 * Use when user lacks permissions
 */
export const exampleAuthorizationError = withErrorHandler(
  async (request: NextRequest) => {
    const userRole = 'caregiver' // Get from auth token

    if (userRole !== 'admin') {
      throw new AuthorizationError(
        ErrorMessages.AUTHORIZATION.INSUFFICIENT_PERMISSIONS(
          'delete',
          'residents'
        ),
        'admin',
        'delete:residents'
      )
    }

    return NextResponse.json({ success: true })
  }
)

/**
 * Example 4: Not Found Error
 * Use when a resource doesn't exist
 */
export const exampleNotFoundError = withErrorHandler(
  async (request: NextRequest) => {
    const { id } = await request.json()

    // Simulate resource lookup
    const resource = null // Replace with actual lookup

    if (!resource) {
      throw new NotFoundError(
        ErrorMessages.NOT_FOUND.MEAL_ORDER(),
        'meal-order',
        id
      )
    }

    return NextResponse.json(resource)
  }
)

/**
 * Example 5: Conflict Error
 * Use when there's a duplicate or version conflict
 */
export const exampleConflictError = withErrorHandler(
  async (request: NextRequest) => {
    const body = await request.json()

    // Simulate duplicate check
    const existingOrder = { id: '123' } // Replace with actual check

    if (existingOrder) {
      throw new ConflictError(
        ErrorMessages.CONFLICT.DUPLICATE_ORDER(),
        'duplicate',
        existingOrder
      )
    }

    return NextResponse.json({ success: true })
  }
)

/**
 * Example 6: Rate Limit Error
 * Use when rate limits are exceeded
 */
export const exampleRateLimitError = withErrorHandler(
  async (request: NextRequest) => {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'

    // Simulate rate limit check
    const isRateLimited = true // Replace with actual check
    const retryAfter = 900 // 15 minutes in seconds

    if (isRateLimited) {
      throw new RateLimitError(
        ErrorMessages.RATE_LIMIT.TOO_MANY_ATTEMPTS(retryAfter),
        retryAfter
      )
    }

    return NextResponse.json({ success: true })
  }
)

/**
 * Example 7: Database Error
 * Use when database operations fail
 */
export const exampleDatabaseError = withErrorHandler(
  async (request: NextRequest) => {
    try {
      // Simulate database operation
      throw new Error('Connection timeout')
    } catch (error) {
      throw new DatabaseError(
        ErrorMessages.DATABASE.CONNECTION_FAILED(),
        'find',
        'meal-orders',
        { originalError: error }
      )
    }
  }
)

/**
 * Example 8: External Service Error
 * Use when external services fail
 */
export const exampleExternalServiceError = withErrorHandler(
  async (request: NextRequest) => {
    try {
      // Simulate external service call
      throw new Error('SMTP connection failed')
    } catch (error) {
      throw new ExternalServiceError(
        ErrorMessages.EXTERNAL_SERVICE.EMAIL_FAILED(),
        'email',
        true, // retryable
        { originalError: error }
      )
    }
  }
)

/**
 * Example 9: Performance Monitoring
 * Use to track operation performance
 */
export const examplePerformanceMonitoring = withErrorHandler(
  async (request: NextRequest) => {
    const timer = startTimer('Complex Operation')
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Perform operation
    await new Promise((resolve) => setTimeout(resolve, 100))

    logInfo('Operation completed', { status: 'success' }, requestId)

    const duration = timer.end()

    return NextResponse.json({ success: true, duration })
  }
)

/**
 * Example 10: Nested Error Handling
 * Use when you need to catch and re-throw with more context
 */
export const exampleNestedErrorHandling = withErrorHandler(
  async (request: NextRequest) => {
    const timer = startTimer('Nested Operation')

    try {
      // Inner operation that might fail
      const result = await performRiskyOperation()
      return NextResponse.json(result)
    } catch (error) {
      // Add context and re-throw
      if (error instanceof Error) {
        await logError(error, undefined, {
          operation: 'performRiskyOperation',
          additionalContext: 'This was a critical operation',
        })
      }
      throw error
    } finally {
      timer.end()
    }
  }
)

async function performRiskyOperation() {
  // Simulate an operation that might fail
  throw new ValidationError('Invalid data format', 'data')
}
