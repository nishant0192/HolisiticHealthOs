import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface AppConfig {
  env: string;
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
  logLevel: string;
  enableMetrics: boolean;
  serviceUrls: {
    user: string;
    integration: string;
  };
  auth: {
    jwtSecret: string;
    jwtExpiry: string;
  };
}

const appConfig: AppConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3004', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
  logLevel: process.env.LOG_LEVEL || 'info',
  enableMetrics: process.env.ENABLE_METRICS === 'true',
  serviceUrls: {
    user: process.env.USER_SERVICE_URL || 'http://localhost:3002/api/v1',
    integration: process.env.INTEGRATION_SERVICE_URL || 'http://localhost:3003/api/v1',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'development_secret_key',
    jwtExpiry: process.env.JWT_EXPIRY || '24h',
  }
};

export default appConfig;