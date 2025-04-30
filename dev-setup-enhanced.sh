#!/bin/bash
set -e

echo "🚀 Setting up enhanced development environment for Holistic Health OS..."

# Ensure we're in the project root
if [ ! -d "./services" ]; then
  echo "❌ services/ directory not found. Please run this script from the project root."
  exit 1
fi

# -----------------------------------------------------------------------------
# Create env files for each service if they don't exist
# -----------------------------------------------------------------------------
setup_env_files() {
  echo "📄 Setting up environment files..."

  # Create the base .env file if it doesn't exist
  if [ ! -f ".env" ]; then
    echo "  • Creating base .env file"
    cat > .env << EOL
# Base environment variables
NODE_ENV=development
LOG_LEVEL=debug

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=holistic_health_os
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=dev_jwt_secret_for_local_development_only
JWT_EXPIRY=24h

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=dev_redis_password

# Service URLs (for local development)
API_GATEWAY_URL=http://api-gateway:8080
AUTH_SERVICE_URL=http://auth-service:3001/api/v1
USER_SERVICE_URL=http://user-service:3002/api/v1
INTEGRATION_SERVICE_URL=http://integration-service:3003/api/v1
ANALYTICS_SERVICE_URL=http://analytics-service:3004/api/v1
NOTIFICATION_SERVICE_URL=http://notification-service:3005/api/v1
AI_SERVICE_URL=http://ai-service:3006/api/v1

# API Configuration
API_PREFIX=/api/v1
API_RATE_LIMIT=1000
API_RATE_LIMIT_WINDOW_MS=900000
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
EOL
  fi

  # Copy base .env into each service and append service‑specific vars
  for svc in auth-service user-service integration-service api-gateway; do
    ENV_DIR="./services/$svc"
    ENV_FILE="$ENV_DIR/.env.development"

    if [ ! -f "$ENV_FILE" ]; then
      echo "  • Creating $svc .env.development"
      cp .env "$ENV_FILE"
      {
        echo "NODE_ENV=development"
        case $svc in
          auth-service)       echo "PORT=3001";;
          user-service)       echo "PORT=3002";;
          integration-service)echo "PORT=3003";;
          api-gateway)        echo "PORT=8080";;
        esac
        echo "DB_HOST=postgres"
        echo "DB_PORT=5432"
        echo "DB_NAME=holistic_health_os"
        echo "DB_USER=postgres"
        echo "DB_PASSWORD=postgres"
        # Only services that issue or verify tokens need JWT_SECRET
        if [[ "$svc" != "api-gateway" ]]; then
          echo "JWT_SECRET=dev_jwt_secret_for_local_development_only"
        fi
        # API gateway needs service URLs
        if [[ "$svc" == "api-gateway" ]]; then
          echo "AUTH_SERVICE_URL=http://auth-service:3001/api/v1"
          echo "USER_SERVICE_URL=http://user-service:3002/api/v1"
          echo "INTEGRATION_SERVICE_URL=http://integration-service:3003/api/v1"
        fi
      } >> "$ENV_FILE"
    fi
  done

  echo "✓ Environment files have been created or already exist"
}

# -----------------------------------------------------------------------------
# Generate docker-compose.dev.yml if it doesn't exist
# -----------------------------------------------------------------------------
generate_docker_compose() {
  if [ ! -f "docker-compose.dev.yml" ]; then
    echo "📦 Generating docker-compose.dev.yml..."
    cat > docker-compose.dev.yml << EOL
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:14-alpine
    container_name: holistic-health-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: holistic_health_os
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./tools/database/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-net

  # Redis Service
  redis:
    image: redis:7-alpine
    container_name: holistic-health-redis
    command: redis-server --requirepass dev_redis_password
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - app-net

  # Auth Service
  auth-service:
    build:
      context: ./services/auth-service
      dockerfile: Dockerfile.dev
    container_name: auth-service
    volumes:
      - ./services/auth-service:/app
      - /app/node_modules
    ports:
      - "3001:3001"
    env_file:
      - ./services/auth-service/.env.development
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - app-net

  # User Service
  user-service:
    build:
      context: ./services/user-service
      dockerfile: Dockerfile.dev
    container_name: user-service
    volumes:
      - ./services/user-service:/app
      - /app/node_modules
    ports:
      - "3002:3002"
    env_file:
      - ./services/user-service/.env.development
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - app-net

  # Integration Service
  integration-service:
    build:
      context: ./services/integration-service
      dockerfile: Dockerfile.dev
    container_name: integration-service
    volumes:
      - ./services/integration-service:/app
      - /app/node_modules
    ports:
      - "3003:3003"
    env_file:
      - ./services/integration-service/.env.development
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - app-net

  # API Gateway
  api-gateway:
    build:
      context: ./services/api-gateway
      dockerfile: Dockerfile.dev
    container_name: api-gateway
    volumes:
      - ./services/api-gateway:/app
      - /app/node_modules
    ports:
      - "8080:8080"
    env_file:
      - ./services/api-gateway/.env.development
    depends_on:
      - auth-service
      - user-service
      - integration-service
    networks:
      - app-net

  # Development tools
  adminer:
    image: adminer
    container_name: adminer
    restart: always
    ports:
      - "8082:8080"
    networks:
      - app-net
    environment:
      ADMINER_DEFAULT_SERVER: postgres

networks:
  app-net:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
EOL
  fi
}

