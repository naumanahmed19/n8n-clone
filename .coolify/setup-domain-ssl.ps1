# Coolify Domain and SSL Setup Script (PowerShell)
# This script configures domain and SSL settings for the n8n-clone application

param(
    [string]$FrontendDomain = $env:FRONTEND_DOMAIN,
    [string]$BackendDomain = $env:BACKEND_DOMAIN,
    [string]$CorsOrigin = $env:CORS_ORIGIN,
    [string]$ViteApiUrl = $env:VITE_API_URL
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

function Test-Environment {
    Write-Status "Checking environment variables..."
    
    $requiredVars = @("FrontendDomain", "BackendDomain", "CorsOrigin", "ViteApiUrl")
    $missingVars = @()
    
    foreach ($var in $requiredVars) {
        $value = Get-Variable -Name $var -ValueOnly -ErrorAction SilentlyContinue
        if ([string]::IsNullOrEmpty($value)) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Error "Missing required environment variables:"
        foreach ($var in $missingVars) {
            Write-Host "  - $var" -ForegroundColor $Red
        }
        Write-Host ""
        Write-Host "Please set these variables in your Coolify project environment configuration."
        Write-Host "Example values:"
        Write-Host "  FRONTEND_DOMAIN=yourdomain.com"
        Write-Host "  BACKEND_DOMAIN=api.yourdomain.com"
        Write-Host "  CORS_ORIGIN=https://yourdomain.com"
        Write-Host "  VITE_API_URL=https://api.yourdomain.com"
        exit 1
    }
    
    Write-Success "All required environment variables are set"
}

function Test-Domains {
    Write-Status "Validating domain configuration..."
    
    # Check if CORS_ORIGIN matches FRONTEND_DOMAIN
    $expectedCors = "https://$FrontendDomain"
    if ($CorsOrigin -ne $expectedCors) {
        Write-Warning "CORS_ORIGIN ($CorsOrigin) doesn't match expected value ($expectedCors)"
    }
    
    # Check if VITE_API_URL matches BACKEND_DOMAIN
    $expectedApiUrl = "https://$BackendDomain"
    if ($ViteApiUrl -ne $expectedApiUrl) {
        Write-Warning "VITE_API_URL ($ViteApiUrl) doesn't match expected value ($expectedApiUrl)"
    }
    
    Write-Success "Domain configuration validated"
}

function New-ServiceConfig {
    Write-Status "Generating Coolify service configuration..."
    
    $serviceConfig = @{
        services = @{
            frontend = @{
                type = "application"
                port = 3000
                domain = $FrontendDomain
                ssl = @{
                    enabled = $true
                    redirect = $true
                    provider = "letsencrypt"
                }
                health_check = "/health"
                environment = @(
                    "VITE_API_URL=$ViteApiUrl",
                    "NGINX_HOST=$FrontendDomain"
                )
            }
            backend = @{
                type = "application"
                port = 4000
                domain = $BackendDomain
                ssl = @{
                    enabled = $true
                    redirect = $true
                    provider = "letsencrypt"
                }
                health_check = "/health"
                environment = @(
                    "CORS_ORIGIN=$CorsOrigin",
                    "FRONTEND_DOMAIN=$FrontendDomain"
                )
            }
        }
    }
    
    $serviceConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath ".coolify/coolify-services.json" -Encoding UTF8
    Write-Success "Service configuration generated"
}

function New-ComposeLabels {
    Write-Status "Updating docker-compose labels for Coolify..."
    
    $labelsConfig = @"
# Coolify Labels for Domain and SSL Configuration
# Add these labels to your services in coolify.yaml

frontend_labels: &frontend_labels
  - "coolify.managed=true"
  - "coolify.type=application"
  - "coolify.name=n8n-clone-frontend"
  - "coolify.port=3000"
  - "coolify.domain=$FrontendDomain"
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
  - "coolify.domain=$BackendDomain"
  - "coolify.ssl=true"
  - "coolify.ssl.redirect=true"
  - "coolify.ssl.provider=letsencrypt"
  - "coolify.health_check=/health"
"@
    
    $labelsConfig | Out-File -FilePath ".coolify/coolify-labels.yml" -Encoding UTF8
    Write-Success "Coolify labels configuration created"
}

function New-NginxConfig {
    Write-Status "Creating production nginx configuration..."
    
    # Read the template and replace variables
    $nginxTemplate = Get-Content ".coolify/nginx-production.conf" -Raw
    $nginxConfigured = $nginxTemplate -replace '\$\{NGINX_HOST\}', $FrontendDomain
    
    $nginxConfigured | Out-File -FilePath ".coolify/nginx-production-configured.conf" -Encoding UTF8
    Write-Success "Nginx configuration created with domain: $FrontendDomain"
}

function New-DeploymentChecklist {
    Write-Status "Generating deployment checklist..."
    
    $checklist = @"
# Domain and SSL Deployment Checklist

## Pre-deployment Steps

- [ ] DNS records configured for domains:
  - [ ] A record: $FrontendDomain → Coolify server IP
  - [ ] A record: $BackendDomain → Coolify server IP
  - [ ] Optional: CNAME record: www.$FrontendDomain → $FrontendDomain

- [ ] Environment variables set in Coolify:
  - [ ] FRONTEND_DOMAIN=$FrontendDomain
  - [ ] BACKEND_DOMAIN=$BackendDomain
  - [ ] CORS_ORIGIN=$CorsOrigin
  - [ ] VITE_API_URL=$ViteApiUrl

## Coolify Configuration

- [ ] Project created in Coolify dashboard
- [ ] Git repository connected
- [ ] Docker Compose file set to: coolify.yaml
- [ ] Environment variables configured
- [ ] Domain settings configured for services:
  - [ ] Frontend: $FrontendDomain
  - [ ] Backend: $BackendDomain

## SSL Configuration

- [ ] SSL enabled for frontend service
- [ ] SSL enabled for backend service
- [ ] HTTP to HTTPS redirect enabled
- [ ] Let's Encrypt certificates configured

## Post-deployment Verification

- [ ] Frontend accessible at: https://$FrontendDomain
- [ ] Backend API accessible at: https://$BackendDomain
- [ ] SSL certificates valid and trusted
- [ ] CORS working correctly
- [ ] Health checks passing:
  - [ ] Frontend: https://$FrontendDomain/health
  - [ ] Backend: https://$BackendDomain/health

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
"@
    
    $checklist | Out-File -FilePath ".coolify/deployment-checklist.md" -Encoding UTF8
    Write-Success "Deployment checklist created"
}

# Main execution
function Main {
    Write-Host "🔧 Coolify Domain and SSL Configuration Setup" -ForegroundColor $Blue
    Write-Host "==============================================`n"
    
    # Only validate if we're not in a CI environment
    if (-not $env:CI) {
        Test-Environment
        Test-Domains
    } else {
        Write-Status "Running in CI environment, skipping environment validation"
    }
    
    New-ServiceConfig
    New-ComposeLabels
    New-NginxConfig
    New-DeploymentChecklist
    
    Write-Host ""
    Write-Success "Domain and SSL configuration setup complete!"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Review the generated configuration files in .coolify/"
    Write-Host "2. Configure DNS records for your domains"
    Write-Host "3. Set environment variables in Coolify dashboard"
    Write-Host "4. Deploy your application"
    Write-Host "5. Follow the deployment checklist in .coolify/deployment-checklist.md"
    Write-Host ""
    Write-Host "Configuration files created:"
    Write-Host "  - .coolify/coolify-services.json"
    Write-Host "  - .coolify/coolify-labels.yml"
    Write-Host "  - .coolify/nginx-production-configured.conf"
    Write-Host "  - .coolify/deployment-checklist.md"
}

# Run main function
Main