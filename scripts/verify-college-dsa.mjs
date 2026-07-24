import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { collegeDsaLabs } from '../src/data/collegeDsaLabs.js';

const compiler = existsSync('C:\\msys64\\ucrt64\\bin\\gcc.exe')
  ? 'C:\\msys64\\ucrt64\\bin\\gcc.exe'
  : 'gcc';
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'leetcards-college-dsa-'));

try {
  for (const lab of collegeDsaLabs) {
    const sourcePath = join(temporaryDirectory, `${lab.id}.c`);
    const executablePath = join(temporaryDirectory, `${lab.id}.exe`);
    await writeFile(sourcePath, lab.source, 'utf8');
    const result = spawnSync(
      compiler,
      ['-std=c17', '-Wall', '-Wextra', '-Wpedantic', '-Werror', sourcePath, '-o', executablePath],
      { encoding: 'utf8' },
    );
    if (result.status !== 0) {
      throw new Error(`${lab.id} failed to compile:\n${result.stdout}\n${result.stderr}`);
    }
  }
  console.log(`Compiled ${collegeDsaLabs.length} college DSA C programs warning-clean.`);
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
