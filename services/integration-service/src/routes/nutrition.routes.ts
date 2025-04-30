// src/routes/nutrition.routes.ts
import { Router } from 'express';
import { NutritionController } from '../controllers/nutrition.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { validate, integrationValidationSchemas } from '../middlewares/validation.middleware';

const router = Router();
const nutritionController = new NutritionController();

/**
 * @swagger
 * /nutrition:
 *   get:
 *     summary: Get user nutrition records
 *     tags: [Nutrition]
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
 *         name: meal_type
 *         schema:
 *           type: string
 *           enum: [breakfast, lunch, dinner, snack]
 *         description: Filter by meal type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: List of nutrition records
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateJwt, nutritionController.getNutritionRecords);

/**
 * @swagger
 * /nutrition/{id}:
 *   get:
 *     summary: Get nutrition record by ID
 *     tags: [Nutrition]
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
 *         description: Nutrition record details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Nutrition record not found
 */
router.get('/:id', authenticateJwt, nutritionController.getNutritionById);

/**
 * @swagger
 * /nutrition:
 *   post:
 *     summary: Log a manual nutrition record
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - timestamp
 *               - meal_type
 *               - foods
 *             properties:
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               meal_type:
 *                 type: string
 *                 enum: [breakfast, lunch, dinner, snack]
 *               foods:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - quantity
 *                     - unit
 *                   properties:
 *                     name:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unit:
 *                       type: string
 *                     calories:
 *                       type: number
 *                     macronutrients:
 *                       type: object
 *                       properties:
 *                         protein:
 *                           type: number
 *                         carbohydrates:
 *                           type: number
 *                         fat:
 *                           type: number
 *                         fiber:
 *                           type: number
 *               total_calories:
 *                 type: number
 *               water_intake_ml:
 *                 type: number
 *     responses:
 *       201:
 *         description: Nutrition record created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', 
  authenticateJwt, 
  validate(integrationValidationSchemas.manualNutrition),
  nutritionController.createNutritionRecord
);

export default router;