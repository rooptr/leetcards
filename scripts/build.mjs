import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const outputDirectory = join(projectRoot, 'dist');
const workerPath = join(outputDirectory, 'sw.js');

async function collectFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(path));
    else files.push(path);
  }
  return files;
}

function toWorkerPath(path) {
  return `./${relative(outputDirectory, path).split(sep).join('/')}`;
}

await build();

const buildAssets = (await collectFiles(join(outputDirectory, 'assets')))
  .map(toWorkerPath)
  .sort();
const buildId = createHash('sha256')
  .update(buildAssets.join('\n'))
  .digest('hex')
  .slice(0, 12);

let worker = await readFile(workerPath, 'utf8');
worker = worker
  .replace('__LEETCARDS_BUILD_ID__', buildId)
  .replace(
    "'__LEETCARDS_BUILD_ASSETS__'",
    buildAssets.map((asset) => JSON.stringify(asset)).join(', '),
  );

if (worker.includes('__LEETCARDS_BUILD_')) {
  throw new Error('PWA build markers were not fully replaced.');
}

await writeFile(workerPath, worker);
console.log(`PWA cache ${buildId} includes ${buildAssets.length} versioned assets.`);
