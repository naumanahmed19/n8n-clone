const DateTimeNode = require('./nodes/xdata.node.js');

// Quick test for empty input
async function quickTest() {
  console.log('🔧 Testing DateTime node with empty input...');
  
  const mockThis = {
    getNodeParameter: (paramName, defaultValue) => {
      const params = {
        operation: 'getCurrentDateTime',
        outputFormat: 'iso'
      };
      return params[paramName] || defaultValue;
    }
  };

  // Test with empty input data (this was causing the issue)
  const emptyInputData = {
    main: [
      [] // Empty array
    ]
  };

  try {
    const result = await DateTimeNode.execute.call(mockThis, emptyInputData);
    console.log('✅ Success! Result:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

quickTest();