export const TestUploadNode = {
  type: "test-upload",
  displayName: "Test Upload Node",
  name: "testUpload",
  group: ["Custom"],
  version: 1,
  description: "A test node uploaded via ZIP",
  icon: "fa:upload",
  color: "#9b59b6",
  defaults: {},
  inputs: ["main"],
  outputs: ["main"],
  properties: [
    {
      displayName: "Message",
      name: "message",
      type: "string",
      required: false,
      default: "Hello from uploaded node!",
      description: "Message to display",
    },
  ],
  execute: async (inputData, properties) => {
    return {
      success: true,
      data: {
        ...inputData,
        message: properties.message || "Hello from uploaded node!"
      },
    };
  },
};