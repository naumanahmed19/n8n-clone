#!/bin/bash

# Coolify Domain and SSL Setup Script
# This script configures domain and SSL settings for the n8n-clone application

set -e

echo "🚀 Setting up domain and SSL configuration for Coolify deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_environment() {
    print_status "Checking environment variables..."
    
    local required_vars=("FRONTEND_DOMAIN" "BACKEND_DOMAIN" "CORS_ORIGIN" "VITE_API_URL")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo ""
        echo "Please set these variables in your Coolify project environment configuration."
        echo "Example values:"
        echo "  FRONTEND_DOMAIN=yourdomain.com"
        echo "  BACKEND_DOMAIN=api.yourdomain.com"
        echo "  CORS_ORIGIN=https://yourdomain.com"
        echo "  VITE_API_URL=https://api.yourdomain.com"
        exit 1
    fi
    
    print_success "All required environment variables are set"
}

# Validate domain configuration
validate_domains() {
    print_status "Validating domain configuration..."
    
    # Check if CORS_ORIGIN matches FRONTEND_DOMAIN
    expected_cors="https://${FRONTEND_DOMAIN}"
    if [[ "$CORS_ORIGIN" != "$expected_cors" ]]; then
        print_warning "CORS_ORIGIN ($CORS_ORIGIN) doesn't match expected value ($expected_cors)"
    fi
    
    # Check if VITE_API_URL matches BACKEND_DOMAIN
    expected_api_url="https://${BACKEND_DOMAIN}"
    if [[ "$VITE_API_URL" != "$expected_api_url" ]]; then
        print_warning "VITE_API_URL ($VITE_API_URL) doesn't match expected value ($expected_api_url)"
    fi
    
    print_success "Domain configuration validated"
}

# Generate Coolify service configuration
generate_service_config() {
    print_status "Generating Coolify service configuration..."
    
    cat > .coolify/coolify-services.json << EOF
{
  "services": {
    "frontend": {
      "type": "application",
      "port": 3000,
      "domain": "${FRONTEND_DOMAIN}",
      "ssl": {
        "enabled": true,
        "redirect": true,
        "provider": "letsencrypt"
      },
      "health_check": "/health",
      "environment": [
        "VITE_API_URL=${VITE_API_URL}",
        "NGINX_HOST=${FRONTEND_DOMAIN}"
      ]
    },
    "backend": {
      "type": "application", 
      "port": 4000,
      "domain": "${BACKEND_DOMAIN}",
      "ssl": {
        "enabled": true,
        "redirect": true,
        "provider": "letsencrypt"
      },
      "health_check": "/health",
      "environment": [
        "CORS_ORIGIN=${CORS_ORIGIN}",
        "FRONTEND_DOMAIN=${FRONTEND_DOMAIN}"
      ]
    }
  }
}
EOF
    
    print_success "Service configuration generated"
}

# Update docker-compose labels for Coolify
update_compose_labels() {
    print_status "Updating docker-compose labels for Coolify..."
    
    # Create a temporary file with updated labels
    cat > .coolify/coolify-labels.yml << EOF
# Coolify Labels for Domain and SSL Configuration
# Add these labels to your services in coolify.yaml

frontend_labels: &frontend_labels
  - "coolify.managed=true"
  - "coolify.type=application"
  - "coolify.name=n8n-clone-frontend"
  - "coolify.port=3000"
  - "coolify.domain=${FRONTEND_DOMAIN}"
  - "coolify.ssl=true"
  - "coolify.ssl.redirect=true"
  - "coolify.ssl.provider=letsencrypt"
  - "coolify.redirect_www=true"
  - "coolify.health_check=/health"

backend_labels: &backend_labels
  - "coolify.managed=true"
  - "coolify.type=application"
  - "coolify.name=n8n-clone-backend"
  - "coolify.port=4000"
  - "coolify.domain=${BACKEND_DOMAIN}"
  - "coolify.ssl=true"
  - "coolify.ssl.redirect=true"
  - "coolify.ssl.provider=letsencrypt"
  - "coolify.health_check=/health"
EOF
    
    print_success "Coolify labels configuration created"
}

