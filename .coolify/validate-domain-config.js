#!/usr/bin/env node

/**
 * Domain and SSL Configuration Validator
 * Validates the domain, SSL, and networking configuration for Coolify deployment
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logInfo(message) {
  log(`[INFO] ${message}`, 'blue');
}

function logSuccess(message) {
  log(`[SUCCESS] ${message}`, 'green');
}

function logWarning(message) {
  log(`[WARNING] ${message}`, 'yellow');
}

function logError(message) {
  log(`[ERROR] ${message}`, 'red');
}

class DomainValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.config = {};
  }

  // Load environment configuration
  loadEnvironment() {
    logInfo('Loading environment configuration...');
    
    // Try to load from various sources
    const envSources = [
      '.env',
      '.env.production',
      '.env.coolify.production'
    ];

    for (const envFile of envSources) {
      if (fs.existsSync(envFile)) {
        const envContent = fs.readFileSync(envFile, 'utf8');
        this.parseEnvFile(envContent);
        logInfo(`Loaded environment from ${envFile}`);
      }
    }

    // Load from process.env as well
    this.config = {
      ...this.config,
      FRONTEND_DOMAIN: process.env.FRONTEND_DOMAIN,
      BACKEND_DOMAIN: process.env.BACKEND_DOMAIN,
      CORS_ORIGIN: process.env.CORS_ORIGIN,
      VITE_API_URL: process.env.VITE_API_URL,
      WEBHOOK_URL: process.env.WEBHOOK_URL,
      NODE_ENV: process.env.NODE_ENV || 'production'
    };
  }

  parseEnvFile(content) {
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          this.config[key] = value;
        }
      }
    }
  }

  // Validate required environment variables
  validateRequiredVariables() {
    logInfo('Validating required environment variables...');
    
    const required = [
      'FRONTEND_DOMAIN',
      'BACKEND_DOMAIN', 
      'CORS_ORIGIN',
      'VITE_API_URL'
    ];

    const missing = required.filter(key => !this.config[key]);
    
    if (missing.length > 0) {
      this.errors.push(`Missing required environment variables: ${missing.join(', ')}`);
      return false;
    }

    logSuccess('All required environment variables are present');
    return true;
  }

  // Validate domain format
  validateDomainFormat() {
    logInfo('Validating domain formats...');
    
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    
    const domains = {
      FRONTEND_DOMAIN: this.config.FRONTEND_DOMAIN,
      BACKEND_DOMAIN: this.config.BACKEND_DOMAIN
    };

    let valid = true;
    for (const [key, domain] of Object.entries(domains)) {
      if (domain && !domainRegex.test(domain)) {
        this.errors.push(`Invalid domain format for ${key}: ${domain}`);
        valid = false;
      }
    }

    if (valid) {
      logSuccess('Domain formats are valid');
    }
    return valid;
  }

  // Validate URL format
  validateUrlFormat() {
    logInfo('Validating URL formats...');
    
    const urls = {
      CORS_ORIGIN: this.config.CORS_ORIGIN,
      VITE_API_URL: this.config.VITE_API_URL,
      WEBHOOK_URL: this.config.WEBHOOK_URL
    };

    let valid = true;
    for (const [key, url] of Object.entries(urls)) {
      if (url) {
        try {
          const parsed = new URL(url);
          if (this.config.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
            this.warnings.push(`${key} should use HTTPS in production: ${url}`);
          }
        } catch (error) {
          this.errors.push(`Invalid URL format for ${key}: ${url}`);
          valid = false;
        }
      }
    }

    if (valid) {
      logSuccess('URL formats are valid');
    }
    return valid;
  }

  // Validate domain consistency
  validateDomainConsistency() {
    logInfo('Validating domain consistency...');
    
    const { FRONTEND_DOMAIN, BACKEND_DOMAIN, CORS_ORIGIN, VITE_API_URL } = this.config;
    
    let consistent = true;

    // Check CORS_ORIGIN matches FRONTEND_DOMAIN
    if (CORS_ORIGIN && FRONTEND_DOMAIN) {
      const expectedCors = `https://${FRONTEND_DOMAIN}`;
      if (CORS_ORIGIN !== expectedCors) {
        this.warnings.push(`CORS_ORIGIN (${CORS_ORIGIN}) should match https://${FRONTEND_DOMAIN}`);
        consistent = false;
      }
    }

    // Check VITE_API_URL matches BACKEND_DOMAIN
    if (VITE_API_URL && BACKEND_DOMAIN) {
      const expectedApiUrl = `https://${BACKEND_DOMAIN}`;
      if (VITE_API_URL !== expectedApiUrl) {
        this.warnings.push(`VITE_API_URL (${VITE_API_URL}) should match https://${BACKEND_DOMAIN}`);
        consistent = false;
      }
    }

    if (consistent) {
      logSuccess('Domain configuration is consistent');
    }
    return consistent;
  }

  // Validate Coolify configuration files
  validateCoolifyConfig() {
    logInfo('Validating Coolify configuration files...');
    
    const requiredFiles = [
      'coolify.yaml',
      '.coolify/domain-ssl-config.json',
      '.coolify/environment.json'
    ];

    let valid = true;
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        this.errors.push(`Missing required configuration file: ${file}`);
        valid = false;
      }
    }

    // Validate coolify.yaml structure
    if (fs.existsSync('coolify.yaml')) {
      try {
        const yamlContent = fs.readFileSync('coolify.yaml', 'utf8');
        
        // Check for required labels
        const requiredLabels = [
          'coolify.domain=${FRONTEND_DOMAIN}',
          'coolify.domain=${BACKEND_DOMAIN}',
          'coolify.ssl=true'
        ];

        for (const label of requiredLabels) {
          if (!yamlContent.includes(label)) {
            this.warnings.push(`Missing or incorrect label in coolify.yaml: ${label}`);
          }
        }
      } catch (error) {
        this.errors.push(`Error reading coolify.yaml: ${error.message}`);
        valid = false;
      }
    }

    if (valid) {
      logSuccess('Coolify configuration files are present');
    }
    return valid;
  }

  // Validate network configuration
  validateNetworkConfig() {
    logInfo('Validating network configuration...');
    
    if (fs.existsSync('coolify.yaml')) {
      const yamlContent = fs.readFileSync('coolify.yaml', 'utf8');
      
      // Check for network definitions
      const hasInternalNetwork = yamlContent.includes('n8n-clone-internal');
      const hasExternalNetwork = yamlContent.includes('n8n-clone-external');
      
      if (!hasInternalNetwork) {
        this.warnings.push('Internal network configuration not found in coolify.yaml');
      }
      
      if (!hasExternalNetwork) {
        this.warnings.push('External network configuration not found in coolify.yaml');
      }
      
      logSuccess('Network configuration validated');
      return true;
    }
    
    return false;
  }

  // Generate configuration summary
  generateSummary() {
    logInfo('Generating configuration summary...');
    
    const summary = {
      timestamp: new Date().toISOString(),
      configuration: this.config,
      validation_results: {
        errors: this.errors,
        warnings: this.warnings,
        status: this.errors.length === 0 ? 'VALID' : 'INVALID'
      },
      deployment_ready: this.errors.length === 0,
      recommendations: []
    };

    // Add recommendations based on warnings
    if (this.warnings.length > 0) {
      summary.recommendations.push('Review and address configuration warnings before deployment');
    }

    if (this.config.NODE_ENV === 'production') {
      summary.recommendations.push('Ensure DNS records are configured for your domains');
      summary.recommendations.push('Verify SSL certificates will be generated correctly');
    }

    // Write summary to file
    fs.writeFileSync('.coolify/validation-summary.json', JSON.stringify(summary, null, 2));
    logSuccess('Configuration summary written to .coolify/validation-summary.json');
    
    return summary;
  }

  // Run all validations
  validate() {
    log('\n🔍 Domain and SSL Configuration Validator', 'cyan');
    log('==========================================\n', 'cyan');

    this.loadEnvironment();
    
    const validations = [
      this.validateRequiredVariables(),
      this.validateDomainFormat(),
      this.validateUrlFormat(),
      this.validateDomainConsistency(),
      this.validateCoolifyConfig(),
      this.validateNetworkConfig()
    ];

    const summary = this.generateSummary();

    log('\n📊 Validation Results', 'magenta');
    log('====================\n', 'magenta');

    if (this.errors.length > 0) {
      logError(`Found ${this.errors.length} error(s):`);
      this.errors.forEach(error => logError(`  - ${error}`));
    }

    if (this.warnings.length > 0) {
      logWarning(`Found ${this.warnings.length} warning(s):`);
      this.warnings.forEach(warning => logWarning(`  - ${warning}`));
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      logSuccess('✅ All validations passed! Configuration is ready for deployment.');
    } else if (this.errors.length === 0) {
      logWarning('⚠️  Configuration is valid but has warnings. Review before deployment.');
    } else {
      logError('❌ Configuration has errors that must be fixed before deployment.');
    }

    log('\n📋 Configuration Summary:', 'cyan');
    log(`  Frontend Domain: ${this.config.FRONTEND_DOMAIN || 'Not set'}`, 'cyan');
    log(`  Backend Domain: ${this.config.BACKEND_DOMAIN || 'Not set'}`, 'cyan');
    log(`  CORS Origin: ${this.config.CORS_ORIGIN || 'Not set'}`, 'cyan');
    log(`  API URL: ${this.config.VITE_API_URL || 'Not set'}`, 'cyan');
    log(`  Environment: ${this.config.NODE_ENV || 'Not set'}`, 'cyan');

    return summary;
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new DomainValidator();
  const summary = validator.validate();
  
  // Exit with error code if validation failed
  process.exit(summary.validation_results.status === 'VALID' ? 0 : 1);
}

module.exports = DomainValidator;