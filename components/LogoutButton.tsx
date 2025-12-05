'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      
      if (refreshToken) {
        await fetch('/api/users/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local storage and cookies
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      document.cookie = 'accessToken=; path=/; max-age=0'
      
      // Redirect to login
      router.push('/login')
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    >
      Sign Out
    </button>
  )
}
