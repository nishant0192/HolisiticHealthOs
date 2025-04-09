import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface AppConfig {
  env: string;
  port: number;
  serviceUrls: {
    auth: string;
    user: string;
    integration: string;
    analytics: string;
    notification: string;
    ai: string;
  };
  timeouts: {
    default: number;
    auth: number;
  };
}

const appConfig: AppConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  serviceUrls: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001/api/v1',
    user: process.env.USER_SERVICE_URL || 'http://localhost:3002/api/v1',
    integration: process.env.INTEGRATION_SERVICE_URL || 'http://localhost:3003/api/v1',
    analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3004/api/v1',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005/api/v1',
    ai: process.env.AI_SERVICE_URL || 'http://localhost:3006/api/v1',
  },
  timeouts: {
    default: parseInt(process.env.DEFAULT_TIMEOUT || '30000', 10), // 30 seconds
    auth: parseInt(process.env.AUTH_TIMEOUT || '10000', 10), // 10 seconds
  }
};

export default appConfig;