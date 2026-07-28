import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  qualcommPrepProfiles,
} from '../src/data/qualcommPrep.js';

const nonLinuxProfiles = Object.entries(qualcommPrepProfiles)
  .filter(([topicId]) => !topicId.startsWith('qualcomm-linux-'));

function compilerAvailable(command) {
  return spawnSync(command, ['--version'], { encoding: 'utf8' }).status === 0;
}

test('every non-Linux Qualcomm C and C++ snippet passes strict syntax checking', async (context) => {
  if (!compilerAvailable('gcc') || !compilerAvailable('g++')) {
    context.skip('gcc and g++ are required for Qualcomm snippet verification');
    return;
  }

  const directory = await mkdtemp(join(tmpdir(), 'leetcards-qualcomm-'));
  try {
    for (const [topicId, profile] of nonLinuxProfiles) {
      for (const [index, example] of profile.codeExamples.entries()) {
        const variants = [
          example.c && {
            language: 'C17',
            compiler: 'gcc',
            extension: 'c',
            standard: 'c17',
            code: example.c,
          },
          example.cpp && {
            language: 'C++20',
            compiler: 'g++',
            extension: 'cpp',
            standard: 'c++20',
            code: example.cpp,
          },
          example.code && !/(?:bash|shell)/i.test(example.language ?? '') && {
            language: example.language ?? 'C17',
            compiler: /C\+\+/i.test(example.language ?? '') ? 'g++' : 'gcc',
            extension: /C\+\+/i.test(example.language ?? '') ? 'cpp' : 'c',
            standard: /C\+\+/i.test(example.language ?? '') ? 'c++20' : 'c17',
            code: example.code,
          },
        ].filter(Boolean);

        for (const variant of variants) {
          const path = join(directory, `${topicId}-${index}.${variant.extension}`);
          await writeFile(path, variant.code, 'utf8');
          const result = spawnSync(
            variant.compiler,
            [
              `-std=${variant.standard}`,
              '-Wall',
              '-Wextra',
              '-Wpedantic',
              '-fsyntax-only',
              path,
            ],
            { encoding: 'utf8' },
          );

          assert.equal(
            result.status,
            0,
            `${topicId} ${variant.language} example does not compile:\n${result.stdout}${result.stderr}`,
          );
        }
      }
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
