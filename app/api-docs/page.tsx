'use client'

import dynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Meal Planner System API Documentation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Interactive API documentation powered by Swagger/OpenAPI 3.0
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <SwaggerUI 
            url="/api/swagger.json"
            docExpansion="list"
            defaultModelsExpandDepth={1}
            defaultModelExpandDepth={1}
          />
        </div>
        
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Quick Start Guide
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200">
            <li>Click on <strong>Authentication</strong> section below</li>
            <li>Try the <strong>POST /api/users/login</strong> endpoint with test credentials</li>
            <li>Copy the <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">access_token</code> from the response</li>
            <li>Click the <strong>Authorize</strong> button at the top</li>
            <li>Paste the token and click <strong>Authorize</strong></li>
            <li>Now you can test all protected endpoints!</li>
          </ol>
          
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Test Credentials (after seeding):
            </h3>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200 font-mono">
              <li>Admin: <code>admin@example.com</code> / <code>test</code></li>
              <li>Caregiver: <code>caregiver@example.com</code> / <code>test</code></li>
              <li>Kitchen: <code>kitchen@example.com</code> / <code>test</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
