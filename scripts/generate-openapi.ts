import { openApiDocument } from '../src/lib/schemas.js';
import { writeFileSync } from 'node:fs';

const specPath = './dashboard/src/api/openapi.json';
writeFileSync(specPath, JSON.stringify(openApiDocument, null, 2));
console.log(`OpenAPI spec written to ${specPath}`);
