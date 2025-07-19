#!/bin/bash
set -e

echo "🔄 Restarting Holistic Health OS development environment..."

# Check if docker-compose files exist
if [ ! -f "docker-compose.dev.yml" ]; then
  echo "❌ docker-compose.dev.yml not found. Please run ./dev-setup-enhanced.sh first."
  exit 1
fi

if [ ! -f "docker-compose.monitoring.yml" ]; then
  echo "❌ docker-compose.monitoring.yml not found. Please make sure it exists."
  exit 1
fi

# Function to restart services
restart_services() {
  echo "⏱️ Stopping containers..."
  docker-compose -f docker-compose.dev.yml down
  docker-compose -f docker-compose.monitoring.yml down

  echo "🧹 Cleaning up any dangling resources..."
  docker network prune -f

  echo "🚀 Starting main services..."
  docker-compose -f docker-compose.dev.yml up -d

  echo "📊 Starting monitoring services..."
  docker-compose -f docker-compose.monitoring.yml up -d
}

# Function to restart a specific service
restart_service() {
  SERVICE=$1
  echo "🔄 Restarting $SERVICE service..."
  
  # Check if service exists in docker-compose.dev.yml
  if grep -q "$SERVICE:" docker-compose.dev.yml; then
    docker-compose -f docker-compose.dev.yml restart $SERVICE
    echo "✅ Service $SERVICE restarted successfully."
  # Check if service exists in docker-compose.monitoring.yml
  elif grep -q "$SERVICE:" docker-compose.monitoring.yml; then
    docker-compose -f docker-compose.monitoring.yml restart $SERVICE
    echo "✅ Service $SERVICE restarted successfully."
  else
    echo "❌ Service $SERVICE not found in docker-compose files."
    exit 1
  fi
}

# Check if a specific service was requested
if [ $# -eq 0 ]; then
  # No arguments provided, restart all services
  restart_services
elif [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  echo "Usage:"
  echo "  ./restart-dev.sh                  - Restart all services"
  echo "  ./restart-dev.sh [service-name]   - Restart a specific service"
  echo "  ./restart-dev.sh --help           - Show this help message"
  exit 0
else
  # Restart specific service
  restart_service $1
fi

echo "✅ Restart completed!"
echo ""
echo "🔗 Access Points:"
echo "🌐 API Gateway: http://localhost:8080"
echo "📊 Grafana: http://localhost:3000 (admin/admin)"
echo "📈 Prometheus: http://localhost:9090"
echo "🔔 Alert Manager: http://localhost:9093"
echo "🔍 Distributed Tracing (Tempo): http://localhost:3200"
echo "🛠️ Database Admin (Adminer): http://localhost:8082"