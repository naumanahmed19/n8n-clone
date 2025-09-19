import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { useAuthStore } from '@/stores'
import { socketService } from '@/services/socket'

export const Layout: React.FC = () => {
  const { token, isAuthenticated } = useAuthStore()

  useEffect(() => {
    // Initialize socket connection when user is authenticated
    if (isAuthenticated && token) {
      socketService.initialize(token)
    } else {
      // Disconnect socket when user is not authenticated
      socketService.disconnect()
    }
  }, [isAuthenticated, token])

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}