# Coolify Project Setup Script (PowerShell)
# This script helps configure the n8n-clone project in Coolify

param(
    [switch]$SkipValidation,
    [string]$ProjectName = "n8n-clone",
    [string]$ComposeFile = "coolify.yaml"
)

$ErrorActionPreference = "Stop"

# Configuration
$ConfigFiles = @(
    ".coolify/project.json",
    ".coolify/environment.json", 
    ".coolify/services.json",
    ".coolify/deployment.md",
    "coolify.yaml"
)

Write-Host "Coolify Project Setup for n8n-clone" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

# Check if Coolify configuration files exist
function Test-CoolifyConfig {
    Write-Info "Checking Coolify configuration files..."
    
    $missingFiles = @()
    
    foreach ($file in $ConfigFiles) {
        if (-not (Test-Path $file)) {
            $missingFiles += $file
        }
    }
    
    if ($missingFiles.Count -gt 0) {
        Write-Error "Missing Coolify configuration files:"
        foreach ($file in $missingFiles) {
            Write-Host "   - $file" -ForegroundColor Red
        }
        exit 1
    }
    
    Write-Status "All Coolify configuration files are present"
}

# Validate Docker Compose configuration
function Test-ComposeConfiguration {
    Write-Info "Validating Docker Compose configuration..."
    
    if (-not (Test-Path $ComposeFile)) {
        Write-Error "Docker Compose file '$ComposeFile' not found"
        exit 1
    }
    
    # Check if docker-compose is available for validation
    if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
        try {
            $null = docker-compose -f $ComposeFile config 2>$null
            Write-Status "Docker Compose configuration is valid"
        }
        catch {
            Write-Error "Docker Compose configuration has errors"
            docker-compose -f $ComposeFile config
            exit 1
        }
    }
    else {
        Write-Warning "docker-compose not available for validation"
    }
}

# Generate environment template
function New-EnvironmentTemplate {
    Write-Info "Generating environment variable template..."
    
    $envFile = ".env.coolify.example"
    
    $envContent = @'
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
'@

    Set-Content -Path $envFile -Value $envContent -Encoding UTF8
    Write-Status "Created environment template: $envFile"
}

# Display project configuration summary
function Show-ProjectSummary {
    Write-Host ""
    Write-Info "Project Configuration Summary"
    Write-Host "=============================="
    Write-Host ""
    Write-Host "Project Name: $ProjectName"
    Write-Host "Compose File: $ComposeFile"
    Write-Host "Services:"
    Write-Host "   - Frontend (React + Nginx) - Port 3000"
    Write-Host "   - Backend (Node.js + Express) - Port 4000"
    Write-Host "   - PostgreSQL Database - Internal only"
    Write-Host "   - Redis Cache - Internal only"
    Write-Host ""
    Write-Host "Networks:"
    Write-Host "   - Internal: postgres, redis, backend (secure)"
    Write-Host "   - External: frontend, backend (public access)"
    Write-Host ""
    Write-Host "Persistent Volumes:"
    Write-Host "   - postgres_data: Database storage"
    Write-Host "   - redis_data: Cache storage"
    Write-Host ""
}

# Display Coolify setup instructions
function Show-CoolifyInstructions {
    Write-Host ""
    Write-Info "Coolify Dashboard Setup Instructions"
    Write-Host "===================================="
    Write-Host ""
    Write-Host "1. Create New Project:"
    Write-Host "   - Name: $ProjectName"
    Write-Host "   - Type: Docker Compose Application"
    Write-Host "   - Server: Select your target server"
    Write-Host ""
    Write-Host "2. Configure Repository:"
    Write-Host "   - Repository URL: Your Git repository URL"
    Write-Host "   - Branch: main (or your production branch)"
    Write-Host "   - Auto Deploy: Enable"
    Write-Host "   - Compose File: $ComposeFile"
    Write-Host ""
    Write-Host "3. Set Environment Variables:"
    Write-Host "   - Copy variables from .env.coolify.example"
    Write-Host "   - Generate secure passwords and secrets"
    Write-Host "   - Update domain names to match your setup"
    Write-Host ""
    Write-Host "4. Configure Domains:"
    Write-Host "   - Frontend: Set primary domain with SSL"
    Write-Host "   - Backend: Set API domain with SSL"
    Write-Host "   - Enable automatic certificate generation"
    Write-Host ""
    Write-Host "5. Deploy Application:"
    Write-Host "   - Click Deploy in Coolify dashboard"
    Write-Host "   - Monitor build logs for issues"
    Write-Host "   - Wait for all services to become healthy"
    Write-Host ""
}

# Display post-deployment verification steps
function Show-VerificationSteps {
    Write-Host ""
    Write-Info "Post-Deployment Verification"
    Write-Host "============================"
    Write-Host ""
    Write-Host "1. Service Health Checks:"
    Write-Host "   - Frontend: https://yourdomain.com/health"
    Write-Host "   - Backend: https://api.yourdomain.com/health"
    Write-Host ""
    Write-Host "2. Monitor Service Logs:"
    Write-Host "   - Check Coolify dashboard logs tab"
    Write-Host "   - Verify all services are running"
    Write-Host "   - Look for any error messages"
    Write-Host ""
    Write-Host "3. Test Application:"
    Write-Host "   - Access frontend application"
    Write-Host "   - Test user registration/login"
    Write-Host "   - Create and execute a simple workflow"
    Write-Host ""
    Write-Host "4. Monitor Performance:"
    Write-Host "   - Check resource usage in Coolify"
    Write-Host "   - Monitor response times"
    Write-Host "   - Verify database connectivity"
    Write-Host ""
}

# Main execution
function Main {
    try {
        # Run validation steps
        if (-not $SkipValidation) {
            Test-CoolifyConfig
            Test-ComposeConfiguration
        }
        
        New-EnvironmentTemplate
        
        # Display information
        Show-ProjectSummary
        Show-CoolifyInstructions
        Show-VerificationSteps
        
        Write-Host ""
        Write-Status "Coolify project setup configuration complete!"
        Write-Host ""
        Write-Info "Next Steps:"
        Write-Host "1. Push your code to Git repository"
        Write-Host "2. Follow the Coolify dashboard instructions above"
        Write-Host "3. Set environment variables from .env.coolify.example"
        Write-Host "4. Deploy and monitor the application"
        Write-Host ""
        Write-Info "For detailed instructions, see: .coolify/deployment.md"
    }
    catch {
        Write-Error "Setup failed: $_"
        exit 1
    }
}

# Run main function
Main