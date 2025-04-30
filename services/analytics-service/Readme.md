# Analytics Service

The Analytics Service is responsible for processing and analyzing health data to provide meaningful insights and reports. It's a core component of the Holistic Health OS platform, enabling users to understand patterns and trends in their health data.

## Features

- Health data aggregation and statistics
- Activity, sleep, and nutrition insights
- Trend and correlation analysis
- Health reports generation
- Population data comparison

## Architecture

The Analytics Service follows a layered architecture:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic for data analysis
- **Models**: Interact with the database
- **Processors**: Specialized modules for different health domains
- **Utils**: Helper functions for statistics and data manipulation

## API Endpoints

### Analytics

- `GET /analytics/health-data`: Get raw health data with filtering options
- `GET /analytics/health-stats`: Get statistics for a specific metric
- `GET /analytics/daily-aggregates`: Get daily aggregated data
- `GET /analytics/activity/insights`: Get activity insights
- `GET /analytics/sleep/insights`: Get sleep insights
- `GET /analytics/nutrition/insights`: Get nutrition insights
- `GET /analytics/trend`: Get trend analysis for a metric
- `GET /analytics/correlation`: Get correlation between two metrics
- `GET /analytics/health-summary`: Get comprehensive health summary
- `GET /analytics/metric-comparison`: Compare with population statistics

### Reports

- `GET /reports`: Get all reports with filtering
- `GET /reports/:id`: Get a specific report
- `POST /reports`: Create a custom report
- `PUT /reports/:id`: Update an existing report
- `DELETE /reports/:id`: Delete a report
- `POST /reports/generate/activity`: Generate an activity report
- `POST /reports/generate/sleep`: Generate a sleep report
- `POST /reports/generate/nutrition`: Generate a nutrition report 
- `POST /reports/generate/health`: Generate a comprehensive health report
- `POST /reports/generate/custom`: Generate a custom report with specific metrics

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Docker and Docker Compose (for development)

### Development Setup

1. Clone the repository
2. Navigate to the analytics service directory:
   ```bash
   cd services/analytics-service
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env.development` file using the provided example
5. Start the service in development mode:
   ```bash
   npm run dev
   ```

### Using Docker Compose

The easiest way to run the entire system including the Analytics Service is to use Docker Compose:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

This will start the database, analytics service, and other required services.

## Database Schema

The Analytics Service relies on these main tables:

- `health_data`: Stores raw health metrics with user ID, timestamp, type, value, and unit
- `reports`: Stores generated reports with type, period, and data

## Technologies

- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **TypeScript**: Type-safe JavaScript
- **PostgreSQL**: Relational database
- **Winston**: Logging library
- **date-fns**: Date manipulation library

## Testing

Run the test suite:

```bash
npm test
```

For development with TDD:

```bash
npm run test:watch
```

## Contributing

1. Follow the coding standards in the project
2. Write tests for new features
3. Update documentation when necessary
4. Submit a pull request

## License

MIT