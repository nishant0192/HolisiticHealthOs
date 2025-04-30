# Holistic Health OS - Development Environment

This document provides instructions for setting up and running the development environment for the Holistic Health OS microservices architecture.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)

## Quick Start

The fastest way to get started is to run the provided setup script:

```bash
# Make all scripts executable
chmod +x *.sh

# Run the development setup script
./dev-setup-enhanced.sh
```

This script will:

1. Create necessary environment files
2. Generate Docker Compose configurations
3. Create development Dockerfiles
4. Install dependencies
5. Start all required containers

## Running with Monitoring

To start the development environment with monitoring tools (Prometheus, Grafana, etc.):

```bash
./start-dev-complete.sh
```

This will start:
- All microservices (auth, user, integration, API gateway)
- PostgreSQL database
- Redis for caching
- Prometheus for metrics collection
- Grafana for metrics visualization
- Tempo for distributed tracing
- Alert Manager for alerts
- Node Exporter for system metrics

## Available Services

Once running, you can access the following services:

| Service | URL | Description |
|---------|-----|-------------|
| API Gateway | http://localhost:8080 | Main entry point for all APIs |
| Auth Service | http://localhost:3001 | Authentication service |
| User Service | http://localhost:3002 | User management service |
| Integration Service | http://localhost:3003 | Health data integration service |
| Adminer | http://localhost:8082 | Database management |
| Grafana | http://localhost:3000 | Metrics dashboard (admin/admin) |
| Prometheus | http://localhost:9090 | Metrics storage |
| Alert Manager | http://localhost:9093 | Alerts management |
| Tempo | http://localhost:3200 | Distributed tracing |

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

## Stopping the Environment

To stop all services:

```bash
./stop-dev.sh
```

## Service Development

When working on a specific service, you can still use your local development tools. The source code for each service is mounted into its respective container, so changes you make locally will be reflected in the container.

To run a service outside of Docker for deeper debugging:

1. Stop the individual service in Docker Compose:
   ```bash
   docker-compose -f docker-compose.dev.yml stop auth-service
   ```

2. Run the service locally:
   ```bash
   cd services/auth-service
   npm run dev
   ```

Ensure you set up the proper environment variables or create a `.env` file based on `.env.development`.

## Logs and Debugging

To view logs for a specific service:

```bash
docker-compose -f docker-compose.dev.yml logs -f auth-service
```

To access a running container's shell:

```bash
docker exec -it auth-service sh
```

## Troubleshooting

1. **Port conflicts**: If you see errors about ports already in use, ensure you don't have other services running on the same ports or modify the port mappings in `docker-compose.dev.yml`.

2. **Connection issues between services**: Ensure you're using the correct service names as hostnames for inter-service communication (e.g., `http://auth-service:3001` from within containers).

3. **Database initialization**: If the database fails to initialize properly, you can remove the volume and restart:
   ```bash
   docker-compose -f docker-compose.dev.yml down
   docker volume rm holistic-health-os_postgres_data
   ./dev-setup-enhanced.sh
   ```

4. **Missing environment variables**: If a service fails due to missing environment variables, check the respective `.env.development` file.

## Next Steps

After starting the development environment, you can:

1. Explore the API through the API Gateway (http://localhost:8080)
2. Monitor service metrics in Grafana (http://localhost:3000)
3. Check the database structure in Adminer (http://localhost:8082)
4. Start coding and see your changes reflect immediately!