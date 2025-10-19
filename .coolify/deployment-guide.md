# Coolify Deployment Guide

This guide provides step-by-step instructions for deploying the n8n-clone application using Coolify and validating the deployment.

## Prerequisites

- Coolify instance running and accessible
- Git repository with the application code
- Domain names configured (optional but recommended)
- Basic understanding of Docker and environment variables

## Deployment Process

### Step 1: Prepare Your Repository

Ensure all code is committed and pushed to your Git repository:

```bash
git add .
git commit -m "Prepare for Coolify deployment"
git push origin main
```

### Step 2: Create Coolify Project

1. **Log into Coolify Dashboard**
   - Navigate to your Coolify instance
   - Log in with your credentials

2. **Create New Project**
   - Click "New Project" or "+"
   - Enter project name: `n8n-clone`
   - Select "Docker Compose" as the project type

3. **Connect Git Repository**
   - Add your Git repository URL
   - Configure branch (usually `main` or `master`)
   - Set up deploy key or access token if needed

4. **Configure Build Settings**
   - Set Docker Compose file path: `coolify.yaml`
   - Enable automatic deployments (optional)

### Step 3: Configure Environment Variables

Set the following required environment variables in Coolify:

#### Required Variables
```bash
# Database Configuration
POSTGRES_PASSWORD=your_secure_database_password
POSTGRES_DB=n8n_clone
POSTGRES_USER=postgres

# Application Secrets
JWT_SECRET=your_jwt_secret_minimum_32_characters
SESSION_SECRET=your_session_secret_32_characters

# CORS and API Configuration
CORS_ORIGIN=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com

# Domain Configuration (if using custom domains)
FRONTEND_DOMAIN=yourdomain.com
BACKEND_DOMAIN=api.yourdomain.com
```

#### Optional Variables
```bash
# Logging and Debug
LOG_LEVEL=info
NODE_ENV=production

# Webhook Configuration
WEBHOOK_URL=https://api.yourdomain.com/webhook

# Nginx Configuration
NGINX_HOST=yourdomain.com
```

### Step 4: Configure Domains and SSL

If using custom domains:

1. **Set Domain Names**
   - Frontend: `yourdomain.com`
   - Backend: `api.yourdomain.com`

2. **Configure DNS Records**
   - Point domains to your Coolify server IP
   - Wait for DNS propagation (can take up to 24 hours)

3. **Enable SSL**
   - Enable Let's Encrypt SSL certificates
   - Configure automatic renewal

### Step 5: Deploy the Application

1. **Trigger Initial Deployment**
   - Click "Deploy" button in Coolify dashboard
   - Monitor deployment logs in real-time

2. **Monitor Deployment Progress**
   - Watch for build completion
   - Check for any error messages
   - Verify all services start successfully

### Step 6: Validate Deployment

Use the provided validation scripts to verify the deployment:

#### Using the Automated Script

**Linux/Mac:**
```bash
chmod +x scripts/deploy-and-validate.sh
./scripts/deploy-and-validate.sh --frontend-url https://yourdomain.com --backend-url https://api.yourdomain.com
```

**Windows PowerShell:**
```powershell
.\scripts\deploy-and-validate.ps1 -FrontendUrl "https://yourdomain.com" -BackendUrl "https://api.yourdomain.com"
```

#### Manual Validation

1. **Check Frontend Service**
   ```bash
   curl -I https://yourdomain.com
   ```

2. **Check Backend Health**
   ```bash
   curl https://api.yourdomain.com/health
   ```

3. **Verify API Communication**
   ```bash
   curl https://api.yourdomain.com/api/node-types
   ```

## Validation Checklist

The deployment validation covers these areas:

### ✅ Frontend Service
- [ ] Frontend is accessible and serving React application
- [ ] Static assets are loading correctly
- [ ] No console errors in browser

### ✅ Backend Service
- [ ] Backend API is responding
- [ ] Health endpoint returns status information
- [ ] API endpoints are accessible

### ✅ Database Connectivity
- [ ] PostgreSQL connection is healthy
- [ ] Database migrations have run successfully
- [ ] Application can read/write to database

### ✅ Redis Connectivity
- [ ] Redis connection is healthy
- [ ] Cache operations are working
- [ ] Session storage is functional

