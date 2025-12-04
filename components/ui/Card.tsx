/**
 * Reusable Card Component
 * 
 * Provides consistent card styling with dark mode support.
 * Requirements: 11.3
 */

import { cardStyles, cn } from '@/lib/utils/styles'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  hover?: boolean
}

export default function Card({ 
  children, 
  className, 
  padding = 'md',
  hover = false 
}: CardProps) {
  return (
    <div
      className={cn(
        cardStyles.base,
        cardStyles.padding[padding],
        hover && cardStyles.hover,
        className
      )}
    >
      {children}
    </div>
  )
}
