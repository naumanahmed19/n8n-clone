export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  message: string
  code?: string
  status?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface RequestConfig {
  headers?: Record<string, string>
  params?: Record<string, any>
  timeout?: number
}