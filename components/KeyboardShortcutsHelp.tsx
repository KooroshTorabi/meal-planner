'use client'

import { useState, useEffect } from 'react'

/**
 * Keyboard Shortcuts Help Component
 * 
 * Displays a help dialog showing available keyboard shortcuts.
 * Can be toggled with Shift + ? or by clicking a help button.
 * 
 * Requirements: 20.2
 */
export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Shift + ? to toggle help
      if (event.shiftKey && event.key === '?') {
        event.preventDefault()
        setIsOpen(prev => !prev)
      }
      
      // Escape to close
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 w-12 h-12 bg-gray-800 dark:bg-gray-700 text-white rounded-full 
                   shadow-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors
                   focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Show keyboard shortcuts help"
        title="Keyboard shortcuts (Shift + ?)"
      >
        <span className="text-xl font-bold">?</span>
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-labelledby="shortcuts-title"
        aria-modal="true"
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50
                   bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-md w-full mx-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="shortcuts-title" className="text-2xl font-bold text-gray-900 dark:text-white">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                       focus:ring-2 focus:ring-blue-500 rounded p-1"
            aria-label="Close keyboard shortcuts help"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Navigation
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Home page</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs">
                  Alt + H
                </kbd>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Caregiver interface</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs">
                  Alt + C
                </kbd>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Kitchen dashboard</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs">
                  Alt + K
                </kbd>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Reports</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs">
                  Alt + R
                </kbd>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              General
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Skip to main content</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs">
                  Tab (from top)
                </kbd>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Close dialogs</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs">
                  Escape
                </kbd>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Show this help</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs">
                  Shift + ?
                </kbd>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Tips
            </h3>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• Use Tab to navigate between interactive elements</li>
              <li>• Use Shift + Tab to navigate backwards</li>
              <li>• Use Enter or Space to activate buttons and links</li>
              <li>• Use arrow keys to navigate within lists and menus</li>
            </ul>
          </section>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md
                       focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  )
}
