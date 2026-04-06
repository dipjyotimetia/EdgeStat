import { openApiDocument } from '@edgestat/schemas';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const specPath = join(__dirname, '../dashboard/src/api/openapi.json');
writeFileSync(specPath, JSON.stringify(openApiDocument, null, 2));
console.log(`OpenAPI spec written to ${specPath}`);
