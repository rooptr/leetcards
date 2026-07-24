import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const readProjectFile = (...segments) => readFile(join(projectRoot, ...segments));
const readProjectText = (...segments) => readFile(join(projectRoot, ...segments), 'utf8');

test('web app manifest defines an installable scoped Leetcards application', async () => {
  const manifest = JSON.parse(await readProjectFile('public', 'manifest.webmanifest'));

  assert.equal(manifest.id, '/leetcards/');
  assert.equal(manifest.start_url, '/leetcards/');
  assert.equal(manifest.scope, '/leetcards/');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.name, 'Leetcards: Systems Learning');
  assert.equal(manifest.short_name, 'Leetcards');
  assert.equal(manifest.background_color, '#f5f1e9');
  assert.equal(manifest.theme_color, '#f5f1e9');
  assert.deepEqual(
    manifest.icons.map(({ src, sizes, purpose }) => ({ src, sizes, purpose })),
    [
      { src: 'icons/icon-192.png', sizes: '192x192', purpose: 'any' },
      { src: 'icons/icon-512.png', sizes: '512x512', purpose: 'any' },
      { src: 'icons/icon-maskable-512.png', sizes: '512x512', purpose: 'maskable' },
    ],
  );
});

test('PWA raster icons are valid PNG files with their declared dimensions', async () => {
  for (const [name, expectedSize] of [
    ['apple-touch-icon-180.png', 180],
    ['icon-192.png', 192],
    ['icon-512.png', 512],
    ['icon-maskable-512.png', 512],
  ]) {
    const image = await readProjectFile('public', 'icons', name);
    assert.deepEqual(
      [...image.subarray(0, 8)],
      [137, 80, 78, 71, 13, 10, 26, 10],
      `${name} is not a PNG`,
    );
    assert.equal(image.readUInt32BE(16), expectedSize, `${name} width drifted`);
    assert.equal(image.readUInt32BE(20), expectedSize, `${name} height drifted`);
  }
});

test('service worker caches only same-origin GET resources and supports safe updates', async () => {
  const worker = await readProjectText('public', 'sw.js');

  assert.match(worker, /request\.method !== 'GET'/);
  assert.match(worker, /url\.origin !== self\.location\.origin/);
  assert.match(worker, /response\.ok && response\.type === 'basic'/);
  assert.match(worker, /request\.mode === 'navigate'/);
  assert.match(worker, /cache\.match\('\.\/index\.html'\)/);
  assert.match(worker, /cache\.match\('\.\/offline\.html'\)/);
  assert.match(worker, /SKIP_WAITING/);
  assert.match(worker, /__LEETCARDS_BUILD_ID__/);
  assert.match(worker, /\.\.\.BUILD_ASSETS/);
  assert.doesNotMatch(worker, /https?:\/\//);
});

test('application registers the scoped worker and exposes quiet install, update, and offline states', async () => {
  const main = await readProjectText('src', 'main.jsx');
  const registration = await readProjectText('src', 'pwa.js');
  const app = await readProjectText('src', 'App.jsx');
  const control = await readProjectText('src', 'components', 'PwaControl.jsx');

  assert.match(main, /registerPwa\(\)/);
  assert.match(registration, /import\.meta\.env\.BASE_URL}sw\.js/);
  assert.match(registration, /scope: import\.meta\.env\.BASE_URL/);
  assert.match(registration, /beforeinstallprompt/);
  assert.match(registration, /controllerchange/);
  assert.doesNotMatch(app, /PwaControl/);
  assert.match(main, /<PwaControl \/>/);
  assert.match(control, /createPortal\(control, portalTarget\)/);
  assert.match(control, /'Install app'/);
  assert.match(control, /Update app/);
  assert.match(control, /role="status">Offline</);
});

test('production build injects versioned Vite assets into the service worker', async () => {
  const packageJson = JSON.parse(await readProjectText('package.json'));
  const buildScript = await readProjectText('scripts', 'build.mjs');

  assert.equal(packageJson.scripts.build, 'node scripts/build.mjs');
  assert.match(buildScript, /await build\(\)/);
  assert.match(buildScript, /collectFiles\(join\(outputDirectory, 'assets'\)\)/);
  assert.match(buildScript, /createHash\('sha256'\)/);
  assert.match(buildScript, /PWA build markers were not fully replaced/);
});

test('document metadata connects the manifest, app icons, and service-worker CSP', async () => {
  const html = await readProjectText('index.html');

  assert.match(html, /rel="manifest" href="\/leetcards\/manifest\.webmanifest"/);
  assert.match(html, /rel="apple-touch-icon"/);
  assert.match(html, /apple-mobile-web-app-capable" content="yes"/);
  assert.match(html, /worker-src 'self'/);
  assert.doesNotMatch(html, /worker-src 'none'/);
});
