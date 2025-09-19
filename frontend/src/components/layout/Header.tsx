import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Settings, User, Workflow, Activity } from 'lucide-react'
import { useAuthStore } from '@/stores'

export const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Workflow className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">n8n Clone</span>
            </Link>

            <nav className="hidden md:flex space-x-6">
              <Link
                to="/workflows"
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <Workflow className="w-4 h-4" />
                <span>Workflows</span>
              </Link>
              <Link
                to="/executions"
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <Activity className="w-4 h-4" />
                <span>Executions</span>
              </Link>
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user?.id === 'guest' && (
              <Link
                to="/login"
                className="text-sm font-medium text-primary-600 hover:text-primary-500 px-3 py-2 rounded-md transition-colors"
              >
                Sign In
              </Link>
            )}
            
            <div className="relative group">
              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                <User className="w-4 h-4" />
                <span className="hidden sm:block">
                  {user?.id === 'guest' ? 'Guest' : (user?.name || user?.email)}
                </span>
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {user?.id !== 'guest' && (
                  <Link
                    to="/settings"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{user?.id === 'guest' ? 'Exit Guest Mode' : 'Sign out'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200">
        <nav className="px-4 py-2 space-y-1">
          <Link
            to="/workflows"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
          >
            <Workflow className="w-4 h-4" />
            <span>Workflows</span>
          </Link>
          <Link
            to="/executions"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
          >
            <Activity className="w-4 h-4" />
            <span>Executions</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}