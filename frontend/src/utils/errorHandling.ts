/**
 * Error handling utilities for workflow operations
 * Provides standardized error handling, logging, and user feedback
 */

export interface ErrorDetails {
  code: string
  message: string
  details?: string
  timestamp: number
  context?: Record<string, any>
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export class OperationError extends Error {
  code: string
  details?: string
  context?: Record<string, any>
  recoverable?: boolean

  constructor(
    code: string,
    message: string,
    details?: string,
    context?: Record<string, any>,
    recoverable = false
  ) {
    super(message)
    this.name = 'OperationError'
    this.code = code
    this.details = details
    this.context = context
    this.recoverable = recoverable
  }
}

/**
 * Error codes for different types of operations
 */
export const ErrorCodes = {
  // Title management errors
  TITLE_EMPTY: 'TITLE_EMPTY',
  TITLE_TOO_LONG: 'TITLE_TOO_LONG',
  TITLE_INVALID_CHARS: 'TITLE_INVALID_CHARS',
  TITLE_SAVE_FAILED: 'TITLE_SAVE_FAILED',
  
  // Import/Export errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_INVALID_FORMAT: 'FILE_INVALID_FORMAT',
  FILE_INVALID_EXTENSION: 'FILE_INVALID_EXTENSION',
  FILE_READ_FAILED: 'FILE_READ_FAILED',
  EXPORT_FAILED: 'EXPORT_FAILED',
  IMPORT_FAILED: 'IMPORT_FAILED',
  WORKFLOW_VALIDATION_FAILED: 'WORKFLOW_VALIDATION_FAILED',
  
  // Execution errors
  EXECUTION_VALIDATION_FAILED: 'EXECUTION_VALIDATION_FAILED',
  EXECUTION_FAILED: 'EXECUTION_FAILED',
  EXECUTION_TIMEOUT: 'EXECUTION_TIMEOUT',
  EXECUTION_CANCELLED: 'EXECUTION_CANCELLED',
  NODE_EXECUTION_FAILED: 'NODE_EXECUTION_FAILED',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND'
} as const

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]

/**
 * Create a standardized operation error
 */
export function createOperationError(
  code: ErrorCode,
  message: string,
  details?: string,
  context?: Record<string, any>,
  recoverable = false
): OperationError {
  return new OperationError(code, message, details, context, recoverable)
}

/**
 * Extract error details from various error types
 */
export function extractErrorDetails(error: unknown): ErrorDetails {
  const timestamp = Date.now()
  
  if (error instanceof OperationError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp,
      context: error.context
    }
  }
  
  if (error instanceof Error) {
    // Try to determine error code from message patterns
    let code: ErrorCode = ErrorCodes.UNKNOWN_ERROR
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) {
      code = ErrorCodes.NETWORK_ERROR
    } else if (message.includes('timeout')) {
      code = ErrorCodes.TIMEOUT_ERROR
    } else if (message.includes('permission') || message.includes('unauthorized')) {
      code = ErrorCodes.PERMISSION_DENIED
    } else if (message.includes('not found')) {
      code = ErrorCodes.RESOURCE_NOT_FOUND
    }
    
    return {
      code,
      message: error.message,
      details: error.stack,
      timestamp
    }
  }
  
  return {
    code: ErrorCodes.UNKNOWN_ERROR,
    message: typeof error === 'string' ? error : 'An unknown error occurred',
    timestamp
  }
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  const details = extractErrorDetails(error)
  
  switch (details.code) {
    case ErrorCodes.TITLE_EMPTY:
      return 'Workflow title cannot be empty'
    case ErrorCodes.TITLE_TOO_LONG:
      return 'Workflow title is too long (maximum 100 characters)'
    case ErrorCodes.TITLE_INVALID_CHARS:
      return 'Workflow title contains invalid characters'
    case ErrorCodes.TITLE_SAVE_FAILED:
      return 'Failed to save workflow title'
      
    case ErrorCodes.FILE_TOO_LARGE:
      return 'File is too large (maximum 50MB)'
    case ErrorCodes.FILE_INVALID_FORMAT:
      return 'Invalid file format. Please select a valid workflow file'
    case ErrorCodes.FILE_INVALID_EXTENSION:
      return 'Invalid file extension. Please select a .json or .workflow file'
    case ErrorCodes.FILE_READ_FAILED:
      return 'Failed to read the selected file'
    case ErrorCodes.EXPORT_FAILED:
      return 'Failed to export workflow'
    case ErrorCodes.IMPORT_FAILED:
      return 'Failed to import workflow'
    case ErrorCodes.WORKFLOW_VALIDATION_FAILED:
      return 'Workflow validation failed'
      
    case ErrorCodes.EXECUTION_VALIDATION_FAILED:
      return 'Cannot execute workflow: validation failed'
    case ErrorCodes.EXECUTION_FAILED:
      return 'Workflow execution failed'
    case ErrorCodes.EXECUTION_TIMEOUT:
      return 'Workflow execution timed out'
    case ErrorCodes.EXECUTION_CANCELLED:
      return 'Workflow execution was cancelled'
    case ErrorCodes.NODE_EXECUTION_FAILED:
      return 'One or more nodes failed during execution'
      
    case ErrorCodes.NETWORK_ERROR:
      return 'Network error. Please check your connection and try again'
    case ErrorCodes.SERVER_ERROR:
      return 'Server error. Please try again later'
    case ErrorCodes.TIMEOUT_ERROR:
      return 'Request timed out. Please try again'
      
    case ErrorCodes.PERMISSION_DENIED:
      return 'Permission denied. You do not have access to perform this action'
    case ErrorCodes.RESOURCE_NOT_FOUND:
      return 'Resource not found'
      
    default:
      return details.message || 'An unexpected error occurred'
  }
}

