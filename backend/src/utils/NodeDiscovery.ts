import * as fs from "fs";
import * as path from "path";
import { NodeDefinition } from "../types/node.types";

export interface NodeInfo {
  name: string;
  path: string;
  definition: NodeDefinition;
}

/**
 * Auto-discovery utility for nodes
 * Scans the nodes directory and automatically loads all available nodes
 */
export class NodeDiscovery {
  private nodesDir: string;

  constructor(nodesDir?: string) {
    if (nodesDir) {
      this.nodesDir = nodesDir;
    } else {
      // In production (dist/), look for nodes in dist/nodes
      // In development (src/), look for nodes in src/nodes
      const defaultPath = path.join(__dirname, "..", "nodes");

      // Check if we're running from dist/ (production)
      if (__dirname.includes("dist")) {
        this.nodesDir = defaultPath; // This will be dist/nodes
      } else {
        this.nodesDir = defaultPath; // This will be src/nodes
      }
    }


  }

  /**
   * Discover all node directories
   * Returns a list of directories that contain node definitions
   */
  async discoverNodeDirectories(): Promise<string[]> {
    const directories: string[] = [];

    try {
      // Check if nodes directory exists
      if (!fs.existsSync(this.nodesDir)) {
        return directories;
      }

      const items = await fs.promises.readdir(this.nodesDir, {
        withFileTypes: true,
      });

      for (const item of items) {
        if (item.isDirectory()) {
          const dirPath = path.join(this.nodesDir, item.name);

          // Check if directory contains node files
          if (await this.isValidNodeDirectory(dirPath)) {
            directories.push(item.name);
          }
        }
      }
    } catch (error) {
      console.error("Error discovering node directories:", error);
    }

    return directories;
  }

  /**
   * Check if a directory is a valid node directory
   */
  private async isValidNodeDirectory(dirPath: string): Promise<boolean> {
    try {
      const files = await fs.promises.readdir(dirPath);

      // Check for index files or node files in both TS and JS formats
      return files.some(
        (file) =>
          file === "index.ts" ||
          file === "index.js" ||
          file.endsWith(".node.ts") ||
          file.endsWith(".node.js")
      );
    } catch {
      return false;
    }
  }

  /**
   * Load all nodes from discovered directories
   */
  async loadAllNodes(): Promise<NodeInfo[]> {
    const nodeInfos: NodeInfo[] = [];
    const directories = await this.discoverNodeDirectories();

    for (const dirName of directories) {
      try {
        const nodePath = path.join(this.nodesDir, dirName);
        const nodeModule = await this.loadNodeFromDirectory(nodePath);

        if (nodeModule) {
          // Extract all exported node definitions
          const nodeDefinitions = this.extractNodeDefinitions(nodeModule);

          for (const definition of nodeDefinitions) {
            nodeInfos.push({
              name: dirName,
              path: nodePath,
              definition,
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to load node from directory ${dirName}:`, error);
      }
    }

    return nodeInfos;
  }

  /**
   * Load a node module from a directory
   */
  private async loadNodeFromDirectory(dirPath: string): Promise<any> {
    try {
      // Try to load from index file first (both .js and .ts)
      const indexPaths = [
        path.join(dirPath, "index.js"),
        path.join(dirPath, "index.ts"),
        path.join(dirPath, "index")
      ];

      for (const indexPath of indexPaths) {
        try {
          const indexUrl = this.pathToFileUrl(indexPath);
          const module = await import(indexUrl);
          return module;
        } catch (error) {
          // Continue to next path
        }
      }

      // If no index file, try to find .node.ts or .node.js files
      const files = await fs.promises.readdir(dirPath);
      const nodeFiles = files.filter((file) =>
        file.endsWith(".node.ts") || file.endsWith(".node.js")
      );

      for (const nodeFile of nodeFiles) {
        try {
          const nodeFilePath = path.join(dirPath, nodeFile.replace(/\.(ts|js)$/, ""));
          const nodeFileUrl = this.pathToFileUrl(nodeFilePath);
          const module = await import(nodeFileUrl);
          return module;
        } catch (error) {
          // Continue to next file
        }
      }
    } catch (error) {
      console.error(`Error loading node from ${dirPath}:`, error);
    }

    return null;
  }

  /**
   * Convert file path to file:// URL for dynamic import (Windows compatible)
   */
  private pathToFileUrl(filePath: string): string {
    // Normalize path separators and resolve absolute path
    const absolutePath = path.resolve(filePath);

    // Convert Windows backslashes to forward slashes
    const normalizedPath = absolutePath.replace(/\\/g, "/");

    // Add file:// protocol
    return `file:///${normalizedPath}`;
  }

  /**
   * Extract node definitions from a module
   */
  private extractNodeDefinitions(nodeModule: any): NodeDefinition[] {
    const definitions: NodeDefinition[] = [];

    for (const key in nodeModule) {
      const exported = nodeModule[key];

      // Check if this looks like a node definition
      if (this.isNodeDefinition(exported)) {
        definitions.push(exported);
      }
    }

    return definitions;
  }

  /**
   * Check if an object is a node definition
   */
  private isNodeDefinition(obj: any): obj is NodeDefinition {
    return (
      obj &&
      typeof obj === "object" &&
      typeof obj.type === "string" &&
      typeof obj.displayName === "string" &&
      typeof obj.name === "string" &&
      Array.isArray(obj.inputs) &&
      Array.isArray(obj.outputs)
    );
  }

  /**
   * Get all available node definitions as a flat array
   */
  async getAllNodeDefinitions(): Promise<NodeDefinition[]> {
    const nodeInfos = await this.loadAllNodes();
    return nodeInfos.map((info) => info.definition);
  }

  /**
   * Get node definitions grouped by directory
   */
  async getNodesByDirectory(): Promise<Record<string, NodeDefinition[]>> {
    const nodeInfos = await this.loadAllNodes();
    const grouped: Record<string, NodeDefinition[]> = {};

    for (const info of nodeInfos) {
      if (!grouped[info.name]) {
        grouped[info.name] = [];
      }
      grouped[info.name].push(info.definition);
    }

    return grouped;
  }
}

// Export a default instance
export const nodeDiscovery = new NodeDiscovery();
