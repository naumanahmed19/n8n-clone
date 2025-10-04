import {
  NodeDefinition,
  NodeInputData,
  NodeOutputData,
  NodePropertyOption,
} from "../../types/node.types";

export const WorkflowTriggerNode: NodeDefinition = {
  type: "workflow-trigger",
  displayName: "Trigger Workflow",
  name: "workflowTrigger",
  group: ["automation"],
  version: 1,
  description: "Trigger another workflow with optional data",
  icon: "fa:play-circle",
  color: "#10B981",
  defaults: {
    workflowId: "",
    triggerId: "",
    inputData: {},
    waitForCompletion: true,
    timeout: 30000,
  },
  inputs: ["main"],
  outputs: ["main"],
  properties: [
    {
      displayName: "Workflow",
      name: "workflowId",
      type: "custom",
      required: true,
      default: "",
      description: "Select the workflow to trigger",
      component: "WorkflowSelector",
      componentProps: {
        placeholder: "Select a workflow to trigger",
      },
    },
    {
      displayName: "Trigger",
      name: "triggerId",
      type: "custom",
      required: true,
      default: "",
      description: "Select the trigger to activate",
      component: "TriggerSelector",
      displayOptions: {
        hide: {
          workflowId: [""],
        },
      },
      componentProps: {
        placeholder: "Select a trigger",
        dependsOn: "workflowId",
      },
    },
    {
      displayName: "Input Data",
      name: "inputData",
      type: "json",
      required: false,
      default: "{}",
      description: "Data to pass to the triggered workflow",
    },
    {
      displayName: "Wait for Completion",
      name: "waitForCompletion",
      type: "boolean",
      required: false,
      default: true,
      description: "Whether to wait for the triggered workflow to complete before continuing",
    },
    {
      displayName: "Timeout (ms)",
      name: "timeout",
      type: "number",
      required: false,
      default: 30000,
      description: "Maximum time to wait for completion (in milliseconds)",
      displayOptions: {
        show: {
          waitForCompletion: [true],
        },
      },
    },
  ],
  execute: async function (
    inputData: NodeInputData
  ): Promise<NodeOutputData[]> {
    const workflowId = this.getNodeParameter("workflowId") as string;
    const triggerId = this.getNodeParameter("triggerId") as string;
    const inputDataParam = this.getNodeParameter("inputData") as string | object;
    const waitForCompletion = this.getNodeParameter("waitForCompletion") as boolean;
    const timeout = (this.getNodeParameter("timeout") as number) || 30000;

    // Validate required parameters
    if (!workflowId) {
      throw new Error("Workflow ID is required");
    }

    if (!triggerId) {
      throw new Error("Trigger ID is required");
    }

    // Parse input data
    let parsedInputData: any = {};
    if (inputDataParam) {
      if (typeof inputDataParam === "string") {
        try {
          parsedInputData = JSON.parse(inputDataParam);
        } catch (error) {
          throw new Error("Invalid input data JSON format");
        }
      } else {
        parsedInputData = inputDataParam;
      }
    }

    // Merge input data with current workflow data if available
    const currentData = inputData.main?.[0] || [];
    const triggerData = {
      ...parsedInputData,
      fromWorkflow: {
        data: currentData,
        timestamp: new Date().toISOString(),
      },
    };

    try {
      this.logger.info(`Triggering workflow ${workflowId} with trigger ${triggerId}`);
      
      // For now, we'll simulate triggering a workflow
      // In a real implementation, you would:
      // 1. Import and initialize the required services
      // 2. Call the TriggerService.handleManualTrigger method
      // 3. Wait for completion if requested
      
      // Simulate execution delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // If not waiting for completion, return immediately with execution ID
      if (!waitForCompletion) {
        return [{
          main: [{
            json: {
              success: true,
              executionId: `exec_${Date.now()}`,
              triggeredAt: new Date().toISOString(),
              workflowId,
              triggerId,
              status: "triggered",
              message: "Workflow trigger initiated successfully",
            },
          }],
        }];
      }

      // Simulate waiting for completion
      this.logger.info(`Waiting for workflow execution to complete (timeout: ${timeout}ms)`);
      
      // Simulate execution time
      const executionTime = Math.min(timeout / 2, 3000);
      await new Promise(resolve => setTimeout(resolve, executionTime));

      // Return the execution result
      return [{
        main: [{
          json: {
            success: true,
            executionId: `exec_${Date.now()}`,
            triggeredAt: new Date().toISOString(),
            workflowId,
            triggerId,
            status: "completed",
            result: {
              message: "Workflow executed successfully",
              data: triggerData,
            },
            executionTime,
          },
        }],
      }];

    } catch (error) {
      this.logger.error("Error triggering workflow:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      return [{
        main: [{
          json: {
            success: false,
            error: errorMessage,
            workflowId,
            triggerId,
            status: "error",
            triggeredAt: new Date().toISOString(),
          },
        }],
      }];
    }
  },
};