import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export default async function AdminPage() {
  // Check if user is admin
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value

  if (!accessToken) {
    redirect('/login?redirect=/admin')
  }

  // Decode token to get user ID
  const jwt = require('jsonwebtoken')
  let userId: string | undefined
  try {
    const decoded = jwt.decode(accessToken) as { id?: string | number } | null
    if (decoded?.id) {
      userId = String(decoded.id)
    }
  } catch {
    redirect('/login?redirect=/admin')
  }

  if (!userId) {
    redirect('/login?redirect=/admin')
  }

  // Fetch user to check role
  const payload = await getPayload({ config: configPromise })
  const user = await payload.findByID({
    collection: 'users',
    id: userId,
  })

  if (!user || user.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Meal Planner Admin Dashboard
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Management */}
          <Link
            href="/admin/users"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 hover:shadow-lg dark:hover:shadow-gray-800 transition-shadow border-l-4 border-red-600"
          >
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
              User Management
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Create and manage system users
            </p>
          </Link>

          {/* Caregiver Portal */}
          <Link
            href="/caregiver"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 hover:shadow-lg dark:hover:shadow-gray-800 transition-shadow border-l-4 border-blue-600"
          >
            <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-2">
              Caregiver Portal
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage meal orders for residents
            </p>
          </Link>

          {/* Kitchen Dashboard */}
          <Link
            href="/kitchen"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 hover:shadow-lg dark:hover:shadow-gray-800 transition-shadow border-l-4 border-green-600"
          >
            <h2 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">
              Kitchen Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage meal preparation
            </p>
          </Link>

          {/* Reports */}
          <Link
            href="/reports"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 hover:shadow-lg dark:hover:shadow-gray-800 transition-shadow border-l-4 border-purple-600"
          >
            <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-2">
              Reports
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              View analytics and generate reports
            </p>
          </Link>

          {/* Audit Logs */}
          <Link
            href="/audit-logs"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 hover:shadow-lg dark:hover:shadow-gray-800 transition-shadow border-l-4 border-orange-600"
          >
            <h2 className="text-xl font-semibold text-orange-600 dark:text-orange-400 mb-2">
              Audit Logs
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Review system activity and logs
            </p>
          </Link>

          {/* API Documentation */}
          <Link
            href="/api-docs"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 hover:shadow-lg dark:hover:shadow-gray-800 transition-shadow border-l-4 border-indigo-600"
          >
            <h2 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
              API Documentation
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Explore REST API endpoints
            </p>
          </Link>

          {/* Role-Based Access Control */}
          <Link
            href="/admin/policies"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 hover:shadow-lg dark:hover:shadow-gray-800 transition-shadow border-l-4 border-teal-600"
          >
            <h2 className="text-xl font-semibold text-teal-600 dark:text-teal-400 mb-2">
              Policies
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage role-based access control policies
            </p>
          </Link>

          {/* Home */}
          <Link
            href="/"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 hover:shadow-lg dark:hover:shadow-gray-800 transition-shadow border-l-4 border-gray-600"
          >
            <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
              Main Dashboard
            </h2>
            <p className="text-gray-600">
              Go to main application dashboard
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}

