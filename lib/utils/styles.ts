/**
 * Shared style utilities for consistent styling across components
 * 
 * Requirements: 11.3
 */

// Button styles with variants
export const buttonStyles = {
  base: 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-touch',
  
  variants: {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
    secondary: 'bg-secondary-200 hover:bg-secondary-300 dark:bg-secondary-700 dark:hover:bg-secondary-600 text-secondary-900 dark:text-secondary-100 focus:ring-secondary-500',
    success: 'bg-success-600 hover:bg-success-700 text-white focus:ring-success-500',
    warning: 'bg-warning-600 hover:bg-warning-700 text-white focus:ring-warning-500',
    danger: 'bg-danger-600 hover:bg-danger-700 text-white focus:ring-danger-500',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-gray-500',
  },
  
  sizes: {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  },
}

// Input styles
export const inputStyles = {
  base: 'w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:border-transparent transition-colors min-h-touch',
  
  variants: {
    default: 'border-gray-300 dark:border-gray-600 focus:ring-primary-500',
    error: 'border-danger-300 dark:border-danger-600 focus:ring-danger-500',
    success: 'border-success-300 dark:border-success-600 focus:ring-success-500',
  },
}

// Card styles
export const cardStyles = {
  base: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700',
  hover: 'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all',
  padding: {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  },
}

// Badge/Tag styles
export const badgeStyles = {
  base: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  
  variants: {
    default: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200',
    success: 'bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-200',
    warning: 'bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-200',
    danger: 'bg-danger-100 dark:bg-danger-900/30 text-danger-800 dark:text-danger-200',
  },
}

// Alert/Notification styles
export const alertStyles = {
  base: 'rounded-lg p-4 border-l-4',
  
  variants: {
    info: 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-800 dark:text-primary-200',
    success: 'bg-success-50 dark:bg-success-900/20 border-success-500 text-success-800 dark:text-success-200',
    warning: 'bg-warning-50 dark:bg-warning-900/20 border-warning-500 text-warning-800 dark:text-warning-200',
    error: 'bg-danger-50 dark:bg-danger-900/20 border-danger-500 text-danger-800 dark:text-danger-200',
  },
}

// Typography styles
export const textStyles = {
  heading: {
    h1: 'text-3xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white',
    h2: 'text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white',
    h3: 'text-xl xs:text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white',
    h4: 'text-lg xs:text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-white',
  },
  
  body: {
    large: 'text-lg text-gray-700 dark:text-gray-300',
    base: 'text-base text-gray-700 dark:text-gray-300',
    small: 'text-sm text-gray-600 dark:text-gray-400',
    tiny: 'text-xs text-gray-500 dark:text-gray-500',
  },
}

// Helper function to combine class names
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
