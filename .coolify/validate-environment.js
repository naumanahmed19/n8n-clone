#!/usr/bin/env node

/**
 * Coolify Environment Validation Script
 * Validates environment configuration for Coolify deployment
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

class EnvironmentValidator {
    constructor(environment = 'production') {
        this.environment = environment;
        this.errors = [];
        this.warnings = [];
        this.info = [];
        this.config = {};
    }

    log(message, color = 'reset') {
        console.log(`${colors[color]}${message}${colors.reset}`);
    }

    error(message) {
        this.errors.push(message);
        this.log(`❌ ERROR: ${message}`, 'red');
    }

    warning(message) {
        this.warnings.push(message);
        this.log(`⚠️  WARNING: ${message}`, 'yellow');
    }

    info(message) {
        this.info.push(message);
        this.log(`ℹ️  INFO: ${message}`, 'blue');
    }

    success(message) {
        this.log(`✅ ${message}`, 'green');
    }

    // Load environment configuration
    loadConfig() {
        try {
            const configPath = path.join(__dirname, 'environment-config.json');
            if (fs.existsSync(configPath)) {
                this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                this.success('Environment configuration loaded');
            } else {
                this.error('Environment configuration file not found');
            }
        } catch (error) {
            this.error(`Failed to load configuration: ${error.message}`);
        }
    }

    // Validate required environment variables
    validateRequiredVariables() {
        this.log('\n🔍 Validating Required Variables...', 'cyan');
        
        const required = [
            'POSTGRES_PASSWORD',
            'JWT_SECRET', 
            'SESSION_SECRET',
            'ENCRYPTION_KEY',
            'FRONTEND_DOMAIN',
            'BACKEND_DOMAIN',
            'CORS_ORIGIN',
            'VITE_API_URL'
        ];

        required.forEach(variable => {
            if (!process.env[variable]) {
                this.error(`Missing required environment variable: ${variable}`);
            } else {
                this.success(`${variable} is set`);
            }
        });
    }

    // Validate secrets strength
    validateSecrets() {
        this.log('\n🔐 Validating Secrets Strength...', 'cyan');

        const secrets = {
            POSTGRES_PASSWORD: { minLength: 16, pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]).{16,}$/ },
            JWT_SECRET: { minLength: 32, pattern: /^[A-Za-z0-9!@#$%^&*()_+\-=]{32,}$/ },
            SESSION_SECRET: { minLength: 16, pattern: /^[A-Za-z0-9!@#$%^&*()_+\-=]{16,}$/ },
            ENCRYPTION_KEY: { minLength: 32, pattern: /^[A-Fa-f0-9]{32}$/ }
        };

        Object.entries(secrets).forEach(([name, rules]) => {
            const value = process.env[name];
            if (value) {
                if (value.length < rules.minLength) {
                    this.error(`${name} is too short (minimum ${rules.minLength} characters)`);
                } else if (!rules.pattern.test(value)) {
                    this.error(`${name} does not meet complexity requirements`);
                } else {
                    this.success(`${name} meets security requirements`);
                }
            }
        });
    }

    // Validate domain configuration
    validateDomains() {
        this.log('\n🌐 Validating Domain Configuration...', 'cyan');

        const domains = {
            FRONTEND_DOMAIN: process.env.FRONTEND_DOMAIN,
            BACKEND_DOMAIN: process.env.BACKEND_DOMAIN
        };

        const urls = {
            CORS_ORIGIN: process.env.CORS_ORIGIN,
            VITE_API_URL: process.env.VITE_API_URL,
            WEBHOOK_URL: process.env.WEBHOOK_URL
        };

        // Validate domain format
        const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
        Object.entries(domains).forEach(([name, domain]) => {
            if (domain) {
                if (domainPattern.test(domain)) {
                    this.success(`${name} format is valid: ${domain}`);
                } else {
                    this.error(`${name} format is invalid: ${domain}`);
                }
            }
        });

        // Validate URL format and consistency
        const urlPattern = /^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        Object.entries(urls).forEach(([name, url]) => {
            if (url) {
                if (urlPattern.test(url)) {
                    this.success(`${name} format is valid: ${url}`);
                } else {
                    this.error(`${name} format is invalid: ${url}`);
                }
            }
        });

        // Check consistency
        if (domains.FRONTEND_DOMAIN && urls.CORS_ORIGIN) {
            const expectedCors = `https://${domains.FRONTEND_DOMAIN}`;
            if (urls.CORS_ORIGIN !== expectedCors) {
                this.warning(`CORS_ORIGIN (${urls.CORS_ORIGIN}) doesn't match FRONTEND_DOMAIN (${expectedCors})`);
            }
        }

        if (domains.BACKEND_DOMAIN && urls.VITE_API_URL) {
            const expectedApi = `https://${domains.BACKEND_DOMAIN}`;
            if (urls.VITE_API_URL !== expectedApi) {
                this.warning(`VITE_API_URL (${urls.VITE_API_URL}) doesn't match BACKEND_DOMAIN (${expectedApi})`);
            }
        }
    }

    // Validate database configuration
    validateDatabase() {
        this.log('\n🗄️  Validating Database Configuration...', 'cyan');

        const dbConfig = {
            POSTGRES_DB: process.env.POSTGRES_DB || 'n8n_clone',
            POSTGRES_USER: process.env.POSTGRES_USER || 'postgres',
            DATABASE_URL: process.env.DATABASE_URL
        };

        // Validate database name
        const dbNamePattern = /^[a-zA-Z0-9_]+$/;
        if (dbNamePattern.test(dbConfig.POSTGRES_DB)) {
            this.success(`Database name is valid: ${dbConfig.POSTGRES_DB}`);
        } else {
            this.error(`Database name contains invalid characters: ${dbConfig.POSTGRES_DB}`);
        }

        // Validate username
        const userPattern = /^[a-zA-Z0-9_]+$/;
        if (userPattern.test(dbConfig.POSTGRES_USER)) {
            this.success(`Database user is valid: ${dbConfig.POSTGRES_USER}`);
        } else {
            this.error(`Database user contains invalid characters: ${dbConfig.POSTGRES_USER}`);
        }

        // Validate DATABASE_URL format
        if (dbConfig.DATABASE_URL) {
            const dbUrlPattern = /^postgresql:\/\/[^:]+:[^@]+@[^:]+:\d+\/[^?]+(\?.*)?$/;
            if (dbUrlPattern.test(dbConfig.DATABASE_URL)) {
                this.success('DATABASE_URL format is valid');
            } else {
                this.error('DATABASE_URL format is invalid');
            }
        }
    }

    // Validate Redis configuration
    validateRedis() {
        this.log('\n🔴 Validating Redis Configuration...', 'cyan');

        const redisUrl = process.env.REDIS_URL;
        if (redisUrl) {
            const redisPattern = /^redis:\/\/[^:]+:\d+(\/\d+)?$/;
            if (redisPattern.test(redisUrl)) {
                this.success(`Redis URL format is valid: ${redisUrl}`);
            } else {
                this.error(`Redis URL format is invalid: ${redisUrl}`);
            }
        } else {
            this.error('REDIS_URL is not set');
        }
    }

    // Validate security configuration
    validateSecurity() {
        this.log('\n🔒 Validating Security Configuration...', 'cyan');

        const nodeEnv = process.env.NODE_ENV;
        if (nodeEnv === 'production') {
            // Production security checks
            const httpsUrls = [
                process.env.CORS_ORIGIN,
                process.env.VITE_API_URL,
                process.env.WEBHOOK_URL
            ];

            httpsUrls.forEach((url, index) => {
                const names = ['CORS_ORIGIN', 'VITE_API_URL', 'WEBHOOK_URL'];
                if (url && url.startsWith('https://')) {
                    this.success(`${names[index]} uses HTTPS`);
                } else if (url) {
                    this.error(`${names[index]} should use HTTPS in production`);
                }
            });

            // Check JWT expiration
            const jwtExpires = process.env.JWT_EXPIRES_IN || '7d';
            if (['1h', '2h', '6h', '12h', '1d', '7d'].includes(jwtExpires)) {
                this.success(`JWT expiration is reasonable: ${jwtExpires}`);
            } else {
                this.warning(`JWT expiration might be too long: ${jwtExpires}`);
            }

            // Check bcrypt rounds
            const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
            if (bcryptRounds >= 10 && bcryptRounds <= 15) {
                this.success(`BCrypt rounds are secure: ${bcryptRounds}`);
            } else {
                this.warning(`BCrypt rounds should be between 10-15: ${bcryptRounds}`);
            }
        } else {
            this.info(`Environment is ${nodeEnv}, relaxed security validation`);
        }
    }

    // Validate Coolify-specific configuration
    validateCoolify() {
        this.log('\n☁️  Validating Coolify Configuration...', 'cyan');

        const coolifyConfig = {
            COOLIFY_PROJECT_NAME: process.env.COOLIFY_PROJECT_NAME,
            COOLIFY_ENVIRONMENT: process.env.COOLIFY_ENVIRONMENT,
            COOLIFY_AUTO_DEPLOY: process.env.COOLIFY_AUTO_DEPLOY,
            COOLIFY_SSL_ENABLED: process.env.COOLIFY_SSL_ENABLED
        };

        Object.entries(coolifyConfig).forEach(([name, value]) => {
            if (value) {
                this.success(`${name} is configured: ${value}`);
            } else {
                this.info(`${name} is not set (optional)`);
            }
        });

        // Validate project name format
        if (coolifyConfig.COOLIFY_PROJECT_NAME) {
            const projectNamePattern = /^[a-z0-9-]+$/;
            if (projectNamePattern.test(coolifyConfig.COOLIFY_PROJECT_NAME)) {
                this.success('Coolify project name format is valid');
            } else {
                this.error('Coolify project name should contain only lowercase letters, numbers, and hyphens');
            }
        }
    }

    // Generate validation report
    generateReport() {
        this.log('\n📊 Validation Report', 'magenta');
        this.log('='.repeat(50), 'magenta');

        this.log(`\n✅ Passed: ${this.info.length + (this.errors.length === 0 ? 1 : 0)} checks`);
        this.log(`⚠️  Warnings: ${this.warnings.length}`, 'yellow');
        this.log(`❌ Errors: ${this.errors.length}`, 'red');

        if (this.warnings.length > 0) {
            this.log('\nWarnings:', 'yellow');
            this.warnings.forEach(warning => this.log(`  • ${warning}`, 'yellow'));
        }

        if (this.errors.length > 0) {
            this.log('\nErrors:', 'red');
            this.errors.forEach(error => this.log(`  • ${error}`, 'red'));
        }

        const isValid = this.errors.length === 0;
        this.log(`\n${isValid ? '🎉' : '💥'} Environment is ${isValid ? 'VALID' : 'INVALID'} for Coolify deployment`, isValid ? 'green' : 'red');

        return isValid;
    }

    // Run all validations
    validate() {
        this.log('🔍 Coolify Environment Validation', 'cyan');
        this.log(`Environment: ${this.environment}`, 'blue');
        this.log('='.repeat(50), 'cyan');

        this.loadConfig();
        this.validateRequiredVariables();
        this.validateSecrets();
        this.validateDomains();
        this.validateDatabase();
        this.validateRedis();
        this.validateSecurity();
        this.validateCoolify();

        return this.generateReport();
    }
}

// CLI usage
if (require.main === module) {
    const environment = process.argv[2] || process.env.NODE_ENV || 'production';
    const validator = new EnvironmentValidator(environment);
    const isValid = validator.validate();
    process.exit(isValid ? 0 : 1);
}

module.exports = EnvironmentValidator;