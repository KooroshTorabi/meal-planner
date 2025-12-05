'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'

/**
 * Conditionally renders the Header component based on the current route
 * Excludes header from login page for cleaner UX
 */
export default function ConditionalHeader() {
  const pathname = usePathname()
  
  // Don't show header on login page
  if (pathname === '/login') {
    return null
  }
  
  return <Header />
}
