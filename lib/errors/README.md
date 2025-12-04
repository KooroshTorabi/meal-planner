# Error Handling System

This directory contains the centralized error handling system for the Meal Planner application.

## Overview

The error handling system provides:
- **Custom error types** for different error scenarios
- **Centralized error handler** for consistent error responses
- **User-friendly error messages** that don't expose sensitive information
- **Structured logging** for debugging and monitoring
- **Performance tracking** for identifying slow operations

## Requirements

- NFR-2: Security Enhancements
- NFR-5: Reliability and Availability
- NFR-8: Usability

## Components

### 1. Error Types (`types.ts`)

Custom error classes for different HTTP status codes:

- `ValidationError` (400) - Invalid input data
- `AuthenticationError` (401) - Invalid credentials or expired tokens
- `AuthorizationError` (403) - Insufficient permissions
- `NotFoundError` (404) - Resource not found
- `ConflictError` (409) - Duplicate resources or version conflicts
- `RateLimitError` (429) - Rate limit exceeded
- `InternalServerError` (500) - Unexpected errors
- `DatabaseError` (500) - Database failures
- `ExternalServiceError` (503) - External service failures

### 2. Error Handler (`handler.ts`)

Centralized error handling functions:

- `handleError()` - Process errors and return appropriate responses
- `parsePayloadError()` - Convert Payload CMS errors to AppError
- `withErrorHandler()` - Wrap route handlers with automatic error handling
- `isOperationalError()` - Check if error is operational or programming error

### 3. Error Messages (`messages.ts`)

User-friendly error messages organized by category:

- Validation errors
- Authentication errors
- Authorization errors
- Not found errors
- Conflict errors
- Rate limit errors
- Server errors
- External service errors

### 4. Examples (`examples.ts`)

Comprehensive examples showing how to use the error handling system.

## Usage

### Basic Usage with withErrorHandler

The simplest way to use the error handling system is with the `withErrorHandler` wrapper:

```typescript
import { withErrorHandler, ValidationError, ErrorMessages } from '@/lib/errors'
import { NextRequest, NextResponse } from 'next/server'

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()

  if (!body.email) {
    throw new ValidationError(
      ErrorMessages.VALIDATION.REQUIRED_FIELD('email'),
      'email'
    )
  }

  // Your logic here
  return NextResponse.json({ success: true })
})
```

### Validation Errors

```typescript
import { ValidationError, ErrorMessages } from '@/lib/errors'

// Required field
if (!data.resident) {
  throw new ValidationError(
    ErrorMessages.VALIDATION.REQUIRED_FIELD('resident'),
    'resident'
  )
}

// Invalid format
if (!isValidDate(data.date)) {
  throw new ValidationError(
    ErrorMessages.VALIDATION.INVALID_DATE('date'),
    'date'
  )
}

// Invalid value
if (!['breakfast', 'lunch', 'dinner'].includes(data.mealType)) {
  throw new ValidationError(
    ErrorMessages.VALIDATION.INVALID_VALUE('meal type', ['breakfast', 'lunch', 'dinner']),
    'mealType'
  )
}
```

### Authentication Errors

```typescript
import { AuthenticationError, ErrorMessages } from '@/lib/errors'

// Invalid credentials
if (!passwordMatch) {
  throw new AuthenticationError(
    ErrorMessages.AUTHENTICATION.INVALID_CREDENTIALS(),
    false,
    remainingAttempts
  )
}

// 2FA required
if (user.twoFactorEnabled && !twoFactorCode) {
  throw new AuthenticationError(
    ErrorMessages.AUTHENTICATION.TWO_FACTOR_REQUIRED(),
    true
  )
}
```

### Authorization Errors

```typescript
import { AuthorizationError, ErrorMessages } from '@/lib/errors'

// Insufficient permissions
if (user.role !== 'admin') {
  throw new AuthorizationError(
    ErrorMessages.AUTHORIZATION.INSUFFICIENT_PERMISSIONS('delete', 'residents'),
    'admin',
    'delete:residents'
  )
}

// Cannot modify prepared order
if (order.status === 'prepared' && user.role === 'caregiver') {
  throw new AuthorizationError(
    ErrorMessages.AUTHORIZATION.CANNOT_MODIFY_PREPARED()
  )
}
```

