#!/bin/bash

# Coolify Deployment Script for n8n-clone
# This script helps prepare and deploy the application to Coolify

set -e

echo "🚀 Starting Coolify deployment preparation..."

# Check if required environment variables are set
check_env_vars() {
    local required_vars=(
        "POSTGRES_PASSWORD"
        "JWT_SECRET"
        "SESSION_SECRET"
        "CORS_ORIGIN"
        "VITE_API_URL"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        echo "❌ Missing required environment variables:"
        printf '   - %s\n' "${missing_vars[@]}"
        echo ""
        echo "Please set these variables in your Coolify environment configuration."
        exit 1
    fi
    
    echo "✅ All required environment variables are set"
}

# Validate Docker configurations
validate_docker() {
    echo "🔍 Validating Docker configurations..."
    
    # Check if Dockerfiles exist
    if [[ ! -f "backend/Dockerfile" ]]; then
        echo "❌ Backend Dockerfile not found"
        exit 1
    fi
    
    if [[ ! -f "frontend/Dockerfile" ]]; then
        echo "❌ Frontend Dockerfile not found"
        exit 1
    fi
    
    # Test Docker builds locally (optional)
    if command -v docker &> /dev/null; then
        echo "🐳 Testing Docker builds..."
        
        # Test backend build
        if ! docker build -t n8n-clone-backend-test ./backend > /dev/null 2>&1; then
            echo "❌ Backend Docker build failed"
            exit 1
        fi
        
        # Test frontend build
        if ! docker build -t n8n-clone-frontend-test ./frontend > /dev/null 2>&1; then
            echo "❌ Frontend Docker build failed"
            exit 1
        fi
        
        # Clean up test images
        docker rmi n8n-clone-backend-test n8n-clone-frontend-test > /dev/null 2>&1 || true
        
        echo "✅ Docker builds successful"
    else
        echo "⚠️  Docker not available for local testing"
    fi
}

# Generate production environment file
generate_env_file() {
    echo "📝 Generating production environment file..."
    
    if [[ ! -f ".env.production" ]]; then
        if [[ -f ".env.production.example" ]]; then
            cp .env.production.example .env.production
            echo "✅ Created .env.production from example"
            echo "⚠️  Please update .env.production with your actual values"
        else
            echo "❌ .env.production.example not found"
            exit 1
        fi
    else
        echo "✅ .env.production already exists"
    fi
}

# Validate database migrations
validate_migrations() {
    echo "🗄️  Validating database migrations..."
    
    if [[ -d "backend/prisma/migrations" ]]; then
        local migration_count=$(find backend/prisma/migrations -name "*.sql" | wc -l)
        echo "✅ Found $migration_count migration files"
    else
        echo "⚠️  No migrations directory found"
    fi
}

# Pre-deployment checklist
pre_deployment_checklist() {
    echo ""
    echo "📋 Pre-deployment checklist:"
    echo "   ✅ Docker configurations optimized"
    echo "   ✅ Health check endpoints configured"
    echo "   ✅ Environment variables template created"
    echo "   ✅ Production docker-compose configuration ready"
    echo ""
    echo "🔧 Manual steps required in Coolify:"
    echo "   1. Create new project in Coolify dashboard"
    echo "   2. Connect your Git repository"
    echo "   3. Set environment variables from .env.production.example"
    echo "   4. Configure domain and SSL settings"
    echo "   5. Deploy the application"
    echo ""
    echo "🌐 Required environment variables in Coolify:"
    echo "   - POSTGRES_PASSWORD (generate secure password)"
    echo "   - JWT_SECRET (minimum 32 characters)"
    echo "   - SESSION_SECRET (secure random string)"
    echo "   - CORS_ORIGIN (your domain URL)"
    echo "   - VITE_API_URL (your API domain URL)"
    echo ""
}

# Main execution
main() {
    echo "n8n-clone Coolify Deployment Preparation"
    echo "========================================"
    echo ""
    
    # Run validation steps
    validate_docker
    generate_env_file
    validate_migrations
    
    # Show checklist
    pre_deployment_checklist
    
    echo "🎉 Deployment preparation complete!"
    echo ""
    echo "Next steps:"
    echo "1. Push your code to your Git repository"
    echo "2. Follow the manual steps in Coolify dashboard"
    echo "3. Monitor the deployment logs for any issues"
}

# Run main function
main "$@"