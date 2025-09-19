/**
 * Confirmation dialog component for destructive operations
 * Provides customizable confirmation dialogs with different severity levels
 */

import React from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react'
import { clsx } from 'clsx'

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  severity?: 'info' | 'warning' | 'danger'
  details?: string[]
  loading?: boolean
  disabled?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  severity = 'info',
  details = [],
  loading = false,
  disabled = false
}: ConfirmDialogProps) {
  // Handle escape key
  React.useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, loading, onClose])

  // Prevent body scroll when dialog is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const getIcon = () => {
    switch (severity) {
      case 'danger':
        return <AlertTriangle className="w-6 h-6 text-red-600" />
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-yellow-600" />
      case 'info':
        return <Info className="w-6 h-6 text-blue-600" />
    }
  }

  const getConfirmButtonClasses = () => {
    const baseClasses = 'px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
    
    switch (severity) {
      case 'danger':
        return clsx(
          baseClasses,
          'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
          (loading || disabled) && 'opacity-50 cursor-not-allowed'
        )
      case 'warning':
        return clsx(
          baseClasses,
          'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
          (loading || disabled) && 'opacity-50 cursor-not-allowed'
        )
      case 'info':
        return clsx(
          baseClasses,
          'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
          (loading || disabled) && 'opacity-50 cursor-not-allowed'
        )
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose()
    }
  }

  const handleConfirm = () => {
    if (loading || disabled) return
    onConfirm()
  }

  const handleCancel = () => {
    if (loading) return
    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 
                id="confirm-dialog-title"
                className="text-lg font-medium text-gray-900"
              >
                {title}
              </h3>
            </div>
          </div>
          
          <button
            onClick={handleCancel}
            disabled={loading}
            className={clsx(
              'p-1 text-gray-400 hover:text-gray-600 transition-colors',
              loading && 'opacity-50 cursor-not-allowed'
            )}
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          <p 
            id="confirm-dialog-description"
            className="text-sm text-gray-700 leading-relaxed"
          >
            {message}
          </p>

          {/* Details */}
          {details.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <ul className="text-sm text-gray-600 space-y-1">
                {details.map((detail, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={handleCancel}
            disabled={loading}
            className={clsx(
              'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors',
              loading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {cancelText}
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={loading || disabled}
            className={getConfirmButtonClasses()}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

/**
 * Hook for managing confirmation dialogs
 */
export interface UseConfirmDialogReturn {
  isOpen: boolean
  showConfirm: (options: Omit<ConfirmDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>) => Promise<boolean>
  hideConfirm: () => void
  ConfirmDialog: React.ComponentType<{}>
}

export function useConfirmDialog(): UseConfirmDialogReturn {
  const [isOpen, setIsOpen] = React.useState(false)
  const [dialogProps, setDialogProps] = React.useState<Omit<ConfirmDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>>({
    title: '',
    message: ''
  })
  const [resolvePromise, setResolvePromise] = React.useState<((value: boolean) => void) | null>(null)

  const showConfirm = React.useCallback((
    options: Omit<ConfirmDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogProps(options)
      setResolvePromise(() => resolve)
      setIsOpen(true)
    })
  }, [])

  const hideConfirm = React.useCallback(() => {
    setIsOpen(false)
    if (resolvePromise) {
      resolvePromise(false)
      setResolvePromise(null)
    }
  }, [resolvePromise])

  const handleConfirm = React.useCallback(() => {
    setIsOpen(false)
    if (resolvePromise) {
      resolvePromise(true)
      setResolvePromise(null)
    }
  }, [resolvePromise])

  const DialogComponent = React.useCallback(() => (
    <ConfirmDialog
      {...dialogProps}
      isOpen={isOpen}
      onClose={hideConfirm}
      onConfirm={handleConfirm}
    />
  ), [dialogProps, isOpen, hideConfirm, handleConfirm])

  return {
    isOpen,
    showConfirm,
    hideConfirm,
    ConfirmDialog: DialogComponent
  }
}