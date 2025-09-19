import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiResponse, ApiError, RequestConfig } from '@/types'
import { env } from '@/config/env'

class ApiClient {
  private client: AxiosInstance
  private token: string | null = null

  constructor(baseURL: string = env.API_BASE_URL) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
    this.loadTokenFromStorage()
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken()
          window.location.href = '/login'
        }
        return Promise.reject(this.formatError(error))
      }
    )
  }

  private loadTokenFromStorage() {
    const token = localStorage.getItem('auth_token')
    if (token) {
      this.setToken(token)
    }
  }

  private formatError(error: any): ApiError {
    if (error.response) {
      return {
        message: error.response.data?.message || 'An error occurred',
        code: error.response.data?.code,
        status: error.response.status,
      }
    } else if (error.request) {
      return {
        message: 'Network error - please check your connection',
        code: 'NETWORK_ERROR',
      }
    } else {
      return {
        message: error.message || 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      }
    }
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem('auth_token', token)
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
  }

  async get<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, config as AxiosRequestConfig)
    return response.data
  }

  async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data, config as AxiosRequestConfig)
    return response.data
  }

  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data, config as AxiosRequestConfig)
    return response.data
  }

  async delete<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url, config as AxiosRequestConfig)
    return response.data
  }

  async patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch(url, data, config as AxiosRequestConfig)
    return response.data
  }
}

export const apiClient = new ApiClient()
export default apiClient