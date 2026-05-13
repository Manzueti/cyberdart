import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cyberdartDir = join(__dirname, '..', '..');
const srcDir = join(cyberdartDir, 'browse', 'src');
const distDir = join(cyberdartDir, 'browse', 'dist');

console.log("Building Node-compatible server bundle (Windows JS version)...");

// Step 1: Transpile server.ts to a single .mjs bundle
try {
  execSync(`bun build "${join(srcDir, 'server.ts')}" --target=node --outfile "${join(distDir, 'server-node.mjs')}" --external playwright --external playwright-core --external diff --external "bun:sqlite" --external "@ngrok/ngrok"`, { stdio: 'inherit' });
} catch (e) {
  console.error("Bun build failed", e);
  process.exit(1);
}

// Step 2 & 3: Post-process & Create final file with polyfill header
let content = readFileSync(join(distDir, 'server-node.mjs'), 'utf8');

// Replace import.meta.dir
content = content.replace(/import\.meta\.dir/g, '__browseNodeSrcDir');

// Stub out bun:sqlite
content = content.replace(/import { Database } from "bun:sqlite";/g, 'const Database = null; // bun:sqlite stubbed on Node');

const lines = content.split('\n');
const firstLine = lines[0];
const rest = lines.slice(1).join('\n');

const polyfillHeader = `
// ── Windows Node.js compatibility (auto-generated) ──
import { fileURLToPath as _ftp } from "node:url";
import { dirname as _dn } from "node:path";
const __browseNodeSrcDir = _dn(_dn(_ftp(import.meta.url))) + "/src";
{ const _r = createRequire(import.meta.url); _r("./bun-polyfill.cjs"); }
// ── end compatibility ──
`;

const finalContent = firstLine + '\n' + polyfillHeader + '\n' + rest;
writeFileSync(join(distDir, 'server-node.mjs'), finalContent);

// Step 4: Copy polyfill to dist/
copyFileSync(join(srcDir, 'bun-polyfill.cjs'), join(distDir, 'bun-polyfill.cjs'));

console.log(`Node server bundle ready: ${join(distDir, 'server-node.mjs')}`);
