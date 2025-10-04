import { apiClient as api } from "./api";

export interface NodeType {
  id: string;
  type: string;
  displayName: string;
  name: string;
  group: string[];
  version: number;
  description: string;
  defaults: Record<string, any>;
  inputs: string[];
  outputs: string[];
  properties: any[];
  icon?: string;
  color?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadResult {
  success: boolean;
  message: string;
  nodes?: NodeType[];
  errors?: string[];
}

export class NodeTypeService {
  private baseUrl = "/node-types";

  /**
   * Get all node types from NodeService (live node definitions)
   */
  async getAllNodeTypes(): Promise<NodeType[]> {
    const response = await api.get(`${this.baseUrl}`);
    return response.data || [];
  }

  /**
   * Get node types by group (category)
   */
  async getNodeTypesByGroup(group: string): Promise<NodeType[]> {
    const response = await api.get(
      `${this.baseUrl}?category=${encodeURIComponent(group)}`
    );
    return response.data.data;
  }

  /**
   * Get a specific node type by type identifier
   */
  async getNodeType(type: string): Promise<NodeType> {
    const response = await api.get(
      `${this.baseUrl}/${encodeURIComponent(type)}`
    );
    return response.data.data;
  }

  /**
   * Upload a zip file containing custom nodes
   */
  async uploadCustomNodes(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append("nodes", file);

    const response = await api.post(`/node-types/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Transform the backend response to match frontend expectations
    const backendResponse = response.data;

    // Handle the actual backend response structure
    const transformedResult = {
      success: true, // If we get here, the upload was successful
      message: `Successfully uploaded ${
        backendResponse.nodes?.length || 0
      } custom node(s)`,
      nodes: backendResponse.nodes || [],
      errors: undefined,
    };

    return transformedResult;
  }

  /**
   * Delete a custom node type
   */
  async deleteNodeType(type: string): Promise<void> {
    await api.delete(`/node-types/${encodeURIComponent(type)}`);
  }

  /**
   * Update a node type's active status
   */
  async updateNodeTypeStatus(type: string, active: boolean): Promise<NodeType> {
    const response = await api.patch(
      `/node-types/${encodeURIComponent(type)}`,
      {
        active,
      }
    );
    return response.data;
  }
}

export const nodeTypeService = new NodeTypeService();
