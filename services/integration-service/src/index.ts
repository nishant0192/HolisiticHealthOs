// src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { appConfig } from './config';
import routes from './routes';
import { 
  errorHandler, 
  notFoundHandler, 
  setupUnhandledRejectionHandler, 
  setupUncaughtExceptionHandler 
} from './middlewares/error.middleware';
import { 
  requestLogger, 
  detailedLogger, 
  addRequestId 
} from './middlewares/logging.middleware';

// Set up process error handlers
setupUncaughtExceptionHandler();
setupUnhandledRejectionHandler();

// Create Express app
const app = express();

// Add request ID to all requests
app.use(addRequestId);

// Apply basic middlewares
app.use(helmet());
app.use(cors({
  origin: appConfig.corsOrigins,
  credentials: true
}));

// Parse JSON request body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(requestLogger);
app.use(detailedLogger);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Integration service is running',
    timestamp: new Date().toISOString()
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
  console.log(`Integration service running on port ${PORT} in ${appConfig.env} mode`);
});

export default app;