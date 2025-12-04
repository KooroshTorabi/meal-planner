'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Keyboard Navigation Component
 * 
 * Provides keyboard shortcuts for common actions:
 * - Alt + H: Navigate to home
 * - Alt + C: Navigate to caregiver interface
 * - Alt + K: Navigate to kitchen dashboard
 * - Alt + R: Navigate to reports
 * - Escape: Close modals/dialogs
 * 
 * Requirements: 20.2
 */
export default function KeyboardNavigation() {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Alt key is pressed (Option on Mac)
      if (event.altKey) {
        switch (event.key.toLowerCase()) {
          case 'h':
            event.preventDefault()
            router.push('/')
            break
          case 'c':
            event.preventDefault()
            router.push('/caregiver')
            break
          case 'k':
            event.preventDefault()
            router.push('/kitchen/dashboard')
            break
          case 'r':
            event.preventDefault()
            router.push('/reports')
            break
        }
      }

      // Escape key handling for closing modals/dialogs
      if (event.key === 'Escape') {
        // Dispatch custom event that components can listen to
        window.dispatchEvent(new CustomEvent('closeModal'))
      }
    }

    // Add event listener
    window.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [router])

  return (
    <>
      {/* Screen reader announcement for keyboard shortcuts */}
      <div className="sr-only" role="region" aria-label="Keyboard shortcuts">
        <h2>Available Keyboard Shortcuts</h2>
        <ul>
          <li>Alt + H: Navigate to home page</li>
          <li>Alt + C: Navigate to caregiver interface</li>
          <li>Alt + K: Navigate to kitchen dashboard</li>
          <li>Alt + R: Navigate to reports</li>
          <li>Escape: Close modals and dialogs</li>
        </ul>
      </div>
    </>
  )
}
