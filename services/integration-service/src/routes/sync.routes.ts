// src/routes/sync.routes.ts
import { Router } from 'express';
import { SyncController } from '../controllers/sync.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';

const router = Router();
const syncController = new SyncController();

/**
 * @swagger
 * /sync/{provider}:
 *   post:
 *     summary: Sync health data from a specific provider
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [apple_health, google_fit, fitbit, garmin]
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for data range (defaults to 30 days ago)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for data range (defaults to current date)
 *     responses:
 *       200:
 *         description: Sync successful
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Connection not found
 */
router.post('/:provider', authenticateJwt, syncController.syncProvider);

/**
 * @swagger
 * /sync:
 *   post:
 *     summary: Sync health data from all active connections
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for data range (defaults to 30 days ago)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for data range (defaults to current date)
 *     responses:
 *       200:
 *         description: Sync successful
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateJwt, syncController.syncAll);

/**
 * @swagger
 * /sync/status:
 *   get:
 *     summary: Get sync status for all connections
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync status for all connections
 *       401:
 *         description: Unauthorized
 */
router.get('/status', authenticateJwt, syncController.getSyncStatus);

export default router;