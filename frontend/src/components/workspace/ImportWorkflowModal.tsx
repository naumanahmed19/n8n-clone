import React, { useState, useRef } from 'react'
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace'

interface ImportWorkflowModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ImportWorkflowModal: React.FC<ImportWorkflowModalProps> = ({
  isOpen,
  onClose
}) => {
  const { importWorkflow } = useWorkspaceStore()
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleFileSelect = (selectedFile: File) => {
    setError(null)
    setSuccess(false)
    
    // Validate file type
    if (!selectedFile.name.endsWith('.json')) {
      setError('Please select a JSON file')
      return
    }
    
    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }
    
    setFile(selectedFile)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleImport = async () => {
    if (!file) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      await importWorkflow(file)
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error: any) {
      setError(error.message || 'Failed to import workflow')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setError(null)
    setSuccess(false)
    setDragActive(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Import Workflow</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Workflow Imported Successfully!
              </h3>
              <p className="text-gray-600">
                Your workflow has been imported and is now available in your workspace.
              </p>
            </div>
          ) : (
            <>
              {/* File Upload Area */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary-400 bg-primary-50'
                    : file
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileInputChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                {file ? (
                  <div className="space-y-2">
                    <FileText className="w-12 h-12 text-green-500 mx-auto" />
                    <div className="text-sm font-medium text-gray-900">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div className="text-sm font-medium text-gray-900">
                      Drop your workflow file here
                    </div>
                    <div className="text-xs text-gray-500">
                      or click to browse for a JSON file
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}

              {/* File Info */}
              {file && !error && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-sm text-blue-700">
                    <strong>Ready to import:</strong> {file.name}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    The workflow will be added to your workspace with a new unique ID.
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="mt-6 text-sm text-gray-600">
                <h4 className="font-medium mb-2">Import Instructions:</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Only JSON files exported from this platform are supported</li>
                  <li>• The workflow will be imported with a new unique ID</li>
                  <li>• All node configurations and connections will be preserved</li>
                  <li>• Credentials will need to be reconfigured after import</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {!success && (
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!file || isLoading || !!error}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Importing...' : 'Import Workflow'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}