// src/routes/connection.routes.ts
import { Router } from 'express';
import { ConnectionController } from '../controllers/connection.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { validate, integrationValidationSchemas } from '../middlewares/validation.middleware';

const router = Router();
const connectionController = new ConnectionController();

/**
 * @swagger
 * /connection:
 *   get:
 *     summary: Get all active connections for a user
 *     tags: [Connection]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active connections
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateJwt, connectionController.getActiveConnections);

/**
 * @swagger
 * /connection/{provider}:
 *   get:
 *     summary: Get a specific connection by provider
 *     tags: [Connection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [apple_health, google_fit, fitbit, garmin]
 *     responses:
 *       200:
 *         description: Connection details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Connection not found
 */
router.get('/:provider', authenticateJwt, connectionController.getConnectionByProvider);

/**
 * @swagger
 * /connection:
 *   post:
 *     summary: Create a new connection
 *     tags: [Connection]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [apple_health, google_fit, fitbit, garmin]
 *               code:
 *                 type: string
 *                 description: OAuth authorization code (required for some providers)
 *               access_token:
 *                 type: string
 *                 description: Direct access token (for Apple Health)
 *               refresh_token:
 *                 type: string
 *                 description: Direct refresh token (for Apple Health)
 *     responses:
 *       201:
 *         description: Connection created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', 
  authenticateJwt, 
  validate(integrationValidationSchemas.createConnection),
  connectionController.createConnection
);

/**
 * @swagger
 * /connection/{id}:
 *   delete:
 *     summary: Delete a connection
 *     tags: [Connection]
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
 *         description: Connection deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Connection not found
 */
router.delete('/:id', authenticateJwt, connectionController.deleteConnection);

/**
 * @swagger
 * /connection/{provider}/auth-url:
 *   get:
 *     summary: Get OAuth authorization URL for a provider
 *     tags: [Connection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google_fit, fitbit, garmin]
 *     responses:
 *       200:
 *         description: Authorization URL
 *       400:
 *         description: Unsupported provider
 *       401:
 *         description: Unauthorized
 */
router.get('/:provider/auth-url', authenticateJwt, connectionController.getAuthorizationUrl);

/**
 * @swagger
 * /connection/{provider}/callback:
 *   get:
 *     summary: OAuth callback endpoint
 *     tags: [Connection]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google_fit, fitbit, garmin]
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect to frontend with success/error
 */
router.get('/:provider/callback', connectionController.handleOAuthCallback);

export default router;