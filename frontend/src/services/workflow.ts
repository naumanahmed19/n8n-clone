import {
  ApiResponse,
  NodeType,
  PaginatedResponse,
  Workflow,
  WorkflowAnalytics,
  WorkflowImportExport,
  WorkflowShare,
  WorkflowTemplate,
} from "@/types";
import { apiClient as api } from "./api";

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  nodes?: any[];
  connections?: any[];
  settings?: any;
  active?: boolean;
  tags?: string[];
  category?: string;
  isPublic?: boolean;
}

export interface WorkflowFilters {
  search?: string;
  tags?: string[];
  category?: string;
  active?: boolean;
  isTemplate?: boolean;
  isPublic?: boolean;
  sortBy?: "name" | "createdAt" | "updatedAt" | "popularity" | "executions";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

class WorkflowService {
  async getWorkflows(
    filters?: WorkflowFilters
  ): Promise<PaginatedResponse<Workflow>> {
    const response = await api.get<{
      success: boolean;
      data: Workflow[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>("/workflows", {
      params: filters,
    });

    // Transform backend response to match frontend PaginatedResponse format
    return {
      data: response.data,
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      limit: response.pagination?.limit || 10,
      totalPages: response.pagination?.totalPages || 1,
    };
  }

  async getWorkflow(id: string): Promise<Workflow> {
    const response = await api.get<ApiResponse<Workflow>>(`/workflows/${id}`);
    return response.data;
  }

  async createWorkflow(data: CreateWorkflowRequest): Promise<Workflow> {
    const response = await api.post<ApiResponse<Workflow>>("/workflows", data);
    return response.data;
  }

  async updateWorkflow(
    id: string,
    data: UpdateWorkflowRequest
  ): Promise<Workflow> {
    const response = await api.put<ApiResponse<Workflow>>(
      `/workflows/${id}`,
      data
    );
    return response.data;
  }

  async deleteWorkflow(id: string): Promise<void> {
    await api.delete(`/workflows/${id}`);
  }

  async duplicateWorkflow(id: string, name: string): Promise<Workflow> {
    const response = await api.post<ApiResponse<Workflow>>(
      `/workflows/${id}/duplicate`,
      { name }
    );
    return response.data;
  }

  async activateWorkflow(id: string): Promise<Workflow> {
    const response = await api.post<ApiResponse<Workflow>>(
      `/workflows/${id}/activate`
    );
    return response.data;
  }

  async deactivateWorkflow(id: string): Promise<Workflow> {
    const response = await api.post<ApiResponse<Workflow>>(
      `/workflows/${id}/deactivate`
    );
    return response.data;
  }

  async getNodeTypes(): Promise<NodeType[]> {
    const response = await api.get<PaginatedResponse<NodeType>>("/nodes");
    return response.data;
  }

  async validateWorkflow(
    workflow: Partial<Workflow>
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const response = await api.post<
      ApiResponse<{ isValid: boolean; errors: string[] }>
    >("/workflows/validate", workflow);
    return response.data;
  }

  // Template management
  async getTemplates(
    filters?: Partial<WorkflowFilters>
  ): Promise<PaginatedResponse<WorkflowTemplate>> {
    const response = await api.get<{
      success: boolean;
      data: WorkflowTemplate[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>("/workflows/templates", {
      params: filters,
    });

    return {
      data: response.data,
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      limit: response.pagination?.limit || 10,
      totalPages: response.pagination?.totalPages || 1,
    };
  }

  async createFromTemplate(
    templateId: string,
    name: string
  ): Promise<Workflow> {
    const response = await api.post<ApiResponse<Workflow>>(
      `/workflows/templates/${templateId}/create`,
      { name }
    );
    return response.data;
  }

  async publishAsTemplate(
    id: string,
    templateData: Partial<WorkflowTemplate>
  ): Promise<WorkflowTemplate> {
    const response = await api.post<ApiResponse<WorkflowTemplate>>(
      `/workflows/${id}/publish-template`,
      templateData
    );
    return response.data;
  }

  // Sharing and collaboration
  async shareWorkflow(
    id: string,
    shares: Omit<WorkflowShare, "sharedAt">[]
  ): Promise<Workflow> {
    const response = await api.post<ApiResponse<Workflow>>(
      `/workflows/${id}/share`,
      { shares }
    );
    return response.data;
  }

  async updateWorkflowShare(
    id: string,
    userId: string,
    permission: WorkflowShare["permission"]
  ): Promise<Workflow> {
    const response = await api.put<ApiResponse<Workflow>>(
      `/workflows/${id}/share/${userId}`,
      { permission }
    );
    return response.data;
  }

  async removeWorkflowShare(id: string, userId: string): Promise<Workflow> {
    const response = await api.delete<ApiResponse<Workflow>>(
      `/workflows/${id}/share/${userId}`
    );
    return response.data;
  }

  async getSharedWorkflows(): Promise<PaginatedResponse<Workflow>> {
    const response = await api.get<{
      success: boolean;
      data: Workflow[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>("/workflows/shared");

    return {
      data: response.data,
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      limit: response.pagination?.limit || 10,
      totalPages: response.pagination?.totalPages || 1,
    };
  }

  // Import/Export
  async exportWorkflow(id: string): Promise<WorkflowImportExport> {
    const response = await api.get<ApiResponse<WorkflowImportExport>>(
      `/workflows/${id}/export`
    );
    return response.data;
  }

  async importWorkflow(
    workflowData: WorkflowImportExport,
    name?: string
  ): Promise<Workflow> {
    const response = await api.post<ApiResponse<Workflow>>(
      "/workflows/import",
      {
        workflowData,
        name,
      }
    );
    return response.data;
  }

  // Analytics
  async getWorkflowAnalytics(id: string): Promise<WorkflowAnalytics> {
    const response = await api.get<ApiResponse<WorkflowAnalytics>>(
      `/workflows/${id}/analytics`
    );
    return response.data;
  }

  async getWorkspaceAnalytics(): Promise<{
    totalWorkflows: number;
    activeWorkflows: number;
    totalExecutions: number;
    popularWorkflows: Workflow[];
    recentActivity: any[];
  }> {
    const response = await api.get<ApiResponse<any>>(
      "/workflows/workspace/analytics"
    );
    return response.data;
  }

  // Tags and categories
  async getAvailableTags(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>("/workflows/tags");
    return response.data;
  }

  async getAvailableCategories(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>(
      "/workflows/categories"
    );
    return response.data;
  }

  async createCategory(categoryData: {
    name: string;
    displayName: string;
    description?: string;
    color?: string;
    icon?: string;
  }): Promise<any> {
    const response = await api.post<ApiResponse<any>>(
      "/workflows/categories",
      categoryData
    );
    return response.data;
  }

  async updateWorkflowTags(id: string, tags: string[]): Promise<Workflow> {
    const response = await api.put<ApiResponse<Workflow>>(
      `/workflows/${id}/tags`,
      { tags }
    );
    return response.data;
  }
}

export const workflowService = new WorkflowService();
