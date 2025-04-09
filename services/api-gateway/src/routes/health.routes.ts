import { Router } from 'express';
import { validateToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/async-handler';
import { proxyToService } from '../utils/service-proxy';

const router = Router();

/**
 * @swagger
 * /health/data:
 *   get:
 *     summary: Get user health data
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [activity, sleep, nutrition, vitals]
 *         description: Type of health data to retrieve
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for data range
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for data range
 *     responses:
 *       200:
 *         description: Health data retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/data',
  validateToken,
  asyncHandler(proxyToService('analytics', '/health/data'))
);

/**
 * @swagger
 * /health/activity:
 *   post:
 *     summary: Record new activity data
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - activity_type
 *               - start_time
 *               - end_time
 *             properties:
 *               activity_type:
 *                 type: string
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *               distance:
 *                 type: number
 *               calories_burned:
 *                 type: number
 *               steps:
 *                 type: number
 *     responses:
 *       201:
 *         description: Activity recorded successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post('/activity',
  validateToken,
  asyncHandler(proxyToService('integration', '/health/activity'))
);

/**
 * @swagger
 * /health/insights:
 *   get:
 *     summary: Get health insights
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Insights retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/insights',
  validateToken,
  asyncHandler(proxyToService('ai', '/health/insights'))
);

/**
 * @swagger
 * /health/recommendations:
 *   get:
 *     summary: Get daily recommendations
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date for recommendations
 *     responses:
 *       200:
 *         description: Recommendations retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/recommendations',
  validateToken,
  asyncHandler(proxyToService('ai', '/health/recommendations'))
);

export default router;