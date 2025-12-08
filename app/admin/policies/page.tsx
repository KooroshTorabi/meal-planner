'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RBAC_POLICIES } from '@/lib/policies/rbac'

type UserRole = 'admin' | 'kitchen' | 'caregiver'
type PolicyKey = keyof typeof RBAC_POLICIES

interface PolicyState {
  [key: string]: UserRole[]
}

export default function PoliciesPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [policies, setPolicies] = useState<PolicyState>({})
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyKey | null>(null)
  const [savedMessage, setSavedMessage] = useState('')

  // Check if user is admin
  useEffect(() => {
    const checkAuth = async () => {
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        router.push('/login?redirect=/admin/policies')
        return
      }
      const user = JSON.parse(userStr)
      if (user.role !== 'admin') {
        router.push('/')
        return
      }
      setAuthChecked(true)
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (authChecked) {
      // Initialize policies from RBAC_POLICIES
      const initialPolicies: PolicyState = {}
      Object.entries(RBAC_POLICIES).forEach(([key, roles]) => {
        initialPolicies[key] = [...roles]
      })
      setPolicies(initialPolicies)
    }
  }, [authChecked])

  const handleRoleToggle = (policyKey: PolicyKey, role: UserRole) => {
    setPolicies((prev) => {
      const current = prev[policyKey as string] || []
      const updated = current.includes(role)
        ? current.filter((r) => r !== role)
        : [...current, role]
      return {
        ...prev,
        [policyKey]: updated,
      }
    })
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/admin/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policies),
      })

      if (response.ok) {
        setSavedMessage('Policies saved successfully!')
        setTimeout(() => setSavedMessage(''), 3000)
      } else {
        setSavedMessage('Error saving policies')
      }
    } catch (error) {
      setSavedMessage('Error saving policies: ' + String(error))
    }
  }

  const handleReset = () => {
    const initialPolicies: PolicyState = {}
    Object.entries(RBAC_POLICIES).forEach(([key, roles]) => {
      initialPolicies[key] = [...roles]
    })
    setPolicies(initialPolicies)
    setSavedMessage('Policies reset to defaults')
    setTimeout(() => setSavedMessage(''), 3000)
  }

  // Don't render until auth is checked
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Checking authorization...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4 inline-block">
            ← Back to Admin Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Role-Based Access Control</h1>

        {savedMessage && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-400 rounded">
            {savedMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Policy List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Policies</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.keys(policies).map((policyKey) => (
                  <button
                    key={policyKey}
                    type="button"
                    onClick={() => setSelectedPolicy(policyKey as PolicyKey)}
                    className={`w-full text-left px-4 py-2 rounded transition-colors ${
                      selectedPolicy === policyKey
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span className="text-sm font-medium">{policyKey}</span>
                    <div className="text-xs mt-1 opacity-75">
                      {policies[policyKey]?.length || 0} role(s)
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Policy Editor */}
          <div className="lg:col-span-2">
            {selectedPolicy ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Edit: {selectedPolicy}
                </h2>

                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Select which roles have access to this policy:
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {(['admin', 'caregiver', 'kitchen'] as UserRole[]).map((role) => (
                    <label key={role} className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={policies[selectedPolicy]?.includes(role) || false}
                        onChange={() =>
                          handleRoleToggle(selectedPolicy, role)
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-3 font-medium text-gray-900 dark:text-gray-100 capitalize">
                        {role}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4 mb-6">
                  <p className="text-sm text-blue-900 dark:text-blue-300">
                    <strong>Current access:</strong>{' '}
                    {policies[selectedPolicy]?.length === 0
                      ? 'No roles have access'
                      : policies[selectedPolicy]?.join(', ')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
                <p>Select a policy to edit its role assignments</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-2 bg-gray-400 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-500 dark:hover:bg-gray-500 transition-colors font-medium"
          >
            Reset to Defaults
          </button>
          <Link
            href="/admin"
            className="px-6 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  )
}
