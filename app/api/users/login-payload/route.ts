import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { logLoginSuccess, logLoginFailure } from '@/lib/audit'

export async function POST(request: NextRequest) {
  const email = ''
  try {
    const body = await request.json()
    const { email: userEmail, password } = body

    if (!userEmail || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })

    // Use Payload's built-in login
    const result = await payload.login({
      collection: 'users',
      data: { email: userEmail, password },
    })

    if (!result.user) {
      // Log failed login attempt
      await logLoginFailure(
        payload,
        userEmail,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        'Invalid credentials'
      )
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Log successful login
    await logLoginSuccess(
      payload,
      String(result.user.id),
      result.user.email || userEmail,
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    )

    // Return user data and token
    return NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      accessToken: result.token,
      refreshToken: result.token, // Payload uses same token
    })
  } catch (error: any) {
    console.error('Login error:', error)
    
    // Log failed login attempt
    if (email) {
      const payload = await getPayload({ config })
      await logLoginFailure(
        payload,
        email,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        error.message || 'Login failed'
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 401 }
    )
  }
}
