// src/config/app.config.ts
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
  providers: {
    appleHealth: {
      clientId: string;
      teamId: string;
      keyId: string;
      privateKey: string;
      redirectUri: string;
    };
    googleFit: {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
    };
    fitbit: {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
    };
    garmin: {
      consumerKey: string;
      consumerSecret: string;
      redirectUri: string;
    };
    samsungHealth: {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
    };
    withings: {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
    };
  };
}

const appConfig: AppConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3003', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-for-development-only',
  },
  logs: {
    level: process.env.LOG_LEVEL || 'info',
    directory: process.env.LOG_DIR || 'logs'
  },
  providers: {
    appleHealth: {
      clientId: process.env.APPLE_HEALTH_CLIENT_ID || '',
      teamId: process.env.APPLE_HEALTH_TEAM_ID || '',
      keyId: process.env.APPLE_HEALTH_KEY_ID || '',
      privateKey: process.env.APPLE_HEALTH_PRIVATE_KEY || '',
      redirectUri: process.env.APPLE_HEALTH_REDIRECT_URI || 'http://localhost:3003/api/v1/connection/apple-health/callback'
    },
    googleFit: {
      clientId: process.env.GOOGLE_FIT_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_FIT_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_FIT_REDIRECT_URI || 'http://localhost:3003/api/v1/connection/google-fit/callback'
    },
    fitbit: {
      clientId: process.env.FITBIT_CLIENT_ID || '',
      clientSecret: process.env.FITBIT_CLIENT_SECRET || '',
      redirectUri: process.env.FITBIT_REDIRECT_URI || 'http://localhost:3003/api/v1/connection/fitbit/callback'
    },
    garmin: {
      consumerKey: process.env.GARMIN_CONSUMER_KEY || '',
      consumerSecret: process.env.GARMIN_CONSUMER_SECRET || '',
      redirectUri: process.env.GARMIN_REDIRECT_URI || 'http://localhost:3003/api/v1/connection/garmin/callback'
    },
    samsungHealth: {
      clientId: process.env.SAMSUNG_HEALTH_CLIENT_ID || '',
      clientSecret: process.env.SAMSUNG_HEALTH_CLIENT_SECRET || '',
      redirectUri: process.env.SAMSUNG_HEALTH_REDIRECT_URI || 'http://localhost:3003/api/v1/connection/samsung-health/callback'
    },
    withings: {
      clientId: process.env.WITHINGS_CLIENT_ID || '',
      clientSecret: process.env.WITHINGS_CLIENT_SECRET || '',
      redirectUri: process.env.WITHINGS_REDIRECT_URI || 'http://localhost:3003/api/v1/connection/withings/callback'
    }
  }
}
export default appConfig;