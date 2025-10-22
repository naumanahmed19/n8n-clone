const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function uploadTestPackage() {
  const baseURL = 'http://localhost:4000/api';
  const zipPath = path.join(__dirname, 'temp', 'test-uninstall-node.zip');
  
  try {
    // Check if ZIP file exists
    if (!fs.existsSync(zipPath)) {
      require('./create-test-package.js');
      
      // Wait a moment for file creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!fs.existsSync(zipPath)) {
        return;
      }
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('nodes', fs.createReadStream(zipPath));
    
    // Upload the package
    console.log(`📡 POST ${baseURL}/node-types/upload`);
    
    const response = await axios.post(`${baseURL}/node-types/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000, // 30 second timeout
    });
    
    // Upload successful if we reach here
    
  } catch (error) {
    // Upload failed
  }
}

uploadTestPackage();