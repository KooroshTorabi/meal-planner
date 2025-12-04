/**
 * Loading Spinner Component
 * 
 * Provides a consistent loading indicator with accessibility support.
 * Requirements: 11.3, 20.3
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function LoadingSpinner({ 
  size = 'md',
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className="flex items-center justify-center" role="status" aria-label="Loading">
      <div
        className={`animate-spin rounded-full border-b-2 border-primary-600 dark:border-primary-400 ${sizeClasses[size]} ${className}`}
      />
      <span className="sr-only">Loading...</span>
    </div>
  )
}
