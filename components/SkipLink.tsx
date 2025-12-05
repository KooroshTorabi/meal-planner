/**
 * Skip Link Component
 * 
 * Provides a "Skip to main content" link for keyboard users
 * that appears when focused. This allows keyboard users to
 * bypass navigation and go directly to the main content.
 * 
 * Requirements: 20.2
 */
export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="absolute -top-10 left-0 bg-primary-600 text-white px-4 py-2 rounded-br z-50 font-medium focus:top-0 transition-all"
    >
      Skip to main content
    </a>
  )
}
