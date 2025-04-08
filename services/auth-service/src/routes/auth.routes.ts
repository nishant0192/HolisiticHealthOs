import { RequestHandler, Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { TokenController } from '../controllers/token.controller';
import { validate, authValidationSchemas } from '../middlewares/validation.middleware';
import { authenticateJwt } from '../middlewares/auth.middleware';

const router = Router();
const authController = new AuthController();
const tokenController = new TokenController();

// Public routes
router.post('/register', validate(authValidationSchemas.register), authController.register);
router.post('/login', validate(authValidationSchemas.login), authController.login);
router.get('/verify/:token', authController.verifyEmail);
router.post('/forgot-password', validate(authValidationSchemas.requestPasswordReset), authController.requestPasswordReset);
router.post('/reset-password/:token', validate(authValidationSchemas.resetPassword), authController.resetPassword);
router.post('/refresh-token', validate(authValidationSchemas.refreshToken), tokenController.refreshToken as RequestHandler);
// Protected routes
router.post('/logout', authenticateJwt, authController.logout);
router.get('/validate-token', authenticateJwt, tokenController.validateToken as RequestHandler);

export default router;
