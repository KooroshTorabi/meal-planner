'use client'

import { useOptionalAuth } from '@/lib/hooks/useAuth'

export default function Home() {
  const { user, loading, logout } = useOptionalAuth()

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Sign In/Out button */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Meal Planner System
          </h1>
          {loading ? (
            <div className="px-6 py-3">
              <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-10 w-24 rounded-lg"></div>
            </div>
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, <span className="font-medium">{user.name}</span> ({user.role})
              </span>
              <button
                onClick={logout}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <a
              href="/login"
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Sign In
            </a>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a 
            href="/caregiver" 
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">Caregiver Interface</h2>
            <p className="text-gray-600 dark:text-gray-400">Create and manage meal orders</p>
          </a>
          
          <a 
            href="/kitchen/dashboard" 
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">Kitchen Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-400">View orders and ingredients</p>
          </a>
          
          <a 
            href="/reports" 
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">Reports</h2>
            <p className="text-gray-600 dark:text-gray-400">Generate meal order reports</p>
          </a>
        </div>
        
        <div className="mt-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Developer Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a href="/api-docs" className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 transition-colors">
              <h3 className="font-semibold mb-1">API Documentation</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Interactive Swagger/OpenAPI docs</p>
            </a>
            <a href="/audit-logs" className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 transition-colors">
              <h3 className="font-semibold mb-1">Audit Logs</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">View system audit logs (Admin only)</p>
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