# Create nginx configuration with domain variables
create_nginx_config() {
    print_status "Creating production nginx configuration..."
    
    # Replace variables in nginx configuration
    sed "s/\${NGINX_HOST}/${FRONTEND_DOMAIN}/g" .coolify/nginx-production.conf > .coolify/nginx-production-configured.conf
    
    print_success "Nginx configuration created with domain: ${FRONTEND_DOMAIN}"
}

# Generate deployment checklist
generate_checklist() {
    print_status "Generating deployment checklist..."
    
    cat > .coolify/deployment-checklist.md << EOF
# Domain and SSL Deployment Checklist

## Pre-deployment Steps

- [ ] DNS records configured for domains:
  - [ ] A record: ${FRONTEND_DOMAIN} → Coolify server IP
  - [ ] A record: ${BACKEND_DOMAIN} → Coolify server IP
  - [ ] Optional: CNAME record: www.${FRONTEND_DOMAIN} → ${FRONTEND_DOMAIN}

- [ ] Environment variables set in Coolify:
  - [ ] FRONTEND_DOMAIN=${FRONTEND_DOMAIN}
  - [ ] BACKEND_DOMAIN=${BACKEND_DOMAIN}
  - [ ] CORS_ORIGIN=${CORS_ORIGIN}
  - [ ] VITE_API_URL=${VITE_API_URL}

## Coolify Configuration

- [ ] Project created in Coolify dashboard
- [ ] Git repository connected
- [ ] Docker Compose file set to: coolify.yaml
- [ ] Environment variables configured
- [ ] Domain settings configured for services:
  - [ ] Frontend: ${FRONTEND_DOMAIN}
  - [ ] Backend: ${BACKEND_DOMAIN}

## SSL Configuration

- [ ] SSL enabled for frontend service
- [ ] SSL enabled for backend service
- [ ] HTTP to HTTPS redirect enabled
- [ ] Let's Encrypt certificates configured

## Post-deployment Verification

- [ ] Frontend accessible at: https://${FRONTEND_DOMAIN}
- [ ] Backend API accessible at: https://${BACKEND_DOMAIN}
- [ ] SSL certificates valid and trusted
- [ ] CORS working correctly
- [ ] Health checks passing:
  - [ ] Frontend: https://${FRONTEND_DOMAIN}/health
  - [ ] Backend: https://${BACKEND_DOMAIN}/health

## Security Verification

- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers present
- [ ] CORS configured correctly
- [ ] No mixed content warnings
- [ ] SSL Labs test passes (A+ rating recommended)

## Performance Verification

- [ ] Static assets cached properly
- [ ] Gzip compression working
- [ ] CDN configured (if applicable)
- [ ] Page load times acceptable
EOF
    
    print_success "Deployment checklist created"
}

# Main execution
main() {
    echo "🔧 Coolify Domain and SSL Configuration Setup"
    echo "=============================================="
    echo ""
    
    # Only validate if we're not in a CI environment
    if [[ -z "$CI" ]]; then
        check_environment
        validate_domains
    else
        print_status "Running in CI environment, skipping environment validation"
    fi
    
    generate_service_config
    update_compose_labels
    create_nginx_config
    generate_checklist
    
    echo ""
    print_success "Domain and SSL configuration setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Review the generated configuration files in .coolify/"
    echo "2. Configure DNS records for your domains"
    echo "3. Set environment variables in Coolify dashboard"
    echo "4. Deploy your application"
    echo "5. Follow the deployment checklist in .coolify/deployment-checklist.md"
    echo ""
    echo "Configuration files created:"
    echo "  - .coolify/coolify-services.json"
    echo "  - .coolify/coolify-labels.yml"
    echo "  - .coolify/nginx-production-configured.conf"
    echo "  - .coolify/deployment-checklist.md"
}

# Run main function
main "$@"