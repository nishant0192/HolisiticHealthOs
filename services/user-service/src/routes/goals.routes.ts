import { Router } from 'express';
import { GoalsController } from '../controllers/goals.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { validate, userValidationSchemas } from '../middlewares/validation.middleware';

const router = Router();
const goalsController = new GoalsController();

/**
 * @swagger
 * /goals:
 *   get:
 *     summary: Get all user goals
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, abandoned]
 *         description: Filter goals by status
 *     responses:
 *       200:
 *         description: Goals retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateJwt, goalsController.getAllGoals);

/**
 * @swagger
 * /goals/{id}:
 *   get:
 *     summary: Get a specific goal by ID
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Goal ID
 *     responses:
 *       200:
 *         description: Goal retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Goal not found
 */
router.get('/:id', authenticateJwt, goalsController.getGoalById);

/**
 * @swagger
 * /goals:
 *   post:
 *     summary: Create a new goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - goal_type
 *               - target
 *               - unit
 *               - start_date
 *               - target_date
 *             properties:
 *               goal_type:
 *                 type: string
 *                 enum: [weight, steps, distance, sleep, nutrition, water, meditation, custom]
 *               target:
 *                 type: number
 *               unit:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *               target_date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Goal created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/', 
  authenticateJwt, 
  validate(userValidationSchemas.createGoal),
  goalsController.createGoal
);

/**
 * @swagger
 * /goals/{id}:
 *   put:
 *     summary: Update a goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Goal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               target:
 *                 type: number
 *               target_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [active, completed, abandoned]
 *               progress:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Goal updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Goal not found
 */
router.put(
  '/:id', 
  authenticateJwt, 
  validate(userValidationSchemas.updateGoal),
  goalsController.updateGoal
);

/**
 * @swagger
 * /goals/{id}:
 *   delete:
 *     summary: Delete a goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Goal ID
 *     responses:
 *       200:
 *         description: Goal deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Goal not found
 */
router.delete('/:id', authenticateJwt, goalsController.deleteGoal);

export default router;