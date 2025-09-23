
import {
  NodeDefinition,
  NodeExecuteFunction,
  NodeInputData,
  NodeOutputData,
  NodeExecutionContext,
  NodeProperty
} from '../types/node.types';

const DddNode: NodeDefinition = {
  type: 'ddd',
  displayName: 'ggg',
  name: 'ddd',
  group: ['transform'],
  version: 1,
  description: 'ddg',
  icon: 'fa:cog',
  color: '#2196F3',
  defaults: {
    name: 'ggg'
  },
  inputs: ['main'],
  outputs: ['main'],
  properties: [
    {
      displayName: 'Operation',
      name: 'operation',
      type: 'options',
      required: true,
      default: 'process',
      options: [
        {
          name: 'Process',
          value: 'process',
          description: 'Process the input data'
        }
      ]
    }
  ] as NodeProperty[],
  execute: async function(inputData: NodeInputData): Promise<NodeOutputData[]> {
    const operation = this.getNodeParameter('operation');
    const items = inputData.main?.[0] || [];

    switch (operation) {
      case 'process':
        // Process the input data
        const processedItems = items.map(item => ({
          json: {
            ...item.json,
            processed: true,
            processedAt: new Date().toISOString()
          }
        }));

        return [{ main: processedItems }];

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }
};

export default DddNode;
