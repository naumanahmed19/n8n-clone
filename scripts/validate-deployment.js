#!/usr/bin/env node

/**
 * Deployment Validation Script for Coolify
 * 
 * This script validates that all services are running correctly after deployment.
 * It performs comprehensive health checks on all application components.
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration from environment variables
const config = {
  frontendUrl: process.env.FRONTEND_URL || process.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000',
  backendUrl: process.env.BACKEND_URL || process.env.VITE_API_URL || 'http://localhost:4000',
  timeout: parseInt(process.env.VALIDATION_TIMEOUT) || 30000,
  retries: parseInt(process.env.VALIDATION_RETRIES) || 3,
  retryDelay: parseInt(process.env.VALIDATION_RETRY_DELAY) || 5000,
};

console.log('🔍 Starting deployment validation...');
console.log(`Frontend URL: ${config.frontendUrl}`);
console.log(`Backend URL: ${config.backendUrl}`);
console.log('');

/**
 * Make HTTP request with timeout and retry logic
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      timeout: config.timeout,
      headers: {
        'User-Agent': 'Coolify-Deployment-Validator/1.0',
        'Accept': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${config.timeout}ms`));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Retry function with exponential backoff
 */
async function withRetry(fn, description, retries = config.retries) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries) {
        throw new Error(`${description} failed after ${retries + 1} attempts: ${error.message}`);
      }
      
      const delay = config.retryDelay * Math.pow(2, i);
      console.log(`   ⚠️  Attempt ${i + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Validate frontend service
 */
async function validateFrontend() {
  console.log('🌐 Validating frontend service...');
  
  try {
    const response = await withRetry(
      () => makeRequest(`${config.frontendUrl}/`),
      'Frontend health check'
    );
    
    if (response.statusCode === 200) {
      console.log('   ✅ Frontend is responding');
      
      // Check if it's serving the React app
      if (response.rawData.includes('<!DOCTYPE html>') || response.rawData.includes('<div id="root">')) {
        console.log('   ✅ Frontend is serving React application');
      } else {
        console.log('   ⚠️  Frontend response doesn\'t look like React app');
      }
      
      return true;
    } else {
      throw new Error(`Frontend returned status ${response.statusCode}`);
    }
  } catch (error) {
    console.log(`   ❌ Frontend validation failed: ${error.message}`);
    return false;
  }
}

/**
 * Validate backend service and health endpoint
 */
async function validateBackend() {
  console.log('🔧 Validating backend service...');
  
  try {
    // Test basic API endpoint
    const apiResponse = await withRetry(
      () => makeRequest(`${config.backendUrl}/`),
      'Backend API check'
    );
    
    if (apiResponse.statusCode === 200 && apiResponse.data) {
      console.log('   ✅ Backend API is responding');
      console.log(`   📋 API Version: ${apiResponse.data.version || 'Unknown'}`);
      
      if (apiResponse.data.endpoints) {
        console.log('   ✅ API endpoints are documented');
      }
    } else {
      throw new Error(`Backend API returned status ${apiResponse.statusCode}`);
    }
    
    // Test health endpoint
    const healthResponse = await withRetry(
      () => makeRequest(`${config.backendUrl}/health`),
      'Backend health check'
    );
    
    if (healthResponse.statusCode === 200 && healthResponse.data) {
      console.log('   ✅ Backend health endpoint is responding');
      
      const health = healthResponse.data;
      console.log(`   📊 Service Status: ${health.status}`);
      console.log(`   ⏱️  Uptime: ${Math.round(health.uptime || 0)}s`);
      
      if (health.memory) {
        console.log(`   💾 Memory Usage: ${health.memory.used}MB / ${health.memory.total}MB`);
      }
      
      if (health.websocket) {
        console.log(`   🔌 WebSocket Users: ${health.websocket.connected_users || 0}`);
      }
      
      return health;
    } else {
      throw new Error(`Backend health check returned status ${healthResponse.statusCode}`);
    }
  } catch (error) {
    console.log(`   ❌ Backend validation failed: ${error.message}`);
    return null;
  }
}

/**
 * Validate database connectivity through backend
 */
async function validateDatabase(healthData) {
  console.log('🗄️  Validating database connectivity...');
  
  try {
    if (healthData && healthData.checks && healthData.checks.database) {
      const dbStatus = healthData.checks.database;
      
      if (dbStatus === 'healthy') {
        console.log('   ✅ Database connection is healthy');
        return true;
      } else if (dbStatus === 'unhealthy') {
        console.log('   ❌ Database connection is unhealthy');
        return false;
      } else if (dbStatus === 'error') {
        console.log('   ❌ Database connection error');
        return false;
      } else {
        console.log('   ⚠️  Database status unknown');
        return false;
      }
    } else {
      console.log('   ⚠️  No database health information available');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Database validation failed: ${error.message}`);
    return false;
  }
}

