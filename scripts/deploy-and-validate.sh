#!/bin/bash

# Deploy and Validate Script for Coolify
# This script provides instructions for triggering deployment and runs validation

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
VALIDATION_SCRIPT="$SCRIPT_DIR/validate-deployment.js"

echo -e "${BLUE}🚀 Coolify Deployment and Validation${NC}"
echo "====================================="
echo ""

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "info")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
        "success")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "error")
            echo -e "${RED}❌ $message${NC}"
            ;;
    esac
}

# Function to check if Node.js is available
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_status "error" "Node.js is not installed or not in PATH"
        print_status "info" "Please install Node.js to run validation scripts"
        return 1
    fi
    
    local node_version=$(node --version)
    print_status "success" "Node.js found: $node_version"
    return 0
}

# Function to display deployment instructions
show_deployment_instructions() {
    print_status "info" "Coolify Deployment Instructions"
    echo ""
    echo "To trigger deployment in Coolify:"
    echo ""
    echo "1. 📋 Ensure all code is committed and pushed to your Git repository"
    echo "2. 🌐 Log into your Coolify dashboard"
    echo "3. 📁 Navigate to your n8n-clone project"
    echo "4. 🔄 Click 'Deploy' or 'Redeploy' button"
    echo "5. 📊 Monitor deployment logs in real-time"
    echo ""
    echo "Alternative deployment triggers:"
    echo "• Git webhook (automatic on push to main branch)"
    echo "• API endpoint (if configured)"
    echo "• Scheduled deployment (if configured)"
    echo ""
    print_status "warning" "This script cannot directly trigger Coolify deployment"
    print_status "info" "Coolify deployments must be triggered through the dashboard or webhooks"
    echo ""
}

# Function to wait for deployment
wait_for_deployment() {
    local frontend_url=${1:-"http://localhost:3000"}
    local backend_url=${2:-"http://localhost:4000"}
    local max_wait=${3:-300} # 5 minutes default
    local check_interval=10
    local elapsed=0
    
    print_status "info" "Waiting for services to become available..."
    print_status "info" "Frontend URL: $frontend_url"
    print_status "info" "Backend URL: $backend_url"
    print_status "info" "Maximum wait time: ${max_wait}s"
    echo ""
    
    while [ $elapsed -lt $max_wait ]; do
        echo -n "⏳ Checking services... (${elapsed}s/${max_wait}s) "
        
        # Check if backend health endpoint is responding
        if curl -s -f "$backend_url/health" > /dev/null 2>&1; then
            echo ""
            print_status "success" "Backend service is responding!"
            return 0
        fi
        
        echo "not ready"
        sleep $check_interval
        elapsed=$((elapsed + check_interval))
    done
    
    echo ""
    print_status "warning" "Services did not become available within ${max_wait}s"
    print_status "info" "Proceeding with validation anyway..."
    return 1
}

# Function to run validation
run_validation() {
    local frontend_url=$1
    local backend_url=$2
    
    print_status "info" "Running deployment validation..."
    echo ""
    
    # Set environment variables for validation script
    export FRONTEND_URL="$frontend_url"
    export BACKEND_URL="$backend_url"
    export VALIDATION_TIMEOUT=30000
    export VALIDATION_RETRIES=3
    export VALIDATION_RETRY_DELAY=5000
    
    # Run the validation script
    if node "$VALIDATION_SCRIPT"; then
        print_status "success" "Deployment validation completed successfully!"
        return 0
    else
        print_status "error" "Deployment validation failed!"
        return 1
    fi
}

# Function to show post-deployment steps
show_post_deployment_steps() {
    echo ""
    print_status "info" "Post-Deployment Steps"
    echo ""
    echo "1. 🔍 Review validation results above"
    echo "2. 🌐 Test your application manually in a browser"
    echo "3. 📊 Monitor application logs in Coolify dashboard"
    echo "4. 🔧 Set up monitoring and alerting (if not already configured)"
    echo "5. 📝 Update DNS records if using custom domains"
    echo "6. 🔒 Verify SSL certificates are working correctly"
    echo ""
    echo "Useful Coolify dashboard sections:"
    echo "• Logs: Monitor real-time application logs"
    echo "• Metrics: View resource usage and performance"
    echo "• Environment: Manage environment variables"
    echo "• Deployments: View deployment history and status"
    echo ""
}

# Function to show troubleshooting tips
show_troubleshooting_tips() {
    print_status "warning" "Troubleshooting Tips"
    echo ""
    echo "If validation fails:"
    echo ""
    echo "1. 📋 Check Coolify deployment logs for errors"
    echo "2. 🔍 Verify all environment variables are set correctly"
    echo "3. 🌐 Ensure domains are configured and DNS is propagated"
    echo "4. 🔒 Check SSL certificate status"
    echo "5. 🗄️  Verify database and Redis services are healthy"
    echo "6. 🔧 Review service resource limits and usage"
    echo ""
    echo "Common issues:"
    echo "• Build failures: Check Dockerfile and dependencies"
    echo "• Health check failures: Verify health endpoints"
    echo "• Network issues: Check service networking configuration"
    echo "• Database issues: Verify connection strings and credentials"
    echo ""
    echo "For detailed troubleshooting, see:"
    echo "• .coolify/README.md"
    echo "• .coolify/deployment.md"
    echo "• Coolify documentation"
    echo ""
}

# Main function
main() {
    local frontend_url=""
    local backend_url=""
    local skip_wait=false
    local skip_validation=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --frontend-url)
                frontend_url="$2"
                shift 2
                ;;
            --backend-url)
                backend_url="$2"
                shift 2
                ;;
            --skip-wait)
                skip_wait=true
                shift
                ;;
            --skip-validation)
                skip_validation=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --frontend-url URL    Frontend URL (default: from env or localhost:3000)"
                echo "  --backend-url URL     Backend URL (default: from env or localhost:4000)"
                echo "  --skip-wait          Skip waiting for services to be ready"
                echo "  --skip-validation    Skip running validation checks"
                echo "  --help, -h           Show this help message"
                echo ""
                exit 0
                ;;
            *)
                print_status "error" "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Set default URLs if not provided
    if [[ -z "$frontend_url" ]]; then
        frontend_url=${FRONTEND_URL:-${VITE_API_URL%/api}:-"http://localhost:3000"}
    fi
    
    if [[ -z "$backend_url" ]]; then
        backend_url=${BACKEND_URL:-${VITE_API_URL:-"http://localhost:4000"}}
    fi
    
    # Show deployment instructions
    show_deployment_instructions
    
    # Check for Node.js if validation is not skipped
    if [[ "$skip_validation" != true ]]; then
        if ! check_nodejs; then
            print_status "warning" "Skipping validation due to missing Node.js"
            skip_validation=true
        fi
    fi
    
    # Ask user to confirm deployment was triggered
    echo -n "Have you triggered the deployment in Coolify? (y/N): "
    read -r response
    
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        print_status "info" "Please trigger the deployment in Coolify first, then run this script again"
        exit 0
    fi
    
    # Wait for deployment if not skipped
    if [[ "$skip_wait" != true ]]; then
        wait_for_deployment "$frontend_url" "$backend_url"
    fi
    
    # Run validation if not skipped
    if [[ "$skip_validation" != true ]]; then
        if run_validation "$frontend_url" "$backend_url"; then
            show_post_deployment_steps
        else
            show_troubleshooting_tips
            exit 1
        fi
    else
        print_status "info" "Validation skipped as requested"
        show_post_deployment_steps
    fi
    
    print_status "success" "Deployment and validation process completed!"
}

# Run main function with all arguments
main "$@"