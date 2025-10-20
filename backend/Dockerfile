# Multi-stage build for production
ARG BASE_IMAGE=node:22-alpine
FROM ${BASE_IMAGE} AS builder

ARG SOURCE_COMMIT
ARG CORS_ORIGIN

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package.json only (no lock file needed for workspace)
COPY package.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Set a dummy DATABASE_URL for Prisma generation (not used during build)
ENV DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy"

# Generate Prisma client first
RUN npx prisma generate

# Then build the TypeScript code
RUN npm run build

# Production dependencies stage
FROM ${BASE_IMAGE} AS deps

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package.json only
COPY package.json ./

# Install only production dependencies
RUN npm install --omit=dev && npm cache clean --force

# Production stage
FROM ${BASE_IMAGE} AS production

WORKDIR /app

# Install curl for health checks and dumb-init for proper signal handling
RUN apk add --no-cache curl dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 4000

# Health check with improved configuration for Coolify
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Use dumb-init for proper signal handling in containers
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["npm", "start"]