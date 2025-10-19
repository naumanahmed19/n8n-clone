# Deploy and Validate Script for Coolify (PowerShell)
# This script provides instructions for triggering deployment and runs validation

param(
    [string]$FrontendUrl = "",
    [string]$BackendUrl = "",
    [switch]$SkipWait = $false,
    [switch]$SkipValidation = $false,
    [switch]$Help = $false
)

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$ValidationScript = Join-Path $ScriptDir "validate-deployment.js"

Write-Host "🚀 Coolify Deployment and Validation" -ForegroundColor $Colors.Blue
Write-Host "=====================================" -ForegroundColor $Colors.Blue
Write-Host ""

# Function to print colored output
function Write-Status {
    param(
        [string]$Status,
        [string]$Message
    )
    
    switch ($Status) {
        "info" {
            Write-Host "ℹ️  $Message" -ForegroundColor $Colors.Blue
        }
        "success" {
            Write-Host "✅ $Message" -ForegroundColor $Colors.Green
        }
        "warning" {
            Write-Host "⚠️  $Message" -ForegroundColor $Colors.Yellow
        }
        "error" {
            Write-Host "❌ $Message" -ForegroundColor $Colors.Red
        }
    }
}

# Function to show help
function Show-Help {
    Write-Host "Usage: .\deploy-and-validate.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -FrontendUrl URL      Frontend URL (default: from env or localhost:3000)"
    Write-Host "  -BackendUrl URL       Backend URL (default: from env or localhost:4000)"
    Write-Host "  -SkipWait            Skip waiting for services to be ready"
    Write-Host "  -SkipValidation      Skip running validation checks"
    Write-Host "  -Help                Show this help message"
    Write-Host ""
}

# Function to check if Node.js is available
function Test-NodeJS {
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Status "success" "Node.js found: $nodeVersion"
            return $true
        }
    }
    catch {
        # Node.js not found
    }
    
    Write-Status "error" "Node.js is not installed or not in PATH"
    Write-Status "info" "Please install Node.js to run validation scripts"
    return $false
}

# Function to display deployment instructions
function Show-DeploymentInstructions {
    Write-Status "info" "Coolify Deployment Instructions"
    Write-Host ""
    Write-Host "To trigger deployment in Coolify:"
    Write-Host ""
    Write-Host "1. 📋 Ensure all code is committed and pushed to your Git repository"
    Write-Host "2. 🌐 Log into your Coolify dashboard"
    Write-Host "3. 📁 Navigate to your n8n-clone project"
    Write-Host "4. 🔄 Click 'Deploy' or 'Redeploy' button"
    Write-Host "5. 📊 Monitor deployment logs in real-time"
    Write-Host ""
    Write-Host "Alternative deployment triggers:"
    Write-Host "• Git webhook (automatic on push to main branch)"
    Write-Host "• API endpoint (if configured)"
    Write-Host "• Scheduled deployment (if configured)"
    Write-Host ""
    Write-Status "warning" "This script cannot directly trigger Coolify deployment"
    Write-Status "info" "Coolify deployments must be triggered through the dashboard or webhooks"
    Write-Host ""
}

# Function to wait for deployment
function Wait-ForDeployment {
    param(
        [string]$FrontendUrl = "http://localhost:3000",
        [string]$BackendUrl = "http://localhost:4000",
        [int]$MaxWait = 300  # 5 minutes default
    )
    
    $CheckInterval = 10
    $Elapsed = 0
    
    Write-Status "info" "Waiting for services to become available..."
    Write-Status "info" "Frontend URL: $FrontendUrl"
    Write-Status "info" "Backend URL: $BackendUrl"
    Write-Status "info" "Maximum wait time: ${MaxWait}s"
    Write-Host ""
    
    while ($Elapsed -lt $MaxWait) {
        Write-Host "⏳ Checking services... (${Elapsed}s/${MaxWait}s) " -NoNewline
        
        try {
            # Check if backend health endpoint is responding
            $response = Invoke-WebRequest -Uri "$BackendUrl/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host ""
                Write-Status "success" "Backend service is responding!"
                return $true
            }
        }
        catch {
            # Service not ready yet
        }
        
        Write-Host "not ready"
        Start-Sleep -Seconds $CheckInterval
        $Elapsed += $CheckInterval
    }
    
    Write-Host ""
    Write-Status "warning" "Services did not become available within ${MaxWait}s"
    Write-Status "info" "Proceeding with validation anyway..."
    return $false
}

