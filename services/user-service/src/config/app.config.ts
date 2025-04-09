import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface AppConfig {
  env: string;
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
  auth: {
    jwtSecret: string;
  };
  logs: {
    level: string;
    directory: string;
  };
}

const appConfig: AppConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3002', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-for-development-only',
  },
  logs: {
    level: process.env.LOG_LEVEL || 'info',
    directory: process.env.LOG_DIR || 'logs'
  }
};

export default appConfig;