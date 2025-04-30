import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { appConfig } from './config';
import routes from './routes';
import { initTracing } from '@shared/monitoring';
import { metricsMiddleware, metricsEndpoint } from '@shared/monitoring';
import { logger } from '@shared/logger';
import { setupErrorHandlers } from './middlewares/error.middleware';
import { notFoundHandler } from './middlewares/error.middleware';
import { requestLogger } from './middlewares/logging.middleware';
import { authMiddleware } from './middlewares/auth.middleware';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Initialize tracing if enabled
if (appConfig.enableMetrics) {
  initTracing('analytics-service');
}

// Create Express app
const app = express();

// Apply basic middlewares
app.use(helmet());
app.use(cors({
  origin: appConfig.corsOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging
app.use(requestLogger());

// Add metrics middleware if enabled
if (appConfig.enableMetrics) {
  app.use(metricsMiddleware());
  app.get('/metrics', metricsEndpoint);
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Analytics Service is healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown'
  });
});

// API routes with prefix
app.use(appConfig.apiPrefix, authMiddleware, routes);

// Handle 404 errors
app.use(notFoundHandler);

// Global error handlers
setupErrorHandlers(app);

// Start the server
const PORT = appConfig.port;
app.listen(PORT, () => {
  logger.info(`Analytics Service running on port ${PORT} in ${appConfig.env} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Rejection:', err);
  // Don't crash the server, just log the error
});

export default app;