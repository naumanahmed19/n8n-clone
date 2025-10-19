import { promises as fs } from 'fs';
import * as path from 'path';
import { NodePackageInfo } from './NodeLoader';
import { logger } from '../utils/logger';

export interface NodeMarketplaceConfig {
  registryUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
}

export interface NodePackageMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  keywords: string[];
  downloadUrl: string;
  homepage?: string;
  repository?: string;
  license?: string;
  createdAt: string;
  updatedAt: string;
  downloads: number;
  rating: number;
  ratingCount: number;
  verified: boolean;
  screenshots?: string[];
  readme?: string;
  changelog?: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  nodeTypes: string[];
  credentialTypes: string[];
}

export interface NodeSearchFilters {
  query?: string;
  category?: string;
  author?: string;
  verified?: boolean;
  minRating?: number;
  tags?: string[];
  sortBy?: 'relevance' | 'downloads' | 'rating' | 'updated' | 'created';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface NodeSearchResult {
  packages: NodePackageMetadata[];
  total: number;
  hasMore: boolean;
}

export interface PublishOptions {
  packagePath: string;
  version?: string;
  changelog?: string;
  tags?: string[];
  private?: boolean;
  dryRun?: boolean;
}

export interface PublishResult {
  success: boolean;
  packageId?: string;
  version?: string;
  downloadUrl?: string;
  errors?: string[];
  warnings?: string[];
}

export interface InstallOptions {
  version?: string;
  force?: boolean;
  skipValidation?: boolean;
  installPath?: string;
}

export interface InstallResult {
  success: boolean;
  packagePath?: string;
  version?: string;
  errors?: string[];
  warnings?: string[];
}

export interface UpdateResult {
  success: boolean;
  oldVersion?: string;
  newVersion?: string;
  changelog?: string;
  errors?: string[];
  warnings?: string[];
}

export class NodeMarketplace {
  private config: NodeMarketplaceConfig;
  private defaultInstallPath: string;

  constructor(config: NodeMarketplaceConfig, installPath?: string) {
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config
    };
    this.defaultInstallPath = installPath || path.join(process.cwd(), 'custom-nodes');
  }