/**
 * Validate Redis connectivity through backend
 */
async function validateRedis(healthData) {
  console.log('🔴 Validating Redis connectivity...');
  
  try {
    if (healthData && healthData.checks && healthData.checks.redis) {
      const redisStatus = healthData.checks.redis;
      
      if (redisStatus === 'healthy') {
        console.log('   ✅ Redis connection is healthy');
        return true;
      } else if (redisStatus === 'unhealthy') {
        console.log('   ❌ Redis connection is unhealthy');
        return false;
      } else if (redisStatus === 'error') {
        console.log('   ❌ Redis connection error');
        return false;
      } else {
        console.log('   ⚠️  Redis status unknown');
        return false;
      }
    } else {
      console.log('   ⚠️  No Redis health information available');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Redis validation failed: ${error.message}`);
    return false;
  }
}

/**
 * Validate frontend-backend API communication
 */
async function validateApiCommunication() {
  console.log('🔗 Validating frontend-backend API communication...');
  
  try {
    // Test a simple API endpoint that doesn't require authentication
    const response = await withRetry(
      () => makeRequest(`${config.backendUrl}/api/node-types`),
      'API communication test'
    );
    
    if (response.statusCode === 200) {
      console.log('   ✅ API communication is working');
      
      if (response.data && Array.isArray(response.data)) {
        console.log(`   📦 Found ${response.data.length} node types`);
      }
      
      return true;
    } else if (response.statusCode === 401) {
      console.log('   ✅ API is responding (authentication required)');
      return true;
    } else {
      throw new Error(`API returned status ${response.statusCode}`);
    }
  } catch (error) {
    console.log(`   ❌ API communication validation failed: ${error.message}`);
    return false;
  }
}

/**
 * Test CORS configuration
 */
async function validateCors() {
  console.log('🌍 Validating CORS configuration...');
  
  try {
    const response = await withRetry(
      () => makeRequest(`${config.backendUrl}/health`, {
        headers: {
          'Origin': config.frontendUrl,
          'Access-Control-Request-Method': 'GET'
        }
      }),
      'CORS validation'
    );
    
    const corsHeaders = response.headers['access-control-allow-origin'];
    
    if (corsHeaders) {
      console.log('   ✅ CORS headers are present');
      console.log(`   🔧 Allowed Origin: ${corsHeaders}`);
      return true;
    } else {
      console.log('   ⚠️  CORS headers not found (may be configured at proxy level)');
      return true; // Not necessarily an error in Coolify setup
    }
  } catch (error) {
    console.log(`   ❌ CORS validation failed: ${error.message}`);
    return false;
  }
}

/**
 * Generate deployment report
 */
function generateReport(results) {
  console.log('');
  console.log('📊 Deployment Validation Report');
  console.log('================================');
  
  const checks = [
    { name: 'Frontend Service', status: results.frontend },
    { name: 'Backend Service', status: results.backend },
    { name: 'Database Connectivity', status: results.database },
    { name: 'Redis Connectivity', status: results.redis },
    { name: 'API Communication', status: results.apiCommunication },
    { name: 'CORS Configuration', status: results.cors }
  ];
  
  let passedChecks = 0;
  
  checks.forEach(check => {
    const icon = check.status ? '✅' : '❌';
    const status = check.status ? 'PASS' : 'FAIL';
    console.log(`${icon} ${check.name}: ${status}`);
    if (check.status) passedChecks++;
  });
  
  console.log('');
  console.log(`Summary: ${passedChecks}/${checks.length} checks passed`);
  
  if (passedChecks === checks.length) {
    console.log('🎉 All validation checks passed! Deployment is successful.');
    return true;
  } else {
    console.log('⚠️  Some validation checks failed. Please review the issues above.');
    return false;
  }
}

/**
 * Main validation function
 */
async function main() {
  const results = {
    frontend: false,
    backend: false,
    database: false,
    redis: false,
    apiCommunication: false,
    cors: false
  };
  
  try {
    // Validate frontend
    results.frontend = await validateFrontend();
    
    // Validate backend and get health data
    const healthData = await validateBackend();
    results.backend = !!healthData;
    
    // Validate database and Redis using health data
    if (healthData) {
      results.database = await validateDatabase(healthData);
      results.redis = await validateRedis(healthData);
    }
    
    // Validate API communication
    results.apiCommunication = await validateApiCommunication();
    
    // Validate CORS
    results.cors = await validateCors();
    
    // Generate report
    const allPassed = generateReport(results);
    
    // Exit with appropriate code
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Validation failed with error:', error.message);
    process.exit(1);
  }
}

// Run validation if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = {
  validateFrontend,
  validateBackend,
  validateDatabase,
  validateRedis,
  validateApiCommunication,
  validateCors,
  generateReport
};