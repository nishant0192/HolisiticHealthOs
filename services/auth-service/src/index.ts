// src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { appConfig } from './config';
import routes from './routes';
import { errorHandler, notFoundHandler, setupUncaughtExceptionHandler, setupUnhandledRejectionHandler } from './middlewares/error.middleware';

// Set up error handlers for uncaught exceptions and unhandled rejections
setupUncaughtExceptionHandler();
setupUnhandledRejectionHandler();

// Create Express app
const app = express();

// Apply security middlewares
app.use(helmet());
app.use(cors({
  origin: appConfig.corsOrigins,
  credentials: true
}));

// Parse JSON request body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Apply rate limiting
const limiter = rateLimit({
  windowMs: appConfig.rateLimitWindowMs,
  max: appConfig.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use(limiter);

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Auth service is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown'
  });
});

// Apply routes
app.use(appConfig.apiPrefix, routes);

// Handle 404 errors
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start the server
const PORT = appConfig.port;
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT} in ${appConfig.env} mode`);
});

export default app;