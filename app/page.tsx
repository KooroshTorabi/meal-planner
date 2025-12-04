import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Alert from '@/components/ui/Alert'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 xs:p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Meal Planner System
          </h1>
          <p className="text-base xs:text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Digital meal planning and ordering system for elderly care homes
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card padding="lg" hover>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Caregiver Interface
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Create and manage meal orders for residents
              </p>
              <Link href="/caregiver">
                <Button variant="primary" size="md" className="w-full">
                  Go to Caregiver
                </Button>
              </Link>
            </div>
          </Card>

          <Card padding="lg" hover>
            <div className="text-center">
              <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Kitchen Dashboard
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                View orders and ingredient requirements
              </p>
              <Link href="/kitchen/dashboard">
                <Button variant="success" size="md" className="w-full">
                  Go to Kitchen
                </Button>
              </Link>
            </div>
          </Card>

          <Card padding="lg" hover>
            <div className="text-center">
              <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-warning-600 dark:text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Reports
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Generate and export meal order reports
              </p>
              <Link href="/reports">
                <Button variant="warning" size="md" className="w-full">
                  Go to Reports
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Features Section */}
        <Card padding="lg" className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            System Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Badge variant="primary">✓</Badge>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Responsive Design</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Works on all devices from 320px to 2560px</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="primary">✓</Badge>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Dark Mode</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Toggle between light, dark, and system themes</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="primary">✓</Badge>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Touch-Friendly</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">All controls are minimum 44x44px for easy tapping</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="primary">✓</Badge>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Accessible</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">WCAG compliant with ARIA labels and focus indicators</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Demo Alerts */}
        <div className="space-y-4">
          <Alert variant="info">
            <strong>Info:</strong> The theme toggle is located in the top-right corner. Try switching between light, dark, and system themes!
          </Alert>
          <Alert variant="success">
            <strong>Success:</strong> All responsive UI features have been implemented and tested.
          </Alert>
        </div>
      </div>
    </main>
  )
}
