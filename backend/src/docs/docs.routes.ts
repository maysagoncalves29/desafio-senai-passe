import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './openapi.js';

export function createDocsRouter(): Router {
  const router = Router();
  router.get('/openapi.json', (_req, res) => {
    res.json(openApiDocument);
  });
  router.use('/', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  return router;
}
