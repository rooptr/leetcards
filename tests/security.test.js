import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const ignoredDirectories = new Set(['.git', 'dist', 'node_modules', 'coverage']);
const textExtensions = new Set([
  '.css', '.html', '.js', '.json', '.jsx', '.md', '.mjs', '.txt', '.webmanifest',
  '.yml', '.yaml',
]);

const extensionOf = (path) => {
  const index = path.lastIndexOf('.');
  return index < 0 ? '' : path.slice(index).toLowerCase();
};

async function collectTextFiles(directory = projectRoot) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectTextFiles(path));
    } else if (textExtensions.has(extensionOf(entry.name))) {
      files.push(path);
    }
  }
  return files;
}

test('publishable source contains no recognizable credentials or private keys', async () => {
  const secretPatterns = [
    ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
    ['AWS access key', /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
    ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/],
    ['OpenAI-style secret', /\bsk-[A-Za-z0-9_-]{20,}\b/],
    ['Google API key', /\bAIza[0-9A-Za-z_-]{20,}\b/],
    ['Slack token', /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/],
    ['credential assignment', /\b(?:api[_-]?key|secret|token|password)\s*[:=]\s*["'][^"']{8,}["']/i],
    ['database connection string', /\b(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis):\/\//i],
  ];

  for (const path of await collectTextFiles()) {
    if (relative(projectRoot, path) === join('tests', 'security.test.js')) continue;
    const source = await readFile(path, 'utf8');
    for (const [label, pattern] of secretPatterns) {
      assert.equal(
        pattern.test(source),
        false,
        `${relative(projectRoot, path)} contains a recognizable ${label}`,
      );
    }
  }
});

test('runtime source avoids raw HTML execution and outbound data APIs', async () => {
  const sourceFiles = (await collectTextFiles(join(projectRoot, 'src')))
    .filter((path) => ['.js', '.jsx'].includes(extensionOf(path)));
  const banned = [
    ['raw React HTML', /dangerouslySetInnerHTML/],
    ['DOM HTML assignment', /\b(?:innerHTML|outerHTML)\s*=/],
    ['dynamic code execution', /\b(?:eval\s*\(|new\s+Function\b)/],
    ['document stream writes', /\bdocument\.write\s*\(/],
    ['outbound HTTP request', /\bfetch\s*\(/],
    ['WebSocket connection', /\bWebSocket\s*\(/],
    ['persistent browser storage', /\b(?:localStorage|sessionStorage)\b/],
  ];

  for (const path of sourceFiles) {
    const source = await readFile(path, 'utf8');
    for (const [label, pattern] of banned) {
      assert.equal(pattern.test(source), false, `${relative(projectRoot, path)} uses ${label}`);
    }
  }
});

test('dependencies are pinned and build tools remain development-only', async () => {
  const packageJson = JSON.parse(await readFile(join(projectRoot, 'package.json'), 'utf8'));
  const allDependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  for (const [name, version] of Object.entries(allDependencies)) {
    assert.match(version, /^\d+\.\d+\.\d+$/, `${name} is not pinned exactly`);
  }
  assert.equal(packageJson.dependencies.vite, undefined);
  assert.equal(packageJson.dependencies['@vitejs/plugin-react'], undefined);
  assert.equal(packageJson.devDependencies.vite, '8.1.5');
  assert.equal(packageJson.devDependencies['@vitejs/plugin-react'], '6.0.4');
});

test('browser policy blocks executable third-party content and data submission', async () => {
  const html = await readFile(join(projectRoot, 'index.html'), 'utf8');
  assert.match(html, /http-equiv="Content-Security-Policy"/);
  assert.match(html, /script-src 'self'/);
  assert.match(html, /object-src 'none'/);
  assert.match(html, /frame-src 'none'/);
  assert.match(html, /form-action 'none'/);
  assert.match(html, /base-uri 'self'/);
  assert.match(html, /worker-src 'self'/);
  assert.doesNotMatch(html, /worker-src 'none'/);
  assert.doesNotMatch(html, /script-src\s+[^;]*'unsafe-inline'/);
  assert.match(html, /name="referrer" content="no-referrer"/);
  assert.match(html, /rel="manifest" href="\/leetcards\/manifest\.webmanifest"/);
  assert.doesNotMatch(html, /<script[^>]+src=["']https?:\/\//i);
});

test('repository hygiene excludes local secrets, dependencies, logs, and builds', async () => {
  const gitignore = await readFile(join(projectRoot, '.gitignore'), 'utf8');
  for (const ignored of ['node_modules/', 'dist/', '.env', '.env.*', '*.pem', '*.key', '*.log']) {
    assert.ok(gitignore.includes(ignored), `.gitignore does not exclude ${ignored}`);
  }
});

test('Pages workflow uses locked installs, tests, audits, and least-privilege jobs', async () => {
  const workflow = await readFile(
    join(projectRoot, '.github', 'workflows', 'deploy.yml'),
    'utf8',
  );
  assert.match(workflow, /^permissions: \{\}$/m);
  assert.match(workflow, /build:[\s\S]*permissions:\s*\n\s+contents: read/);
  assert.match(workflow, /deploy:[\s\S]*permissions:\s*\n\s+pages: write\s*\n\s+id-token: write/);
  assert.match(workflow, /run: npm ci/);
  assert.match(workflow, /run: npm audit --omit=dev --audit-level=high/);
  assert.match(workflow, /run: npm test/);
  assert.match(workflow, /run: npm run build/);
  assert.doesNotMatch(workflow, /pull_request_target|contents: write|actions: write/);
});
