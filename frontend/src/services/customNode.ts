import { apiClient as api } from './api';
import {
  NodePackageInfo,
  NodePackageValidationResult,
  NodeLoadResult,
  NodeCompilationResult,
  NodeTemplateOptions,
  TemplateGenerationResult,
  NodeSearchFilters,
  NodeSearchResult,
  NodePackageMetadata,
  InstallOptions,
  InstallResult,
  UpdateResult,
  PublishOptions,
  PublishResult
} from '../types/customNode';

export class CustomNodeService {
  private baseUrl = '/api/custom-nodes';

  /**
   * Get all loaded custom node packages
   */
  async getLoadedPackages(): Promise<NodePackageInfo[]> {
    const response = await api.get(`${this.baseUrl}/packages`);
    return response.data.data;
  }

  /**
   * Validate a custom node package
   */
  async validatePackage(packagePath: string): Promise<NodePackageValidationResult> {
    const response = await api.post(`${this.baseUrl}/packages/validate`, {
      packagePath
    });
    return response.data.data;
  }

  /**
   * Load a custom node package
   */
  async loadPackage(packagePath: string): Promise<NodeLoadResult> {
    const response = await api.post(`${this.baseUrl}/packages/load`, {
      packagePath
    });
    return response.data.data;
  }

  /**
   * Unload a custom node package
   */
  async unloadPackage(packageName: string): Promise<void> {
    await api.delete(`${this.baseUrl}/packages/${encodeURIComponent(packageName)}`);
  }

  /**
   * Reload a custom node package
   */
  async reloadPackage(packageName: string): Promise<NodeLoadResult> {
    const response = await api.post(`${this.baseUrl}/packages/${encodeURIComponent(packageName)}/reload`);
    return response.data.data;
  }

  /**
   * Generate a new custom node package from template
   */
  async generatePackage(options: NodeTemplateOptions, outputPath?: string): Promise<TemplateGenerationResult> {
    const response = await api.post(`${this.baseUrl}/generate`, {
      ...options,
      group: options.group?.join(','),
      outputPath
    });
    return response.data.data;
  }

  /**
   * Compile a TypeScript node package
   */
  async compilePackage(packagePath: string): Promise<NodeCompilationResult> {
    const response = await api.post(`${this.baseUrl}/compile`, {
      packagePath
    });
    return response.data.data;
  }

  /**
   * Search for nodes in the marketplace
   */
  async searchMarketplace(filters: NodeSearchFilters = {}): Promise<NodeSearchResult> {
    const params = new URLSearchParams();
    
    if (filters.query) params.set('query', filters.query);
    if (filters.category) params.set('category', filters.category);
    if (filters.author) params.set('author', filters.author);
    if (filters.verified !== undefined) params.set('verified', filters.verified.toString());
    if (filters.minRating) params.set('minRating', filters.minRating.toString());
    if (filters.tags) params.set('tags', filters.tags.join(','));
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
    if (filters.limit) params.set('limit', filters.limit.toString());
    if (filters.offset) params.set('offset', filters.offset.toString());

    const response = await api.get(`${this.baseUrl}/marketplace/search?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Get detailed information about a marketplace package
   */
  async getPackageInfo(packageId: string): Promise<NodePackageMetadata> {
    const response = await api.get(`${this.baseUrl}/marketplace/packages/${encodeURIComponent(packageId)}`);
    return response.data.data;
  }

  /**
   * Install a package from the marketplace
   */
  async installPackage(packageId: string, options: InstallOptions = {}): Promise<InstallResult> {
    const response = await api.post(`${this.baseUrl}/marketplace/install`, {
      packageId,
      ...options
    });
    return response.data.data;
  }

  /**
   * Update a package to the latest version
   */
  async updatePackage(packageId: string): Promise<UpdateResult> {
    const response = await api.post(`${this.baseUrl}/marketplace/update`, {
      packageId
    });
    return response.data.data;
  }

  /**
   * Publish a package to the marketplace
   */
  async publishPackage(options: PublishOptions): Promise<PublishResult> {
    const response = await api.post(`${this.baseUrl}/marketplace/publish`, {
      ...options,
      tags: options.tags?.join(',')
    });
    return response.data.data;
  }
}

export const customNodeService = new CustomNodeService();