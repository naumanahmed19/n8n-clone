/**
 * Test Custom Node
 * A simple node for testing upload functionality
 */
export class TestNode {
  description = {
    displayName: 'Test Node',
    name: 'TestNode',
    group: ['transform'],
    version: 1,
    description: 'A test node for custom node upload functionality',
    defaults: {
      name: 'Test Node',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Message',
        name: 'message',
        type: 'string',
        default: 'Hello World',
        description: 'The message to process',
      },
    ],
    icon: '🧪',
    color: '#FF6B6B',
  };

  async execute(items: any[]): Promise<any[]> {
    const returnData = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const message = this.getNodeParameter('message', i);
      
      returnData.push({
        json: {
          ...item.json,
          testMessage: `Processed: ${message}`,
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    return returnData;
  }

  private getNodeParameter(parameterName: string, itemIndex: number): any {
    // Simplified parameter getter for testing
    return 'Hello World';
  }
}