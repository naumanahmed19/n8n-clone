import { Workflow, Node } from "../types/database";
import { NodeService } from "./NodeService";
import { logger } from "../utils/logger";

/**
 * Template requirement types
 */
export interface TemplateCredentialRequirement {
    nodeId: string; // Unique node ID
    nodeName: string; // Human-readable node name
    nodeType: string; // Node type for icon/logo
    credentialType: string; // Type of credential needed
    credentialFieldName: string; // Parameter name where credential is stored (e.g., "authentication")
    displayName: string;
    description?: string;
    required: boolean;
}

export interface TemplateVariableRequirement {
    name: string;
    description?: string;
    defaultValue?: any;
    required: boolean;
    nodeIds: string[];
    nodeNames: string[];
    propertyPath: string; // e.g., "apiKey", "settings.timeout"
}

export interface WorkflowTemplateMetadata {
    workflowId: string;
    workflowName: string;
    description?: string;
    credentials: TemplateCredentialRequirement[];
    variables: TemplateVariableRequirement[];
    nodeCount: number;
    triggerTypes: string[];
    tags?: string[];
    complexity: "simple" | "medium" | "complex";
    estimatedSetupTime: string; // e.g., "5 minutes"
}

export class WorkflowTemplateService {
    private nodeService: NodeService;

    constructor(nodeService: NodeService) {
        this.nodeService = nodeService;
    }