# -----------------------------------------------------------------------------
# Create or update tsconfig.json files for each service
# -----------------------------------------------------------------------------
create_tsconfig_files() {
  echo "📄 Creating or updating tsconfig.json files..."
  
  # For each service, create a basic tsconfig.json if it doesn't exist
  for svc in auth-service user-service integration-service api-gateway; do
    TSCONFIG_FILE="./services/$svc/tsconfig.json"
    
    if [ ! -f "$TSCONFIG_FILE" ]; then
      echo "  • Creating $TSCONFIG_FILE"
      cat > "$TSCONFIG_FILE" << EOL
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "moduleResolution": "node",
    "sourceMap": true,
    "removeComments": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "allowSyntheticDefaultImports": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
EOL
    fi
  done
  
  echo "✓ TypeScript configuration files have been created or updated"
}

# -----------------------------------------------------------------------------
# Update package.json files to fix prepare script issues
# -----------------------------------------------------------------------------
update_package_json() {
  echo "📦 Checking and updating package.json files..."
  
  for svc in auth-service user-service integration-service api-gateway; do
    PKG_FILE="./services/$svc/package.json"
    
    if [ -f "$PKG_FILE" ]; then
      # Check if file contains a prepare script that runs build
      if grep -q '"prepare":.*"npm run build"' "$PKG_FILE"; then
        echo "  • Removing prepare script from $PKG_FILE"
        # Use temporary file for sed replacement
        sed 's/"prepare":.*"npm run build".*,//' "$PKG_FILE" > "$PKG_FILE.tmp"
        mv "$PKG_FILE.tmp" "$PKG_FILE"
      fi
    else
      echo "  • Creating basic package.json for $svc"
      mkdir -p "./services/$svc"
      cat > "$PKG_FILE" << EOL
{
  "name": "$svc",
  "version": "1.0.0",
  "description": "$svc for Holistic Health OS",
  "main": "dist/index.js",
  "scripts": {
    "start": "node dist/index.js",
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc -p tsconfig.json",
    "clean": "rimraf dist",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix"
  },
  "dependencies": {
    "express": "^5.0.0-beta.1",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "winston": "^3.8.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.14",
    "@types/cors": "^2.8.12",
    "@types/node": "^18.11.9",
    "ts-node-dev": "^2.0.0",
    "typescript": "^4.8.4",
    "rimraf": "^3.0.2"
  }
}
EOL
    fi
  done
  
  echo "✓ Package.json files have been checked and updated"
}

# -----------------------------------------------------------------------------
# Ensure Dockerfile.dev exists for each service
# -----------------------------------------------------------------------------
create_dev_dockerfiles() {
  echo "🐳 Creating development Dockerfiles if needed..."
  
  # For each service, create a Dockerfile.dev if it doesn't exist
  for svc in auth-service user-service integration-service api-gateway; do
    DOCKERFILE="./services/$svc/Dockerfile.dev"
    
    if [ -f "$DOCKERFILE" ]; then
      echo "  • Updating $DOCKERFILE"
      cat > "$DOCKERFILE" << EOL
FROM node:18-alpine

WORKDIR /app

# Copy package.json and tsconfig.json first
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies without running scripts
RUN npm install --ignore-scripts

# Copy source code
COPY . .

# Expose port
EXPOSE ${PORT:-3000}

# Command to run in development mode
CMD ["npm", "run", "dev"]
EOL
    else
      echo "  • Creating $DOCKERFILE"
      cat > "$DOCKERFILE" << EOL
FROM node:18-alpine

WORKDIR /app

# Copy package.json and tsconfig.json first
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies without running scripts
RUN npm install --ignore-scripts

# Copy source code
COPY . .

# Expose port
EXPOSE ${PORT:-3000}

# Command to run in development mode
CMD ["npm", "run", "dev"]
EOL
    fi
  done
  
  echo "✓ Development Dockerfiles have been updated"
}

# -----------------------------------------------------------------------------
# Create basic directory structure and files for services
# -----------------------------------------------------------------------------
create_service_structure() {
  echo "📂 Creating basic service structure if needed..."
  
  for svc in auth-service user-service integration-service api-gateway; do
    SRC_DIR="./services/$svc/src"
    
    if [ ! -d "$SRC_DIR" ]; then
      echo "  • Creating basic structure for $svc"
      mkdir -p "$SRC_DIR"
      
      # Create a simple index.ts file
      cat > "$SRC_DIR/index.ts" << EOL
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: '$svc' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to $svc' });
});

// Start server
app.listen(port, () => {
  console.log(\`$svc running on port \${port}\`);
});
EOL
    fi
  done
  
  echo "✓ Basic service structure created"
}

# -----------------------------------------------------------------------------
# Install dependencies for each service
# -----------------------------------------------------------------------------
install_deps() {
  echo "📦 Installing dependencies..."

  for service in ./services/auth-service \
                 ./services/user-service \
                 ./services/integration-service \
                 ./services/api-gateway; do
    if [ -f "$service/package.json" ]; then
      echo "  • $(basename $service)"
      ( cd "$service" && npm install )
    fi
  done

  echo "✓ Dependencies installed"
}

# -----------------------------------------------------------------------------
# Start the development environment via docker-compose
# -----------------------------------------------------------------------------
start_dev() {
  echo "🐳 Building and starting development containers…"

  docker-compose -f docker-compose.dev.yml up -d --build
  echo "✓ All containers are up and running"
  echo ""
  echo "🌐 API Gateway: http://localhost:8080"
  echo "🛠️ Database Admin (Adminer): http://localhost:8082"
  echo ""
  echo "Postgres credentials:"
  echo "  • Host: localhost"
  echo "  • Port: 5432"
  echo "  • User: postgres"
  echo "  • Password: postgres"
  echo "  • Database: holistic_health_os"
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------
echo "🔍 Running setup steps..."
setup_env_files
generate_docker_compose
create_tsconfig_files
update_package_json
create_service_structure
create_dev_dockerfiles
install_deps
start_dev

echo "✅ Setup complete! Development environment is ready."