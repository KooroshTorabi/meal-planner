'use client'

import { useOptionalAuth } from '@/lib/hooks/useAuth'

export default function Home() {
  const { user } = useOptionalAuth()

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Meal Planner System
          </h1>
          {user && (
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back, <span className="font-medium">{user.name}</span>!
            </p>
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
