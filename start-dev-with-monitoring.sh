#!/bin/bash
set -e

echo "🚀 Starting Holistic Health OS development environment with monitoring..."

# Check if directories exist
if [ ! -d "./monitoring/prometheus" ]; then
  echo "Creating monitoring directory structure..."
  mkdir -p ./monitoring/prometheus/rules
  mkdir -p ./monitoring/grafana/dashboards
  mkdir -p ./monitoring/grafana/datasources
  mkdir -p ./monitoring/alerting/alert-manager
  mkdir -p ./monitoring/distributed-tracing/tempo
fi

# Start the main development environment
echo "📦 Starting main services..."
docker-compose -f docker-compose.dev.yml up -d

# Start the monitoring environment
echo "📊 Starting monitoring services..."
docker-compose -f docker-compose.monitoring.yml up -d

echo "✅ Development environment with monitoring is now running!"
echo ""
echo "🔗 Access Points:"
echo "🌐 API Gateway: http://localhost:8080"
echo "📊 Grafana: http://localhost:3000 (admin/admin)"
echo "📈 Prometheus: http://localhost:9090"
echo "🔔 Alert Manager: http://localhost:9093"
echo "🔍 Distributed Tracing (Tempo): http://localhost:3200"
echo "🛠️ Database Admin (Adminer): http://localhost:8082"
echo ""
echo "To stop all services: ./stop-dev.sh"