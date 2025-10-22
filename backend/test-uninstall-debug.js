const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testUninstallWithDebug() {
  console.log('🐛 Testing Node Uninstall with Debug Logging\n');
  
  const baseURL = 'http://localhost:4000/api';
  
  try {
    // Step 1: Check available packages
    console.log('📋 Checking available packages...');
    const customNodesPath = path.join(__dirname, 'custom-nodes');
    
    if (!fs.existsSync(customNodesPath)) {
      console.log('❌ custom-nodes directory not found');
      return;
    }
    
    const packages = fs.readdirSync(customNodesPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    console.log(`📦 Available packages: ${packages.join(', ')}`);
    
    if (packages.length === 0) {
      console.log('❌ No packages found to test');
      return;
    }
    
    // Use the first available package for testing
    const testPackage = packages[0];
    console.log(`\n🎯 Testing uninstall with package: ${testPackage}`);
    
    // Step 2: Show package details before uninstall
    const packagePath = path.join(customNodesPath, testPackage);
    console.log(`\n📊 Package details before uninstall:`);
    
    try {
      const stats = fs.statSync(packagePath);
      const permissions = (stats.mode & parseInt('777', 8)).toString(8);
      console.log(`   📁 Path: ${packagePath}`);
      console.log(`   🔐 Permissions: ${permissions}`);
      console.log(`   👤 Owner UID: ${stats.uid}`);
      console.log(`   👥 Owner GID: ${stats.gid}`);
      console.log(`   📏 Size: ${stats.size} bytes`);
      console.log(`   📅 Modified: ${stats.mtime}`);
      
      const files = fs.readdirSync(packagePath, { recursive: true });
      console.log(`   📄 File count: ${files.length}`);
      console.log(`   📋 Sample files: ${files.slice(0, 5).join(', ')}`);
      
    } catch (error) {
      console.log(`   ❌ Cannot read package details: ${error.message}`);
    }
    
    // Step 3: Perform uninstall with debug logging
    console.log(`\n🗑️  Performing uninstall (watch Docker logs for debug info)...`);
    console.log(`📡 DELETE ${baseURL}/node-types/packages/${testPackage}`);
    console.log(`\n💡 To see debug logs, run in another terminal:`);
    console.log(`   docker logs -f n8n-clone-backend-dev`);
    console.log(`\n⏳ Calling uninstall API...`);
    
    try {
      const startTime = Date.now();
      const response = await axios.delete(`${baseURL}/node-types/packages/${testPackage}`);
      const duration = Date.now() - startTime;
      
      console.log(`\n⏱️  API call completed in ${duration}ms`);
      console.log(`📋 Response Status: ${response.status}`);
      console.log(`📋 Response Data:`);
      console.log(JSON.stringify(response.data, null, 2));
      
      if (response.data.success) {
        console.log('\n✅ Uninstall API call successful!');
        
        const details = response.data.details || {};
        console.log(`\n📊 Uninstall Results:`);
        console.log(`   📦 Package: ${details.packageName || testPackage}`);
        console.log(`   🔍 Node types found: ${details.nodeTypesFound || 0}`);
        console.log(`   🗑️  Node types deleted: ${details.nodeTypesDeleted || 0}`);
        console.log(`   📁 Files removed: ${details.filesRemoved ? '✅ Yes' : '❌ No'}`);
        console.log(`   📋 Deleted types: ${(details.deletedNodeTypes || []).join(', ') || 'None'}`);
        
        if (details.errors && details.errors.length > 0) {
          console.log(`   ⚠️  Errors (${details.errors.length}):`);
          details.errors.forEach((err, i) => console.log(`     ${i + 1}. ${err}`));
        }
        
        // Verify file removal
        console.log(`\n🔍 Verifying file removal...`);
        const packageExistsAfter = fs.existsSync(packagePath);
        console.log(`   📁 Package directory exists: ${packageExistsAfter ? '❌ Yes (FAILED)' : '✅ No (SUCCESS)'}`);
        
        if (packageExistsAfter) {
          console.log(`\n🚨 DEBUG: Package directory still exists!`);
          try {
            const remainingFiles = fs.readdirSync(packagePath, { recursive: true });
            console.log(`   📄 Remaining files (${remainingFiles.length}):`);
            remainingFiles.slice(0, 10).forEach((file, i) => {
              console.log(`     ${i + 1}. ${file}`);
            });
            if (remainingFiles.length > 10) {
              console.log(`     ... and ${remainingFiles.length - 10} more files`);
            }
            
            // Check permissions of remaining directory
            const remainingStats = fs.statSync(packagePath);
            const remainingPerms = (remainingStats.mode & parseInt('777', 8)).toString(8);
            console.log(`   🔐 Current permissions: ${remainingPerms}`);
            console.log(`   👤 Current owner UID: ${remainingStats.uid}`);
            console.log(`   👥 Current owner GID: ${remainingStats.gid}`);
            
          } catch (error) {
            console.log(`   ❌ Cannot analyze remaining files: ${error.message}`);
          }
        }
        
      } else {
        console.log('❌ Uninstall failed:', response.data);
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Uninstall API error (${error.response.status}):`);
        console.log(JSON.stringify(error.response.data, null, 2));
      } else if (error.code === 'ECONNREFUSED') {
        console.log('❌ Could not connect to API server');
        console.log('💡 Make sure the Docker development environment is running');
        console.log('   docker-compose -f docker-compose.dev.yml up');
      } else {
        console.log('❌ Uninstall error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

console.log('🐛 Node Uninstall Debug Test');
console.log('This will test the uninstall functionality with detailed debug logging');
console.log('Make sure your Docker development environment is running\n');

testUninstallWithDebug().catch(console.error);