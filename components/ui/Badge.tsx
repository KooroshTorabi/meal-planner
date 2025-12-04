/**
 * Reusable Badge Component
 * 
 * Provides consistent badge/tag styling with variants.
 * Requirements: 11.3
 */

import { badgeStyles, cn } from '@/lib/utils/styles'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  className?: string
}

export default function Badge({ 
  children, 
  variant = 'default',
  className 
}: BadgeProps) {
  return (
    <span
      className={cn(
        badgeStyles.base,
        badgeStyles.variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