### ✅ API Communication
- [ ] Frontend can communicate with backend
- [ ] CORS is configured correctly
- [ ] Authentication endpoints are working

### ✅ SSL and Security
- [ ] SSL certificates are valid and active
- [ ] HTTPS redirection is working
- [ ] Security headers are present

## Troubleshooting

### Common Issues and Solutions

#### Build Failures
**Problem:** Docker build fails during deployment
**Solutions:**
- Check Dockerfile syntax in `frontend/` and `backend/` directories
- Verify all dependencies are listed in `package.json`
- Review build logs for specific error messages
- Ensure base images are accessible

#### Service Health Check Failures
**Problem:** Services fail health checks and restart repeatedly
**Solutions:**
- Verify health check endpoints are implemented correctly
- Check service startup logs for errors
- Ensure dependencies (database, Redis) are ready before app starts
- Adjust health check timeout and retry settings

#### Database Connection Issues
**Problem:** Backend cannot connect to PostgreSQL
**Solutions:**
- Verify `POSTGRES_PASSWORD` environment variable is set
- Check database service logs for startup errors
- Ensure database service is healthy before backend starts
- Verify connection string format in backend configuration

#### Redis Connection Issues
**Problem:** Backend cannot connect to Redis
**Solutions:**
- Check Redis service health status
- Verify Redis URL configuration
- Review Redis service logs for errors
- Ensure Redis service is accessible from backend

#### Domain and SSL Issues
**Problem:** Custom domains not working or SSL certificate errors
**Solutions:**
- Verify DNS records are pointing to correct IP
- Wait for DNS propagation (up to 24 hours)
- Check Let's Encrypt certificate generation logs
- Ensure domains are properly configured in Coolify

#### CORS Errors
**Problem:** Frontend cannot communicate with backend due to CORS
**Solutions:**
- Verify `CORS_ORIGIN` environment variable matches frontend domain
- Check that both HTTP and HTTPS variants are allowed
- Review CORS configuration in backend code
- Test API endpoints directly to isolate CORS issues

### Debug Commands

#### Check Service Status
```bash
# View all services
docker ps

# Check specific service logs
docker logs n8n-clone-backend
docker logs n8n-clone-frontend
docker logs n8n-clone-postgres
docker logs n8n-clone-redis
```

#### Test Database Connection
```bash
# Connect to PostgreSQL
docker exec -it n8n-clone-postgres psql -U postgres -d n8n_clone

# Test Redis connection
docker exec -it n8n-clone-redis redis-cli ping
```

#### Test API Endpoints
```bash
# Health check
curl -v https://api.yourdomain.com/health

# API endpoint
curl -v https://api.yourdomain.com/api/node-types

# Test with CORS headers
curl -H "Origin: https://yourdomain.com" -v https://api.yourdomain.com/health
```

## Post-Deployment Steps

### 1. Monitor Application
- Set up monitoring and alerting in Coolify
- Monitor resource usage (CPU, memory, disk)
- Set up log aggregation and analysis

### 2. Configure Backups
- Enable automated database backups
- Test backup and restore procedures
- Set up off-site backup storage

### 3. Performance Optimization
- Monitor application performance metrics
- Optimize database queries and indexes
- Configure caching strategies
- Set up CDN for static assets (optional)

### 4. Security Hardening
- Review and update security headers
- Configure rate limiting
- Set up intrusion detection
- Regular security updates

### 5. Documentation
- Document deployment configuration
- Create runbooks for common operations
- Document troubleshooting procedures
- Train team members on deployment process

## Maintenance

### Regular Tasks
- Monitor application logs for errors
- Review resource usage and scaling needs
- Update dependencies and security patches
- Test backup and restore procedures
- Review and rotate secrets periodically

### Scaling Considerations
- Monitor resource usage trends
- Plan for horizontal scaling if needed
- Consider database read replicas for high load
- Implement load balancing for multiple instances

## Support Resources

- **Coolify Documentation**: Official Coolify documentation
- **Application Logs**: Available in Coolify dashboard
- **Health Endpoints**: `/health` for detailed service status
- **Configuration Files**: `.coolify/` directory for all configs
- **Validation Scripts**: `scripts/` directory for deployment validation

For additional support, review the troubleshooting section above and check the application logs in the Coolify dashboard.