#!/bin/bash
set -e

echo "🚀 Setting up development environment for Holistic Health OS..."

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
# Install dependencies for each service
# -----------------------------------------------------------------------------
install_deps() {
  echo "📦 Installing dependencies..."

  for service in ./services/auth-service \
                 ./services/user-service \
                 ./services/integration-service \
                 ./services/api-gateway; do
    echo "  • $(basename $service)"
    ( cd "$service" && npm install )
  done

  echo "✓ Dependencies installed"
}

# -----------------------------------------------------------------------------
# Start the development environment via root docker-compose
# -----------------------------------------------------------------------------
start_dev() {
  echo "🐳 Building and starting development containers…"

  COMPOSE_FILE="docker-compose.yml"
  if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ $COMPOSE_FILE not found in $(pwd). Aborting."
    exit 1
  fi

  docker-compose -f "$COMPOSE_FILE" up -d --build
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
install_deps
start_dev

echo "✅ Setup complete! Development environment is ready."