    /**
     * Analyze a workflow and extract template requirements
     */
    async analyzeWorkflow(workflow: Workflow): Promise<WorkflowTemplateMetadata> {
        try {
            const nodes = Array.isArray(workflow.nodes)
                ? workflow.nodes
                : JSON.parse(workflow.nodes as any);

            const credentials = await this.extractCredentialRequirements(nodes);
            const variables = this.extractVariableRequirements(nodes);
            const triggerTypes = this.extractTriggerTypes(nodes);
            const complexity = this.calculateComplexity(nodes, credentials, variables);
            const estimatedSetupTime = this.estimateSetupTime(complexity, credentials, variables);

            return {
                workflowId: workflow.id,
                workflowName: workflow.name,
                description: workflow.description,
                credentials,
                variables,
                nodeCount: nodes.length,
                triggerTypes,
                complexity,
                estimatedSetupTime,
            };
        } catch (error: any) {
            logger.error("Failed to analyze workflow template", {
                workflowId: workflow.id,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Extract credential requirements from workflow nodes
     * Each node gets its own credential requirement (no grouping by type)
     */
    private async extractCredentialRequirements(
        nodes: Node[]
    ): Promise<TemplateCredentialRequirement[]> {
        const requirements: TemplateCredentialRequirement[] = [];

        for (const node of nodes) {
            try {
                // Get node definition to check for credential requirements
                const nodeSchema = await this.nodeService.getNodeSchema(node.type);

                if (!nodeSchema) continue;

                const nodeDefinition = nodeSchema as any;
                let hasCredential = false;
                let credentialType = "";
                let credentialFieldName = "authentication"; // Default field name
                let displayName = "";
                let description = "";
                let required = false;

                // Check if node has credentials defined
                if (nodeDefinition.credentials && nodeDefinition.credentials.length > 0) {
                    const credDef = nodeDefinition.credentials[0]; // Take first credential
                    credentialType = credDef.name;
                    displayName = credDef.displayName;
                    description = credDef.documentationUrl;
                    required = true;
                    hasCredential = true;
                    // Default to "authentication" for old-style credentials
                    credentialFieldName = "authentication";
                }

                // Check for credential selector property
                if (!hasCredential && nodeDefinition.credentialSelector) {
                    const allowedTypes = nodeDefinition.credentialSelector.allowedTypes;
                    if (allowedTypes && allowedTypes.length > 0) {
                        credentialType = allowedTypes[0]; // Take first allowed type
                        displayName = nodeDefinition.credentialSelector.displayName;
                        description = nodeDefinition.credentialSelector.description;
                        required = nodeDefinition.credentialSelector.required || false;
                        hasCredential = true;
                        credentialFieldName = "authentication";
                    }
                }

                // Check node parameters for credential type properties
                if (!hasCredential && nodeDefinition.properties) {
                    const properties = typeof nodeDefinition.properties === 'function'
                        ? nodeDefinition.properties()
                        : nodeDefinition.properties;

                    for (const prop of properties) {
                        if (prop.type === "credential" && prop.allowedTypes) {
                            if (prop.allowedTypes.length > 0) {
                                credentialType = prop.allowedTypes[0];
                                credentialFieldName = prop.name; // Use the actual property name!
                                displayName = prop.displayName;
                                description = prop.description;
                                required = prop.required || false;
                                hasCredential = true;
                                break;
                            }
                        }
                    }
                }

                // Add requirement for this node if it needs credentials
                if (hasCredential) {
                    requirements.push({
                        nodeId: node.id,
                        nodeName: node.name || nodeDefinition.displayName,
                        nodeType: node.type,
                        credentialType,
                        credentialFieldName, // Include the field name
                        displayName,
                        description,
                        required,
                    });
                }
            } catch (error: any) {
                logger.warn("Failed to extract credentials for node", {
                    nodeId: node.id,
                    nodeType: node.type,
                    error: error.message,
                });
            }
        }

        return requirements;
    }

    /**
     * Extract variable requirements (parameters that use expressions)
     */
    private extractVariableRequirements(nodes: Node[]): TemplateVariableRequirement[] {
        const variables: TemplateVariableRequirement[] = [];
        const variablePattern = /\{\{([^}]+)\}\}/g;

        for (const node of nodes) {
            if (!node.parameters) continue;

            this.scanParametersForVariables(
                node.parameters,
                node.id,
                node.name,
                "",
                variables,
                variablePattern
            );
        }

        // Deduplicate variables by name
        const uniqueVariables = new Map<string, TemplateVariableRequirement>();
        for (const variable of variables) {
            if (!uniqueVariables.has(variable.name)) {
                uniqueVariables.set(variable.name, variable);
            } else {
                const existing = uniqueVariables.get(variable.name)!;
                existing.nodeIds.push(...variable.nodeIds);
                existing.nodeNames.push(...variable.nodeNames);
            }
        }

        return Array.from(uniqueVariables.values());
    }

    /**
     * Recursively scan parameters for variable expressions
     */
    private scanParametersForVariables(
        params: any,
        nodeId: string,
        nodeName: string,
        path: string,
        variables: TemplateVariableRequirement[],
        pattern: RegExp
    ): void {
        if (typeof params === "string") {
            const matches = params.matchAll(pattern);
            for (const match of matches) {
                const expression = match[1].trim();

                // Skip common expressions that aren't variables
                if (
                    expression.startsWith("json.") ||
                    expression.startsWith("$json.") ||
                    expression === "json" ||
                    expression === "$json"
                ) {
                    continue;
                }

                variables.push({
                    name: expression,
                    description: `Used in ${nodeName}${path ? ` (${path})` : ""}`,
                    required: true,
                    nodeIds: [nodeId],
                    nodeNames: [nodeName],
                    propertyPath: path,
                });
            }
        } else if (Array.isArray(params)) {
            params.forEach((item, index) => {
                this.scanParametersForVariables(
                    item,
                    nodeId,
                    nodeName,
                    `${path}[${index}]`,
                    variables,
                    pattern
                );
            });
        } else if (typeof params === "object" && params !== null) {
            for (const [key, value] of Object.entries(params)) {
                const newPath = path ? `${path}.${key}` : key;
                this.scanParametersForVariables(
                    value,
                    nodeId,
                    nodeName,
                    newPath,
                    variables,
                    pattern
                );
            }
        }
    }

    /**
     * Extract trigger types from workflow
     */
    private extractTriggerTypes(nodes: Node[]): string[] {
        const triggerTypes = new Set<string>();

        for (const node of nodes) {
            if (
                node.type.includes("trigger") ||
                node.type === "webhook" ||
                node.type === "workflow-called"
            ) {
                triggerTypes.add(node.type);
            }
        }

        return Array.from(triggerTypes);
    }

    /**
     * Calculate workflow complexity
     */
    private calculateComplexity(
        nodes: Node[],
        credentials: TemplateCredentialRequirement[],
        variables: TemplateVariableRequirement[]
    ): "simple" | "medium" | "complex" {
        const nodeCount = nodes.length;
        const credentialCount = credentials.length;
        const variableCount = variables.length;

        const complexityScore = nodeCount + credentialCount * 2 + variableCount;

        if (complexityScore <= 5) return "simple";
        if (complexityScore <= 15) return "medium";
        return "complex";
    }

    /**
     * Estimate setup time based on complexity
     */
    private estimateSetupTime(
        complexity: "simple" | "medium" | "complex",
        credentials: TemplateCredentialRequirement[],
        variables: TemplateVariableRequirement[]
    ): string {
        const baseTime = {
            simple: 2,
            medium: 5,
            complex: 10,
        }[complexity];

        const credentialTime = credentials.length * 2;
        const variableTime = variables.length * 0.5;

        const totalMinutes = Math.ceil(baseTime + credentialTime + variableTime);

        if (totalMinutes < 5) return "Less than 5 minutes";
        if (totalMinutes < 15) return `${totalMinutes} minutes`;
        if (totalMinutes < 60) return `${totalMinutes} minutes`;

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
    }

    /**
     * Generate a template setup checklist
     */
    generateSetupChecklist(metadata: WorkflowTemplateMetadata): string[] {
        const checklist: string[] = [];

        if (metadata.credentials.length > 0) {
            checklist.push("Configure required credentials:");
            metadata.credentials.forEach((cred) => {
                checklist.push(`  - ${cred.displayName} for ${cred.nodeName}`);
            });
        }

        if (metadata.variables.length > 0) {
            checklist.push("Set up required variables:");
            metadata.variables.forEach((variable) => {
                checklist.push(`  - ${variable.name}: ${variable.description}`);
            });
        }

        if (metadata.triggerTypes.length > 0) {
            checklist.push("Configure triggers:");
            metadata.triggerTypes.forEach((trigger) => {
                checklist.push(`  - ${trigger}`);
            });
        }

        checklist.push("Test the workflow");
        checklist.push("Activate the workflow");

        return checklist;
    }
}
