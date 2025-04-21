# ------------------------------------------------
# Auth Service - Production Dockerfile
# ------------------------------------------------

# --- Build Stage ---
    FROM node:18-alpine AS build

    # Create app directory
    WORKDIR /app
    
    # Copy package files for efficient caching
    COPY package*.json ./
    COPY tsconfig.json ./
    COPY services/auth-service/package*.json ./services/auth-service/
    COPY shared/common/package*.json ./shared/common/
    COPY shared/logger/package*.json ./shared/logger/
    COPY shared/monitoring/package*.json ./shared/monitoring/
    
    # Install dependencies for all packages
    RUN npm ci --ignore-scripts --prefix services/auth-service
    RUN npm ci --ignore-scripts --prefix shared/common
    RUN npm ci --ignore-scripts --prefix shared/logger
    RUN npm ci --ignore-scripts --prefix shared/monitoring
    
    # Copy source code
    COPY shared/common/ ./shared/common/
    COPY shared/logger/ ./shared/logger/
    COPY shared/monitoring/ ./shared/monitoring/
    COPY services/auth-service/ ./services/auth-service/
    
    # Build shared packages first
    RUN npm run build --prefix shared/common
    RUN npm run build --prefix shared/logger  
    RUN npm run build --prefix shared/monitoring
    
    # Build the auth service
    RUN npm run build --prefix services/auth-service
    
    # --- Production Stage ---
    FROM node:18-alpine
    
    # Create app directory
    WORKDIR /app
    
    # Set environment
    ENV NODE_ENV=production
    
    # Install curl for healthcheck
    RUN apk --no-cache add curl
    
    # Install production dependencies
    COPY --from=build /app/services/auth-service/package*.json ./
    RUN npm ci --only=production
    
    # Copy built artifacts
    COPY --from=build /app/services/auth-service/dist ./dist
    COPY --from=build /app/shared/common/dist ./node_modules/@shared/common/dist
    COPY --from=build /app/shared/logger/dist ./node_modules/@shared/logger/dist
    COPY --from=build /app/shared/monitoring/dist ./node_modules/@shared/monitoring/dist
    
    # Run as non-root user
    RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs
    USER nodejs
    
    # Set healthcheck
    HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
      CMD curl -f http://localhost:3001/health || exit 1
    
    # Expose API port
    EXPOSE 3001
    
    # Start command
    CMD ["node", "dist/index.js"]