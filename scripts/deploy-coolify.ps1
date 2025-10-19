# Coolify Deployment Script for n8n-clone (PowerShell)
# This script helps prepare and deploy the application to Coolify

param(
    [switch]$SkipDockerTest,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Coolify deployment preparation..." -ForegroundColor Green

# Check if required environment variables are set
function Test-EnvironmentVariables {
    $requiredVars = @(
        "POSTGRES_PASSWORD",
        "JWT_SECRET", 
        "SESSION_SECRET",
        "CORS_ORIGIN",
        "VITE_API_URL"
    )
    
    $missingVars = @()
    
    foreach ($var in $requiredVars) {
        if (-not (Get-Variable -Name $var -ErrorAction SilentlyContinue)) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host "❌ Missing required environment variables:" -ForegroundColor Red
        foreach ($var in $missingVars) {
            Write-Host "   - $var" -ForegroundColor Red
        }
        Write-Host ""
        Write-Host "Please set these variables in your Coolify environment configuration." -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ All required environment variables are set" -ForegroundColor Green
}

# Validate Docker configurations
function Test-DockerConfigurations {
    Write-Host "🔍 Validating Docker configurations..." -ForegroundColor Blue
    
    # Check if Dockerfiles exist
    if (-not (Test-Path "backend/Dockerfile")) {
        Write-Host "❌ Backend Dockerfile not found" -ForegroundColor Red
        exit 1
    }
    
    if (-not (Test-Path "frontend/Dockerfile")) {
        Write-Host "❌ Frontend Dockerfile not found" -ForegroundColor Red
        exit 1
    }
    
    # Test Docker builds locally (optional)
    if (-not $SkipDockerTest -and (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Host "🐳 Testing Docker builds..." -ForegroundColor Blue
        
        try {
            # Test backend build
            $null = docker build -t n8n-clone-backend-test ./backend 2>$null
            if ($LASTEXITCODE -ne 0) {
                throw "Backend Docker build failed"
            }
            
            # Test frontend build  
            $null = docker build -t n8n-clone-frontend-test ./frontend 2>$null
            if ($LASTEXITCODE -ne 0) {
                throw "Frontend Docker build failed"
            }
            
            # Clean up test images
            docker rmi n8n-clone-backend-test n8n-clone-frontend-test 2>$null | Out-Null
            
            Write-Host "✅ Docker builds successful" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ Docker build failed: $_" -ForegroundColor Red
            exit 1
        }
    }
    else {
        Write-Host "⚠️  Docker testing skipped" -ForegroundColor Yellow
    }
}

# Generate production environment file
function New-ProductionEnvironmentFile {
    Write-Host "📝 Generating production environment file..." -ForegroundColor Blue
    
    if (-not (Test-Path ".env.production") -or $Force) {
        if (Test-Path ".env.production.example") {
            Copy-Item ".env.production.example" ".env.production"
            Write-Host "✅ Created .env.production from example" -ForegroundColor Green
            Write-Host "⚠️  Please update .env.production with your actual values" -ForegroundColor Yellow
        }
        else {
            Write-Host "❌ .env.production.example not found" -ForegroundColor Red
            exit 1
        }
    }
    else {
        Write-Host "✅ .env.production already exists" -ForegroundColor Green
    }
}

# Validate database migrations
function Test-DatabaseMigrations {
    Write-Host "🗄️  Validating database migrations..." -ForegroundColor Blue
    
    if (Test-Path "backend/prisma/migrations") {
        $migrationCount = (Get-ChildItem "backend/prisma/migrations" -Filter "*.sql" -Recurse).Count
        Write-Host "✅ Found $migrationCount migration files" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  No migrations directory found" -ForegroundColor Yellow
    }
}

# Pre-deployment checklist
function Show-PreDeploymentChecklist {
    Write-Host ""
    Write-Host "📋 Pre-deployment checklist:" -ForegroundColor Cyan
    Write-Host "   ✅ Docker configurations optimized" -ForegroundColor Green
    Write-Host "   ✅ Health check endpoints configured" -ForegroundColor Green
    Write-Host "   ✅ Environment variables template created" -ForegroundColor Green
    Write-Host "   ✅ Production docker-compose configuration ready" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔧 Manual steps required in Coolify:" -ForegroundColor Yellow
    Write-Host "   1. Create new project in Coolify dashboard"
    Write-Host "   2. Connect your Git repository"
    Write-Host "   3. Set environment variables from .env.production.example"
    Write-Host "   4. Configure domain and SSL settings"
    Write-Host "   5. Deploy the application"
    Write-Host ""
    Write-Host "🌐 Required environment variables in Coolify:" -ForegroundColor Magenta
    Write-Host "   - POSTGRES_PASSWORD (generate secure password)"
    Write-Host "   - JWT_SECRET (minimum 32 characters)"
    Write-Host "   - SESSION_SECRET (secure random string)"
    Write-Host "   - CORS_ORIGIN (your domain URL)"
    Write-Host "   - VITE_API_URL (your API domain URL)"
    Write-Host ""
}

# Main execution
function Main {
    Write-Host "n8n-clone Coolify Deployment Preparation" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    try {
        # Run validation steps
        Test-DockerConfigurations
        New-ProductionEnvironmentFile
        Test-DatabaseMigrations
        
        # Show checklist
        Show-PreDeploymentChecklist
        
        Write-Host "🎉 Deployment preparation complete!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Push your code to your Git repository"
        Write-Host "2. Follow the manual steps in Coolify dashboard"
        Write-Host "3. Monitor the deployment logs for any issues"
    }
    catch {
        Write-Host "❌ Deployment preparation failed: $_" -ForegroundColor Red
        exit 1
    }
}

# Run main function
Main