/**
 * Check if an error is recoverable
 */
export function isRecoverableError(error: unknown): boolean {
  if (error instanceof OperationError) {
    return error.recoverable || false
  }
  
  const details = extractErrorDetails(error)
  
  // Network and timeout errors are generally recoverable
  return [
    ErrorCodes.NETWORK_ERROR,
    ErrorCodes.TIMEOUT_ERROR,
    ErrorCodes.SERVER_ERROR
  ].includes(details.code as ErrorCode)
}

/**
 * Get recovery suggestions for an error
 */
export function getRecoverySuggestions(error: unknown): string[] {
  const details = extractErrorDetails(error)
  
  switch (details.code) {
    case ErrorCodes.TITLE_EMPTY:
      return ['Enter a title for your workflow']
    case ErrorCodes.TITLE_TOO_LONG:
      return ['Shorten the workflow title to 100 characters or less']
    case ErrorCodes.TITLE_INVALID_CHARS:
      return ['Remove special characters from the title', 'Use only letters, numbers, spaces, and basic punctuation']
      
    case ErrorCodes.FILE_TOO_LARGE:
      return ['Select a smaller file (under 50MB)', 'Try exporting a simpler workflow']
    case ErrorCodes.FILE_INVALID_FORMAT:
      return ['Select a valid JSON workflow file', 'Make sure the file was exported from this application']
    case ErrorCodes.FILE_INVALID_EXTENSION:
      return ['Select a file with .json or .workflow extension']
    case ErrorCodes.FILE_READ_FAILED:
      return ['Try selecting the file again', 'Make sure the file is not corrupted']
      
    case ErrorCodes.WORKFLOW_VALIDATION_FAILED:
      return ['Fix workflow validation errors', 'Make sure all nodes are properly connected']
    case ErrorCodes.EXECUTION_VALIDATION_FAILED:
      return ['Validate your workflow before executing', 'Fix any validation errors']
    case ErrorCodes.NODE_EXECUTION_FAILED:
      return ['Check node configurations', 'Review execution logs for details']
      
    case ErrorCodes.NETWORK_ERROR:
      return ['Check your internet connection', 'Try again in a few moments']
    case ErrorCodes.SERVER_ERROR:
      return ['Try again later', 'Contact support if the problem persists']
    case ErrorCodes.TIMEOUT_ERROR:
      return ['Try again with a stable connection', 'Break down large operations into smaller steps']
      
    default:
      return ['Try again', 'Contact support if the problem persists']
  }
}

/**
 * Log error for debugging and monitoring
 */
export function logError(error: unknown, context?: Record<string, any>): void {
  const details = extractErrorDetails(error)
  
  const logData = {
    ...details,
    context: { ...details.context, ...context },
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString()
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', logData)
  }
  
  // In production, you might want to send this to an error tracking service
  // Example: Sentry, LogRocket, etc.
  // errorTrackingService.captureError(logData)
}

/**
 * Validate title and return validation errors
 */
export function validateTitle(title: string): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (!title.trim()) {
    errors.push({
      field: 'title',
      message: 'Title cannot be empty',
      code: ErrorCodes.TITLE_EMPTY
    })
  }
  
  if (title.length > 100) {
    errors.push({
      field: 'title',
      message: 'Title cannot exceed 100 characters',
      code: ErrorCodes.TITLE_TOO_LONG
    })
  }
  
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/
  if (invalidChars.test(title)) {
    errors.push({
      field: 'title',
      message: 'Title contains invalid characters',
      code: ErrorCodes.TITLE_INVALID_CHARS
    })
  }
  
  return errors
}

/**
 * Validate file for import
 */
export function validateImportFile(file: File): ValidationError[] {
  const errors: ValidationError[] = []
  const maxSize = 50 * 1024 * 1024 // 50MB
  const allowedExtensions = ['.json', '.workflow']
  
  if (file.size > maxSize) {
    errors.push({
      field: 'file',
      message: `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (50MB)`,
      code: ErrorCodes.FILE_TOO_LARGE
    })
  }
  
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  if (!allowedExtensions.includes(extension)) {
    errors.push({
      field: 'file',
      message: `Invalid file extension: ${extension}. Allowed extensions: ${allowedExtensions.join(', ')}`,
      code: ErrorCodes.FILE_INVALID_EXTENSION
    })
  }
  
  return errors
}

/**
 * Create error handler for async operations
 */
export function createAsyncErrorHandler<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  context?: Record<string, any>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await operation(...args)
    } catch (error) {
      logError(error, context)
      throw error
    }
  }
}

/**
 * Retry an operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: unknown
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Don't retry if it's not a recoverable error
      if (!isRecoverableError(error)) {
        throw error
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break
      }
      
      // Wait before retrying with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}