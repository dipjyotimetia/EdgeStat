import { buildSync } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { gzipSync } from 'zlib';

// Build the tracking snippet
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

// Write to public/s.js
mkdirSync('../public', { recursive: true });
writeFileSync('../public/s.js', code);

// Also build the full SDK
buildSync({
  entryPoints: ['src/client.ts'],
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2020',
  outfile: '../public/edgestat.mjs',
});

console.log('SDK built successfully');
