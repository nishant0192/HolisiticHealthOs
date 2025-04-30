// src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
// import swaggerUi from 'swagger-ui-express';
import { appConfig, corsConfig, rateLimitConfig } from './config';
import routes from './routes';
import { errorHandler, notFoundHandler, setupUncaughtExceptionHandler, setupUnhandledRejectionHandler } from './middlewares/error.middleware';
import { requestLogger, detailedLogger } from './middlewares/logging.middleware';

// Set up process error handlers
setupUncaughtExceptionHandler();
setupUnhandledRejectionHandler();

// Create Express app
const app = express();

// Apply basic middlewares
app.use(helmet());
app.use(cors(corsConfig));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(requestLogger);
app.use(detailedLogger);

// Rate limiting
const standardLimiter = rateLimit(rateLimitConfig.standard);
app.use(standardLimiter);

// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API Gateway is healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || 'unknown'
    });
});

// API routes
app.use('/api/v1', routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start the server
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT} in ${appConfig.env} mode`);
});

export default app;