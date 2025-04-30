import { Router } from 'express';
import { HealthProfileController } from '../controllers/health-profile.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { validate, userValidationSchemas } from '../middlewares/validation.middleware';

const router = Router();
const healthProfileController = new HealthProfileController();

/**
 * @swagger
 * /health-profile:
 *   get:
 *     summary: Get user health profile
 *     tags: [Health Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Health profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateJwt, healthProfileController.getHealthProfile);

/**
 * @swagger
 * /health-profile:
 *   put:
 *     summary: Update user health profile
 *     tags: [Health Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               health_conditions:
 *                 type: array
 *                 items:
 *                   type: string
 *               medications:
 *                 type: array
 *                 items:
 *                   type: string
 *               allergies:
 *                 type: array
 *                 items:
 *                   type: string
 *               dietary_preferences:
 *                 type: array
 *                 items:
 *                   type: string
 *               activity_level:
 *                 type: string
 *                 enum: [sedentary, light, moderate, active, very_active]
 *               sleep_goal_hours:
 *                 type: number
 *                 minimum: 3
 *                 maximum: 12
 *               fitness_experience:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               motivation_factors:
 *                 type: array
 *                 items:
 *                   type: string
 *               stress_level:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10
 *               height_cm:
 *                 type: number
 *                 minimum: 50
 *                 maximum: 300
 *               weight_kg:
 *                 type: number
 *                 minimum: 20
 *                 maximum: 500
 *     responses:
 *       200:
 *         description: Health profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put(
    '/',
    authenticateJwt,
    validate(userValidationSchemas.updateHealthProfile),
    healthProfileController.updateHealthProfile
);

/**
 * @swagger
 * /health-profile/measurements/latest:
 *   get:
 *     summary: Get latest health measurements
 *     tags: [Health Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Latest measurements retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/measurements/latest', authenticateJwt, healthProfileController.getLatestMeasurements);

/**
 * @swagger
 * /health-profile/measurements:
 *   put:
 *     summary: Update health measurements
 *     tags: [Health Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               height:
 *                 type: number
 *                 description: User's height value (in cm)
 *               weight:
 *                 type: number
 *                 description: User's weight value (in kg)
 *     responses:
 *       200:
 *         description: Measurements updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put(
    '/measurements',
    authenticateJwt,
    // Optionally, you can add a validation middleware for height and weight if you add the schema
    healthProfileController.updateMeasurements
);

export default router;
