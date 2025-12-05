'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const redirectTo = searchParams.get('redirect') || null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/users/login-payload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Store tokens in localStorage
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      // Store access token in cookie for middleware
      document.cookie = `accessToken=${data.accessToken}; path=/; max-age=900; SameSite=Strict`

      // Redirect to original page or home
      if (redirectTo) {
        router.push(redirectTo)
      } else {
        router.push('/')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex items-center justify-center p-4 relative">
      {/* Theme toggle in top right corner */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Meal Planner System
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to your account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-800 dark:text-red-200 rounded">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         transition-colors"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         transition-colors"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 
                       disabled:bg-gray-400 disabled:cursor-not-allowed
                       text-white font-medium rounded-lg
                       focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                       transition-colors flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Signing in... (this may take 20-30 seconds)' : 'Sign In'}
            </button>
            
            {loading && (
              <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-2">
                Please wait, authenticating your credentials...
              </p>
            )}
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Quick Login (Demo):
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@example.com')
                  setPassword('test')
                }}
                className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-left transition-colors"
              >
                <span className="font-medium">Admin:</span> admin@example.com / test
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('caregiver@example.com')
                  setPassword('test')
                }}
                className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-left transition-colors"
              >
                <span className="font-medium">Caregiver:</span> caregiver@example.com / test
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('kitchen@example.com')
                  setPassword('test')
                }}
                className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-left transition-colors"
              >
                <span className="font-medium">Kitchen:</span> kitchen@example.com / test
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
              ⚠️ Note: First login may take 60-90 seconds due to database migrations. Please be patient.
            </p>
            <p className="mt-2 text-xs text-primary-600 dark:text-primary-400">
              💡 Tip: For faster access, use the <a href="/admin" className="underline">Payload Admin Panel</a> at /admin
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
