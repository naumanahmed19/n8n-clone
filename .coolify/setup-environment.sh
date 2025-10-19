#!/bin/bash

# Coolify Environment Setup Script
# This script helps configure environment variables for Coolify deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT=${1:-production}

echo -e "${BLUE}🚀 Coolify Environment Setup for n8n-clone${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo ""

# Function to generate secure random string
generate_secret() {
    local length=${1:-32}
    local charset=${2:-"A-Za-z0-9"}
    
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -base64 $((length * 3 / 4)) | tr -d "=+/" | cut -c1-${length}
    elif command -v head >/dev/null 2>&1 && [ -c /dev/urandom ]; then
        head -c ${length} /dev/urandom | base64 | tr -d "=+/" | cut -c1-${length}
    else
        echo "$(date +%s)$(shuf -i 1000-9999 -n 1)" | sha256sum | cut -c1-${length}
    fi
}

# Function to generate password
generate_password() {
    local length=${1:-32}
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -base64 48 | tr -d "=+/" | tr -d '\n' | cut -c1-${length}
    else
        generate_secret ${length}
    fi
}

# Function to validate domain
validate_domain() {
    local domain=$1
    if [[ $domain =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to prompt for input with validation
prompt_input() {
    local prompt=$1
    local default=$2
    local validator=$3
    local value
    
    while true; do
        if [ -n "$default" ]; then
            read -p "$prompt [$default]: " value
            value=${value:-$default}
        else
            read -p "$prompt: " value
        fi
        
        if [ -z "$validator" ] || $validator "$value"; then
            echo "$value"
            return 0
        else
            echo -e "${RED}Invalid input. Please try again.${NC}"
        fi
    done
}

echo -e "${YELLOW}📋 Environment Configuration${NC}"
echo ""

# Get domain configuration
echo -e "${BLUE}Domain Configuration:${NC}"
FRONTEND_DOMAIN=$(prompt_input "Frontend domain (e.g., yourdomain.com)" "" validate_domain)
BACKEND_DOMAIN=$(prompt_input "Backend API domain (e.g., api.yourdomain.com)" "api.$FRONTEND_DOMAIN" validate_domain)

# Generate secrets
echo ""
echo -e "${YELLOW}🔐 Generating Secrets...${NC}"

POSTGRES_PASSWORD=$(generate_password 32)
JWT_SECRET=$(generate_secret 64)
SESSION_SECRET=$(generate_secret 32)
ENCRYPTION_KEY=$(generate_secret 32 "A-Fa-f0-9")
WEBHOOK_SIGNING_SECRET=$(generate_secret 48)

echo -e "${GREEN}✅ Secrets generated successfully${NC}"

# Create environment file
ENV_FILE="$SCRIPT_DIR/.env.coolify.${ENVIRONMENT}.generated"

echo ""
echo -e "${YELLOW}📝 Creating environment configuration...${NC}"

cat > "$ENV_FILE" << EOF
# Generated Coolify Environment Configuration
# Environment: ${ENVIRONMENT}
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

# =============================================================================
# DOMAIN CONFIGURATION
# =============================================================================
FRONTEND_DOMAIN=${FRONTEND_DOMAIN}
BACKEND_DOMAIN=${BACKEND_DOMAIN}
CORS_ORIGIN=https://${FRONTEND_DOMAIN}
VITE_API_URL=https://${BACKEND_DOMAIN}
WEBHOOK_URL=https://${FRONTEND_DOMAIN}

# =============================================================================
# GENERATED SECRETS (Copy to Coolify Secrets Management)
# =============================================================================
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
WEBHOOK_SIGNING_SECRET=${WEBHOOK_SIGNING_SECRET}

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
POSTGRES_DB=n8n_clone$([ "$ENVIRONMENT" != "production" ] && echo "_${ENVIRONMENT}" || echo "")
POSTGRES_USER=postgres
DATABASE_URL=postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB}

# =============================================================================
# REDIS CONFIGURATION
# =============================================================================
REDIS_URL=redis://redis:6379$([ "$ENVIRONMENT" != "production" ] && echo "/1" || echo "")

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================
NODE_ENV=${ENVIRONMENT}
LOG_LEVEL=$([ "$ENVIRONMENT" = "production" ] && echo "info" || echo "debug")
PORT=4000
FRONTEND_PORT=3000

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
JWT_EXPIRES_IN=$([ "$ENVIRONMENT" = "production" ] && echo "7d" || echo "24h")
BCRYPT_ROUNDS=$([ "$ENVIRONMENT" = "production" ] && echo "12" || echo "10")
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTP_ONLY=true
SESSION_COOKIE_SAME_SITE=$([ "$ENVIRONMENT" = "production" ] && echo "strict" || echo "lax")

# =============================================================================
# COOLIFY CONFIGURATION
# =============================================================================
COOLIFY_PROJECT_NAME=n8n-clone$([ "$ENVIRONMENT" != "production" ] && echo "-${ENVIRONMENT}" || echo "")
COOLIFY_ENVIRONMENT=${ENVIRONMENT}
COOLIFY_AUTO_DEPLOY=true
COOLIFY_SSL_ENABLED=true
COOLIFY_SSL_REDIRECT=true
EOF

echo -e "${GREEN}✅ Environment file created: ${ENV_FILE}${NC}"

# Create Coolify import JSON
IMPORT_FILE="$SCRIPT_DIR/coolify-import-${ENVIRONMENT}.json"

cat > "$IMPORT_FILE" << EOF
{
  "project_name": "n8n-clone$([ "$ENVIRONMENT" != "production" ] && echo "-${ENVIRONMENT}" || echo "")",
  "environment": "${ENVIRONMENT}",
  "secrets": {
    "POSTGRES_PASSWORD": "${POSTGRES_PASSWORD}",
    "JWT_SECRET": "${JWT_SECRET}",
    "SESSION_SECRET": "${SESSION_SECRET}",
    "ENCRYPTION_KEY": "${ENCRYPTION_KEY}",
    "WEBHOOK_SIGNING_SECRET": "${WEBHOOK_SIGNING_SECRET}"
  },
  "environment_variables": {
    "FRONTEND_DOMAIN": "${FRONTEND_DOMAIN}",
    "BACKEND_DOMAIN": "${BACKEND_DOMAIN}",
    "CORS_ORIGIN": "https://${FRONTEND_DOMAIN}",
    "VITE_API_URL": "https://${BACKEND_DOMAIN}",
    "WEBHOOK_URL": "https://${FRONTEND_DOMAIN}",
    "POSTGRES_DB": "n8n_clone$([ "$ENVIRONMENT" != "production" ] && echo "_${ENVIRONMENT}" || echo "")",
    "POSTGRES_USER": "postgres",
    "NODE_ENV": "${ENVIRONMENT}",
    "LOG_LEVEL": "$([ "$ENVIRONMENT" = "production" ] && echo "info" || echo "debug")",
    "PORT": "4000",
    "FRONTEND_PORT": "3000"
  },
  "computed_variables": {
    "DATABASE_URL": "postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB}",
    "REDIS_URL": "redis://redis:6379$([ "$ENVIRONMENT" != "production" ] && echo "/1" || echo "")"
  }
}
EOF

echo -e "${GREEN}✅ Coolify import file created: ${IMPORT_FILE}${NC}"

# Create setup instructions
INSTRUCTIONS_FILE="$SCRIPT_DIR/coolify-setup-instructions-${ENVIRONMENT}.md"

cat > "$INSTRUCTIONS_FILE" << EOF
# Coolify Setup Instructions - ${ENVIRONMENT}

## 1. Create Project in Coolify

1. Log into your Coolify dashboard
2. Create a new project: \`n8n-clone$([ "$ENVIRONMENT" != "production" ] && echo "-${ENVIRONMENT}" || echo "")\`
3. Connect your Git repository

## 2. Configure Secrets

Add the following secrets in Coolify Secrets Management:

\`\`\`
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
JWT_SECRET: ${JWT_SECRET}
SESSION_SECRET: ${SESSION_SECRET}
ENCRYPTION_KEY: ${ENCRYPTION_KEY}
WEBHOOK_SIGNING_SECRET: ${WEBHOOK_SIGNING_SECRET}
\`\`\`

## 3. Configure Environment Variables

Add the following environment variables in Coolify:

\`\`\`
FRONTEND_DOMAIN: ${FRONTEND_DOMAIN}
BACKEND_DOMAIN: ${BACKEND_DOMAIN}
CORS_ORIGIN: https://${FRONTEND_DOMAIN}
VITE_API_URL: https://${BACKEND_DOMAIN}
WEBHOOK_URL: https://${FRONTEND_DOMAIN}
POSTGRES_DB: n8n_clone$([ "$ENVIRONMENT" != "production" ] && echo "_${ENVIRONMENT}" || echo "")
POSTGRES_USER: postgres
NODE_ENV: ${ENVIRONMENT}
LOG_LEVEL: $([ "$ENVIRONMENT" = "production" ] && echo "info" || echo "debug")
PORT: 4000
FRONTEND_PORT: 3000
\`\`\`

## 4. Configure Computed Variables

These will be automatically computed by Coolify:

\`\`\`
DATABASE_URL: postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB}
REDIS_URL: redis://redis:6379$([ "$ENVIRONMENT" != "production" ] && echo "/1" || echo "")
\`\`\`

## 5. Deploy Services

1. Deploy in this order:
   - PostgreSQL database
   - Redis cache
   - Backend API
   - Frontend application

2. Configure domains:
   - Frontend: ${FRONTEND_DOMAIN}
   - Backend: ${BACKEND_DOMAIN}

3. Enable SSL certificates for both domains

## 6. Verify Deployment

1. Check health endpoints:
   - Frontend: https://${FRONTEND_DOMAIN}/health
   - Backend: https://${BACKEND_DOMAIN}/health

2. Test database connectivity
3. Verify Redis connection
4. Test API endpoints

## Security Notes

- All secrets are randomly generated with high entropy
- Passwords meet security requirements
- SSL is enabled for all domains
- CORS is properly configured
- Session security is enforced

## Files Generated

- Environment file: \`.env.coolify.${ENVIRONMENT}.generated\`
- Import file: \`coolify-import-${ENVIRONMENT}.json\`
- Instructions: \`coolify-setup-instructions-${ENVIRONMENT}.md\`
EOF

echo -e "${GREEN}✅ Setup instructions created: ${INSTRUCTIONS_FILE}${NC}"

echo ""
echo -e "${GREEN}🎉 Environment setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Review the generated files in ${SCRIPT_DIR}/"
echo -e "2. Follow the instructions in ${INSTRUCTIONS_FILE}"
echo -e "3. Import the configuration into Coolify"
echo -e "4. Deploy your services"
echo ""
echo -e "${BLUE}Generated files:${NC}"
echo -e "- ${ENV_FILE}"
echo -e "- ${IMPORT_FILE}"
echo -e "- ${INSTRUCTIONS_FILE}"
echo ""
echo -e "${RED}⚠️  Security Notice:${NC}"
echo -e "Keep the generated secrets secure and do not commit them to version control!"