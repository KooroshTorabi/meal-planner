/**
 * Error Handling System Tests
 * 
 * Tests the centralized error handling system
 * Requirements: NFR-2, NFR-5, NFR-8
 */

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
  parsePayloadError,
  isOperationalError,
  ErrorMessages,
  getUserFriendlyMessage,
} from '@/lib/errors'

describe('Error Handling System', () => {
  describe('Custom Error Types', () => {
    test('ValidationError should have correct status code and properties', () => {
      const error = new ValidationError('Invalid email', 'email')
      
      expect(error).toBeInstanceOf(AppError)
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.statusCode).toBe(400)
      expect(error.isOperational).toBe(true)
      expect(error.field).toBe('email')
      expect(error.message).toBe('Invalid email')
    })

    test('AuthenticationError should have correct status code and properties', () => {
      const error = new AuthenticationError('Invalid credentials', false, 3)
      
      expect(error).toBeInstanceOf(AppError)
      expect(error).toBeInstanceOf(AuthenticationError)
      expect(error.statusCode).toBe(401)
      expect(error.isOperational).toBe(true)
      expect(error.requiresTwoFactor).toBe(false)
      expect(error.remainingAttempts).toBe(3)
    })

    test('AuthorizationError should have correct status code and properties', () => {
      const error = new AuthorizationError(
        'Insufficient permissions',
        'admin',
        'delete:residents'
      )
      
      expect(error).toBeInstanceOf(AppError)
      expect(error).toBeInstanceOf(AuthorizationError)
      expect(error.statusCode).toBe(403)
      expect(error.isOperational).toBe(true)
      expect(error.requiredRole).toBe('admin')
      expect(error.requiredPermission).toBe('delete:residents')
    })

    test('NotFoundError should have correct status code and properties', () => {
      const error = new NotFoundError('Resident not found', 'resident', '123')
      
      expect(error).toBeInstanceOf(AppError)
      expect(error).toBeInstanceOf(NotFoundError)
      expect(error.statusCode).toBe(404)
      expect(error.isOperational).toBe(true)
      expect(error.resourceType).toBe('resident')
      expect(error.resourceId).toBe('123')
    })

    test('ConflictError should have correct status code and properties', () => {
      const existingResource = { id: '123' }
      const error = new ConflictError(
        'Duplicate order',
        'duplicate',
        existingResource
      )
      
      expect(error).toBeInstanceOf(AppError)
      expect(error).toBeInstanceOf(ConflictError)
      expect(error.statusCode).toBe(409)
      expect(error.isOperational).toBe(true)
      expect(error.conflictType).toBe('duplicate')
      expect(error.existingResource).toEqual(existingResource)
    })

    test('RateLimitError should have correct status code and properties', () => {
      const error = new RateLimitError('Too many requests', 900)
      
      expect(error).toBeInstanceOf(AppError)
      expect(error).toBeInstanceOf(RateLimitError)
      expect(error.statusCode).toBe(429)
      expect(error.isOperational).toBe(true)
      expect(error.retryAfter).toBe(900)
    })

    test('InternalServerError should have correct status code and properties', () => {
      const originalError = new Error('Database connection failed')
      const error = new InternalServerError('Internal error', originalError)
      
      expect(error).toBeInstanceOf(AppError)
      expect(error).toBeInstanceOf(InternalServerError)
      expect(error.statusCode).toBe(500)
      expect(error.isOperational).toBe(false)
      expect(error.originalError).toBe(originalError)
    })

    test('DatabaseError should have correct status code and properties', () => {
      const error = new DatabaseError('Query failed', 'find', 'meal-orders')
      
      expect(error).toBeInstanceOf(AppError)
      expect(error).toBeInstanceOf(DatabaseError)
      expect(error.statusCode).toBe(500)
      expect(error.isOperational).toBe(false)
      expect(error.operation).toBe('find')
      expect(error.collection).toBe('meal-orders')
    })

    test('ExternalServiceError should have correct status code and properties', () => {
      const error = new ExternalServiceError('Email service failed', 'email', true)
      
      expect(error).toBeInstanceOf(AppError)
      expect(error).toBeInstanceOf(ExternalServiceError)
      expect(error.statusCode).toBe(503)
      expect(error.isOperational).toBe(true)
      expect(error.service).toBe('email')
      expect(error.retryable).toBe(true)
    })
  })

  describe('parsePayloadError', () => {
    test('should parse duplicate error', () => {
      const payloadError = new Error('A meal order already exists for this resident')
      const appError = parsePayloadError(payloadError)
      
      expect(appError).toBeInstanceOf(ConflictError)
      expect(appError.statusCode).toBe(409)
    })

    test('should parse validation error', () => {
      const payloadError = new Error('Field is required')
      const appError = parsePayloadError(payloadError)
      
      expect(appError).toBeInstanceOf(ValidationError)
      expect(appError.statusCode).toBe(400)
    })

    test('should parse authorization error', () => {
      const payloadError = new Error('User cannot modify this resource')
      const appError = parsePayloadError(payloadError)
      
      expect(appError).toBeInstanceOf(AuthorizationError)
      expect(appError.statusCode).toBe(403)
    })

    test('should parse not found error', () => {
      const payloadError = new Error('Resource not found')
      const appError = parsePayloadError(payloadError)
      
      expect(appError).toBeInstanceOf(NotFoundError)
      expect(appError.statusCode).toBe(404)
    })

    test('should default to InternalServerError for unknown errors', () => {
      const payloadError = new Error('Unknown error')
      const appError = parsePayloadError(payloadError)
      
      expect(appError).toBeInstanceOf(InternalServerError)
      expect(appError.statusCode).toBe(500)
    })
  })

  describe('isOperationalError', () => {
    test('should return true for operational errors', () => {
      const error = new ValidationError('Invalid input')
      expect(isOperationalError(error)).toBe(true)
    })

    test('should return false for non-operational errors', () => {
      const error = new InternalServerError('Unexpected error')
      expect(isOperationalError(error)).toBe(false)
    })

    test('should return false for regular Error objects', () => {
      const error = new Error('Regular error')
      expect(isOperationalError(error)).toBe(false)
    })
  })

  describe('Error Messages', () => {
    test('should provide user-friendly validation messages', () => {
      const message = ErrorMessages.VALIDATION.REQUIRED_FIELD('email')
      expect(message).toContain('email')
      expect(message).toContain('required')
      expect(message).not.toContain('undefined')
    })

    test('should provide user-friendly authentication messages', () => {
      const message = ErrorMessages.AUTHENTICATION.INVALID_CREDENTIALS()
      expect(message).toContain('email')
      expect(message).toContain('password')
      expect(message).not.toContain('database')
      expect(message).not.toContain('query')
    })

    test('should provide user-friendly authorization messages', () => {
      const message = ErrorMessages.AUTHORIZATION.INSUFFICIENT_PERMISSIONS('delete', 'residents')
      expect(message).toContain('delete')
      expect(message).toContain('residents')
      expect(message).toContain('permission')
    })

    test('should provide user-friendly not found messages', () => {
      const message = ErrorMessages.NOT_FOUND.RESIDENT()
      expect(message).toContain('resident')
      expect(message).toContain('not')
      expect(message).toContain('found')
    })

    test('should provide user-friendly conflict messages', () => {
      const message = ErrorMessages.CONFLICT.DUPLICATE_ORDER()
      expect(message).toContain('already exists')
      expect(message).toContain('meal order')
    })

    test('should provide user-friendly rate limit messages', () => {
      const message = ErrorMessages.RATE_LIMIT.TOO_MANY_ATTEMPTS(900)
      expect(message).toContain('Too many')
      expect(message).toContain('15 minute')
    })

    test('should provide user-friendly server error messages', () => {
      const message = ErrorMessages.SERVER.INTERNAL_ERROR()
      expect(message).not.toContain('stack')
      expect(message).not.toContain('database')
      expect(message).toContain('unexpected')
    })
  })

  describe('getUserFriendlyMessage', () => {
    test('should return appropriate message for validation errors', () => {
      const message = getUserFriendlyMessage('required field', { field: 'email' })
      expect(message).toContain('email')
      expect(message).toContain('required')
    })

    test('should return appropriate message for authentication errors', () => {
      const message = getUserFriendlyMessage('invalid credentials')
      expect(message).toContain('email')
      expect(message).toContain('password')
    })

    test('should return appropriate message for authorization errors', () => {
      const message = getUserFriendlyMessage('permission denied', {
        action: 'delete',
        resource: 'residents',
      })
      expect(message).toContain('permission')
    })

    test('should return appropriate message for not found errors', () => {
      const message = getUserFriendlyMessage('not found', { resourceType: 'resident' })
      expect(message).toContain('resident')
      expect(message).toContain('not')
    })

    test('should return default message for unknown errors', () => {
      const message = getUserFriendlyMessage('unknown error type')
      expect(message).toBeTruthy()
      expect(message.length).toBeGreaterThan(0)
    })
  })

  describe('Error Context', () => {
    test('should preserve context in errors', () => {
      const context = { userId: '123', operation: 'create' }
      const error = new ValidationError('Invalid input', 'email', undefined, context)
      
      expect(error.context).toEqual(context)
      expect(error.context?.userId).toBe('123')
      expect(error.context?.operation).toBe('create')
    })

    test('should allow undefined context', () => {
      const error = new ValidationError('Invalid input', 'email')
      expect(error.context).toBeUndefined()
    })
  })

  describe('Error Messages Do Not Expose Sensitive Information', () => {
    test('validation errors should not expose system details', () => {
      const error = new ValidationError('Invalid email', 'email')
      expect(error.message).not.toContain('database')
      expect(error.message).not.toContain('query')
      expect(error.message).not.toContain('SQL')
    })

    test('authentication errors should not expose user existence', () => {
      const message = ErrorMessages.AUTHENTICATION.INVALID_CREDENTIALS()
      expect(message).not.toContain('user not found')
      expect(message).not.toContain('does not exist')
    })

    test('server errors should not expose stack traces in messages', () => {
      const message = ErrorMessages.SERVER.INTERNAL_ERROR()
      expect(message).not.toContain('at')
      expect(message).not.toContain('.ts:')
      expect(message).not.toContain('Error:')
    })
  })
})
