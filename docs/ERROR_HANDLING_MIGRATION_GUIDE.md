# Error Handling Migration Guide

This guide helps you migrate existing API routes to use the new centralized error handling system.

## Quick Start

### 1. Import the Error Handling System

```typescript
import {
  withErrorHandler,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ErrorMessages,
} from '@/lib/errors'
import { startTimer, logInfo } from '@/lib/logging'
```

### 2. Wrap Your Route Handler

**Before:**
```typescript
export async function GET(request: NextRequest) {
  try {
    // Your code
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**After:**
```typescript
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Your code - errors are automatically handled
})
```

### 3. Replace Manual Error Responses with Exceptions

**Before:**
```typescript
if (!body.email) {
  return NextResponse.json(
    { error: 'Validation error', message: 'Email is required' },
    { status: 400 }
  )
}
```

**After:**
```typescript
if (!body.email) {
  throw new ValidationError(
    ErrorMessages.VALIDATION.REQUIRED_FIELD('email'),
    'email'
  )
}
```

## Common Migration Patterns

### Pattern 1: Validation Errors

**Before:**
```typescript
if (!body.resident) {
  return NextResponse.json(
    { error: 'Validation error', message: 'Resident is required' },
    { status: 400 }
  )
}

if (!['breakfast', 'lunch', 'dinner'].includes(body.mealType)) {
  return NextResponse.json(
    { error: 'Validation error', message: 'Invalid meal type' },
    { status: 400 }
  )
}
```

**After:**
```typescript
if (!body.resident) {
  throw new ValidationError(
    ErrorMessages.VALIDATION.REQUIRED_FIELD('resident'),
    'resident'
  )
}

if (!['breakfast', 'lunch', 'dinner'].includes(body.mealType)) {
  throw new ValidationError(
    ErrorMessages.VALIDATION.INVALID_VALUE('meal type', ['breakfast', 'lunch', 'dinner']),
    'mealType'
  )
}
```

### Pattern 2: Authentication Errors

**Before:**
```typescript
if (!passwordMatch) {
  return NextResponse.json(
    { error: 'Invalid credentials' },
    { status: 401 }
  )
}

if (user.twoFactorEnabled && !twoFactorCode) {
  return NextResponse.json(
    { error: '2FA code required', requiresTwoFactor: true },
    { status: 401 }
  )
}
```

**After:**
```typescript
if (!passwordMatch) {
  throw new AuthenticationError(
    ErrorMessages.AUTHENTICATION.INVALID_CREDENTIALS(),
    false,
    remainingAttempts
  )
}

if (user.twoFactorEnabled && !twoFactorCode) {
  throw new AuthenticationError(
    ErrorMessages.AUTHENTICATION.TWO_FACTOR_REQUIRED(),
    true
  )
}
```

### Pattern 3: Authorization Errors

**Before:**
```typescript
if (user.role !== 'admin') {
  return NextResponse.json(
    { error: 'Access denied', message: 'Admin role required' },
    { status: 403 }
  )
}

if (order.status === 'prepared' && user.role === 'caregiver') {
  return NextResponse.json(
    { error: 'Cannot modify prepared orders' },
    { status: 403 }
  )
}
```

**After:**
```typescript
if (user.role !== 'admin') {
  throw new AuthorizationError(
    ErrorMessages.AUTHORIZATION.ROLE_REQUIRED('admin'),
    'admin'
  )
}

