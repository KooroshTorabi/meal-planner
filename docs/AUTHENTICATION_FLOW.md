# Authentication Flow Documentation

This document provides comprehensive documentation for the authentication system in the Meal Planner System.

## Table of Contents

- [Overview](#overview)
- [Authentication Architecture](#authentication-architecture)
- [Token Types](#token-types)
- [Authentication Flow](#authentication-flow)
- [Two-Factor Authentication (2FA)](#two-factor-authentication-2fa)
- [Token Validation](#token-validation)
- [Refresh Token Flow](#refresh-token-flow)
- [Logout Flow](#logout-flow)
- [Rate Limiting](#rate-limiting)
- [Security Considerations](#security-considerations)
- [Implementation Details](#implementation-details)
- [Troubleshooting](#troubleshooting)

## Overview

The Meal Planner System uses JWT (JSON Web Tokens) for authentication with support for:
- Access tokens (short-lived)
- Refresh tokens (long-lived)
- Two-factor authentication (TOTP-based)
- Rate limiting for brute force protection
- Comprehensive audit logging

### Key Features

- ✅ **JWT-based authentication**: Stateless, scalable authentication
- ✅ **Refresh token rotation**: Enhanced security with token rotation
- ✅ **2FA support**: Optional TOTP-based two-factor authentication
- ✅ **Rate limiting**: Protection against brute force attacks
- ✅ **Audit logging**: Complete audit trail of authentication events
- ✅ **Role-based access**: Three user roles with granular permissions

## Authentication Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Client                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  1. User enters credentials                            │  │
│  │  2. Optional: User enters 2FA code                     │  │
│  │  3. Store access token + refresh token                 │  │
│  │  4. Include access token in API requests               │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js)                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  POST /api/users/login                                 │  │
│  │  - Validate credentials                                │  │
│  │  - Check 2FA if enabled                                │  │
│  │  - Generate tokens                                     │  │
│  │  - Store refresh token                                 │  │
│  │  - Return tokens + user info                           │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  POST /api/users/refresh                               │  │
│  │  - Validate refresh token                              │  │
│  │  - Generate new access token                           │  │
│  │  - Rotate refresh token                                │  │
│  │  - Return new tokens                                   │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Authenticated Endpoints                               │  │
│  │  - Validate access token                               │  │
│  │  - Check user permissions                              │  │
│  │  - Process request                                     │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Users Collection                                      │  │
│  │  - User credentials (hashed passwords)                 │  │
│  │  - Refresh tokens                                      │  │
│  │  - 2FA secrets                                         │  │
│  │  - User roles                                          │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Audit Logs Collection                                 │  │
│  │  - Authentication attempts                             │  │
│  │  - Failed login attempts                               │  │
│  │  - Token refreshes                                     │  │
│  │  - 2FA events                                          │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Token Types

### Access Token

**Purpose**: Short-lived token for API authentication

**Lifetime**: 15 minutes

**Payload**:
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "role": "caregiver",
  "iat": 1704067200,
  "exp": 1704068100
}
```

**Usage**: Include in Authorization header for all API requests
```
Authorization: Bearer <access_token>
```

**Security**:
- Signed with JWT_SECRET
- Cannot be revoked (short lifetime mitigates risk)
- Validated on every API request

### Refresh Token

**Purpose**: Long-lived token for obtaining new access tokens

**Lifetime**: 7 days

**Payload**:
```json
{
  "token": "random-uuid",
  "iat": 1704067200,
  "exp": 1704672000
}
```

**Storage**: Stored in database (Users collection, refreshTokens array)

**Usage**: Send to /api/users/refresh to get new access token

**Security**:
- Signed with JWT_SECRET
- Can be revoked (removed from database)
- Rotated on each use (old token invalidated)
- Stored securely in database

## Authentication Flow

### Step-by-Step Process

#### 1. User Login Request

**Client sends**:
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "caregiver@example.com",
  "password": "password123"
}
```

#### 2. Server Validation

```typescript
// 1. Check rate limit (5 attempts per 15 minutes)
if (isRateLimited(ip)) {
  return 429 Too Many Requests
}

// 2. Find user by email
const user = await findUserByEmail(email)
if (!user) {
  recordFailedAttempt(ip)
  logAuthAttempt(email, false, 'User not found')
  return 401 Unauthorized
}

// 3. Check if user is active
if (!user.active) {
  recordFailedAttempt(ip)
  logAuthAttempt(email, false, 'Account inactive')
  return 401 Unauthorized
}

// 4. Verify password
const passwordMatch = await bcrypt.compare(password, user.password)
if (!passwordMatch) {
  recordFailedAttempt(ip)
  logAuthAttempt(email, false, 'Invalid password')
  return 401 Unauthorized
}

// 5. Check 2FA if enabled (see 2FA section)
if (user.twoFactorEnabled) {
  // Validate 2FA code
}

// 6. Reset rate limit on successful login
resetRateLimit(ip)

// 7. Generate tokens
const accessToken = generateAccessToken({
  id: user.id,
  email: user.email,
  role: user.role
})

const refreshToken = generateRefreshToken()

// 8. Store refresh token in database
await storeRefreshToken(user.id, refreshToken)

// 9. Log successful authentication
logAuthAttempt(email, true)

// 10. Return tokens
return {
  accessToken,
  refreshToken,
  user: { id, email, name, role }
}
```

#### 3. Client Stores Tokens

```javascript
// Store tokens securely
localStorage.setItem('accessToken', response.accessToken)
localStorage.setItem('refreshToken', response.refreshToken)
localStorage.setItem('user', JSON.stringify(response.user))
```

#### 4. Client Makes Authenticated Requests

```javascript
fetch('/api/meal-orders', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
})
```

### Sequence Diagram

```
Client                  API Server              Database
  │                         │                       │
  │  1. POST /login         │                       │
  │  (email, password)      │                       │
  ├────────────────────────>│                       │
  │                         │                       │
  │                         │  2. Find user         │
  │                         ├──────────────────────>│
  │                         │<──────────────────────┤
  │                         │  User data            │
  │                         │                       │
  │                         │  3. Verify password   │
  │                         │  (bcrypt.compare)     │
  │                         │                       │
  │                         │  4. Generate tokens   │
  │                         │                       │
  │                         │  5. Store refresh     │
  │                         ├──────────────────────>│
  │                         │<──────────────────────┤
  │                         │  Stored               │
  │                         │                       │
  │  6. Return tokens       │                       │
  │<────────────────────────┤                       │
  │  {accessToken,          │                       │
  │   refreshToken, user}   │                       │
  │                         │                       │
  │  7. API Request         │                       │
  │  (Authorization header) │                       │
  ├────────────────────────>│                       │
  │                         │                       │
  │                         │  8. Validate token    │
  │                         │  (jwt.verify)         │
  │                         │                       │
  │  9. Response            │                       │
  │<────────────────────────┤                       │
  │                         │                       │
```


## Two-Factor Authentication (2FA)

### Overview

The system supports TOTP (Time-based One-Time Password) 2FA using the Speakeasy library.

### Enabling 2FA

#### 1. User Requests 2FA Setup

```http
POST /api/users/enable-2fa
Authorization: Bearer <access_token>
```

#### 2. Server Generates Secret

```typescript
const secret = speakeasy.generateSecret({
  name: 'Meal Planner',
  issuer: 'Meal Planner System'
})

// Generate QR code for authenticator app
const qrCode = await QRCode.toDataURL(secret.otpauth_url)

// Store secret in user record
await updateUser(userId, {
  twoFactorEnabled: true,
  twoFactorSecret: secret.base32
})

return {
  secret: secret.base32,
  qrCode: qrCode,
  message: '2FA enabled successfully'
}
```

#### 3. User Scans QR Code

User scans QR code with authenticator app (Google Authenticator, Authy, etc.)

### Login with 2FA

#### 1. Initial Login Request

```http
POST /api/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 2. Server Detects 2FA Enabled

```json
{
  "error": "2FA code required",
  "requiresTwoFactor": true,
  "statusCode": 401
}
```

#### 3. User Provides 2FA Code

```http
POST /api/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "twoFactorCode": "123456"
}
```

#### 4. Server Verifies 2FA Code

```typescript
const verified = speakeasy.totp.verify({
  secret: user.twoFactorSecret,
  encoding: 'base32',
  token: twoFactorCode,
  window: 2  // Allow 2 time steps before/after
})

if (!verified) {
  recordFailedAttempt(ip)
  log2FAVerify(email, false, 'Invalid 2FA code')
  return 401 Unauthorized
}

// Continue with normal login flow
log2FAVerify(email, true)
```

### 2FA Flow Diagram

```
Client                  API Server              Database
  │                         │                       │
  │  1. POST /login         │                       │
  │  (email, password)      │                       │
  ├────────────────────────>│                       │
  │                         │                       │
  │                         │  2. Verify password   │
  │                         │  3. Check 2FA enabled │
  │                         │                       │
  │  4. 2FA required        │                       │
  │<────────────────────────┤                       │
  │  {requiresTwoFactor}    │                       │
  │                         │                       │
  │  5. POST /login         │                       │
  │  (email, password,      │                       │
  │   twoFactorCode)        │                       │
  ├────────────────────────>│                       │
  │                         │                       │
  │                         │  6. Verify 2FA code   │
  │                         │  (speakeasy.verify)   │
  │                         │                       │
  │                         │  7. Generate tokens   │
  │                         │                       │
  │  8. Return tokens       │                       │
  │<────────────────────────┤                       │
  │                         │                       │
```

## Token Validation

### Access Token Validation Process

```typescript
// 1. Extract token from Authorization header
const authHeader = request.headers.get('Authorization')
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return 401 Unauthorized
}

const token = authHeader.substring(7)

// 2. Verify token signature and expiration
try {
  const decoded = jwt.verify(token, JWT_SECRET)
  
  // 3. Extract user information
  const userId = decoded.id
  const userRole = decoded.role
  
  // 4. Attach user to request
  request.user = {
    id: userId,
    email: decoded.email,
    role: userRole
  }
  
  // 5. Continue to route handler
  return next()
  
} catch (error) {
  if (error.name === 'TokenExpiredError') {
    return 401 Token Expired
  }
  if (error.name === 'JsonWebTokenError') {
    return 401 Invalid Token
  }
  return 401 Unauthorized
}
```

### Token Validation Middleware

```typescript
export function requireAuth(handler) {
  return async (request) => {
    // Validate token
    const user = await validateAccessToken(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Attach user to request
    request.user = user
    
    // Call handler
    return handler(request)
  }
}

// Usage
export const GET = requireAuth(async (request) => {
  const user = request.user
  // Handle request
})
```

## Refresh Token Flow

### When to Refresh

Refresh the access token when:
1. Access token expires (15 minutes)
2. API returns 401 with "Token Expired" error
3. Proactively before expiration (recommended)

### Refresh Process

#### 1. Client Detects Expired Token

```javascript
async function apiRequest(url, options) {
  let response = await fetch(url, options)
  
  // Check if token expired
  if (response.status === 401) {
    const error = await response.json()
    
    if (error.message === 'Token expired') {
      // Refresh token
      const newToken = await refreshAccessToken()
      
      // Retry request with new token
      options.headers.Authorization = `Bearer ${newToken}`
      response = await fetch(url, options)
    }
  }
  
  return response
}
```

#### 2. Client Requests New Token

```http
POST /api/users/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 3. Server Validates and Rotates Token

```typescript
// 1. Verify refresh token signature
const decoded = jwt.verify(refreshToken, JWT_SECRET)

// 2. Find user with this refresh token
const user = await findUserWithRefreshToken(decoded.token)
if (!user) {
  return 401 Invalid Refresh Token
}

// 3. Check if token is expired
if (decoded.exp < Date.now() / 1000) {
  return 401 Refresh Token Expired
}

// 4. Generate new tokens
const newAccessToken = generateAccessToken({
  id: user.id,
  email: user.email,
  role: user.role
})

const newRefreshToken = generateRefreshToken()

// 5. Replace old refresh token with new one (rotation)
await replaceRefreshToken(user.id, decoded.token, newRefreshToken)

// 6. Return new tokens
return {
  accessToken: newAccessToken,
  refreshToken: newRefreshToken.token
}
```

#### 4. Client Stores New Tokens

```javascript
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken')
  
  const response = await fetch('/api/users/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  })
  
  if (!response.ok) {
    // Refresh token expired, redirect to login
    window.location.href = '/login'
    return null
  }
  
  const data = await response.json()
  
  // Store new tokens
  localStorage.setItem('accessToken', data.accessToken)
  localStorage.setItem('refreshToken', data.refreshToken)
  
  return data.accessToken
}
```

### Refresh Token Rotation

**Why Rotate?**
- Enhanced security: Old tokens are invalidated
- Prevents token reuse attacks
- Limits damage if token is compromised

**How It Works**:
1. Client sends refresh token
2. Server validates token
3. Server generates new access token + new refresh token
4. Server removes old refresh token from database
5. Server stores new refresh token in database
6. Server returns both new tokens
7. Client replaces old tokens with new ones

## Logout Flow

### Process

#### 1. Client Sends Logout Request

```http
POST /api/users/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. Server Invalidates Refresh Token

```typescript
// 1. Verify access token
const user = await validateAccessToken(request)

// 2. Decode refresh token
const decoded = jwt.verify(refreshToken, JWT_SECRET)

// 3. Remove refresh token from database
await removeRefreshToken(user.id, decoded.token)

// 4. Log logout event
logAuthAttempt(user.email, true, 'logout')

// 5. Return success
return { message: 'Logged out successfully' }
```

#### 3. Client Clears Tokens

```javascript
async function logout() {
  const accessToken = localStorage.getItem('accessToken')
  const refreshToken = localStorage.getItem('refreshToken')
  
  // Call logout endpoint
  await fetch('/api/users/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken })
  })
  
  // Clear local storage
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  
  // Redirect to login
  window.location.href = '/login'
}
```


## Rate Limiting

### Configuration

```typescript
const RATE_LIMIT_CONFIG = {
  maxAttempts: 5,           // Maximum failed attempts
  windowMs: 15 * 60 * 1000, // 15 minutes
  lockoutMs: 15 * 60 * 1000 // 15 minutes lockout
}
```

### Implementation

```typescript
// In-memory store (use Redis in production)
const failedAttempts = new Map()

export function isRateLimited(ip: string): boolean {
  const attempts = failedAttempts.get(ip)
  
  if (!attempts) return false
  
  // Check if still within lockout period
  if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    return true
  }
  
  // Check if within window and exceeded max attempts
  if (attempts.count >= RATE_LIMIT_CONFIG.maxAttempts) {
    return true
  }
  
  return false
}

export function recordFailedAttempt(ip: string): void {
  const attempts = failedAttempts.get(ip) || { count: 0, firstAttempt: Date.now() }
  
  // Reset if outside window
  if (Date.now() - attempts.firstAttempt > RATE_LIMIT_CONFIG.windowMs) {
    attempts.count = 1
    attempts.firstAttempt = Date.now()
  } else {
    attempts.count++
  }
  
  // Lock if exceeded max attempts
  if (attempts.count >= RATE_LIMIT_CONFIG.maxAttempts) {
    attempts.lockedUntil = Date.now() + RATE_LIMIT_CONFIG.lockoutMs
  }
  
  failedAttempts.set(ip, attempts)
}

export function resetRateLimit(ip: string): void {
  failedAttempts.delete(ip)
}
```

### Rate Limit Response

```json
{
  "error": "Too many failed login attempts. Please try again later.",
  "retryAfter": 900,
  "statusCode": 429
}
```

## Security Considerations

### Password Security

**Hashing**:
- Algorithm: bcrypt
- Salt rounds: 12
- Never store plain text passwords

```typescript
// Hash password on user creation
const hashedPassword = await bcrypt.hash(password, 12)

// Verify password on login
const isValid = await bcrypt.compare(password, hashedPassword)
```

### Token Security

**Access Tokens**:
- Short lifetime (15 minutes)
- Signed with strong secret
- Cannot be revoked (short lifetime mitigates risk)
- Validated on every request

**Refresh Tokens**:
- Long lifetime (7 days)
- Stored in database (can be revoked)
- Rotated on each use
- One-time use only

**Secrets**:
- Use strong, random secrets (minimum 32 characters)
- Store in environment variables
- Never commit to version control
- Rotate periodically

```bash
# Generate strong secrets
openssl rand -base64 32
```

### HTTPS/TLS

**Production Requirements**:
- Always use HTTPS in production
- Redirect HTTP to HTTPS
- Use TLS 1.2 or higher
- Use strong cipher suites

### CORS Configuration

```typescript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

### XSS Protection

- Sanitize user input
- Use Content Security Policy headers
- Escape output in templates
- Use httpOnly cookies for sensitive data

### CSRF Protection

- Use CSRF tokens for state-changing operations
- Validate Origin/Referer headers
- Use SameSite cookie attribute

## Implementation Details

### Token Generation

```typescript
import jwt from 'jsonwebtoken'

export function generateAccessToken(payload: {
  id: string
  email: string
  role: string
}): string {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET!,
    {
      expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
      issuer: 'meal-planner-system',
      audience: 'meal-planner-api'
    }
  )
}

export function generateRefreshToken(): {
  token: string
  expiresAt: Date
  createdAt: Date
} {
  const token = jwt.sign(
    { token: crypto.randomUUID() },
    process.env.JWT_SECRET!,
    {
      expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
      issuer: 'meal-planner-system',
      audience: 'meal-planner-api'
    }
  )
  
  const decoded = jwt.decode(token) as any
  
  return {
    token,
    expiresAt: new Date(decoded.exp * 1000),
    createdAt: new Date(decoded.iat * 1000)
  }
}
```

### Token Validation

```typescript
export function validateAccessToken(token: string): {
  id: string
  email: string
  role: string
} | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      issuer: 'meal-planner-system',
      audience: 'meal-planner-api'
    }) as any
    
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    }
  } catch (error) {
    return null
  }
}
```

### Audit Logging

```typescript
export async function logAuthAttempt(
  payload: Payload,
  email: string,
  success: boolean,
  request: NextRequest,
  errorMessage?: string
): Promise<void> {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  await payload.create({
    collection: 'audit-logs',
    data: {
      action: success ? 'login_success' : 'login_failure',
      email,
      status: success ? 'success' : 'failure',
      ipAddress: ip,
      userAgent,
      errorMessage,
      details: {
        timestamp: new Date().toISOString()
      }
    }
  })
}
```

## Troubleshooting

### Common Issues

#### Issue: "Token expired" error

**Cause**: Access token has expired (15 minutes)

**Solution**: Implement automatic token refresh
```javascript
if (response.status === 401) {
  const newToken = await refreshAccessToken()
  // Retry request with new token
}
```

#### Issue: "Invalid refresh token" error

**Cause**: Refresh token has been revoked or expired

**Solution**: Redirect user to login page
```javascript
if (refreshResponse.status === 401) {
  window.location.href = '/login'
}
```

#### Issue: "Rate limit exceeded" error

**Cause**: Too many failed login attempts

**Solution**: Wait for lockout period to expire (15 minutes)
```javascript
if (response.status === 429) {
  const data = await response.json()
  showError(`Too many attempts. Try again in ${data.retryAfter} seconds`)
}
```

#### Issue: "2FA code required" but user doesn't have 2FA enabled

**Cause**: Database inconsistency

**Solution**: Admin should disable 2FA for the user
```typescript
await payload.update({
  collection: 'users',
  id: userId,
  data: {
    twoFactorEnabled: false,
    twoFactorSecret: null
  }
})
```

### Debugging

**Enable debug logging**:
```typescript
// In development
if (process.env.NODE_ENV === 'development') {
  console.log('Token payload:', jwt.decode(token))
  console.log('Token expiration:', new Date(decoded.exp * 1000))
}
```

**Check token validity**:
```bash
# Decode JWT token (without verification)
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | base64 -d
```

**Test authentication**:
```bash
# Login
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# Use token
curl -X GET http://localhost:3000/api/meal-orders \
  -H "Authorization: Bearer <access_token>"

# Refresh token
curl -X POST http://localhost:3000/api/users/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh_token>"}'
```

## Best Practices

### Client-Side

1. **Store tokens securely**
   - Use localStorage or sessionStorage
   - Never store in cookies without httpOnly flag
   - Clear tokens on logout

2. **Implement automatic token refresh**
   - Refresh before expiration
   - Handle refresh failures gracefully
   - Redirect to login if refresh fails

3. **Handle authentication errors**
   - Show user-friendly error messages
   - Provide clear next steps
   - Log errors for debugging

4. **Implement logout everywhere**
   - Clear all tokens
   - Clear user data
   - Redirect to login page

### Server-Side

1. **Use strong secrets**
   - Minimum 32 characters
   - Random and unpredictable
   - Rotate periodically

2. **Implement rate limiting**
   - Protect against brute force
   - Use Redis for distributed systems
   - Log suspicious activity

3. **Log all authentication events**
   - Successful logins
   - Failed attempts
   - Token refreshes
   - Logouts

4. **Validate tokens properly**
   - Check signature
   - Check expiration
   - Check issuer/audience
   - Handle errors gracefully

5. **Rotate refresh tokens**
   - One-time use only
   - Invalidate old tokens
   - Detect token reuse

## Additional Resources

- [JWT.io](https://jwt.io/) - JWT debugger and documentation
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Speakeasy Documentation](https://github.com/speakeasyjs/speakeasy)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)

---

**Last Updated**: December 2024
