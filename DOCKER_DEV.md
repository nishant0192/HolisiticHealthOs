# Docker Development Environment

This document explains how to set up and use the development environment for the Holistic Health OS project using Docker.

## Prerequisites

- Docker and Docker Compose installed on your system
- Git
- Node.js and npm (for local development outside Docker)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/holistic-health-os/holistic-health-os.git
cd holistic-health-os

# Make the setup scripts executable
chmod +x *.sh

# Set up and start the development environment
./dev-setup.sh
```

This will:
1. Create development environment files for each service
2. Install dependencies
3. Build and start Docker containers for all services
4. Set up a PostgreSQL database

## Development Environment Components

The development environment consists of:

- **PostgreSQL database**: Stores all application data
- **Auth Service**: Handles authentication and authorization (port 3001)
- **User Service**: Manages user profiles and health profiles (port 3002)
- **Integration Service**: Connects with external health data providers (port 3003)
- **API Gateway**: Routes requests to appropriate services (port 8080)
- **Adminer**: Web-based database management tool (port 8082)

## Monitoring Components (Optional)

You can start the monitoring stack with:

```bash
./start-dev-with-monitoring.sh
```

This includes:

- **Prometheus**: Metrics collection and storage (port 9090)
- **Grafana**: Metrics visualization and dashboards (port 3000)
- **Tempo**: Distributed tracing (port 3200)
- **Alert Manager**: Alerts handling and notifications (port 9093)

## Development Workflow

1. The source code is mounted into the containers, so any changes you make to the files will be reflected immediately
2. The containers run in development mode with hot-reloading enabled
3. You can access the services at:
   - API Gateway: http://localhost:8080
   - Auth Service: http://localhost:3001
   - User Service: http://localhost:3002
   - Integration Service: http://localhost:3003

## Useful Commands

```bash
# Start development environment
./dev-setup.sh

# Start with monitoring stack
./start-dev-with-monitoring.sh

# Stop all containers
./stop-dev.sh

# View logs for a specific service
docker logs -f auth-service

# Rebuild a specific service
docker-compose -f docker-compose.dev.yml build user-service
docker-compose -f docker-compose.dev.yml up -d user-service

# Reset the database
docker-compose -f docker-compose.dev.yml down
docker volume rm holistic-health-os_postgres_data
./dev-setup.sh
```

## Database Access

You can access the PostgreSQL database:

1. **Using Adminer**:
   - Visit http://localhost:8082
   - System: PostgreSQL
   - Server: postgres
   - Username: postgres
   - Password: postgres
   - Database: holistic_health_os

2. **Direct connection**:
   - Host: localhost
   - Port: 5432
   - Username: postgres
   - Password: postgres
   - Database: holistic_health_os

## Troubleshooting

1. **Container fails to start**:
   - Check logs: `docker logs <container_name>`
   - Ensure all required environment variables are set
   - Verify port is not already in use

2. **Changes not reflecting**:
   - Ensure your code is properly mounted (check docker-compose volumes)
   - Some services may need a restart: `docker restart <container_name>`

3. **Database connection issues**:
   - Ensure PostgreSQL container is running: `docker ps | grep postgres`
   - Check if migrations have run successfully
   - Verify database credentials in .env files