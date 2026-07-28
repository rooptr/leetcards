import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cppLessonProfiles } from '../src/data/cppLessonProfiles.js';

test('every authored C++ lesson example is accepted by a real compiler', async (context) => {
  const compiler = spawnSync('g++', ['--version'], { encoding: 'utf8' });
  if (compiler.status !== 0) {
    context.skip('g++ is unavailable on this host');
    return;
  }

  const directory = await mkdtemp(join(tmpdir(), 'leetcards-cpp-'));
  try {
    for (const [topicId, profile] of Object.entries(cppLessonProfiles)) {
      const standard = profile.standard === 'C++23' ? 'c++23' : 'c++20';
      const embeddedFiles = [...profile.code.matchAll(
        /^\/\/ ([A-Za-z0-9_-]+\.(?:hpp|cpp))\r?\n([\s\S]*?)(?=^\/\/ [A-Za-z0-9_-]+\.(?:hpp|cpp)\r?\n|(?![\s\S]))/gm,
      )];
      if (embeddedFiles.length > 1) {
        const cppFiles = [];
        for (const [, filename, contents] of embeddedFiles) {
          await writeFile(join(directory, filename), contents.trimStart(), 'utf8');
          if (filename.endsWith('.cpp')) {
            cppFiles.push(filename);
          }
        }
        assert.ok(cppFiles.length >= 1, `${topicId} has no compilable translation unit`);

        const result = spawnSync(
          'g++',
          [`-std=${standard}`, '-Wall', '-Wextra', '-Wpedantic', '-fsyntax-only', ...cppFiles],
          { cwd: directory, encoding: 'utf8' },
        );
        assert.equal(
          result.status,
          0,
          `${topicId} multi-file example does not compile as ${standard}:\n${result.stdout}${result.stderr}`,
        );
        continue;
      }

      const source = join(directory, `${topicId}.cpp`);
      await writeFile(source, profile.code, 'utf8');
      const result = spawnSync(
        'g++',
        [`-std=${standard}`, '-Wall', '-Wextra', '-Wpedantic', '-fsyntax-only', source],
        { encoding: 'utf8' },
      );

      assert.equal(
        result.status,
        0,
        `${topicId} does not compile as ${standard}:\n${result.stdout}${result.stderr}`,
      );
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
