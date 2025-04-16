// src/routes/activity.routes.ts
import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { validate, integrationValidationSchemas } from '../middlewares/validation.middleware';

const router = Router();
const activityController = new ActivityController();

/**
 * @swagger
 * /activity:
 *   get:
 *     summary: Get user activities
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: activity_type
 *         schema:
 *           type: string
 *         description: Filter by activity type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: List of activities
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateJwt, activityController.getActivities);

/**
 * @swagger
 * /activity/{id}:
 *   get:
 *     summary: Get activity by ID
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Activity details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Activity not found
 */
router.get('/:id', authenticateJwt, activityController.getActivityById);

/**
 * @swagger
 * /activity:
 *   post:
 *     summary: Log a manual activity
 *     tags: [Activity]
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
 *               duration_seconds:
 *                 type: number
 *               distance:
 *                 type: number
 *               distance_unit:
 *                 type: string
 *               calories_burned:
 *                 type: number
 *               steps:
 *                 type: number
 *     responses:
 *       201:
 *         description: Activity created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', 
  authenticateJwt, 
  validate(integrationValidationSchemas.manualActivity),
  activityController.createActivity
);

export default router;