import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const openApiPath = path.resolve(__dirname, '../../../docs/openapi.yaml');

let swaggerDocument = {};
if (fs.existsSync(openApiPath)) {
  try {
    swaggerDocument = YAML.load(openApiPath);
  } catch (err) {
    console.error('Failed to load OpenAPI document:', err);
  }
}

// Serve interactive Swagger UI
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerDocument));

export default router;
