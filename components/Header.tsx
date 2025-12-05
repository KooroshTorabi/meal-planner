'use client'

import { useOptionalAuth } from '@/lib/hooks/useAuth'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const { user, loading, logout } = useOptionalAuth()

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Title */}
          <div className="flex items-center">
            <a href="/" className="text-xl font-bold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Meal Planner System
            </a>
          </div>

          {/* Right side - User info and theme toggle */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-8 w-32 rounded"></div>
            ) : user ? (
              <>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">({user.role})</span>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <a
                href="/login"
                className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                Sign In
              </a>
            )}
            
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