# Function to run validation
function Invoke-Validation {
    param(
        [string]$FrontendUrl,
        [string]$BackendUrl
    )
    
    Write-Status "info" "Running deployment validation..."
    Write-Host ""
    
    # Set environment variables for validation script
    $env:FRONTEND_URL = $FrontendUrl
    $env:BACKEND_URL = $BackendUrl
    $env:VALIDATION_TIMEOUT = "30000"
    $env:VALIDATION_RETRIES = "3"
    $env:VALIDATION_RETRY_DELAY = "5000"
    
    # Run the validation script
    try {
        $result = & node $ValidationScript
        if ($LASTEXITCODE -eq 0) {
            Write-Status "success" "Deployment validation completed successfully!"
            return $true
        }
        else {
            Write-Status "error" "Deployment validation failed!"
            return $false
        }
    }
    catch {
        Write-Status "error" "Failed to run validation script: $($_.Exception.Message)"
        return $false
    }
}

# Function to show post-deployment steps
function Show-PostDeploymentSteps {
    Write-Host ""
    Write-Status "info" "Post-Deployment Steps"
    Write-Host ""
    Write-Host "1. 🔍 Review validation results above"
    Write-Host "2. 🌐 Test your application manually in a browser"
    Write-Host "3. 📊 Monitor application logs in Coolify dashboard"
    Write-Host "4. 🔧 Set up monitoring and alerting (if not already configured)"
    Write-Host "5. 📝 Update DNS records if using custom domains"
    Write-Host "6. 🔒 Verify SSL certificates are working correctly"
    Write-Host ""
    Write-Host "Useful Coolify dashboard sections:"
    Write-Host "• Logs: Monitor real-time application logs"
    Write-Host "• Metrics: View resource usage and performance"
    Write-Host "• Environment: Manage environment variables"
    Write-Host "• Deployments: View deployment history and status"
    Write-Host ""
}

# Function to show troubleshooting tips
function Show-TroubleshootingTips {
    Write-Status "warning" "Troubleshooting Tips"
    Write-Host ""
    Write-Host "If validation fails:"
    Write-Host ""
    Write-Host "1. 📋 Check Coolify deployment logs for errors"
    Write-Host "2. 🔍 Verify all environment variables are set correctly"
    Write-Host "3. 🌐 Ensure domains are configured and DNS is propagated"
    Write-Host "4. 🔒 Check SSL certificate status"
    Write-Host "5. 🗄️  Verify database and Redis services are healthy"
    Write-Host "6. 🔧 Review service resource limits and usage"
    Write-Host ""
    Write-Host "Common issues:"
    Write-Host "• Build failures: Check Dockerfile and dependencies"
    Write-Host "• Health check failures: Verify health endpoints"
    Write-Host "• Network issues: Check service networking configuration"
    Write-Host "• Database issues: Verify connection strings and credentials"
    Write-Host ""
    Write-Host "For detailed troubleshooting, see:"
    Write-Host "• .coolify\README.md"
    Write-Host "• .coolify\deployment.md"
    Write-Host "• Coolify documentation"
    Write-Host ""
}

# Main function
function Main {
    # Show help if requested
    if ($Help) {
        Show-Help
        return
    }
    
    # Set default URLs if not provided
    if (-not $FrontendUrl) {
        $FrontendUrl = $env:FRONTEND_URL
        if (-not $FrontendUrl) {
            $apiUrl = $env:VITE_API_URL
            if ($apiUrl) {
                $FrontendUrl = $apiUrl -replace '/api$', ''
            }
            else {
                $FrontendUrl = "http://localhost:3000"
            }
        }
    }
    
    if (-not $BackendUrl) {
        $BackendUrl = $env:BACKEND_URL
        if (-not $BackendUrl) {
            $BackendUrl = $env:VITE_API_URL
            if (-not $BackendUrl) {
                $BackendUrl = "http://localhost:4000"
            }
        }
    }
    
    # Show deployment instructions
    Show-DeploymentInstructions
    
    # Check for Node.js if validation is not skipped
    if (-not $SkipValidation) {
        if (-not (Test-NodeJS)) {
            Write-Status "warning" "Skipping validation due to missing Node.js"
            $SkipValidation = $true
        }
    }
    
    # Ask user to confirm deployment was triggered
    $response = Read-Host "Have you triggered the deployment in Coolify? (y/N)"
    
    if ($response -notmatch '^[Yy]$') {
        Write-Status "info" "Please trigger the deployment in Coolify first, then run this script again"
        return
    }
    
    # Wait for deployment if not skipped
    if (-not $SkipWait) {
        Wait-ForDeployment -FrontendUrl $FrontendUrl -BackendUrl $BackendUrl | Out-Null
    }
    
    # Run validation if not skipped
    if (-not $SkipValidation) {
        if (Invoke-Validation -FrontendUrl $FrontendUrl -BackendUrl $BackendUrl) {
            Show-PostDeploymentSteps
        }
        else {
            Show-TroubleshootingTips
            exit 1
        }
    }
    else {
        Write-Status "info" "Validation skipped as requested"
        Show-PostDeploymentSteps
    }
    
    Write-Status "success" "Deployment and validation process completed!"
}

# Run main function
Main