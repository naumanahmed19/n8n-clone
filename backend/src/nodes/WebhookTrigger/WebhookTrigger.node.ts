import {
  NodeDefinition,
  NodeInputData,
  NodeOutputData,
} from "../../types/node.types";

export const WebhookTriggerNode: NodeDefinition = {
  type: "webhook-trigger",
  displayName: "Webhook Trigger",
  name: "webhookTrigger",
  group: ["trigger"],
  version: 1,
  description: "Triggers workflow execution when a webhook is called",
  icon: "",
  color: "#FF6B35",
  defaults: {
    httpMethod: "POST",
    path: "",
    authentication: {
      type: "none",
    },
    responseMode: "onReceived",
    responseData: "firstEntryJson",
  },
  inputs: [],
  outputs: ["main"],
  properties: [
    {
      displayName: "Webhook URL",
      name: "webhookUrl",
      type: "custom",
      required: false,
      default: "",
      description: "Generated webhook URL for test and production environments",
      component: "WebhookUrlGenerator",
      componentProps: {
        mode: "test",
      },
    },
    {
      displayName: "HTTP Method",
      name: "httpMethod",
      type: "options",
      required: true,
      default: "POST",
      description: "The HTTP method to listen for",
      options: [
        { name: "GET", value: "GET" },
        { name: "POST", value: "POST" },
        { name: "PUT", value: "PUT" },
        { name: "DELETE", value: "DELETE" },
        { name: "PATCH", value: "PATCH" },
      ],
    },
    {
      displayName: "Path",
      name: "path",
      type: "string",
      required: false,
      default: "",
      description: "Optional path to append to the webhook URL",
    },
    {
      displayName: "Authentication",
      name: "authentication",
      type: "options",
      required: true,
      default: "none",
      description: "Authentication method for the webhook",
      options: [
        { name: "None", value: "none" },
        { name: "Basic Auth", value: "basic" },
        { name: "Header Auth", value: "header" },
        { name: "Query Parameter", value: "query" },
      ],
    },
    {
      displayName: "Header Name",
      name: "headerName",
      type: "string",
      required: true,
      default: "Authorization",
      description: "Name of the header to check",
      displayOptions: {
        show: {
          authentication: ["header"],
        },
      },
    },
    {
      displayName: "Expected Value",
      name: "expectedValue",
      type: "string",
      required: true,
      default: "",
      description: "Expected value for authentication",
      displayOptions: {
        show: {
          authentication: ["header", "query"],
        },
      },
    },
    {
      displayName: "Query Parameter",
      name: "queryParam",
      type: "string",
      required: true,
      default: "token",
      description: "Name of the query parameter to check",
      displayOptions: {
        show: {
          authentication: ["query"],
        },
      },
    },
    {
      displayName: "Username",
      name: "username",
      type: "string",
      required: true,
      default: "",
      description: "Username for basic authentication",
      displayOptions: {
        show: {
          authentication: ["basic"],
        },
      },
    },
    {
      displayName: "Password",
      name: "password",
      type: "string",
      required: true,
      default: "",
      description: "Password for basic authentication",
      displayOptions: {
        show: {
          authentication: ["basic"],
        },
      },
    },
    {
      displayName: "Response Mode",
      name: "responseMode",
      type: "options",
      required: true,
      default: "onReceived",
      description: "When to respond to the webhook",
      options: [
        { name: "Immediately", value: "onReceived" },
        { name: "When Workflow Finishes", value: "lastNode" },
      ],
    },
    {
      displayName: "Response Data",
      name: "responseData",
      type: "options",
      required: true,
      default: "firstEntryJson",
      description: "What data to return in the response",
      options: [
        { name: "First Entry JSON", value: "firstEntryJson" },
        { name: "First Entry Binary", value: "firstEntryBinary" },
        { name: "All Entries", value: "allEntries" },
        { name: "No Data", value: "noData" },
      ],
    },
  ],
  execute: async function (
    inputData: NodeInputData
  ): Promise<NodeOutputData[]> {
    // Webhook triggers don't execute in the traditional sense
    // They are activated by the TriggerService and provide data to the workflow
    // This function is called when the webhook receives a request

    // The webhook data is passed through the execution context
    const webhookData = inputData.main?.[0]?.[0] || {};

    return [
      {
        main: [
          {
            json: {
              headers: webhookData.headers || {},
              params: webhookData.query || {},
              body: webhookData.body || {},
              method: webhookData.method || "POST",
              timestamp: new Date().toISOString(),
            },
          },
        ],
      },
    ];
  },
};
