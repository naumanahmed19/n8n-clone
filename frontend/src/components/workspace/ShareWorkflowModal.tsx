import React, { useState } from 'react'
import { X, Plus, Mail, User, Shield, Globe, Lock } from 'lucide-react'
import { Workflow, WorkflowShare } from '@/types'
import { useWorkspaceStore } from '@/stores/workspace'

interface ShareWorkflowModalProps {
  workflow: Workflow
  isOpen: boolean
  onClose: () => void
}

export const ShareWorkflowModal: React.FC<ShareWorkflowModalProps> = ({
  workflow,
  isOpen,
  onClose
}) => {
  const { shareWorkflow } = useWorkspaceStore()
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<'view' | 'edit' | 'admin'>('view')
  const [isPublic, setIsPublic] = useState(workflow.isPublic || false)
  const [shares, setShares] = useState<Omit<WorkflowShare, 'sharedAt'>[]>(
    workflow.sharedWith?.map(share => ({
      userId: share.userId,
      userEmail: share.userEmail,
      permission: share.permission
    })) || []
  )
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleAddShare = () => {
    if (!email.trim()) return

    const newShare = {
      userId: '', // Will be resolved by backend
      userEmail: email.trim(),
      permission
    }

    setShares([...shares, newShare])
    setEmail('')
    setPermission('view')
  }

  const handleRemoveShare = (index: number) => {
    setShares(shares.filter((_, i) => i !== index))
  }

  const handleUpdatePermission = (index: number, newPermission: 'view' | 'edit' | 'admin') => {
    setShares(shares.map((share, i) => 
      i === index ? { ...share, permission: newPermission } : share
    ))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await shareWorkflow(workflow.id, shares)
      onClose()
    } catch (error) {
      console.error('Failed to update sharing settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPermissionIcon = (perm: string) => {
    switch (perm) {
      case 'admin': return <Shield className="w-4 h-4" />
      case 'edit': return <User className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  const getPermissionColor = (perm: string) => {
    switch (perm) {
      case 'admin': return 'text-red-600 bg-red-100'
      case 'edit': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Share "{workflow.name}"
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Public Access */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isPublic ? (
                  <Globe className="w-5 h-5 text-green-600" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {isPublic ? 'Public Access' : 'Private Workflow'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isPublic 
                      ? 'Anyone with the link can view this workflow'
                      : 'Only you and people you share with can access this workflow'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isPublic ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPublic ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Add New Share */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Invite people
            </h3>
            <div className="flex space-x-3">
              <div className="flex-1">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as 'view' | 'edit' | 'admin')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="view">Can view</option>
                <option value="edit">Can edit</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={handleAddShare}
                disabled={!email.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Current Shares */}
          {shares.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                People with access
              </h3>
              <div className="space-y-3">
                {shares.map((share, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <Mail className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {share.userEmail}
                        </div>
                        <div className="text-xs text-gray-500">
                          Invited
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        value={share.permission}
                        onChange={(e) => handleUpdatePermission(index, e.target.value as 'view' | 'edit' | 'admin')}
                        className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="view">Can view</option>
                        <option value="edit">Can edit</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handleRemoveShare(index)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permission Explanations */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Permission levels</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span><strong>Can view:</strong> Can see and run the workflow</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span><strong>Can edit:</strong> Can modify the workflow and its settings</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span><strong>Admin:</strong> Can manage sharing and delete the workflow</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}