if (order.status === 'prepared' && user.role === 'caregiver') {
  throw new AuthorizationError(
    ErrorMessages.AUTHORIZATION.CANNOT_MODIFY_PREPARED()
  )
}
```

### Pattern 4: Not Found Errors

**Before:**
```typescript
try {
  const resident = await payload.findByID({
    collection: 'residents',
    id: residentId,
  })
} catch (err) {
  return NextResponse.json(
    { error: 'Resident not found' },
    { status: 404 }
  )
}
```

**After:**
```typescript
try {
  const resident = await payload.findByID({
    collection: 'residents',
    id: residentId,
  })
} catch (err) {
  throw new NotFoundError(
    ErrorMessages.NOT_FOUND.RESIDENT(),
    'resident',
    residentId
  )
}
```

### Pattern 5: Conflict Errors

**Before:**
```typescript
if (existingOrder) {
  return NextResponse.json(
    {
      error: 'Duplicate order',
      message: 'A meal order already exists for this resident, date, and meal type',
    },
    { status: 409 }
  )
}
```

**After:**
```typescript
if (existingOrder) {
  throw new ConflictError(
    ErrorMessages.CONFLICT.DUPLICATE_ORDER(),
    'duplicate',
    existingOrder
  )
}
```

### Pattern 6: Nested Try-Catch Blocks

**Before:**
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    try {
      const resident = await payload.findByID({
        collection: 'residents',
        id: body.resident,
      })
      
      if (!resident.active) {
        return NextResponse.json(
          { error: 'Cannot create orders for inactive residents' },
          { status: 400 }
        )
      }
    } catch (err) {
      return NextResponse.json(
        { error: 'Resident not found' },
        { status: 404 }
      )
    }
    
    // More code...
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**After:**
```typescript
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  
  try {
    const resident = await payload.findByID({
      collection: 'residents',
      id: body.resident,
    })
    
    if (!resident.active) {
      throw new ValidationError(
        ErrorMessages.VALIDATION.INACTIVE_RESIDENT(),
        'resident'
      )
    }
  } catch (err) {
    if (err instanceof ValidationError) {
      throw err
    }
    throw new NotFoundError(
      ErrorMessages.NOT_FOUND.RESIDENT(),
      'resident',
      body.resident
    )
  }
  
  // More code...
})
```

## Adding Performance Monitoring

**Before:**
```typescript
export async function GET(request: NextRequest) {
  try {
    const result = await payload.find({
      collection: 'meal-orders',
      // ...
    })
    
    return NextResponse.json(result)
  } catch (error) {
    // Error handling
  }
}
```

**After:**
```typescript
export const GET = withErrorHandler(async (request: NextRequest) => {
  const timer = startTimer('Fetch Meal Orders')
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const result = await payload.find({
    collection: 'meal-orders',
    // ...
  })
  
  logInfo('Meal orders fetched', {
    count: result.docs.length,
  }, requestId)
  
  timer.end()
  
  return NextResponse.json(result)
})
```

## Adding Security Event Logging

**Before:**
```typescript
if (!passwordMatch) {
  console.warn(`Failed login attempt for email: ${email}`)
  return NextResponse.json(
    { error: 'Invalid credentials' },
    { status: 401 }
  )
}
```

**After:**
```typescript
if (!passwordMatch) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  logAuthAttempt(email, false, ip, userAgent, 'Invalid password')
  
  throw new AuthenticationError(
    ErrorMessages.AUTHENTICATION.INVALID_CREDENTIALS(),
    false,
    remainingAttempts
  )
}
```

## Handling Payload CMS Errors

The error handler automatically converts Payload CMS errors to appropriate AppError types:

```typescript
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  
  // Payload errors are automatically converted
  const doc = await payload.create({
    collection: 'meal-orders',
    data: body,
  })
  
  return NextResponse.json(doc, { status: 201 })
})
```

Payload errors like:
- "already exists" → `ConflictError`
- "is required" → `ValidationError`
- "cannot modify" → `AuthorizationError`
- "not found" → `NotFoundError`

## Complete Example

Here's a complete before/after example:

### Before

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    if (!body.resident) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Resident is required' },
        { status: 400 }
      )
    }

    if (!body.date) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Date is required' },
        { status: 400 }
      )
    }

    try {
      const resident = await payload.findByID({
        collection: 'residents',
        id: body.resident,
      })

      if (!resident.active) {
        return NextResponse.json(
          { error: 'Cannot create orders for inactive residents' },
          { status: 400 }
        )
      }
    } catch (err) {
      return NextResponse.json(
        { error: 'Resident not found' },
        { status: 404 }
      )
    }

    try {
      const doc = await payload.create({
        collection: 'meal-orders',
        data: body,
      })

      return NextResponse.json(doc, { status: 201 })
    } catch (error: any) {
      if (error.message && error.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'Duplicate order' },
          { status: 409 }
        )
      }
      throw error
    }
  } catch (error: any) {
    console.error('Error creating meal order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### After

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import {
  withErrorHandler,
  ValidationError,
  NotFoundError,
  ErrorMessages,
} from '@/lib/errors'
import { startTimer, logInfo } from '@/lib/logging'

export const POST = withErrorHandler(async (request: NextRequest) => {
  const timer = startTimer('Create Meal Order')
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const payload = await getPayload({ config })
  const body = await request.json()

  if (!body.resident) {
    throw new ValidationError(
      ErrorMessages.VALIDATION.REQUIRED_FIELD('resident'),
      'resident'
    )
  }

  if (!body.date) {
    throw new ValidationError(
      ErrorMessages.VALIDATION.REQUIRED_FIELD('date'),
      'date'
    )
  }

  try {
    const resident = await payload.findByID({
      collection: 'residents',
      id: body.resident,
    })

    if (!resident.active) {
      throw new ValidationError(
        ErrorMessages.VALIDATION.INACTIVE_RESIDENT(),
        'resident'
      )
    }
  } catch (err) {
    if (err instanceof ValidationError) {
      throw err
    }
    throw new NotFoundError(
      ErrorMessages.NOT_FOUND.RESIDENT(),
      'resident',
      body.resident
    )
  }

  const doc = await payload.create({
    collection: 'meal-orders',
    data: body,
  })

  logInfo('Meal order created', {
    orderId: doc.id,
    residentId: body.resident,
  }, requestId)

  timer.end()

  return NextResponse.json(doc, { status: 201 })
})
```

## Benefits of Migration

1. **Less Code** - No manual error response construction
2. **Consistency** - All errors follow the same format
3. **Type Safety** - TypeScript ensures correct error usage
4. **Better UX** - User-friendly error messages
5. **Better DX** - Easier to debug with structured logs
6. **Security** - No sensitive data in error messages
7. **Performance** - Automatic performance tracking

## Checklist

When migrating a route, ensure you:

- [ ] Import error handling utilities
- [ ] Wrap handler with `withErrorHandler`
- [ ] Replace all manual error responses with exceptions
- [ ] Use appropriate error types
- [ ] Use `ErrorMessages` for user-friendly messages
- [ ] Add performance monitoring with timers
- [ ] Add security event logging where appropriate
- [ ] Remove manual try-catch blocks (unless needed for specific logic)
- [ ] Test the migrated route
- [ ] Update any related tests

## Need Help?

- See `lib/errors/README.md` for detailed documentation
- See `lib/errors/examples.ts` for more examples
- See `docs/ERROR_HANDLING_IMPLEMENTATION.md` for implementation details