### Not Found Errors

```typescript
import { NotFoundError, ErrorMessages } from '@/lib/errors'

// Resource not found
if (!resident) {
  throw new NotFoundError(
    ErrorMessages.NOT_FOUND.RESIDENT(),
    'resident',
    residentId
  )
}
```

### Conflict Errors

```typescript
import { ConflictError, ErrorMessages } from '@/lib/errors'

// Duplicate order
if (existingOrder) {
  throw new ConflictError(
    ErrorMessages.CONFLICT.DUPLICATE_ORDER(),
    'duplicate',
    existingOrder
  )
}

// Version conflict
if (data.version !== currentVersion) {
  throw new ConflictError(
    ErrorMessages.CONFLICT.VERSION_MISMATCH(),
    'version'
  )
}
```

### Rate Limit Errors

```typescript
import { RateLimitError, ErrorMessages } from '@/lib/errors'

if (isRateLimited(ip)) {
  const retryAfter = getTimeUntilUnlock(ip)
  throw new RateLimitError(
    ErrorMessages.RATE_LIMIT.TOO_MANY_ATTEMPTS(retryAfter),
    retryAfter
  )
}
```

### Database Errors

```typescript
import { DatabaseError, ErrorMessages } from '@/lib/errors'

try {
  await payload.find({ collection: 'meal-orders' })
} catch (error) {
  throw new DatabaseError(
    ErrorMessages.DATABASE.QUERY_FAILED('fetch'),
    'find',
    'meal-orders'
  )
}
```

### External Service Errors

```typescript
import { ExternalServiceError, ErrorMessages } from '@/lib/errors'

try {
  await sendEmail(user.email, subject, body)
} catch (error) {
  throw new ExternalServiceError(
    ErrorMessages.EXTERNAL_SERVICE.EMAIL_FAILED(),
    'email',
    true // retryable
  )
}
```

## Performance Monitoring

Use the logging system to track performance:

```typescript
import { startTimer, logInfo } from '@/lib/logging'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const timer = startTimer('Fetch Meal Orders')
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Your logic here
  const result = await fetchMealOrders()

  logInfo('Meal orders fetched', { count: result.length }, requestId)
  timer.end()

  return NextResponse.json(result)
})
```

## Error Response Format

All errors return a consistent JSON format:

```json
{
  "error": "Validation Error",
  "message": "The email field is required. Please provide a value and try again.",
  "statusCode": 400,
  "field": "email",
  "requestId": "req_1234567890_abc123"
}
```

## Best Practices

1. **Always use withErrorHandler** - Wrap all route handlers with `withErrorHandler` for consistent error handling
2. **Use specific error types** - Choose the most appropriate error type for the situation
3. **Provide context** - Include relevant context in error constructors
4. **Use error messages** - Use predefined messages from `ErrorMessages` for consistency
5. **Log errors** - Errors are automatically logged, but you can add additional logging for context
6. **Don't expose sensitive data** - Error messages are sanitized to avoid exposing system details
7. **Track performance** - Use timers to identify slow operations
8. **Handle Payload errors** - Use `parsePayloadError` to convert Payload CMS errors

## Security Considerations

- Error messages never expose sensitive system details
- Stack traces are only included in development mode
- Resource IDs are not exposed in error responses
- All errors are logged with full context for debugging
- Rate limiting is enforced on authentication endpoints

## Testing

Test error handling by:

1. Triggering validation errors with invalid input
2. Testing authentication with invalid credentials
3. Testing authorization with insufficient permissions
4. Testing not found scenarios
5. Testing conflict scenarios (duplicates, version mismatches)
6. Testing rate limiting
7. Simulating database failures
8. Simulating external service failures

## Future Enhancements

- Integration with external logging services (e.g., Sentry, LogRocket)
- Error analytics and reporting dashboard
- Automatic error recovery for transient failures
- Circuit breaker pattern for external services
- Error rate alerting for administrators
