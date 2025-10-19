# Coolify Deployment Guide

This guide provides step-by-step instructions for deploying the n8n-clone application using Coolify.

## Prerequisites

- Coolify instance running and accessible
- Git repository with your code
- Domain name (optional but recommended)
- Basic understanding of Docker and environment variables

## Quick Start

1. **Prepare your deployment:**
   ```bash
   # Linux/Mac
   ./scripts/deploy-coolify.sh
   
   # Windows PowerShell
   .\scripts\deploy-coolify.ps1
   ```

2. **Push your code to Git repository**

3. **Follow the Coolify setup steps below**

## Coolify Setup Steps

### 1. Create New Project

1. Log into your Coolify dashboard
2. Click "New Project"
3. Name it `n8n-clone`
4. Select your server/destination

### 2. Add Application

1. In your project, click "New Resource" → "Application"
2. Choose "Public Repository" or connect your private Git repository
3. Enter your repository URL
4. Set build pack to "Docker Compose"
5. Select the `docker-compose.prod.yml` file or use the default `docker-compose.yml`

### 3. Configure Environment Variables

Set the following environment variables in Coolify:

#### Required Variables
```env
# Database
POSTGRES_DB=n8n_clone
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here

# Authentication
JWT_SECRET=your_very_secure_jwt_secret_minimum_32_chars
SESSION_SECRET=your_secure_session_secret_here

# Application URLs
CORS_ORIGIN=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com
WEBHOOK_URL=https://yourdomain.com

# Domains
FRONTEND_DOMAIN=yourdomain.com
BACKEND_DOMAIN=api.yourdomain.com
```

#### Optional Variables
```env
# Logging
LOG_LEVEL=info

# Redis (uses defaults if not set)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0

# Ports (for custom configurations)
FRONTEND_PORT=3000
BACKEND_PORT=4000
```

### 4. Configure Domains and SSL

1. **Frontend Domain:**
   - Go to your application settings
   - Add domain: `yourdomain.com`
   - Enable SSL (Let's Encrypt)
   - Set port to `3000`

2. **Backend API Domain (Optional):**
   - Add another domain: `api.yourdomain.com`
   - Enable SSL
   - Set port to `4000`

### 5. Deploy Application

1. Click "Deploy" in your Coolify dashboard
2. Monitor the build logs for any issues
3. Wait for all services to become healthy

## Service Architecture

The deployment includes the following services:

- **Frontend**: React application with Nginx (Port 3000)
- **Backend**: Node.js API server (Port 4000)
- **PostgreSQL**: Database (Internal only)
- **Redis**: Cache and session store (Internal only)

## Health Checks

All services include comprehensive health checks:

- **Frontend**: `GET /health` - Returns "healthy" status
- **Backend**: `GET /health` - Returns detailed system status including database and Redis connectivity
- **PostgreSQL**: `pg_isready` command
- **Redis**: `redis-cli ping` command

## Monitoring and Logs

### Application Logs
Access logs through Coolify dashboard:
1. Go to your application
2. Click on "Logs" tab
3. Select the service you want to monitor

### Health Status
Monitor service health:
- Frontend: `https://yourdomain.com/health`
- Backend: `https://api.yourdomain.com/health`

### Database Monitoring
The backend health endpoint provides database connectivity status and performance metrics.

## Troubleshooting

### Common Issues

#### 1. Build Failures
- Check Docker build logs in Coolify
- Ensure all required files are in your Git repository
- Verify Dockerfile syntax

#### 2. Database Connection Issues
- Verify `POSTGRES_PASSWORD` is set correctly
- Check if PostgreSQL service is healthy
- Review database connection logs

#### 3. Redis Connection Issues
- Ensure Redis service is running
- Check Redis health status in backend health endpoint
- Verify Redis configuration

#### 4. Frontend Not Loading
- Check if `VITE_API_URL` points to correct backend URL
- Verify frontend build completed successfully
- Check nginx configuration and logs

#### 5. CORS Issues
- Ensure `CORS_ORIGIN` matches your frontend domain
- Check if both HTTP and HTTPS are configured correctly

### Debug Commands

Access service containers for debugging:

```bash
# View logs
docker logs n8n-clone-backend-prod
docker logs n8n-clone-frontend-prod
docker logs n8n-clone-postgres-prod

# Access container shell
docker exec -it n8n-clone-backend-prod sh
docker exec -it n8n-clone-postgres-prod psql -U postgres -d n8n_clone
```

## Backup and Recovery

### Database Backup
```bash
# Create backup
docker exec n8n-clone-postgres-prod pg_dump -U postgres n8n_clone > backup.sql

# Restore backup
docker exec -i n8n-clone-postgres-prod psql -U postgres n8n_clone < backup.sql
```

### Volume Backup
Coolify automatically manages persistent volumes. For additional backup:
1. Go to your application in Coolify
2. Navigate to "Storages" tab
3. Use Coolify's backup features

## Scaling and Performance

### Horizontal Scaling
To scale your application:
1. Increase server resources in Coolify
2. Configure load balancer for multiple instances
3. Consider database connection pooling

### Performance Optimization
- Enable Redis caching
- Configure CDN for static assets
- Optimize database queries and indexes
- Monitor resource usage through Coolify metrics

## Security Considerations

### Environment Variables
- Use strong, unique passwords
- Generate secure JWT secrets (minimum 32 characters)
- Regularly rotate secrets

### Network Security
- Database and Redis are not exposed externally
- Use HTTPS for all public endpoints
- Configure proper CORS origins

### Updates and Maintenance
- Regularly update Docker images
- Monitor security advisories
- Keep Coolify instance updated

## Support

For deployment issues:
1. Check Coolify documentation
2. Review application logs
3. Verify environment configuration
4. Test health endpoints

For application-specific issues:
1. Check backend health endpoint for detailed status
2. Review application logs
3. Verify database and Redis connectivity