import { Router } from 'express';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { swaggerConfig } from '../config';

const router = Router();

// Generate swagger specification
const swaggerSpec = swaggerJsDoc(swaggerConfig);

// Swagger UI setup
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec));

// Swagger JSON endpoint
router.get('/swagger.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

export default router;