#!/bin/bash

# Coolify Project Setup Script
# This script helps configure the n8n-clone project in Coolify

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="n8n-clone"
COMPOSE_FILE="coolify.yaml"

echo -e "${BLUE}🚀 Coolify Project Setup for n8n-clone${NC}"
echo "=============================================="
echo ""

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Coolify configuration files exist
check_coolify_config() {
    print_info "Checking Coolify configuration files..."
    
    local config_files=(
        ".coolify/project.json"
        ".coolify/environment.json"
        ".coolify/services.json"
        ".coolify/deployment.md"
        "coolify.yaml"
    )
    
    local missing_files=()
    
    for file in "${config_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        print_error "Missing Coolify configuration files:"
        printf '   - %s\n' "${missing_files[@]}"
        exit 1
    fi
    
    print_status "All Coolify configuration files are present"
}

# Validate Docker Compose configuration
validate_compose() {
    print_info "Validating Docker Compose configuration..."
    
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        print_error "Docker Compose file '$COMPOSE_FILE' not found"
        exit 1
    fi
    
    # Check if docker-compose is available for validation
    if command -v docker-compose &> /dev/null; then
        if docker-compose -f "$COMPOSE_FILE" config > /dev/null 2>&1; then
            print_status "Docker Compose configuration is valid"
        else
            print_error "Docker Compose configuration has errors"
            docker-compose -f "$COMPOSE_FILE" config
            exit 1
        fi
    else
        print_warning "docker-compose not available for validation"
    fi
}

# Generate environment template
generate_env_template() {
    print_info "Generating environment variable template..."
    
    local env_file=".env.coolify.example"
    
    cat > "$env_file" << 'EOF'
# Coolify Environment Variables Template
# Copy these variables to your Coolify project environment configuration

# Required Variables - MUST be set in Coolify
POSTGRES_PASSWORD=generate_secure_password_32_chars
JWT_SECRET=generate_secure_random_string_64_chars
SESSION_SECRET=generate_secure_random_string_32_chars
CORS_ORIGIN=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com
WEBHOOK_URL=https://yourdomain.com

# Domain Configuration
FRONTEND_DOMAIN=yourdomain.com
BACKEND_DOMAIN=api.yourdomain.com

# Optional Variables - Can use defaults
POSTGRES_DB=n8n_clone
POSTGRES_USER=postgres
LOG_LEVEL=info
NGINX_HOST=yourdomain.com

# Auto-Generated Variables - Set by Coolify/Docker Compose
# DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/n8n_clone
# REDIS_URL=redis://redis:6379
# NODE_ENV=production
# PORT=4000
EOF

    print_status "Created environment template: $env_file"
}

# Display project configuration summary
show_project_summary() {
    echo ""
    print_info "Project Configuration Summary"
    echo "=============================="
    echo ""
    echo "📁 Project Name: $PROJECT_NAME"
    echo "🐳 Compose File: $COMPOSE_FILE"
    echo "🌐 Services:"
    echo "   - Frontend (React + Nginx) - Port 3000"
    echo "   - Backend (Node.js + Express) - Port 4000"
    echo "   - PostgreSQL Database - Internal only"
    echo "   - Redis Cache - Internal only"
    echo ""
    echo "🔗 Networks:"
    echo "   - Internal: postgres, redis, backend (secure)"
    echo "   - External: frontend, backend (public access)"
    echo ""
    echo "💾 Persistent Volumes:"
    echo "   - postgres_data: Database storage"
    echo "   - redis_data: Cache storage"
    echo ""
}

# Display Coolify setup instructions
show_coolify_instructions() {
    echo ""
    print_info "Coolify Dashboard Setup Instructions"
    echo "===================================="
    echo ""
    echo "1. 🏗️  Create New Project:"
    echo "   - Name: $PROJECT_NAME"
    echo "   - Type: Docker Compose Application"
    echo "   - Server: Select your target server"
    echo ""
    echo "2. 📦 Configure Repository:"
    echo "   - Repository URL: Your Git repository URL"
    echo "   - Branch: main (or your production branch)"
    echo "   - Auto Deploy: Enable"
    echo "   - Compose File: $COMPOSE_FILE"
    echo ""
    echo "3. 🔧 Set Environment Variables:"
    echo "   - Copy variables from .env.coolify.example"
    echo "   - Generate secure passwords and secrets"
    echo "   - Update domain names to match your setup"
    echo ""
    echo "4. 🌐 Configure Domains:"
    echo "   - Frontend: Set primary domain with SSL"
    echo "   - Backend: Set API domain with SSL"
    echo "   - Enable automatic certificate generation"
    echo ""
    echo "5. 🚀 Deploy Application:"
    echo "   - Click Deploy in Coolify dashboard"
    echo "   - Monitor build logs for issues"
    echo "   - Wait for all services to become healthy"
    echo ""
}

# Display post-deployment verification steps
show_verification_steps() {
    echo ""
    print_info "Post-Deployment Verification"
    echo "============================"
    echo ""
    echo "1. ✅ Service Health Checks:"
    echo "   - Frontend: https://yourdomain.com/health"
    echo "   - Backend: https://api.yourdomain.com/health"
    echo ""
    echo "2. 🔍 Monitor Service Logs:"
    echo "   - Check Coolify dashboard logs tab"
    echo "   - Verify all services are running"
    echo "   - Look for any error messages"
    echo ""
    echo "3. 🧪 Test Application:"
    echo "   - Access frontend application"
    echo "   - Test user registration/login"
    echo "   - Create and execute a simple workflow"
    echo ""
    echo "4. 📊 Monitor Performance:"
    echo "   - Check resource usage in Coolify"
    echo "   - Monitor response times"
    echo "   - Verify database connectivity"
    echo ""
}

# Main execution
main() {
    # Run validation steps
    check_coolify_config
    validate_compose
    generate_env_template
    
    # Display information
    show_project_summary
    show_coolify_instructions
    show_verification_steps
    
    echo ""
    print_status "Coolify project setup configuration complete!"
    echo ""
    print_info "Next Steps:"
    echo "1. Push your code to Git repository"
    echo "2. Follow the Coolify dashboard instructions above"
    echo "3. Set environment variables from .env.coolify.example"
    echo "4. Deploy and monitor the application"
    echo ""
    print_info "For detailed instructions, see: .coolify/deployment.md"
}

# Run main function
main "$@"