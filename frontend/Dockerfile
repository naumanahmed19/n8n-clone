# Multi-stage build for production
FROM node:22-alpine AS builder

# Define build arguments
ARG VITE_API_URL

# Set environment variables from build arguments
ENV VITE_API_URL=${VITE_API_URL}

WORKDIR /app

# Copy package.json only (no lock file needed for workspace)
COPY package.json ./

# Install dependencies
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Build application with production optimizations
RUN npm run build

# Production stage with nginx
FROM nginxinc/nginx-unprivileged:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 3000

# Health check for Coolify
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start nginx (using unprivileged user by default)
CMD ["nginx", "-g", "daemon off;"]