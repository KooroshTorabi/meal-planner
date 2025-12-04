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
      className="skip-link"
      style={{
        position: 'absolute',
        top: '-40px',
        left: 0,
        background: '#3b82f6',
        color: 'white',
        padding: '8px 16px',
        textDecoration: 'none',
        zIndex: 100,
        borderRadius: '0 0 4px 0',
        fontWeight: 500,
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = '0'
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-40px'
      }}
    >
      Skip to main content
    </a>
  )
}
