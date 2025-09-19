import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
}) => {
  const { isAuthenticated, isLoading, getCurrentUser, token, loginAsGuest } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    // If we have a token but no user info, try to get current user
    if (token && token !== 'guest-token' && !isAuthenticated && !isLoading) {
      getCurrentUser()
    }
    // Remove automatic guest login - users must explicitly choose guest mode
  }, [token, isAuthenticated, isLoading, getCurrentUser])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600" />
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If authentication is required but user is not authenticated (and not guest)
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If user is authenticated but trying to access auth pages
  if (!requireAuth && isAuthenticated) {
    const from = location.state?.from?.pathname || '/workflows'
    return <Navigate to={from} replace />
  }

  return <>{children}</>
}