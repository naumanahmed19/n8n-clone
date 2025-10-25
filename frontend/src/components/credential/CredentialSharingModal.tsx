import { useState, useEffect } from 'react'
import { X, Users, Search, UserCheck, UserX, Loader2 } from 'lucide-react'
import { Credential } from '@/types'
import { useCredentialStore } from '@/stores'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface CredentialSharingModalProps {
  credential: Credential
  onClose: () => void
  onShare: () => void
}

export function CredentialSharingModal({ credential, onClose, onShare }: CredentialSharingModalProps) {
  const { shareCredential, unshareCredential } = useCredentialStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [sharedUsers, setSharedUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isSharing, setIsSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mock data - in real app, this would come from an API
  useEffect(() => {
    // Simulate fetching users
    const mockUsers: User[] = [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
      { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
      { id: '4', name: 'Alice Brown', email: 'alice@example.com' },
      { id: '5', name: 'Charlie Wilson', email: 'charlie@example.com' }
    ]

    // Simulate currently shared users
    const currentlyShared = mockUsers.slice(0, 2)
    const available = mockUsers.slice(2)

    setSharedUsers(currentlyShared)
    setAvailableUsers(available)
  }, [])

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleShareWithSelected = async () => {
    if (selectedUsers.length === 0) return

    setIsSharing(true)
    setError(null)

    try {
      await shareCredential(credential.id, selectedUsers)
      
      // Move selected users from available to shared
      const usersToMove = availableUsers.filter(user => selectedUsers.includes(user.id))
      setSharedUsers(prev => [...prev, ...usersToMove])
      setAvailableUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)))
      setSelectedUsers([])
      
      onShare()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to share credential')
    } finally {
      setIsSharing(false)
    }
  }

  const handleUnshareUser = async (userId: string) => {
    setError(null)

    try {
      await unshareCredential(credential.id, [userId])
      
      // Move user from shared to available
      const userToMove = sharedUsers.find(user => user.id === userId)
      if (userToMove) {
        setAvailableUsers(prev => [...prev, userToMove])
        setSharedUsers(prev => prev.filter(user => user.id !== userId))
      }
      
      onShare()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to unshare credential')
    }
  }

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Share Credential
                </h2>
                <p className="text-sm text-gray-500">
                  Manage access to "{credential.name}"
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Currently Shared Users */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Currently Shared With ({sharedUsers.length})
            </h3>
            
            {sharedUsers.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">This credential is not shared with anyone</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sharedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-purple-600">
                          {getUserInitials(user.name)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnshareUser(user.id)}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                      title="Remove access"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Users */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Share with Additional Users
            </h3>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* User List */}
            {filteredUsers.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">
                  {searchTerm ? 'No users found matching your search' : 'No additional users available'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {getUserInitials(user.name)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Share Button */}
            {selectedUsers.length > 0 && (
              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-900">
                      Share with {selectedUsers.length} user{selectedUsers.length === 1 ? '' : 's'}
                    </p>
                    <p className="text-xs text-purple-700">
                      Selected users will gain access to this credential
                    </p>
                  </div>
                  <button
                    onClick={handleShareWithSelected}
                    disabled={isSharing}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSharing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                    <span>Share</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
