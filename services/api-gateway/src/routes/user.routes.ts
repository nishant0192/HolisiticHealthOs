import { Router } from 'express';
import { validateToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/async-handler';
import { proxyToService } from '../utils/service-proxy';

const router = Router();

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', 
  validateToken, 
  asyncHandler(proxyToService('user', '/users/profile'))
);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *               phone_number:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', 
  validateToken, 
  asyncHandler(proxyToService('user', '/users/profile'))
);

/**
 * @swagger
 * /users/health-profile:
 *   get:
 *     summary: Get user health profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved health profile
 *       401:
 *         description: Unauthorized
 */
router.get('/health-profile',
  validateToken,
  asyncHandler(proxyToService('user', '/users/health-profile'))
);

/**
 * @swagger
 * /users/health-profile:
 *   put:
 *     summary: Update health profile
 *     tags: [Users]
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
 *               sleep_goal_hours:
 *                 type: number
 *               fitness_experience:
 *                 type: string
 *     responses:
 *       200:
 *         description: Health profile updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.put('/health-profile',
  validateToken,
  asyncHandler(proxyToService('user', '/users/health-profile'))
);

export default router;