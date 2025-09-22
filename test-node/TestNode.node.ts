import { INodeType, INodeTypeDescription, IExecuteFunctions } from 'n8n-workflow';

export class TestNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Test Custom Node',
    name: 'testCustomNode',
    group: ['transform'],
    version: 1,
    description: 'A simple test node for demonstration',
    defaults: {
      name: 'Test Custom Node',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Message',
        name: 'message',
        type: 'string',
        default: 'Hello from custom node!',
        placeholder: 'Enter your message',
        description: 'The message to output',
      },
    ],
  };

  async execute(this: IExecuteFunctions) {
    const items = this.getInputData();
    const message = this.getNodeParameter('message', 0) as string;

    const returnData = items.map(() => ({
      json: {
        message,
        timestamp: new Date().toISOString(),
        processed: true
      }
    }));

    return [returnData];
  }
}