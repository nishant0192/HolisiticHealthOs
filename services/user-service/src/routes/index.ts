import { Router } from 'express';
import userRoutes from './user.routes';
import profileRoutes from './profile.routes';
import healthProfileRoutes from './health-profile.routes';
import goalsRoutes from './goals.routes';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'User service is running',
    timestamp: new Date().toISOString()
  });
});

// Register all routes
router.use('/users', userRoutes);
router.use('/profile', profileRoutes);
router.use('/health-profile', healthProfileRoutes);
router.use('/goals', goalsRoutes);

export default router;