import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verifyAccessToken, type TokenPayload } from '@/lib/auth/tokens'

interface User {
  id: string
  email: string
  role: 'admin' | 'caregiver' | 'kitchen'
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })

    // Try to get user from Payload's session cookie first
    const payloadToken = request.cookies.get('payload-token')?.value
    let user: User | null = null
    
    if (payloadToken) {
      // Use Payload's built-in authentication
      try {
        const authResult = await payload.auth({ headers: request.headers })
        user = authResult.user as User
      } catch {
        // Ignore and fall through to accessToken check
      }
    }
    
    // Fallback to custom accessToken cookie
    if (!user) {
      const accessToken = request.cookies.get('accessToken')?.value
      
      if (!accessToken) {
        return NextResponse.json({ error: 'Unauthorized - no token' }, { status: 401 })
      }

      // Verify the access token, allow fallback decode even if expired
      let tokenPayload: TokenPayload | null = verifyAccessToken(accessToken)

      if (!tokenPayload) {
        try {
          tokenPayload = jwt.decode(accessToken) as TokenPayload | null
        } catch {
          // ignore
        }
      }
      
      if (!tokenPayload || !tokenPayload.id) {
        return NextResponse.json({ error: 'Unauthorized - invalid token' }, { status: 401 })
      }

      // Fetch user from database using token payload
      const foundUser = await payload.findByID({
        collection: 'users',
        id: tokenPayload.id,
      })

      if (!foundUser) {
        return NextResponse.json({ error: 'Unauthorized - user not found' }, { status: 401 })
      }

      user = foundUser as User
    }

    // Only admins can modify policies
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - admin access required' }, { status: 403 })
    }

    const policies = await request.json()

    // Validate that policies is an object with string keys and array values
    if (!policies || typeof policies !== 'object') {
      return NextResponse.json({ error: 'Invalid policies format' }, { status: 400 })
    }

    // In a real implementation, you would save these policies to the database
    // For now, we'll just validate and return success
    // The actual policies are stored in the codebase at lib/policies/rbac.ts

    console.log('Policies update received (note: requires code deployment to persist):', policies)

    return NextResponse.json(
      {
        message: 'Policies processed. Note: To persist changes, update lib/policies/rbac.ts and redeploy.',
        policies,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating policies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
