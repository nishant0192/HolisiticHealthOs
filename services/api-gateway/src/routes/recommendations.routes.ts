// src/routes/recommendations.routes.ts
import { Router } from 'express';
import { validateToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/async-handler';
import { proxyToService } from '../utils/service-proxy';

const router = Router();

/**
 * @swagger
 * /recommendations/daily:
 *   get:
 *     summary: Get daily recommendations
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date for recommendations (defaults to current date)
 *     responses:
 *       200:
 *         description: Daily recommendations retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/daily',
  validateToken,
  asyncHandler(proxyToService('ai', '/recommendations/daily'))
);

/**
 * @swagger
 * /recommendations/{id}:
 *   get:
 *     summary: Get a specific recommendation by ID
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recommendation ID
 *     responses:
 *       200:
 *         description: Recommendation retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recommendation not found
 */
router.get('/:id',
  validateToken,
  asyncHandler(proxyToService('ai', '/recommendations/:id'))
);

/**
 * @swagger
 * /recommendations/{id}/complete:
 *   post:
 *     summary: Mark a recommendation as completed
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recommendation ID
 *     responses:
 *       200:
 *         description: Recommendation marked as completed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recommendation not found
 */
router.post('/:id/complete',
  validateToken,
  asyncHandler(proxyToService('ai', '/recommendations/:id/complete'))
);

/**
 * @swagger
 * /recommendations/{id}/skip:
 *   post:
 *     summary: Skip a recommendation
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recommendation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Recommendation skipped successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recommendation not found
 */
router.post('/:id/skip',
  validateToken,
  asyncHandler(proxyToService('ai', '/recommendations/:id/skip'))
);

/**
 * @swagger
 * /recommendations/{id}/feedback:
 *   post:
 *     summary: Provide feedback on a recommendation
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recommendation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feedback recorded successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recommendation not found
 */
router.post('/:id/feedback',
  validateToken,
  asyncHandler(proxyToService('ai', '/recommendations/:id/feedback'))
);

export default router;