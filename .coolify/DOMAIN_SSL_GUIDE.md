# Domain and SSL Configuration Guide

This guide covers the complete setup of custom domains, SSL certificates, and networking configuration for the n8n-clone application deployment on Coolify.

## Overview

The domain and SSL configuration includes:
- Custom domain setup for frontend and backend services
- Automatic SSL certificate generation via Let's Encrypt
- Reverse proxy configuration with Nginx
- CORS configuration for production domains
- Network security and performance optimization

## Prerequisites

### DNS Configuration
Before deploying, ensure your DNS records are configured:

```
# A Records (replace with your Coolify server IP)
yourdomain.com        A    YOUR_COOLIFY_SERVER_IP
api.yourdomain.com    A    YOUR_COOLIFY_SERVER_IP

# Optional: WWW redirect
www.yourdomain.com    CNAME    yourdomain.com
```

### Domain Requirements
- Frontend domain: `yourdomain.com`
- Backend domain: `api.yourdomain.com` (or subdomain of your choice)
- Valid SSL certificates will be automatically generated

## Configuration Files

### 1. Environment Variables

Set these variables in your Coolify project environment:

```bash
# Required Domain Configuration
FRONTEND_DOMAIN=yourdomain.com
BACKEND_DOMAIN=api.yourdomain.com
CORS_ORIGIN=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com
WEBHOOK_URL=https://yourdomain.com

# Optional Nginx Configuration
NGINX_HOST=yourdomain.com
```

### 2. Coolify Service Configuration

The `coolify.yaml` file includes proper labels for domain and SSL:

```yaml
services:
  frontend:
    labels:
      - "coolify.domain=${FRONTEND_DOMAIN}"
      - "coolify.ssl=true"
      - "coolify.ssl.redirect=true"
      - "coolify.ssl.provider=letsencrypt"
      - "coolify.redirect_www=true"
  
  backend:
    labels:
      - "coolify.domain=${BACKEND_DOMAIN}"
      - "coolify.ssl=true"
      - "coolify.ssl.redirect=true"
      - "coolify.ssl.provider=letsencrypt"
```

## SSL Configuration

### Automatic Certificate Generation
- SSL certificates are automatically generated via Let's Encrypt
- Certificates are renewed automatically before expiration
- HTTP traffic is redirected to HTTPS
- HSTS headers are configured for security

### SSL Security Features
- TLS 1.2 and 1.3 support
- Strong cipher suites
- Perfect Forward Secrecy
- OCSP stapling
- Security headers (HSTS, CSP, etc.)

## CORS Configuration

### Production CORS Settings
The backend is configured to allow requests from:
- `https://yourdomain.com` (main frontend)
- `https://www.yourdomain.com` (www variant)
- Any domain specified in `CORS_ORIGIN`

### CORS Headers
```javascript
{
  origin: [
    process.env.CORS_ORIGIN,
    `https://${process.env.FRONTEND_DOMAIN}`,
    `https://www.${process.env.FRONTEND_DOMAIN}`
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin', 'X-Requested-With', 'Content-Type', 
    'Accept', 'Authorization', 'X-CSRF-Token'
  ],
  maxAge: 86400
}
```

## Reverse Proxy Configuration

### Frontend Proxy (Nginx)
- Serves static React application
- Client-side routing support
- Static asset caching (1 year)
- Gzip compression
- Security headers

### Backend Proxy (Coolify)
- API endpoint routing
- WebSocket support for real-time features
- Request/response buffering
- Rate limiting
- Health check monitoring

## Network Architecture

### Internal Network
- **Name**: `n8n-clone-internal`
- **Services**: postgres, redis, backend
- **Access**: Internal communication only
- **Security**: Isolated from external access

### External Network
- **Name**: `n8n-clone-external`
- **Services**: frontend, backend
- **Access**: Public via Coolify proxy
- **Security**: SSL termination, rate limiting

### Service Communication
```
Internet → Coolify Proxy → Frontend (Port 3000)
                        → Backend (Port 4000)
                        
Backend → Internal Network → PostgreSQL (Port 5432)
                          → Redis (Port 6379)
```

## Setup Scripts

### Automated Setup
Run the setup script to configure domains and SSL:

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
1. Set environment variables in Coolify dashboard
2. Configure domain settings for each service
3. Enable SSL with Let's Encrypt
4. Deploy the application

## Validation

### Configuration Validation
Run the validation script to check your configuration:

```bash
node .coolify/validate-domain-config.js
```

### Health Checks
After deployment, verify these endpoints:
- Frontend: `https://yourdomain.com/health`
- Backend: `https://api.yourdomain.com/health`

### SSL Testing
Test SSL configuration:
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)
- [Security Headers Test](https://securityheaders.com/)

## Troubleshooting

### Common Issues

#### DNS Not Propagating
- Wait 24-48 hours for DNS propagation
- Use `nslookup` or `dig` to verify DNS records
- Check with multiple DNS servers

#### SSL Certificate Generation Failed
- Verify DNS records point to Coolify server
- Ensure port 80 and 443 are accessible
- Check Coolify logs for certificate generation errors

#### CORS Errors
- Verify `CORS_ORIGIN` matches frontend domain exactly
- Check browser developer tools for specific CORS errors
- Ensure credentials are included in requests

#### Health Check Failures
- Verify health endpoints are implemented
- Check service startup logs
- Ensure dependencies (database, Redis) are healthy

### Debug Commands

```bash
# Check DNS resolution
nslookup yourdomain.com
dig yourdomain.com A

# Test SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Test health endpoints
curl -I https://yourdomain.com/health
curl -I https://api.yourdomain.com/health

# Check CORS headers
curl -H "Origin: https://yourdomain.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS https://api.yourdomain.com/health
```

## Security Considerations

### Domain Security
- Use HTTPS everywhere (no mixed content)
- Configure HSTS headers
- Implement CSP headers
- Regular SSL certificate monitoring

### Network Security
- Database and Redis are internal-only
- API rate limiting enabled
- Security headers configured
- Regular security updates

### Monitoring
- SSL certificate expiration alerts
- Health check monitoring
- Performance monitoring
- Security scanning

## Performance Optimization

### Caching Strategy
- Static assets cached for 1 year
- API responses cached appropriately
- CDN integration (optional)
- Browser caching headers

### Compression
- Gzip compression for text assets
- Image optimization
- Minified JavaScript and CSS
- HTTP/2 support

### Monitoring
- Response time monitoring
- Error rate tracking
- Resource usage monitoring
- User experience metrics

## Maintenance

### Regular Tasks
- Monitor SSL certificate expiration
- Review security headers
- Update DNS records if needed
- Performance optimization

### Updates
- Keep Coolify updated
- Monitor for security patches
- Review and update CORS policies
- Update SSL configurations as needed

## Support

For issues with domain and SSL configuration:
1. Check the deployment checklist
2. Run the validation script
3. Review Coolify logs
4. Test endpoints manually
5. Check DNS and SSL status

For application-specific issues:
1. Check health endpoints
2. Review application logs
3. Verify environment variables
4. Test API endpoints