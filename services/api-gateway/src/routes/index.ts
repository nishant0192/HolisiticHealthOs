import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import healthRoutes from './health.routes';
import docsRoutes from './docs.routes';

const router = Router();

// API Health Check
router.get('/', (_req, res) => {
  res.json({
    status: 'success',
    message: 'API Gateway is running',
    timestamp: new Date().toISOString()
  });
});

// Register service routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/health', healthRoutes);
router.use('/docs', docsRoutes);

export default router;