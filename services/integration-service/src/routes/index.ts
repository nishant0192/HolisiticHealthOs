// src/routes/index.ts
import { Router } from 'express';
import connectionRoutes from './connection.routes';
import syncRoutes from './sync.routes';
import activityRoutes from './activity.routes';
import sleepRoutes from './sleep.routes';
import nutritionRoutes from './nutrition.routes';

const router = Router();

// Register all routes
router.use('/connection', connectionRoutes);
router.use('/sync', syncRoutes);
router.use('/activity', activityRoutes);
router.use('/sleep', sleepRoutes);
router.use('/nutrition', nutritionRoutes);

export default router;