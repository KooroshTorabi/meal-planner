/**
 * Rate Limiting for Authentication
 * Limits failed login attempts to 5 per 15 minutes per IP
 */

interface RateLimitEntry {
  attempts: number
  firstAttempt: number
  lockedUntil?: number
}

// In-memory store for rate limiting
// In production, use Redis or similar distributed cache
const rateLimitStore = new Map<string, RateLimitEntry>()

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const LOCK_DURATION_MS = 15 * 60 * 1000 // 15 minutes

/**
 * Check if an IP is rate limited
 */
export function isRateLimited(ip: string): boolean {
  const entry = rateLimitStore.get(ip)
  
  if (!entry) {
    return false
  }
  
  const now = Date.now()
  
  // Check if currently locked
  if (entry.lockedUntil && entry.lockedUntil > now) {
    return true
  }
  
  // Check if window has expired
  if (now - entry.firstAttempt > WINDOW_MS) {
    // Window expired, reset
    rateLimitStore.delete(ip)
    return false
  }
  
  // Check if max attempts reached
  return entry.attempts >= MAX_ATTEMPTS
}

/**
 * Record a failed login attempt
 */
export function recordFailedAttempt(ip: string): void {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)
  
  if (!entry) {
    // First attempt
    rateLimitStore.set(ip, {
      attempts: 1,
      firstAttempt: now,
    })
    return
  }
  
  // Check if window has expired
  if (now - entry.firstAttempt > WINDOW_MS) {
    // Window expired, reset
    rateLimitStore.set(ip, {
      attempts: 1,
      firstAttempt: now,
    })
    return
  }
  
  // Increment attempts
  entry.attempts += 1
  
  // Lock if max attempts reached
  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCK_DURATION_MS
  }
  
  rateLimitStore.set(ip, entry)
}

/**
 * Reset rate limit for an IP (e.g., after successful login)
 */
export function resetRateLimit(ip: string): void {
  rateLimitStore.delete(ip)
}

/**
 * Get remaining attempts for an IP
 */
export function getRemainingAttempts(ip: string): number {
  const entry = rateLimitStore.get(ip)
  
  if (!entry) {
    return MAX_ATTEMPTS
  }
  
  const now = Date.now()
  
  // Check if window has expired
  if (now - entry.firstAttempt > WINDOW_MS) {
    return MAX_ATTEMPTS
  }
  
  return Math.max(0, MAX_ATTEMPTS - entry.attempts)
}

/**
 * Get time until unlock (in seconds)
 */
export function getTimeUntilUnlock(ip: string): number {
  const entry = rateLimitStore.get(ip)
  
  if (!entry || !entry.lockedUntil) {
    return 0
  }
  
  const now = Date.now()
  const remaining = Math.max(0, entry.lockedUntil - now)
  
  return Math.ceil(remaining / 1000) // Convert to seconds
}
