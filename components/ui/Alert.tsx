/**
 * Reusable Alert Component
 * 
 * Provides consistent alert/notification styling with variants.
 * Requirements: 11.3, 20.3
 */

import { alertStyles, cn } from '@/lib/utils/styles'

interface AlertProps {
  children: React.ReactNode
  variant?: 'info' | 'success' | 'warning' | 'error'
  className?: string
  role?: string
}

export default function Alert({ 
  children, 
  variant = 'info',
  className,
  role = 'alert'
}: AlertProps) {
  return (
    <div
      role={role}
      aria-live="polite"
      className={cn(
        alertStyles.base,
        alertStyles.variants[variant],
        className
      )}
    >
      {children}
    </div>
  )
}