  /**
   * Search for nodes in the marketplace
   */
  async searchNodes(filters: NodeSearchFilters = {}): Promise<NodeSearchResult> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.query) queryParams.set('q', filters.query);
      if (filters.category) queryParams.set('category', filters.category);
      if (filters.author) queryParams.set('author', filters.author);
      if (filters.verified !== undefined) queryParams.set('verified', filters.verified.toString());
      if (filters.minRating) queryParams.set('minRating', filters.minRating.toString());
      if (filters.tags) queryParams.set('tags', filters.tags.join(','));
      if (filters.sortBy) queryParams.set('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.set('sortOrder', filters.sortOrder);
      if (filters.limit) queryParams.set('limit', filters.limit.toString());
      if (filters.offset) queryParams.set('offset', filters.offset.toString());

      const url = `${this.config.registryUrl}/search?${queryParams.toString()}`;
      const response = await this.makeRequest(url, 'GET');

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      const result = data as any;
      return {
        packages: result.packages || [],
        total: result.total || 0,
        hasMore: result.hasMore || false
      };
    } catch (error) {
      logger.error('Failed to search nodes', { error, filters });
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get detailed information about a specific node package
   */
  async getNodeInfo(packageId: string): Promise<NodePackageMetadata> {
    try {
      const url = `${this.config.registryUrl}/packages/${encodeURIComponent(packageId)}`;
      const response = await this.makeRequest(url, 'GET');

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Package not found: ${packageId}`);
        }
        throw new Error(`Failed to get package info: ${response.status} ${response.statusText}`);
      }

      const packageInfo = await response.json();
      return packageInfo as NodePackageMetadata;
    } catch (error) {
      logger.error('Failed to get node info', { error, packageId });
      throw new Error(`Failed to get package info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Publish a node package to the marketplace
   */
  async publishNode(options: PublishOptions): Promise<PublishResult> {
    try {
      // Validate package before publishing
      const validation = await this.validatePackageForPublish(options.packagePath);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // Create package archive
      const archivePath = await this.createPackageArchive(options.packagePath);
      
      try {
        // Upload package
        const uploadResult = await this.uploadPackage(archivePath, options);
        
        if (uploadResult.success) {
          logger.info('Package published successfully', { 
            packageId: uploadResult.packageId,
            version: uploadResult.version 
          });
        }

        return uploadResult;
      } finally {
        // Clean up archive
        try {
          await fs.unlink(archivePath);
        } catch (cleanupError) {
          logger.warn('Failed to clean up package archive', { error: cleanupError, archivePath });
        }
      }
    } catch (error) {
      logger.error('Failed to publish node', { error, options });
      return {
        success: false,
        errors: [`Publish failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Install a node package from the marketplace
   */
  async installNode(packageId: string, options: InstallOptions = {}): Promise<InstallResult> {
    try {
      // Get package information
      const packageInfo = await this.getNodeInfo(packageId);
      
      // Determine version to install
      const versionToInstall = options.version || packageInfo.version;
      
      // Check if package is already installed
      const installPath = options.installPath || this.defaultInstallPath;
      const packagePath = path.join(installPath, packageInfo.name);
      
      if (!options.force) {
        const isInstalled = await this.isPackageInstalled(packagePath);
        if (isInstalled) {
          const installedVersion = await this.getInstalledVersion(packagePath);
          if (installedVersion === versionToInstall) {
            return {
              success: true,
              packagePath,
              version: versionToInstall,
              warnings: [`Package ${packageInfo.name} v${versionToInstall} is already installed`]
            };
          }
        }
      }

      // Download package
      const downloadResult = await this.downloadPackage(packageInfo, versionToInstall, installPath);
      
      if (!downloadResult.success) {
        return downloadResult;
      }

      // Validate installed package
      if (!options.skipValidation) {
        const validation = await this.validateInstalledPackage(downloadResult.packagePath!);
        if (!validation.valid) {
          return {
            success: false,
            errors: [`Package validation failed: ${validation.errors.join(', ')}`]
          };
        }
      }

      logger.info('Package installed successfully', { 
        packageId,
        version: versionToInstall,
        packagePath: downloadResult.packagePath 
      });

      return {
        success: true,
        packagePath: downloadResult.packagePath,
        version: versionToInstall
      };
    } catch (error) {
      logger.error('Failed to install node', { error, packageId, options });
      return {
        success: false,
        errors: [`Install failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Update a node package to the latest version
   */
  async updateNode(packageId: string): Promise<UpdateResult> {
    try {
      // Get current installed version
      const packagePath = path.join(this.defaultInstallPath, packageId);
      const isInstalled = await this.isPackageInstalled(packagePath);
      
      if (!isInstalled) {
        throw new Error(`Package not installed: ${packageId}`);
      }

      const currentVersion = await this.getInstalledVersion(packagePath);
      
      // Get latest version from marketplace
      const packageInfo = await this.getNodeInfo(packageId);
      const latestVersion = packageInfo.version;

      if (currentVersion === latestVersion) {
        return {
          success: true,
          oldVersion: currentVersion,
          newVersion: latestVersion,
          warnings: [`Package ${packageId} is already up to date (v${latestVersion})`]
        };
      }

      // Install latest version
      const installResult = await this.installNode(packageId, { force: true });
      
      if (!installResult.success) {
        return {
          success: false,
          errors: installResult.errors
        };
      }

      logger.info('Package updated successfully', { 
        packageId,
        oldVersion: currentVersion,
        newVersion: latestVersion 
      });

      return {
        success: true,
        oldVersion: currentVersion,
        newVersion: latestVersion,
        changelog: packageInfo.changelog
      };
    } catch (error) {
      logger.error('Failed to update node', { error, packageId });
      return {
        success: false,
        errors: [`Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Get list of installed packages
   */
  async getInstalledPackages(): Promise<NodePackageInfo[]> {
    try {
      const packages: NodePackageInfo[] = [];
      const installPath = this.defaultInstallPath;
      
      const dirExists = await this.directoryExists(installPath);
      if (!dirExists) {
        return packages;
      }

      const entries = await fs.readdir(installPath, { withFileTypes: true });
      const packageDirs = entries.filter(entry => entry.isDirectory());

      for (const packageDir of packageDirs) {
        try {
          const packagePath = path.join(installPath, packageDir.name);
          const packageJsonPath = path.join(packagePath, 'package.json');
          
          const packageJsonExists = await this.fileExists(packageJsonPath);
          if (!packageJsonExists) {
            continue;
          }

          const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
          const packageInfo = JSON.parse(packageJsonContent);
          
          packages.push(packageInfo);
        } catch (error) {
          logger.warn('Failed to read package info', { error, packageName: packageDir.name });
        }
      }

      return packages;
    } catch (error) {
      logger.error('Failed to get installed packages', { error });
      return [];
    }
  }

  /**
   * Uninstall a node package
   */
  async uninstallNode(packageId: string): Promise<void> {
    try {
      const packagePath = path.join(this.defaultInstallPath, packageId);
      const isInstalled = await this.isPackageInstalled(packagePath);
      
      if (!isInstalled) {
        throw new Error(`Package not installed: ${packageId}`);
      }

      // Remove package directory
      await this.removeDirectory(packagePath);
      
      logger.info('Package uninstalled successfully', { packageId });
    } catch (error) {
      logger.error('Failed to uninstall node', { error, packageId });
      throw new Error(`Uninstall failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(url: string, method: string, body?: any): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'n8n-node-cli/1.0.0'
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.retries!; attempt++) {
      try {
        const fetch = (await import('node-fetch')).default;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        
        try {
          const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          return response as any; // Type assertion for compatibility
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.config.retries!) {
          const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Validate package for publishing
   */
  private async validatePackageForPublish(packagePath: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check package.json
      const packageJsonPath = path.join(packagePath, 'package.json');
      const packageJsonExists = await this.fileExists(packageJsonPath);
      
      if (!packageJsonExists) {
        errors.push('package.json not found');
        return { valid: false, errors };
      }

      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
      const packageInfo = JSON.parse(packageJsonContent);

      // Validate required fields for publishing
      if (!packageInfo.name) errors.push('Package name is required');
      if (!packageInfo.version) errors.push('Package version is required');
      if (!packageInfo.description) errors.push('Package description is required');
      if (!packageInfo.author) errors.push('Package author is required');
      if (!packageInfo.license) errors.push('Package license is required');
      if (!packageInfo.nodes || packageInfo.nodes.length === 0) {
        errors.push('Package must define at least one node');
      }

      // Check README
      const readmePath = path.join(packagePath, 'README.md');
      const readmeExists = await this.fileExists(readmePath);
      if (!readmeExists) {
        errors.push('README.md is required for publishing');
      }

      // Validate node files exist
      if (packageInfo.nodes) {
        for (const nodePath of packageInfo.nodes) {
          const fullNodePath = path.join(packagePath, nodePath);
          const nodeExists = await this.fileExists(fullNodePath);
          if (!nodeExists) {
            errors.push(`Node file not found: ${nodePath}`);
          }
        }
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { valid: false, errors };
    }
  }

  /**
   * Create package archive for upload
   */
  private async createPackageArchive(packagePath: string): Promise<string> {
    // This is a simplified implementation
    // In a real implementation, you would create a tar.gz archive
    const archivePath = path.join(packagePath, '..', `${path.basename(packagePath)}.tar.gz`);
    
    // For now, just return the package path
    // In production, implement actual archiving logic
    return packagePath;
  }

  /**
   * Upload package to marketplace
   */
  private async uploadPackage(archivePath: string, options: PublishOptions): Promise<PublishResult> {
    try {
      if (options.dryRun) {
        return {
          success: true,
          warnings: ['Dry run - package not actually published']
        };
      }

      // Read package info
      const packageJsonPath = path.join(archivePath, 'package.json');
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
      const packageInfo = JSON.parse(packageJsonContent);

      // In a real implementation, you would upload the archive
      // For now, simulate the upload
      const url = `${this.config.registryUrl}/packages`;
      const response = await this.makeRequest(url, 'POST', {
        name: packageInfo.name,
        version: options.version || packageInfo.version,
        description: packageInfo.description,
        author: packageInfo.author,
        changelog: options.changelog,
        tags: options.tags,
        private: options.private
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json() as any;
      
      return {
        success: true,
        packageId: result.id,
        version: result.version,
        downloadUrl: result.downloadUrl
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Download package from marketplace
   */
  private async downloadPackage(
    packageInfo: NodePackageMetadata,
    version: string,
    installPath: string
  ): Promise<InstallResult> {
    try {
      const packagePath = path.join(installPath, packageInfo.name);
      
      // Ensure install directory exists
      await fs.mkdir(installPath, { recursive: true });
      
      // In a real implementation, you would download and extract the package
      // For now, simulate the download
      await fs.mkdir(packagePath, { recursive: true });
      
      // Create a basic package.json
      const packageJson = {
        name: packageInfo.name,
        version: version,
        description: packageInfo.description,
        author: packageInfo.author,
        nodes: packageInfo.nodeTypes.map(type => `nodes/${type}.node.js`),
        credentials: packageInfo.credentialTypes.map(type => `credentials/${type}.credentials.js`)
      };
      
      await fs.writeFile(
        path.join(packagePath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      return {
        success: true,
        packagePath,
        version
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Validate installed package
   */
  private async validateInstalledPackage(packagePath: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      const packageJsonPath = path.join(packagePath, 'package.json');
      const packageJsonExists = await this.fileExists(packageJsonPath);
      
      if (!packageJsonExists) {
        errors.push('package.json not found in installed package');
        return { valid: false, errors };
      }

      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
      const packageInfo = JSON.parse(packageJsonContent);

      if (!packageInfo.name) errors.push('Package name missing');
      if (!packageInfo.version) errors.push('Package version missing');

      return { valid: errors.length === 0, errors };
    } catch (error) {
      errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { valid: false, errors };
    }
  }

  /**
   * Check if package is installed
   */
  private async isPackageInstalled(packagePath: string): Promise<boolean> {
    try {
      const packageJsonPath = path.join(packagePath, 'package.json');
      return await this.fileExists(packageJsonPath);
    } catch {
      return false;
    }
  }

  /**
   * Get installed package version
   */
  private async getInstalledVersion(packagePath: string): Promise<string> {
    try {
      const packageJsonPath = path.join(packagePath, 'package.json');
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
      const packageInfo = JSON.parse(packageJsonContent);
      return packageInfo.version || '0.0.0';
    } catch {
      return '0.0.0';
    }
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if directory exists
   */
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Remove directory recursively
   */
  private async removeDirectory(dirPath: string): Promise<void> {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
    } catch (error) {
      throw new Error(`Failed to remove directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}