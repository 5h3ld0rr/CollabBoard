import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'node:path';
import fs from 'node:fs';

const router = Router();

const openapiPath = path.resolve('../docs/openapi.yaml');
let swaggerDocument = {};

if (fs.existsSync(openapiPath)) {
  swaggerDocument = YAML.load(openapiPath);
}

// Serve interactive Swagger UI
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerDocument));

export default router;
