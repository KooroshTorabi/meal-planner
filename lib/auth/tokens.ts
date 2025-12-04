/**
 * JWT Token Management Utilities
 * Handles access token and refresh token generation and validation
 */

import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production'

const ACCESS_TOKEN_EXPIRY = '15m' // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d' // 7 days

export interface TokenPayload {
  id: string
  email: string
  role: string
}

export interface RefreshTokenData {
  token: string
  expiresAt: Date
  createdAt: Date
}

/**
 * Generate an access token (JWT) for a user
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  })
}

/**
 * Generate a refresh token (random string) for a user
 */
export function generateRefreshToken(): RefreshTokenData {
  const token = crypto.randomBytes(64).toString('hex')
  const createdAt = new Date()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now
  
  return {
    token,
    expiresAt,
    createdAt,
  }
}

/**
 * Verify an access token and return the payload
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Check if a refresh token is expired
 */
export function isRefreshTokenExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt)
}
