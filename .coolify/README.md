# Coolify Configuration Files

This directory contains all the configuration files needed to deploy the n8n-clone application using Coolify.

## Files Overview

### Configuration Files
- **`project.json`** - Coolify project metadata and basic configuration
- **`environment.json`** - Environment variables schema and documentation
- **`services.json`** - Detailed service definitions and networking configuration
- **`deployment.md`** - Complete step-by-step deployment guide

### Root Configuration
- **`../coolify.yaml`** - Main Docker Compose file optimized for Coolify
- **`../scripts/setup-coolify-project.sh`** - Linux/Mac setup script
- **`../scripts/setup-coolify-project.ps1`** - Windows PowerShell setup script

## Quick Start

### 1. Prepare Configuration
Run the setup script for your platform:

**Linux/Mac:**
```bash
./scripts/setup-coolify-project.sh
```

**Windows PowerShell:**
```powershell
.\scripts\setup-coolify-project.ps1
```

### 2. Push to Git Repository
Ensure all configuration files are committed and pushed to your Git repository.

### 3. Create Coolify Project
1. Log into your Coolify dashboard
2. Create new project named `n8n-clone`
3. Connect your Git repository
4. Set Docker Compose file to `coolify.yaml`

### 4. Configure Environment Variables
Copy the required variables from `.env.coolify.example` to your Coolify project environment settings.

### 5. Deploy Application
Click "Deploy" in Coolify and monitor the deployment process.

## Service Architecture

### Network Configuration
- **Internal Network**: Secure communication between backend, database, and cache
- **External Network**: Public access to frontend and backend services

### Service Dependencies
```
Frontend → Backend → PostgreSQL
                  → Redis
```

### Port Configuration
- **Frontend**: 3000 (public via Coolify proxy)
- **Backend**: 4000 (public via Coolify proxy)
- **PostgreSQL**: 5432 (internal only)
- **Redis**: 6379 (internal only)

## Environment Variables

### Required Variables
These must be set in Coolify before deployment:
- `POSTGRES_PASSWORD` - Database password (generate secure)
- `JWT_SECRET` - Authentication secret (64+ characters)
- `SESSION_SECRET` - Session encryption secret (32+ characters)
- `CORS_ORIGIN` - Frontend domain URL
- `VITE_API_URL` - Backend API URL
- `WEBHOOK_URL` - Webhook base URL

### Optional Variables
These have sensible defaults but can be customized:
- `POSTGRES_DB` - Database name (default: n8n_clone)
- `POSTGRES_USER` - Database user (default: postgres)
- `LOG_LEVEL` - Logging level (default: info)
- `FRONTEND_DOMAIN` - Frontend domain name
- `BACKEND_DOMAIN` - Backend domain name

## Health Checks

All services include comprehensive health monitoring:

### Frontend Health Check
- **Endpoint**: `GET /health`
- **Expected Response**: `200 OK` with "healthy" status

### Backend Health Check
- **Endpoint**: `GET /health`
- **Expected Response**: `200 OK` with system status including:
  - Database connectivity
  - Redis connectivity
  - Service uptime
  - Memory usage

### Database Health Check
- **Command**: `pg_isready -U postgres -d n8n_clone`
- **Expected**: Exit code 0

### Redis Health Check
- **Command**: `redis-cli ping`
- **Expected**: "PONG" response

## Troubleshooting

### Common Issues

#### Build Failures
1. Check Dockerfile syntax in `frontend/` and `backend/` directories
2. Verify all required files are in Git repository
3. Review build logs in Coolify dashboard

#### Service Health Check Failures
1. Verify health check endpoints are implemented
2. Check service startup logs for errors
3. Ensure dependencies are properly configured

#### Network Connectivity Issues
1. Verify service names match Docker Compose configuration
2. Check internal network configuration
3. Review environment variable values

#### Database Connection Issues
1. Verify `POSTGRES_PASSWORD` is set correctly
2. Check database service health status
3. Review database connection logs in backend service

### Debug Access
Access service logs through Coolify dashboard:
1. Navigate to your application
2. Click "Logs" tab
3. Select the service to monitor
4. Review real-time logs for issues

## Security Considerations

### Network Security
- Database and Redis services are not exposed externally
- Only frontend and backend have public access via Coolify proxy
- Internal services communicate via secure Docker network

### Secrets Management
- All sensitive data stored as Coolify environment variables
- Passwords and secrets are not committed to Git repository
- JWT and session secrets use cryptographically secure generation

### SSL Configuration
- Automatic SSL certificate generation via Let's Encrypt
- HTTPS enforcement for all public endpoints
- Secure cookie configuration for sessions

## Performance Optimization

### Resource Limits
Each service has defined resource limits:
- **Frontend**: 256MB RAM, 0.5 CPU
- **Backend**: 1GB RAM, 1.0 CPU
- **PostgreSQL**: 512MB RAM, 0.5 CPU
- **Redis**: 256MB RAM, 0.25 CPU

### Caching Strategy
- Redis used for session storage and application caching
- Static assets cached by Nginx in frontend container
- Database connection pooling in backend service

### Monitoring
- Health checks for all services
- Resource usage monitoring via Coolify
- Application logs centralized through Coolify dashboard

## Domain and SSL Configuration

### Quick Setup
Run the domain and SSL setup script:

**Linux/Mac:**
```bash
chmod +x .coolify/setup-domain-ssl.sh
./.coolify/setup-domain-ssl.sh
```

**Windows PowerShell:**
```powershell
.\.coolify\setup-domain-ssl.ps1
```

### Manual Configuration
1. Set domain environment variables in Coolify
2. Configure DNS records for your domains
3. Enable SSL with Let's Encrypt in Coolify dashboard
4. Deploy and verify SSL certificates

### Validation
Validate your configuration before deployment:
```bash
node .coolify/validate-domain-config.js
```

For detailed domain and SSL setup instructions, see: `DOMAIN_SSL_GUIDE.md`

## Support

For deployment issues:
1. Check the detailed deployment guide: `deployment.md`
2. Review domain and SSL guide: `DOMAIN_SSL_GUIDE.md`
3. Run configuration validation: `validate-domain-config.js`
4. Review Coolify documentation
5. Verify environment configuration
6. Test health endpoints manually

For application-specific issues:
1. Check backend health endpoint for detailed status
2. Review application logs in Coolify dashboard
3. Verify database and Redis connectivity
4. Test API endpoints manually