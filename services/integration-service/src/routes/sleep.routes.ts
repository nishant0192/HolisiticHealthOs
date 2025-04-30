// src/routes/sleep.routes.ts
import { Router } from 'express';
import { SleepController } from '../controllers/sleep.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { validate, integrationValidationSchemas } from '../middlewares/validation.middleware';

const router = Router();
const sleepController = new SleepController();

/**
 * @swagger
 * /sleep:
 *   get:
 *     summary: Get user sleep records
 *     tags: [Sleep]
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
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: List of sleep records
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateJwt, sleepController.getSleepRecords);

/**
 * @swagger
 * /sleep/{id}:
 *   get:
 *     summary: Get sleep record by ID
 *     tags: [Sleep]
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
 *         description: Sleep record details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Sleep record not found
 */
router.get('/:id', authenticateJwt, sleepController.getSleepById);

/**
 * @swagger
 * /sleep:
 *   post:
 *     summary: Log a manual sleep record
 *     tags: [Sleep]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - start_time
 *               - end_time
 *             properties:
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *               duration_seconds:
 *                 type: number
 *               sleep_stages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     stage:
 *                       type: string
 *                       enum: [awake, light, deep, rem]
 *                     start_time:
 *                       type: string
 *                       format: date-time
 *                     end_time:
 *                       type: string
 *                       format: date-time
 *                     duration_seconds:
 *                       type: number
 *     responses:
 *       201:
 *         description: Sleep record created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', 
  authenticateJwt, 
  validate(integrationValidationSchemas.manualSleep),
  sleepController.createSleepRecord
);

export default router;