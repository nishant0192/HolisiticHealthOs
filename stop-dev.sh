#!/bin/bash
set -e

echo "🛑 Stopping Holistic Health OS development environment..."

# Stop monitoring services
echo "📊 Stopping monitoring services..."
docker-compose -f docker-compose.monitoring.yml down

# Stop main services
echo "📦 Stopping main services..."
docker-compose -f docker-compose.dev.yml down

echo "✅ All services have been stopped."
echo ""
echo "To remove volumes (database data), run:"
echo "docker volume prune -f"