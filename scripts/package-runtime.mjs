import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const output = resolve(root, '.deploy-runtime');
const standalone = resolve(root, '.next/standalone');
if (!existsSync(resolve(standalone, 'server.js'))) {
  throw new Error('Run pnpm run build with output=standalone before packaging.');
}
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(standalone, output, { recursive: true, verbatimSymlinks: true });
mkdirSync(resolve(output, '.next'), { recursive: true });
cpSync(resolve(root, '.next/static'), resolve(output, '.next/static'), { recursive: true, verbatimSymlinks: true });
cpSync(resolve(root, 'public'), resolve(output, 'public'), { recursive: true, dereference: true });
rmSync(resolve(output, '.next/cache'), { recursive: true, force: true });
writeFileSync(resolve(output, 'DEPLOYMENT.json'), JSON.stringify({
  revision: process.env.GITHUB_SHA || null,
  applications: ['threejs', 'tutorial'],
  entry: 'server.js',
  node: process.version,
}, null, 2) + '\n');
console.log('Packaged standalone server, static chunks and public assets in .deploy-runtime');
