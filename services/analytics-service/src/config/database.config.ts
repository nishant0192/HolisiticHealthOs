import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  maxPool: number;
  idleTimeout: number;
  connectionTimeout: number;
}

const databaseConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'holistic_health_os',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true',
  maxPool: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000', 10)
};

export default databaseConfig;