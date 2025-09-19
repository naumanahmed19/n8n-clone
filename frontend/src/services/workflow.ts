import { apiClient as api } from './api'
import { Workflow, NodeType, ApiResponse, PaginatedResponse } from '@/types'

export interface CreateWorkflowRequest {
  name: string
  description?: string
}

export interface UpdateWorkflowRequest {
  name?: string
  description?: string
  nodes?: any[]
  connections?: any[]
  settings?: any
  active?: boolean
}

export interface WorkflowFilters {
  search?: string
  active?: boolean
  page?: number
  limit?: number
}

class WorkflowService {
  async getWorkflows(filters?: WorkflowFilters): Promise<PaginatedResponse<Workflow>> {
    const response = await api.get<PaginatedResponse<Workflow>>('/workflows', {
      params: filters
    })
    return response.data
  }

  async getWorkflow(id: string): Promise<Workflow> {
    const response = await api.get<ApiResponse<Workflow>>(`/workflows/${id}`)
    return response.data.data
  }

  async createWorkflow(data: CreateWorkflowRequest): Promise<Workflow> {
    const response = await api.post<ApiResponse<Workflow>>('/workflows', data)
    return response.data.data
  }

  async updateWorkflow(id: string, data: UpdateWorkflowRequest): Promise<Workflow> {
    const response = await api.put<ApiResponse<Workflow>>(`/workflows/${id}`, data)
    return response.data.data
  }

  async deleteWorkflow(id: string): Promise<void> {
    await api.delete(`/workflows/${id}`)
  }

  async duplicateWorkflow(id: string, name: string): Promise<Workflow> {
    const response = await api.post<ApiResponse<Workflow>>(`/workflows/${id}/duplicate`, { name })
    return response.data.data
  }

  async activateWorkflow(id: string): Promise<Workflow> {
    const response = await api.post<ApiResponse<Workflow>>(`/workflows/${id}/activate`)
    return response.data.data
  }

  async deactivateWorkflow(id: string): Promise<Workflow> {
    const response = await api.post<ApiResponse<Workflow>>(`/workflows/${id}/deactivate`)
    return response.data.data
  }

  async getNodeTypes(): Promise<NodeType[]> {
    const response = await api.get<ApiResponse<NodeType[]>>('/node-types')
    return response.data.data
  }

  async validateWorkflow(workflow: Partial<Workflow>): Promise<{ isValid: boolean; errors: string[] }> {
    const response = await api.post<ApiResponse<{ isValid: boolean; errors: string[] }>>('/workflows/validate', workflow)
    return response.data.data
  }
}

export const workflowService = new WorkflowService()