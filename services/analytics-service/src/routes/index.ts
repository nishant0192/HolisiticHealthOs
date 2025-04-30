import { Router } from 'express';
import analyticsRoutes from './analytics.routes';
import reportsRoutes from './reports.routes';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Analytics Service is healthy',
    timestamp: new Date().toISOString()
  });
});

// API routes
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportsRoutes);

export default router;