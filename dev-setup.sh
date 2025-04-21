#!/bin/bash
set -e

echo "🚀 Setting up development environment for Holistic Health OS..."

# Create env files for each service if they don't exist
setup_env_files() {
  echo "📄 Setting up environment files..."

  # Auth Service
  if [ ! -f "./services/auth-service/.env.development" ]; then
    echo "Creating .env.development for auth-service..."
    cp .env ./services/auth-service/.env.development
    echo "NODE_ENV=development" >> ./services/auth-service/.env.development
    echo "PORT=3001" >> ./services/auth-service/.env.development
    echo "DB_HOST=postgres" >> ./services/auth-service/.env.development
    echo "DB_PORT=5432" >> ./services/auth-service/.env.development
    echo "DB_NAME=holistic_health_os" >> ./services/auth-service/.env.development
    echo "DB_USER=postgres" >> ./services/auth-service/.env.development
    echo "DB_PASSWORD=postgres" >> ./services/auth-service/.env.development
    echo "JWT_SECRET=dev_jwt_secret_for_local_development_only" >> ./services/auth-service/.env.development
  fi

  # User Service
  if [ ! -f "./services/user-service/.env.development" ]; then
    echo "Creating .env.development for user-service..."
    cp .env ./services/user-service/.env.development
    echo "NODE_ENV=development" >> ./services/user-service/.env.development
    echo "PORT=3002" >> ./services/user-service/.env.development
    echo "DB_HOST=postgres" >> ./services/user-service/.env.development
    echo "DB_PORT=5432" >> ./services/user-service/.env.development
    echo "DB_NAME=holistic_health_os" >> ./services/user-service/.env.development
    echo "DB_USER=postgres" >> ./services/user-service/.env.development
    echo "DB_PASSWORD=postgres" >> ./services/user-service/.env.development
    echo "JWT_SECRET=dev_jwt_secret_for_local_development_only" >> ./services/user-service/.env.development
  fi

  # Integration Service
  if [ ! -f "./services/integration-service/.env.development" ]; then
    echo "Creating .env.development for integration-service..."
    cp .env ./services/integration-service/.env.development
    echo "NODE_ENV=development" >> ./services/integration-service/.env.development
    echo "PORT=3003" >> ./services/integration-service/.env.development
    echo "DB_HOST=postgres" >> ./services/integration-service/.env.development
    echo "DB_PORT=5432" >> ./services/integration-service/.env.development
    echo "DB_NAME=holistic_health_os" >> ./services/integration-service/.env.development
    echo "DB_USER=postgres" >> ./services/integration-service/.env.development
    echo "DB_PASSWORD=postgres" >> ./services/integration-service/.env.development
    echo "JWT_SECRET=dev_jwt_secret_for_local_development_only" >> ./services/integration-service/.env.development
  fi

  # API Gateway
  if [ ! -f "./services/api-gateway/.env.development" ]; then
    echo "Creating .env.development for api-gateway..."
    cp .env ./services/api-gateway/.env.development
    echo "NODE_ENV=development" >> ./services/api-gateway/.env.development
    echo "PORT=8080" >> ./services/api-gateway/.env.development
    echo "AUTH_SERVICE_URL=http://auth-service:3001/api/v1" >> ./services/api-gateway/.env.development
    echo "USER_SERVICE_URL=http://user-service:3002/api/v1" >> ./services/api-gateway/.env.development
    echo "INTEGRATION_SERVICE_URL=http://integration-service:3003/api/v1" >> ./services/api-gateway/.env.development
  fi

  echo "✓ Environment files have been created or already exist"
}

# Install dependencies for each service
install_deps() {
  echo "📦 Installing dependencies..."

  for service in ./services/auth-service ./services/user-service ./services/integration-service ./services/api-gateway; do
    echo "Installing dependencies for $(basename $service)..."
    cd $service && npm install && cd - > /dev/null
  done

  echo "✓ Dependencies installed"
}

# Start the development environment
start_dev() {
  echo "🐳 Building and starting development containers..."
  docker-compose -f docker-compose.dev.yml up --build -d
  echo "✓ Development environment started"
  echo "🌐 API Gateway available at: http://localhost:8080"
  echo "🛠️ Database admin available at: http://localhost:8082"
  echo "   Username: postgres"
  echo "   Password: postgres"
  echo "   Database: holistic_health_os"
}

# Main execution
echo "🔍 Running setup steps..."
setup_env_files
install_deps
start_dev

echo "✅ Setup complete! Development environment is ready."
