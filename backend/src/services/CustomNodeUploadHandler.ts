import { PrismaClient } from "@prisma/client";
import AdmZip from "adm-zip";
import * as fs from "fs/promises";
import * as path from "path";
import { logger } from "../utils/logger";

interface UploadResult {
  success: boolean;
  message: string;
  nodes?: any[];
  extractedPath?: string;
  errors?: string[];
}

interface NodeDefinition {
  type: string;
  displayName: string;
  name: string;
  group: string[];
  version?: number;
  description: string;
  defaults?: any;
  inputs?: string[];
  outputs?: string[];
  properties?: any[];
  icon?: string;
  color?: string;
}

interface PackageInfo {
  name: string;
  version: string;
  description?: string;
  author?: string;
  n8n?: {
    nodes?: string[];
    credentials?: string[];
  };
}

export class CustomNodeUploadHandler {
  private prisma: PrismaClient;
  private extractPath: string;
  private customNodesPath: string;

  constructor() {
    this.prisma = new PrismaClient();
    this.extractPath = path.join(process.cwd(), "temp/extract");
    this.customNodesPath = path.join(process.cwd(), "custom-nodes");
  }

  async processUpload(
    filePath: string,
    originalName: string
  ): Promise<UploadResult> {
    try {
      // Create extraction directory
      await this.ensureDirectory(this.extractPath);
      await this.ensureDirectory(this.customNodesPath);

      const extractDir = path.join(this.extractPath, Date.now().toString());
      await this.ensureDirectory(extractDir);

      // Extract ZIP file
      const zip = new AdmZip(filePath);
      zip.extractAllTo(extractDir, true);

      // Validate and process the extracted content
      const result = await this.processExtractedContent(
        extractDir,
        originalName
      );

      // Clean up the uploaded file
      await fs.unlink(filePath).catch(() => {});

      return {
        ...result,
        extractedPath: extractDir,
      };
    } catch (error) {
      logger.error("Upload processing failed", { error, filePath });
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        message: "Failed to process upload",
        errors: [errorMessage],
      };
    }
  }

  private async processExtractedContent(
    extractDir: string,
    originalName: string
  ): Promise<UploadResult> {
    try {
      // Look for package.json
      const packageJsonPath = path.join(extractDir, "package.json");
      let packageInfo: PackageInfo | null = null;

      try {
        const packageJsonContent = await fs.readFile(packageJsonPath, "utf-8");
        packageInfo = JSON.parse(packageJsonContent);
      } catch (error) {
        return {
          success: false,
          message: "Invalid package structure",
          errors: ["package.json not found or invalid"],
        };
      }

      // Find and validate node files
      const nodeFiles = await this.findNodeFiles(extractDir);

      if (nodeFiles.length === 0) {
        return {
          success: false,
          message: "No node files found",
          errors: ["No .node.js or .node.ts files found in the package"],
        };
      }

      // Create package directory in custom-nodes
      const packageName =
        packageInfo!.name || this.generatePackageNameFromZip(originalName);
      const packageDir = path.join(this.customNodesPath, packageName);

      // Copy the entire package to custom-nodes directory
      await this.copyPackageToCustomNodes(extractDir, packageDir);

      // Process and validate each node
      const processedNodes: any[] = [];
      const errors: string[] = [];

      for (const nodeFile of nodeFiles) {
        try {
          const nodeDefinition = await this.processNodeFile(
            nodeFile,
            packageInfo!
          );
          if (nodeDefinition) {
            // Save to database
            const savedNode = await this.saveNodeType(nodeDefinition);
            processedNodes.push(savedNode);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          errors.push(
            `Failed to process ${path.basename(nodeFile)}: ${errorMessage}`
          );
        }
      }

      if (processedNodes.length === 0) {
        return {
          success: false,
          message: "No valid nodes could be processed",
          errors:
            errors.length > 0 ? errors : ["All node files failed validation"],
        };
      }

      // Try to load the package using NodeLoader
      try {
        const nodeLoader = global.nodeLoader;
        if (nodeLoader) {
          await nodeLoader.loadNodePackage(packageDir);
          logger.info("Package loaded successfully by NodeLoader", {
            packageDir,
          });
        }
      } catch (error) {
        logger.warn("Failed to load package with NodeLoader", {
          error,
          packageDir,
        });
        // Don't fail the upload if NodeLoader fails, just log the warning
      }

      return {
        success: true,
        message: `Successfully uploaded ${processedNodes.length} custom node(s)`,
        nodes: processedNodes,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      logger.error("Content processing failed", { error, extractDir });
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        message: "Failed to process package content",
        errors: [errorMessage],
      };
    }
  }

  private async findNodeFiles(directory: string): Promise<string[]> {
    const nodeFiles: string[] = [];

    const searchInDirectory = async (dir: string) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await searchInDirectory(fullPath);
        } else if (entry.isFile()) {
          if (
            entry.name.endsWith(".node.js") ||
            entry.name.endsWith(".node.ts")
          ) {
            nodeFiles.push(fullPath);
          }
        }
      }
    };

    await searchInDirectory(directory);
    return nodeFiles;
  }

  private async processNodeFile(
    filePath: string,
    packageInfo: PackageInfo
  ): Promise<NodeDefinition | null> {
    try {
      // Try to find corresponding .node.json file
      const nodeJsonPath = filePath.replace(/\.(js|ts)$/, ".json");
      let nodeDescription: any = {};

      try {
        const nodeJsonContent = await fs.readFile(nodeJsonPath, "utf-8");
        nodeDescription = JSON.parse(nodeJsonContent);
      } catch (error) {
        // .node.json is optional, continue without it
        logger.warn("No .node.json found", { filePath: nodeJsonPath });
      }

      // Extract node information from file content
      const fileContent = await fs.readFile(filePath, "utf-8");
      const nodeInfo = this.extractNodeInfoFromContent(
        fileContent,
        path.basename(filePath)
      );

      // Merge information from different sources
      const nodeDefinition: NodeDefinition = {
        type: nodeInfo.type || this.generateTypeFromFilename(filePath),
        displayName:
          nodeDescription.displayName ||
          nodeInfo.displayName ||
          this.generateDisplayNameFromFilename(filePath),
        name:
          nodeDescription.name ||
          nodeInfo.name ||
          this.generateNameFromFilename(filePath),
        group: nodeDescription.group || nodeInfo.group || ["Custom"],
        version:
          nodeDescription.version || packageInfo.version
            ? parseInt(packageInfo.version.split(".")[0])
            : 1,
        description:
          nodeDescription.description ||
          nodeInfo.description ||
          `Custom node from ${packageInfo.name}`,
        defaults: nodeDescription.defaults || nodeInfo.defaults || {},
        inputs: nodeDescription.inputs || nodeInfo.inputs || ["main"],
        outputs: nodeDescription.outputs || nodeInfo.outputs || ["main"],
        properties: nodeDescription.properties || nodeInfo.properties || [],
        icon: nodeDescription.icon || nodeInfo.icon,
        color: nodeDescription.color || nodeInfo.color || "#3b82f6",
      };

      return nodeDefinition;
    } catch (error) {
      logger.error("Failed to process node file", { error, filePath });
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to process node file: ${errorMessage}`);
    }
  }

  private extractNodeInfoFromContent(
    content: string,
    filename: string
  ): Partial<NodeDefinition> {
    const info: Partial<NodeDefinition> = {};

    // Try to extract class name and basic info from TypeScript/JavaScript content
    const classMatch = content.match(/class\s+(\w+)/);
    if (classMatch) {
      info.name = classMatch[1];
      info.displayName = classMatch[1].replace(/([A-Z])/g, " $1").trim();
    }

    // Look for description in comments
    const descriptionMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
    if (descriptionMatch) {
      info.description = descriptionMatch[1];
    }

    // Try to extract type from export or class name
    const typeMatch = content.match(/type:\s*['"`]([^'"`]+)['"`]/);
    if (typeMatch) {
      info.type = typeMatch[1];
    }

    return info;
  }

  private generateTypeFromFilename(filePath: string): string {
    const basename = path.basename(filePath, path.extname(filePath));
    return basename.replace(".node", "").replace(/[^a-zA-Z0-9]/g, "");
  }

  private generateDisplayNameFromFilename(filePath: string): string {
    const basename = path.basename(filePath, path.extname(filePath));
    return basename
      .replace(".node", "")
      .replace(/([A-Z])/g, " $1")
      .replace(/[_-]/g, " ")
      .trim()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  private generateNameFromFilename(filePath: string): string {
    const basename = path.basename(filePath, path.extname(filePath));
    return basename.replace(".node", "").replace(/[^a-zA-Z0-9]/g, "");
  }

  private async saveNodeType(nodeDefinition: NodeDefinition): Promise<any> {
    try {
      // Check if node type already exists
      const existingNode = await this.prisma.nodeType.findUnique({
        where: { type: nodeDefinition.type },
      });

      if (existingNode) {
        // Update existing node
        return await this.prisma.nodeType.update({
          where: { type: nodeDefinition.type },
          data: {
            displayName: nodeDefinition.displayName,
            name: nodeDefinition.name,
            group: nodeDefinition.group,
            version: nodeDefinition.version,
            description: nodeDefinition.description,
            defaults: nodeDefinition.defaults,
            inputs: nodeDefinition.inputs,
            outputs: nodeDefinition.outputs,
            properties: nodeDefinition.properties,
            icon: nodeDefinition.icon,
            color: nodeDefinition.color,
            active: true,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new node
        return await this.prisma.nodeType.create({
          data: {
            type: nodeDefinition.type,
            displayName: nodeDefinition.displayName,
            name: nodeDefinition.name,
            group: nodeDefinition.group,
            version: nodeDefinition.version || 1,
            description: nodeDefinition.description,
            defaults: nodeDefinition.defaults || {},
            inputs: nodeDefinition.inputs || ["main"],
            outputs: nodeDefinition.outputs || ["main"],
            properties: nodeDefinition.properties || [],
            icon: nodeDefinition.icon,
            color: nodeDefinition.color,
            active: true,
          },
        });
      }
    } catch (error) {
      logger.error("Failed to save node type", { error, nodeDefinition });
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to save node type: ${errorMessage}`);
    }
  }

  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private generatePackageNameFromZip(originalName: string): string {
    // Remove .zip extension and sanitize name
    const name = path.basename(originalName, ".zip");
    return name.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase();
  }

  private async copyPackageToCustomNodes(
    sourceDir: string,
    targetDir: string
  ): Promise<void> {
    try {
      // Remove target directory if it exists
      try {
        await fs.rm(targetDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore if directory doesn't exist
      }

      // Create target directory
      await this.ensureDirectory(targetDir);

      // Copy all files and directories
      await this.copyRecursive(sourceDir, targetDir);
    } catch (error) {
      logger.error("Failed to copy package to custom nodes directory", {
        error,
        sourceDir,
        targetDir,
      });
      throw error;
    }
  }

  private async copyRecursive(source: string, target: string): Promise<void> {
    const stat = await fs.stat(source);

    if (stat.isDirectory()) {
      await this.ensureDirectory(target);
      const entries = await fs.readdir(source);

      for (const entry of entries) {
        const sourcePath = path.join(source, entry);
        const targetPath = path.join(target, entry);
        await this.copyRecursive(sourcePath, targetPath);
      }
    } else {
      await fs.copyFile(source, target);
    }
  }
}
