import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const possiblePaths = [
  path.resolve(__dirname, '../../../docs/openapi.yaml'), // Local dev from Backend/src/routes
  path.resolve(__dirname, '../../docs/openapi.yaml'),    // Container /app/docs/openapi.yaml
];
const openApiPath = possiblePaths.find((p) => fs.existsSync(p)) || possiblePaths[0];

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
