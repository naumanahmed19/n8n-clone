# Coolify Deployment Design

## Overview

This design outlines the deployment strategy for the n8n-clone workflow automation platform using Coolify, a self-hosted deployment platform. The application consists of a React frontend, Node.js/Express backend, PostgreSQL database, and Redis cache, all containerized and orchestrated for production deployment.

## Architecture

### Application Stack
- **Frontend**: React + Vite application (Port 3000)
- **Backend**: Node.js/Express API with TypeScript (Port 4000)
- **Database**: PostgreSQL 15 (Port 5432)
- **Cache**: Redis 7 (Port 6379)
- **Reverse Proxy**: Nginx (handled by Coolify)

### Deployment Architecture
```
Internet → Coolify Proxy → Frontend (React)
                       → Backend API (Node.js)
                       → Database (PostgreSQL)
                       → Cache (Redis)
```

## Components and Interfaces

### 1. Coolify Project Configuration
- **Project Type**: Docker Compose application
- **Source**: Git repository with automatic deployments
- **Build Strategy**: Multi-stage Docker builds for frontend and backend
- **Networking**: Internal Docker network for service communication

### 2. Service Definitions

#### Frontend Service
- **Image**: Custom React build with Nginx
- **Port Mapping**: 3000 (internal) → 80/443 (external via Coolify proxy)
- **Environment Variables**:
  - `VITE_API_URL`: Backend API endpoint
- **Health Check**: HTTP GET on `/`
- **Build Context**: `./frontend`

#### Backend Service  
- **Image**: Custom Node.js application
- **Port Mapping**: 4000 (internal)
- **Environment Variables**:
  - `NODE_ENV=production`
  - `DATABASE_URL`: PostgreSQL connection string
  - `REDIS_URL`: Redis connection string
  - `JWT_SECRET`: Authentication secret
  - `PORT=4000`
- **Health Check**: HTTP GET on `/health`
- **Build Context**: `./backend`
- **Dependencies**: PostgreSQL and Redis services

#### PostgreSQL Service
- **Image**: `postgres:15-alpine`
- **Port**: 5432 (internal only)
- **Environment Variables**:
  - `POSTGRES_DB=n8n_clone`
  - `POSTGRES_USER=postgres`
  - `POSTGRES_PASSWORD`: From Coolify secrets
- **Persistent Storage**: Database volume mount
- **Health Check**: `pg_isready` command

#### Redis Service
- **Image**: `redis:7-alpine`
- **Port**: 6379 (internal only)
- **Persistent Storage**: Redis data volume mount
- **Health Check**: Redis ping command

### 3. Coolify-Specific Configurations

#### Environment Management
- **Production Environment**: Managed through Coolify UI
- **Secrets Management**: 
  - `POSTGRES_PASSWORD`
  - `JWT_SECRET`
  - API keys and sensitive configuration
- **Environment Files**: `.env.production` templates

#### Domain and SSL
- **Custom Domain**: Configurable through Coolify
- **SSL Certificates**: Automatic Let's Encrypt integration
- **Subdomain Strategy**:
  - Main app: `yourdomain.com`
  - API: `api.yourdomain.com` (optional)

#### Persistent Storage
- **Database Volume**: PostgreSQL data persistence
- **Redis Volume**: Cache data persistence (optional)
- **Application Logs**: Centralized logging through Coolify
- **File Uploads**: Persistent volume for user-uploaded files

## Data Models

### Coolify Configuration Structure
```yaml
# coolify.yaml (if using file-based config)
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - VITE_API_URL=${BACKEND_URL}
    
  backend:
    build: ./backend
    ports: ["4000:4000"]
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
```

### Environment Variables Schema
```typescript
interface DeploymentConfig {
  // Database
  DATABASE_URL: string;
  POSTGRES_PASSWORD: string;
  
  // Cache
  REDIS_URL: string;
  
  // Authentication
  JWT_SECRET: string;
  
  // Application
  NODE_ENV: 'production';
  PORT: number;
  
  // Frontend
  VITE_API_URL: string;
}
```

## Error Handling

### Deployment Failures
- **Build Failures**: Detailed logs through Coolify interface
- **Service Dependencies**: Health checks and restart policies
- **Database Connection**: Connection retry logic in backend
- **Redis Unavailability**: Graceful degradation without cache

### Runtime Monitoring
- **Health Endpoints**: `/health` for backend service status
- **Database Health**: PostgreSQL connection monitoring
- **Redis Health**: Cache availability checks
- **Application Logs**: Centralized logging and error tracking

### Rollback Strategy
- **Git-based Deployments**: Easy rollback to previous commits
- **Database Migrations**: Reversible migration scripts
- **Zero-downtime Deployments**: Blue-green deployment strategy
- **Backup Strategy**: Automated database backups

## Testing Strategy

### Pre-deployment Testing
- **Local Docker Testing**: Validate docker-compose.yml locally
- **Environment Validation**: Test all environment variables
- **Database Migration Testing**: Verify schema changes
- **API Endpoint Testing**: Smoke tests for critical endpoints

### Post-deployment Validation
- **Health Check Verification**: All services responding correctly
- **Database Connectivity**: Verify database operations
- **Frontend-Backend Integration**: End-to-end API communication
- **SSL Certificate Validation**: HTTPS working correctly

### Monitoring and Alerting
- **Service Uptime**: Monitor all service availability
- **Database Performance**: Query performance and connection pools
- **Application Metrics**: Response times and error rates
- **Resource Usage**: CPU, memory, and disk utilization

## Security Considerations

### Network Security
- **Internal Networking**: Services communicate via Docker network
- **External Access**: Only frontend and API exposed publicly
- **Database Security**: PostgreSQL accessible only internally
- **Redis Security**: Cache service isolated from external access

### Secrets Management
- **Environment Variables**: Sensitive data through Coolify secrets
- **Database Credentials**: Encrypted storage in Coolify
- **JWT Secrets**: Secure random generation and storage
- **API Keys**: External service credentials management

### SSL and Encryption
- **HTTPS Enforcement**: Automatic SSL certificate management
- **Database Encryption**: PostgreSQL connection encryption
- **Session Security**: Secure cookie configuration
- **CORS Configuration**: Proper cross-origin request handling

## Performance Optimization

### Caching Strategy
- **Redis Integration**: Session and application-level caching
- **Static Asset Caching**: Nginx-based frontend asset caching
- **Database Query Optimization**: Connection pooling and indexing
- **CDN Integration**: Optional CDN for static assets

### Resource Allocation
- **Container Limits**: CPU and memory limits per service
- **Database Tuning**: PostgreSQL configuration optimization
- **Connection Pooling**: Backend database connection management
- **Horizontal Scaling**: Load balancer configuration for multiple instances

### Build Optimization
- **Multi-stage Builds**: Optimized Docker images
- **Dependency Caching**: npm/yarn cache optimization
- **Asset Minification**: Production build optimizations
- **Image Size Reduction**: Alpine-based images and layer optimization