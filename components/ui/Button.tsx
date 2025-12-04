/**
 * Reusable Button Component
 * 
 * Provides consistent button styling with variants and accessibility features.
 * Requirements: 11.3, 20.2
 */

import { buttonStyles, cn } from '@/lib/utils/styles'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        buttonStyles.base,
        buttonStyles.variants[variant],
        buttonStyles.sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
