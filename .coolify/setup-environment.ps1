# Coolify Environment Setup Script (PowerShell)
# This script helps configure environment variables for Coolify deployment

param(
    [string]$Environment = "production"
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Write-Host "🚀 Coolify Environment Setup for n8n-clone" -ForegroundColor Blue
Write-Host "Environment: $Environment" -ForegroundColor Blue
Write-Host ""

# Function to generate secure random string
function Generate-Secret {
    param(
        [int]$Length = 32,
        [string]$Charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    )
    
    $Random = New-Object System.Random
    $Result = ""
    for ($i = 0; $i -lt $Length; $i++) {
        $Result += $Charset[$Random.Next(0, $Charset.Length)]
    }
    return $Result
}

# Function to generate password with special characters
function Generate-Password {
    param([int]$Length = 32)
    
    $Charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-="
    return Generate-Secret -Length $Length -Charset $Charset
}

# Function to generate hex string
function Generate-HexSecret {
    param([int]$Length = 32)
    
    $Charset = "0123456789ABCDEF"
    return Generate-Secret -Length $Length -Charset $Charset
}

# Function to validate domain
function Test-Domain {
    param([string]$Domain)
    
    return $Domain -match "^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$"
}

# Function to prompt for input with validation
function Read-ValidatedInput {
    param(
        [string]$Prompt,
        [string]$Default = "",
        [scriptblock]$Validator = $null
    )
    
    do {
        if ($Default) {
            $Input = Read-Host "$Prompt [$Default]"
            if ([string]::IsNullOrEmpty($Input)) { $Input = $Default }
        } else {
            $Input = Read-Host $Prompt
        }
        
        if ($Validator -eq $null -or (& $Validator $Input)) {
            return $Input
        } else {
            Write-Host "Invalid input. Please try again." -ForegroundColor Red
        }
    } while ($true)
}

Write-Host "📋 Environment Configuration" -ForegroundColor Yellow
Write-Host ""

# Get domain configuration
Write-Host "Domain Configuration:" -ForegroundColor Blue
$FrontendDomain = Read-ValidatedInput -Prompt "Frontend domain (e.g., yourdomain.com)" -Validator { param($d) Test-Domain $d }
$BackendDomain = Read-ValidatedInput -Prompt "Backend API domain (e.g., api.yourdomain.com)" -Default "api.$FrontendDomain" -Validator { param($d) Test-Domain $d }

# Generate secrets
Write-Host ""
Write-Host "🔐 Generating Secrets..." -ForegroundColor Yellow

$PostgresPassword = Generate-Password -Length 32
$JwtSecret = Generate-Secret -Length 64
$SessionSecret = Generate-Secret -Length 32
$EncryptionKey = Generate-HexSecret -Length 32
$WebhookSigningSecret = Generate-Secret -Length 48

Write-Host "✅ Secrets generated successfully" -ForegroundColor Green

# Create environment file
$EnvFile = Join-Path $ScriptDir ".env.coolify.$Environment.generated"

Write-Host ""
Write-Host "📝 Creating environment configuration..." -ForegroundColor Yellow

$DatabaseSuffix = if ($Environment -ne "production") { "_$Environment" } else { "" }
$RedisSuffix = if ($Environment -ne "production") { "/1" } else { "" }
$LogLevel = if ($Environment -eq "production") { "info" } else { "debug" }
$JwtExpires = if ($Environment -eq "production") { "7d" } else { "24h" }
$BcryptRounds = if ($Environment -eq "production") { "12" } else { "10" }
$SameSite = if ($Environment -eq "production") { "strict" } else { "lax" }
$ProjectSuffix = if ($Environment -ne "production") { "-$Environment" } else { "" }

$EnvContent = @"
# Generated Coolify Environment Configuration
# Environment: $Environment
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC")

# =============================================================================
# DOMAIN CONFIGURATION
# =============================================================================
FRONTEND_DOMAIN=$FrontendDomain
BACKEND_DOMAIN=$BackendDomain
CORS_ORIGIN=https://$FrontendDomain
VITE_API_URL=https://$BackendDomain
WEBHOOK_URL=https://$FrontendDomain

# =============================================================================
# GENERATED SECRETS (Copy to Coolify Secrets Management)
# =============================================================================
POSTGRES_PASSWORD=$PostgresPassword
JWT_SECRET=$JwtSecret
SESSION_SECRET=$SessionSecret
ENCRYPTION_KEY=$EncryptionKey
WEBHOOK_SIGNING_SECRET=$WebhookSigningSecret

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
POSTGRES_DB=n8n_clone$DatabaseSuffix
POSTGRES_USER=postgres
DATABASE_URL=postgresql://`${POSTGRES_USER}:`${POSTGRES_PASSWORD}@postgres:5432/`${POSTGRES_DB}

# =============================================================================
# REDIS CONFIGURATION
# =============================================================================
REDIS_URL=redis://redis:6379$RedisSuffix

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================
NODE_ENV=$Environment
LOG_LEVEL=$LogLevel
PORT=4000
FRONTEND_PORT=3000

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
JWT_EXPIRES_IN=$JwtExpires
BCRYPT_ROUNDS=$BcryptRounds
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTP_ONLY=true
SESSION_COOKIE_SAME_SITE=$SameSite

# =============================================================================
# COOLIFY CONFIGURATION
# =============================================================================
COOLIFY_PROJECT_NAME=n8n-clone$ProjectSuffix
COOLIFY_ENVIRONMENT=$Environment
COOLIFY_AUTO_DEPLOY=true
COOLIFY_SSL_ENABLED=true
COOLIFY_SSL_REDIRECT=true
"@

$EnvContent | Out-File -FilePath $EnvFile -Encoding UTF8
Write-Host "✅ Environment file created: $EnvFile" -ForegroundColor Green

# Create Coolify import JSON
$ImportFile = Join-Path $ScriptDir "coolify-import-$Environment.json"

$ImportContent = @{
    project_name = "n8n-clone$ProjectSuffix"
    environment = $Environment
    secrets = @{
        POSTGRES_PASSWORD = $PostgresPassword
        JWT_SECRET = $JwtSecret
        SESSION_SECRET = $SessionSecret
        ENCRYPTION_KEY = $EncryptionKey
        WEBHOOK_SIGNING_SECRET = $WebhookSigningSecret
    }
    environment_variables = @{
        FRONTEND_DOMAIN = $FrontendDomain
        BACKEND_DOMAIN = $BackendDomain
        CORS_ORIGIN = "https://$FrontendDomain"
        VITE_API_URL = "https://$BackendDomain"
        WEBHOOK_URL = "https://$FrontendDomain"
        POSTGRES_DB = "n8n_clone$DatabaseSuffix"
        POSTGRES_USER = "postgres"
        NODE_ENV = $Environment
        LOG_LEVEL = $LogLevel
        PORT = "4000"
        FRONTEND_PORT = "3000"
    }
    computed_variables = @{
        DATABASE_URL = "postgresql://`${POSTGRES_USER}:`${POSTGRES_PASSWORD}@postgres:5432/`${POSTGRES_DB}"
        REDIS_URL = "redis://redis:6379$RedisSuffix"
    }
}

$ImportContent | ConvertTo-Json -Depth 10 | Out-File -FilePath $ImportFile -Encoding UTF8
Write-Host "✅ Coolify import file created: $ImportFile" -ForegroundColor Green

# Create setup instructions
$InstructionsFile = Join-Path $ScriptDir "coolify-setup-instructions-$Environment.md"

$InstructionsContent = @"
# Coolify Setup Instructions - $Environment

## 1. Create Project in Coolify

1. Log into your Coolify dashboard
2. Create a new project: ``n8n-clone$ProjectSuffix``
3. Connect your Git repository

## 2. Configure Secrets

Add the following secrets in Coolify Secrets Management:

``````
POSTGRES_PASSWORD: $PostgresPassword
JWT_SECRET: $JwtSecret
SESSION_SECRET: $SessionSecret
ENCRYPTION_KEY: $EncryptionKey
WEBHOOK_SIGNING_SECRET: $WebhookSigningSecret
``````

## 3. Configure Environment Variables

Add the following environment variables in Coolify:

``````
FRONTEND_DOMAIN: $FrontendDomain
BACKEND_DOMAIN: $BackendDomain
CORS_ORIGIN: https://$FrontendDomain
VITE_API_URL: https://$BackendDomain
WEBHOOK_URL: https://$FrontendDomain
POSTGRES_DB: n8n_clone$DatabaseSuffix
POSTGRES_USER: postgres
NODE_ENV: $Environment
LOG_LEVEL: $LogLevel
PORT: 4000
FRONTEND_PORT: 3000
``````

## 4. Configure Computed Variables

These will be automatically computed by Coolify:

``````
DATABASE_URL: postgresql://`${POSTGRES_USER}:`${POSTGRES_PASSWORD}@postgres:5432/`${POSTGRES_DB}
REDIS_URL: redis://redis:6379$RedisSuffix
``````

## 5. Deploy Services

1. Deploy in this order:
   - PostgreSQL database
   - Redis cache
   - Backend API
   - Frontend application

2. Configure domains:
   - Frontend: $FrontendDomain
   - Backend: $BackendDomain

3. Enable SSL certificates for both domains

## 6. Verify Deployment

1. Check health endpoints:
   - Frontend: https://$FrontendDomain/health
   - Backend: https://$BackendDomain/health

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

- Environment file: ``.env.coolify.$Environment.generated``
- Import file: ``coolify-import-$Environment.json``
- Instructions: ``coolify-setup-instructions-$Environment.md``
"@

$InstructionsContent | Out-File -FilePath $InstructionsFile -Encoding UTF8
Write-Host "✅ Setup instructions created: $InstructionsFile" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Environment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review the generated files in $ScriptDir\"
Write-Host "2. Follow the instructions in $InstructionsFile"
Write-Host "3. Import the configuration into Coolify"
Write-Host "4. Deploy your services"
Write-Host ""
Write-Host "Generated files:" -ForegroundColor Blue
Write-Host "- $EnvFile"
Write-Host "- $ImportFile"
Write-Host "- $InstructionsFile"
Write-Host ""
Write-Host "⚠️  Security Notice:" -ForegroundColor Red
Write-Host "Keep the generated secrets secure and do not commit them to version control!"