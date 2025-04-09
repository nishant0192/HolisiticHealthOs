// src/routes/insights.routes.ts
import { Router } from 'express';
import { validateToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/async-handler';
import { proxyToService } from '../utils/service-proxy';

const router = Router();

/**
 * @swagger
 * /insights:
 *   get:
 *     summary: Get all user insights
 *     tags: [Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [activity, sleep, nutrition, mental, general]
 *         description: Filter insights by category
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of insights to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page of results to return
 *     responses:
 *       200:
 *         description: List of insights retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/',
  validateToken,
  asyncHandler(proxyToService('ai', '/insights'))
);

/**
 * @swagger
 * /insights/{id}:
 *   get:
 *     summary: Get a specific insight by ID
 *     tags: [Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Insight ID
 *     responses:
 *       200:
 *         description: Insight retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Insight not found
 */
router.get('/:id',
  validateToken,
  asyncHandler(proxyToService('ai', '/insights/:id'))
);

/**
 * @swagger
 * /insights/{id}/dismiss:
 *   post:
 *     summary: Dismiss an insight
 *     tags: [Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Insight ID
 *     responses:
 *       200:
 *         description: Insight dismissed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Insight not found
 */
router.post('/:id/dismiss',
  validateToken,
  asyncHandler(proxyToService('ai', '/insights/:id/dismiss'))
);

/**
 * @swagger
 * /insights/{id}/feedback:
 *   post:
 *     summary: Provide feedback on an insight
 *     tags: [Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Insight ID
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
 *         description: Insight not found
 */
router.post('/:id/feedback',
  validateToken,
  asyncHandler(proxyToService('ai', '/insights/:id/feedback'))
);

export default router;