# Coolify Project Setup Guide

This guide provides step-by-step instructions for setting up the n8n-clone project in Coolify.

## 1. Create New Project in Coolify Dashboard

### Access Coolify Dashboard
1. Log into your Coolify instance
2. Navigate to the main dashboard
3. Click "New Project" button

### Project Configuration
- **Project Name**: `n8n-clone`
- **Description**: `Workflow automation platform with visual workflow builder`
- **Environment**: `production`
- **Server**: Select your target server/destination

## 2. Configure Git Repository Connection

### Repository Setup
1. In your new project, click "New Resource" → "Application"
2. Choose repository type:
   - **Public Repository**: Enter your repository URL directly
   - **Private Repository**: Connect your Git provider (GitHub, GitLab, etc.)

### Repository Configuration
- **Repository URL**: `https://github.com/your-username/n8n-clone.git`
- **Branch**: `main` (or your production branch)
- **Build Pack**: `Docker Compose`
- **Docker Compose File**: `docker-compose.prod.yml`
- **Auto Deploy**: Enable for automatic deployments on push

### Build Configuration
- **Build Command**: Not required (handled by Docker Compose)
- **Install Command**: Not required (handled by Dockerfiles)
- **Start Command**: Not required (handled by Docker Compose)

## 3. Service Definitions Configuration

### Frontend Service
1. **Service Name**: `n8n-clone-frontend`
2. **Type**: Application
3. **Port**: `3000`
4. **Health Check**: `/health`
5. **Domain Configuration**:
   - Primary domain: Your frontend domain (e.g., `yourdomain.com`)
   - SSL: Enable automatic SSL certificates
   - Redirect WWW: Enable if desired

### Backend Service  
1. **Service Name**: `n8n-clone-backend`
2. **Type**: Application
3. **Port**: `4000`
4. **Health Check**: `/health`
5. **Domain Configuration**:
   - Primary domain: Your API domain (e.g., `api.yourdomain.com`)
   - SSL: Enable automatic SSL certificates

### PostgreSQL Service
1. **Service Name**: `n8n-clone-postgres`
2. **Type**: Database
3. **Image**: `postgres:15-alpine`
4. **Internal Only**: Yes (not exposed externally)
5. **Persistent Storage**: Enable with volume mount
6. **Health Check**: `pg_isready` command

### Redis Service
1. **Service Name**: `n8n-clone-redis`
2. **Type**: Cache
3. **Image**: `redis:7-alpine`
4. **Internal Only**: Yes (not exposed externally)
5. **Persistent Storage**: Enable with volume mount
6. **Health Check**: `redis-cli ping` command

## 4. Internal Docker Networking Configuration

### Network Architecture
The application uses two Docker networks:

#### Internal Network (`n8n-clone-internal`)
- **Purpose**: Secure communication between backend, database, and cache
- **Type**: Bridge network with internal flag
- **Services**: backend, postgres, redis
- **External Access**: None (completely isolated)

#### External Network (`n8n-clone-external`)  
- **Purpose**: Public access to frontend and backend services
- **Type**: Bridge network
- **Services**: frontend, backend
- **External Access**: Via Coolify reverse proxy

### Service Network Assignments
- **Frontend**: External network only
- **Backend**: Both internal and external networks
- **PostgreSQL**: Internal network only
- **Redis**: Internal network only

### Internal Service Communication
Services communicate using Docker service names:
- **Database URL**: `postgresql://postgres:password@postgres:5432/n8n_clone`
- **Redis URL**: `redis://redis:6379`
- **Backend API**: `http://backend:4000` (internal)

## 5. Environment Variables Setup

### Required Variables (Set in Coolify)
```env
# Database Configuration
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=n8n_clone
POSTGRES_USER=postgres

# Authentication Secrets
JWT_SECRET=your_very_secure_jwt_secret_minimum_32_chars
SESSION_SECRET=your_secure_session_secret_here

# Domain Configuration  
CORS_ORIGIN=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com
WEBHOOK_URL=https://yourdomain.com
FRONTEND_DOMAIN=yourdomain.com
BACKEND_DOMAIN=api.yourdomain.com

# Optional Configuration
LOG_LEVEL=info
NGINX_HOST=yourdomain.com
```

### Auto-Generated Variables (Handled by Coolify)
```env
# Internal service URLs
DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/n8n_clone
REDIS_URL=redis://redis:6379

# Application Configuration
NODE_ENV=production
PORT=4000
```

## 6. Deployment Process

### Initial Deployment
1. **Verify Configuration**: Ensure all environment variables are set
2. **Trigger Deployment**: Click "Deploy" in Coolify dashboard
3. **Monitor Build**: Watch build logs for any issues
4. **Health Checks**: Wait for all services to become healthy

### Service Startup Order
1. **PostgreSQL**: Database starts first
2. **Redis**: Cache service starts
3. **Backend**: API server starts after database and cache are healthy
4. **Frontend**: Web application starts after backend is healthy

### Verification Steps
1. **Service Health**: Check that all services show as "healthy"
2. **Database Connection**: Verify backend can connect to PostgreSQL
3. **Redis Connection**: Verify backend can connect to Redis
4. **Frontend Access**: Test frontend loads correctly
5. **API Communication**: Test frontend can communicate with backend

## 7. Troubleshooting

### Common Issues

#### Build Failures
- Check Dockerfile syntax in frontend and backend directories
- Verify all required files are in Git repository
- Review build logs in Coolify dashboard

#### Service Health Check Failures
- Verify health check endpoints are implemented
- Check service startup logs for errors
- Ensure dependencies are properly configured

#### Network Connectivity Issues
- Verify service names match Docker Compose configuration
- Check internal network configuration
- Review environment variable values

#### Database Connection Issues
- Verify PostgreSQL password is set correctly
- Check database service health status
- Review database connection logs

### Debug Commands
Access service logs through Coolify dashboard:
1. Navigate to your application
2. Click on "Logs" tab
3. Select the service to monitor
4. Review real-time logs for issues

## 8. Post-Deployment Configuration

### Domain and SSL Setup
1. **DNS Configuration**: Point your domains to Coolify server IP
2. **SSL Certificates**: Verify automatic certificate generation
3. **Domain Verification**: Test HTTPS access to both frontend and backend

### Monitoring Setup
1. **Health Monitoring**: Configure alerts for service failures
2. **Log Monitoring**: Set up log aggregation and analysis
3. **Performance Monitoring**: Monitor resource usage and response times

### Backup Configuration
1. **Database Backups**: Configure automated PostgreSQL backups
2. **Volume Backups**: Set up persistent volume backup strategy
3. **Configuration Backups**: Export Coolify configuration for disaster recovery

This completes the Coolify project and service configuration setup. The application will be deployed with proper networking, security, and monitoring in place.