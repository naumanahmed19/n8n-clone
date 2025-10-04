import { PrismaClient } from "@prisma/client";
import { WorkflowService } from "../../services/WorkflowService";
import { NodePropertyOption } from "../../types/node.types";

export class WorkflowTriggerHelper {
  private static prisma = new PrismaClient();
  private static workflowService = new WorkflowService(this.prisma);

  /**
   * Get available workflows for the current user
   */
  static async getWorkflowOptions(userId: string = 'system'): Promise<NodePropertyOption[]> {
    try {
      const result = await this.workflowService.listWorkflows(userId, {
        limit: 100,
        page: 1,
        sortOrder: 'desc',
      });
      
      const options: NodePropertyOption[] = result.workflows.map((workflow: any) => ({
        name: workflow.name,
        value: workflow.id,
        description: workflow.description || `Workflow: ${workflow.name}`,
      }));

      return options;
    } catch (error) {
      console.error('Error loading workflows:', error);
      return [];
    }
  }

  /**
   * Get available triggers for a specific workflow
   */
  static async getTriggerOptions(workflowId: string, userId: string = 'system'): Promise<NodePropertyOption[]> {
    try {
      if (!workflowId) {
        return [];
      }

      const workflow = await this.workflowService.getWorkflow(workflowId, userId);
      const triggers = (workflow.triggers as any[]) || [];
      
      const options: NodePropertyOption[] = triggers
        .filter((trigger: any) => trigger.active)
        .map((trigger: any) => ({
          name: `${trigger.type.charAt(0).toUpperCase() + trigger.type.slice(1)} - ${trigger.settings.description || 'No description'}`,
          value: trigger.id,
          description: `Type: ${trigger.type}, Node: ${trigger.nodeId}`,
        }));

      return options;
    } catch (error) {
      console.error('Error loading triggers:', error);
      return [];
    }
  }

  /**
   * Get workflow details
   */
  static async getWorkflowDetails(workflowId: string, userId: string = 'system') {
    try {
      return await this.workflowService.getWorkflow(workflowId, userId);
    } catch (error) {
      console.error('Error getting workflow details:', error);
      return null;
    }
  }

  /**
   * Validate workflow and trigger combination
   */
  static async validateWorkflowTrigger(workflowId: string, triggerId: string, userId: string = 'system'): Promise<{
    valid: boolean;
    workflow?: any;
    trigger?: any;
    error?: string;
  }> {
    try {
      const workflow = await this.getWorkflowDetails(workflowId, userId);
      
      if (!workflow) {
        return { valid: false, error: 'Workflow not found' };
      }

      if (!workflow.active) {
        return { valid: false, error: 'Workflow is not active' };
      }

      const triggers = (workflow.triggers as any[]) || [];
      const trigger = triggers.find((t: any) => t.id === triggerId);

      if (!trigger) {
        return { valid: false, error: 'Trigger not found in workflow' };
      }

      if (!trigger.active) {
        return { valid: false, error: 'Trigger is not active' };
      }

      return { valid: true, workflow, trigger };
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}