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
  asyncHandler(proxyToService('analytics', '/analytics/health-data'))
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

/**
 * @swagger
 * /health/analytics/activity:
 *   get:
 *     summary: Get activity analytics
 *     tags: [Health Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to analyze
 *     responses:
 *       200:
 *         description: Activity analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/analytics/activity',
  validateToken,
  asyncHandler(proxyToService('analytics', '/analytics/activity/insights'))
);

/**
 * @swagger
 * /health/analytics/sleep:
 *   get:
 *     summary: Get sleep analytics
 *     tags: [Health Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to analyze
 *     responses:
 *       200:
 *         description: Sleep analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/analytics/sleep',
  validateToken,
  asyncHandler(proxyToService('analytics', '/analytics/sleep/insights'))
);

/**
 * @swagger
 * /health/analytics/nutrition:
 *   get:
 *     summary: Get nutrition analytics
 *     tags: [Health Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to analyze
 *     responses:
 *       200:
 *         description: Nutrition analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/analytics/nutrition',
  validateToken,
  asyncHandler(proxyToService('analytics', '/analytics/nutrition/insights'))
);

/**
 * @swagger
 * /health/analytics/summary:
 *   get:
 *     summary: Get health summary
 *     tags: [Health Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days to summarize
 *     responses:
 *       200:
 *         description: Health summary retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/analytics/summary',
  validateToken,
  asyncHandler(proxyToService('analytics', '/analytics/health-summary'))
);

/**
 * @swagger
 * /health/reports:
 *   get:
 *     summary: Get health reports
 *     tags: [Health Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [activity, sleep, nutrition, health, custom]
 *         description: Type of reports to retrieve
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/reports',
  validateToken,
  asyncHandler(proxyToService('analytics', '/reports'))
);

/**
 * @swagger
 * /health/reports/{id}:
 *   get:
 *     summary: Get a health report by ID
 *     tags: [Health Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Report not found
 */
router.get('/reports/:id',
  validateToken,
  asyncHandler(proxyToService('analytics', '/reports/:id'))
);

/**
 * @swagger
 * /health/reports/generate/{type}:
 *   post:
 *     summary: Generate a health report
 *     tags: [Health Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [activity, sleep, nutrition, health, custom]
 *         description: Type of report to generate
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: integer
 *                 default: 30
 *               title:
 *                 type: string
 *               metrics:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Report generated successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid input
 */
router.post('/reports/generate/:type',
  validateToken,
  asyncHandler(proxyToService('analytics', '/reports/generate/:type'))
);

export default router;