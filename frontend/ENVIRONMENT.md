# Environment Configuration

This document explains how to configure environment variables for the n8n Clone frontend application.

## Environment Files

The application supports multiple environment files:

- `.env` - Default environment variables (development)
- `.env.example` - Template for environment variables
- `.env.production` - Production environment variables
- `.env.staging` - Staging environment variables

## Available Variables

### API Configuration
- `VITE_API_URL` - Backend API URL (default: `http://localhost:4000`)

### App Configuration
- `VITE_APP_NAME` - Application name (default: `n8n Clone`)
- `VITE_APP_VERSION` - Application version (default: `1.0.0`)
- `VITE_ENVIRONMENT` - Environment name (development, staging, production)

## Usage

### Development
```bash
# Copy the example file
cp .env.example .env

# Edit the variables as needed
VITE_API_URL=http://localhost:4000
VITE_APP_NAME=n8n Clone
```

### Production
```bash
# Use production environment file
cp .env.production .env

# Or set variables directly
export VITE_API_URL=https://api.your-domain.com
export VITE_APP_NAME="n8n Clone"
```

### Staging
```bash
# Use staging environment file
cp .env.staging .env
```

## Environment Config Module

The application includes a centralized environment configuration module at `src/config/env.ts`:

```typescript
import { env, APP_NAME, API_URL } from '@/config/env'

// Use individual exports
console.log(APP_NAME) // "n8n Clone"
console.log(API_URL)  // "http://localhost:4000"

// Or use the full env object
console.log(env.IS_DEVELOPMENT) // true
console.log(env.API_BASE_URL)   // "http://localhost:4000/api"
```

## Build-time vs Runtime

**Important**: Vite environment variables are embedded at build time, not runtime. This means:

1. Variables must be prefixed with `VITE_` to be accessible in the browser
2. Changing environment variables requires rebuilding the application
3. Sensitive information should never be stored in frontend environment variables

## Docker Configuration

When using Docker, you can pass environment variables:

```bash
# Build with environment variables
docker build --build-arg VITE_API_URL=https://api.example.com .

# Or use environment file
docker run --env-file .env.production your-app
```

## Deployment

### Vercel
Add environment variables in the Vercel dashboard or use `vercel.json`:

```json
{
  "env": {
    "VITE_API_URL": "https://api.your-domain.com",
    "VITE_APP_NAME": "n8n Clone"
  }
}
```

### Netlify
Add environment variables in the Netlify dashboard or use `netlify.toml`:

```toml
[build.environment]
  VITE_API_URL = "https://api.your-domain.com"
  VITE_APP_NAME = "n8n Clone"
```

### GitHub Actions
```yaml
env:
  VITE_API_URL: ${{ secrets.API_URL }}
  VITE_APP_NAME: "n8n Clone"
```

## Security Notes

1. **Never store secrets** in frontend environment variables
2. **API keys and tokens** should be handled by the backend
3. **Environment variables are public** in the built application
4. **Use HTTPS** for production API URLs
5. **Validate environment variables** in the env config module

## Troubleshooting

### Variables not loading
- Ensure variables are prefixed with `VITE_`
- Restart the development server after changing `.env`
- Check that the `.env` file is in the project root

### Build issues
- Verify all required environment variables are set
- Check for typos in variable names
- Ensure the environment file exists for the target environment

### API connection issues
- Verify `VITE_API_URL` points to the correct backend
- Check CORS configuration on the backend
- Ensure the backend is running and accessible