import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { validate, userValidationSchemas } from '../middlewares/validation.middleware';

const router = Router();
const profileController = new ProfileController();

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.get('/', authenticateJwt, profileController.getProfile);

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Profile]
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
 *                 enum: [male, female, non-binary, prefer_not_to_say, other]
 *               phone_number:
 *                 type: string
 *               profile_picture:
 *                 type: string
 *                 format: uri
 *               preferred_units:
 *                 type: object
 *                 properties:
 *                   weight:
 *                     type: string
 *                     enum: [kg, lb]
 *                   height:
 *                     type: string
 *                     enum: [cm, in]
 *                   distance:
 *                     type: string
 *                     enum: [km, mi]
 *               notification_preferences:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: boolean
 *                   push:
 *                     type: boolean
 *                   sms:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/', 
  authenticateJwt, 
  validate(userValidationSchemas.updateProfile),
  profileController.updateProfile
);

export default router;