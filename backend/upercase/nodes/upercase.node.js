
const UpercaseNode = {
  type: 'upercase',
  displayName: 'upercase',
  name: 'upercase',
  group: ['transform'],
  version: 1,
  description: 'upercase',
  icon: 'fa:cog',
  color: '#2196F3',
  defaults: {
    name: 'upercase'
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
  ],
  execute: async function(inputData) {
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

module.exports = UpercaseNode;
