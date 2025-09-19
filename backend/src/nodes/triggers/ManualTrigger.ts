import { NodeDefinition, NodeInputData, NodeOutputData } from '../../types/node.types';

export const ManualTriggerNode: NodeDefinition = {
  type: 'manual-trigger',
  displayName: 'Manual Trigger',
  name: 'manualTrigger',
  group: ['trigger'],
  version: 1,
  description: 'Triggers workflow execution manually when requested by the user',
  icon: 'fa:play',
  color: '#4CAF50',
  defaults: {
    description: '',
    allowCustomData: false
  },
  inputs: [],
  outputs: ['main'],
  properties: [
    {
      displayName: 'Description',
      name: 'description',
      type: 'string',
      required: false,
      default: '',
      description: 'Optional description for this manual trigger'
    },
    {
      displayName: 'Allow Custom Data',
      name: 'allowCustomData',
      type: 'boolean',
      required: false,
      default: false,
      description: 'Whether to allow custom data to be passed when triggering manually'
    },
    {
      displayName: 'Default Data',
      name: 'defaultData',
      type: 'json',
      required: false,
      default: '{}',
      description: 'Default data to use when no custom data is provided',
      displayOptions: {
        show: {
          allowCustomData: [true]
        }
      }
    }
  ],
  execute: async function(inputData: NodeInputData): Promise<NodeOutputData[]> {
    // Manual triggers are executed when the user manually starts the workflow
    // The input data may contain custom data passed by the user
    
    const description = this.getNodeParameter('description') as string;
    const allowCustomData = this.getNodeParameter('allowCustomData') as boolean;
    const defaultData = this.getNodeParameter('defaultData') as string;
    
    // Get custom data from input or use default
    let customData = {};
    if (allowCustomData) {
      try {
        customData = inputData.main?.[0]?.[0]?.json || JSON.parse(defaultData || '{}');
      } catch (error) {
        customData = {};
      }
    }
    
    return [{
      main: [{
        json: {
          triggeredAt: new Date().toISOString(),
          triggerType: 'manual',
          description,
          customData: allowCustomData ? customData : undefined
        }
      }]
    }];
  }
};