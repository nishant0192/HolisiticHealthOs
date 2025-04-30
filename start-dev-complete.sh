#!/bin/bash
set -e

echo "🚀 Starting Holistic Health OS complete development environment..."

# Check if required directories exist, create if needed
echo "📂 Setting up directory structure..."
mkdir -p monitoring/prometheus/rules
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources
mkdir -p monitoring/alerting/alert-manager
mkdir -p monitoring/distributed-tracing/tempo

# Check if docker-compose files exist
if [ ! -f "docker-compose.dev.yml" ]; then
  echo "❌ docker-compose.dev.yml not found. Please run ./dev-setup-enhanced.sh first."
  exit 1
fi

if [ ! -f "docker-compose.monitoring.yml" ]; then
  echo "❌ docker-compose.monitoring.yml not found. Please make sure it exists."
  exit 1
fi

# Ensure Prometheus config exists
if [ ! -f "monitoring/prometheus/prometheus.yaml" ]; then
  echo "❌ Prometheus configuration is missing. Creating a basic one..."
  
  # Create prometheus.yaml
  mkdir -p monitoring/prometheus
  cat > monitoring/prometheus/prometheus.yaml << EOL
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - "rules/alert-rules.yaml"
  - "rules/recording-rules.yaml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'auth-service'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['auth-service:3001']

  - job_name: 'user-service'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['user-service:3002']

  - job_name: 'integration-service'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['integration-service:3003']

  - job_name: 'analytics-service'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['analytics-service:3004']

  - job_name: 'api-gateway'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['api-gateway:8080']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

EOL
fi

# Create an empty alert-rules.yaml file if it doesn't exist
mkdir -p monitoring/prometheus/rules
if [ ! -f "monitoring/prometheus/rules/alert-rules.yaml" ]; then
  echo "Creating empty alert-rules.yaml..."
  cat > monitoring/prometheus/rules/alert-rules.yaml << EOL
groups:
  - name: basic_alerts
    rules:
      - alert: InstanceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Instance {{ \$labels.instance }} down"
          description: "{{ \$labels.instance }} of job {{ \$labels.job }} has been down for more than 1 minute."
EOL
fi

# Create an empty recording-rules.yaml file if it doesn't exist
if [ ! -f "monitoring/prometheus/rules/recording-rules.yaml" ]; then
  echo "Creating empty recording-rules.yaml..."
  cat > monitoring/prometheus/rules/recording-rules.yaml << EOL
groups:
  - name: basic_recording_rules
    rules:
      - record: job:http_requests_total:rate5m
        expr: sum(rate(http_requests_total[5m])) by (job)
EOL
fi

# Create tempo.yaml if it doesn't exist
mkdir -p monitoring/distributed-tracing/tempo
if [ ! -f "monitoring/distributed-tracing/tempo/tempo.yaml" ]; then
  echo "Creating basic tempo.yaml..."
  cat > monitoring/distributed-tracing/tempo/tempo.yaml << EOL
server:
  http_listen_port: 3200

distributor:
  receivers:
    otlp:
      protocols:
        http:
        grpc:

ingester:
  trace_idle_period: 10s
  max_block_duration: 5m

compactor:
  compaction:
    compaction_window: 1h
    max_compaction_objects: 1000000
    block_retention: 24h

storage:
  trace:
    backend: local
    block:
      bloom_filter_false_positive: .05
      index_downsample_bytes: 1000
      encoding: zstd
    wal:
      path: /tmp/tempo/wal
      encoding: snappy
    local:
      path: /tmp/tempo/blocks
    pool:
      max_workers: 100
      queue_depth: 10000
EOL
fi

# Create alertmanager config if it doesn't exist
mkdir -p monitoring/alerting/alert-manager
if [ ! -f "monitoring/alerting/alert-manager/config.yaml" ]; then
  echo "Creating basic alertmanager config..."
  cat > monitoring/alerting/alert-manager/config.yaml << EOL
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 12h
  receiver: 'web.hook'

receivers:
- name: 'web.hook'
  webhook_configs:
  - url: 'http://localhost:5001/'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'dev', 'instance']
EOL
fi

# Create Grafana datasource for Prometheus
mkdir -p monitoring/grafana/datasources
if [ ! -f "monitoring/grafana/datasources/prometheus.yaml" ]; then
  echo "Creating Grafana datasource for Prometheus..."
  cat > monitoring/grafana/datasources/prometheus.yaml << EOL
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOL
fi

# Start main development environment
echo "📦 Starting main services..."
docker-compose -f docker-compose.dev.yml up -d

# Start the monitoring environment
echo "📊 Starting monitoring services..."
docker-compose -f docker-compose.monitoring.yml up -d

echo "✅ Complete development environment with monitoring is now running!"
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