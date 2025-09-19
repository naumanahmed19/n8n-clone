import { apiClient } from './api'
import { NodeType } from '@/types'

export interface TestNodeRequest {
  parameters: Record<string, any>
  inputData: any
  credentials?: string[]
}

export interface TestNodeResponse {
  success: boolean
  data?: any
  error?: string
  executionTime?: number
}

export class NodeService {
  async getNodeTypes(): Promise<NodeType[]> {
    const response = await apiClient.get<NodeType[]>('/node-types')
    return response.data || []
  }

  async getNodeType(type: string): Promise<NodeType> {
    const response = await apiClient.get<NodeType>(`/node-types/${type}`)
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch node type')
    }
    return response.data
  }

  async testNode(nodeType: string, request: TestNodeRequest): Promise<TestNodeResponse> {
    const response = await apiClient.post<TestNodeResponse>(`/nodes/${nodeType}/test`, request)
    return response.data || { success: false, error: 'Unknown error' }
  }

  async validateNodeParameters(nodeType: string, parameters: Record<string, any>): Promise<{
    isValid: boolean
    errors: Array<{ field: string; message: string }>
  }> {
    const response = await apiClient.post<{
      isValid: boolean
      errors: Array<{ field: string; message: string }>
    }>(`/nodes/${nodeType}/validate`, { parameters })
    
    return response.data || { isValid: false, errors: [] }
  }

  async getNodeDocumentation(nodeType: string): Promise<{
    description: string
    examples: any[]
    properties: any[]
  }> {
    const response = await apiClient.get<{
      description: string
      examples: any[]
      properties: any[]
    }>(`/nodes/${nodeType}/docs`)
    
    return response.data || { description: '', examples: [], properties: [] }
  }
}

export const nodeService = new NodeService()