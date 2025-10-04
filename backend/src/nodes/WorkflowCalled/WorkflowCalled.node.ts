import {
  NodeDefinition,
  NodeInputData,
  NodeOutputData,
} from "../../types/node.types";

export const WorkflowCalledNode: NodeDefinition = {
  type: "workflow-called",
  displayName: "Called by Workflow",
  name: "workflowCalled",
  group: ["trigger"],
  version: 1,
  description: "Receives data when this workflow is called by another workflow",
  icon: "fa:phone-alt",
  color: "#16A085",
  defaults: {
    description: "",
    passthrough: true,
  },
  inputs: [],
  outputs: ["main"],
  properties: [
    {
      displayName: "Description",
      name: "description",
      type: "string",
      required: false,
      default: "",
      description: "Optional description for this workflow trigger",
    },
    {
      displayName: "Pass Through Input Data",
      name: "passthrough",
      type: "boolean",
      required: false,
      default: true,
      description:
        "Whether to pass through data received from the calling workflow",
    },
  ],
  execute: async function (
    inputData: NodeInputData
  ): Promise<NodeOutputData[]> {
    const description = (this.getNodeParameter("description") as string) || "";
    const passthrough = this.getNodeParameter("passthrough") as boolean;

    this.logger.info("WorkflowCalled trigger starting execution", {
      description,
      passthrough,
      inputData: inputData
        ? {
            main: inputData.main?.length || 0,
            hasContent: !!inputData.main?.[0]?.[0],
            content: inputData.main?.[0]?.[0],
          }
        : null,
    });

    // Get trigger data from the execution context
    // The WorkflowTrigger passes data through the execution's triggerData
    let receivedData: any = {};

    // Check input data for trigger data
    if (inputData?.main?.[0]?.[0]?.json) {
      receivedData = inputData.main[0][0].json;
    }

    let output: any = {
      triggeredAt: new Date().toISOString(),
      triggerType: "workflow-called",
      description: description || "Workflow called by external source",
      message:
        "This workflow was triggered by another workflow or external call",
    };

    // Include the received data if passthrough is enabled
    if (passthrough && Object.keys(receivedData).length > 0) {
      output.receivedData = receivedData;
      // Also merge the received data directly into the output for easy access
      output = { ...output, ...receivedData };
    }

    // Always provide some basic data even if no input
    if (Object.keys(receivedData).length === 0) {
      output.workflowCallInfo = {
        calledAt: new Date().toISOString(),
        triggerSource: "workflow-called",
      };
    }

    const result = [
      {
        main: [
          {
            json: output,
          },
        ],
      },
    ];

    this.logger.info("Workflow called trigger completed execution", {
      description,
      hasReceivedData: Object.keys(receivedData).length > 0,
      receivedDataKeys: Object.keys(receivedData),
      outputKeys: Object.keys(output),
      result: result,
    });

    return result;
  },
};
