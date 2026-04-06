import { buildSync } from 'esbuild';
import { writeFileSync, mkdirSync } from 'fs';
import { gzipSync } from 'zlib';

// Build the tracking snippet (IIFE → Worker asset at /s.js)
const result = buildSync({
  entryPoints: ['src/snippet.ts'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  write: false,
});

const code = new TextDecoder().decode(result.outputFiles[0].contents);
const gzipped = gzipSync(code);

console.log(`Snippet size: ${code.length} bytes (${gzipped.length} bytes gzipped)`);

if (gzipped.length > 2048) {
  console.warn(`WARNING: Snippet exceeds 2KB gzipped target (${gzipped.length} bytes)`);
}

// Write snippet to dashboard/dist/s.js (served by Worker)
mkdirSync('../dashboard/dist', { recursive: true });
writeFileSync('../dashboard/dist/s.js', code);

// Build the npm-publishable SDK (ESM → dist/index.mjs)
// packages: 'bundle' inlines @edgestat/schemas (private workspace pkg, not on npm)
// minify: false preserves tree-shaking for consumers
mkdirSync('dist', { recursive: true });
buildSync({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: false,
  format: 'esm',
  target: 'es2020',
  outfile: 'dist/index.mjs',
  packages: 'bundle',
});

console.log('SDK built successfully');
