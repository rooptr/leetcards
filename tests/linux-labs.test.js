import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { linuxLabs, linuxLabById } from '../src/data/linuxLabs.js';
import { allTopics } from '../src/data/topics.js';
import { getLessonForTopic } from '../src/data/contentModel.js';
import { searchTopics } from '../src/data/search.js';

const expectedIds = Array.from({ length: 22 }, (_, index) => `A${String(index + 1).padStart(2, '0')}`);
const requiredFlags = ['-std=c17', '-Wall', '-Wextra', '-Wpedantic'];

test('Linux labs expose exactly A01-A22 once and support lookup by ID', () => {
  const ids = linuxLabs.map((lab) => lab.id);

  assert.deepEqual(ids, expectedIds);
  assert.equal(new Set(ids).size, 22);
  assert.equal(linuxLabById.size, 22);
  for (const lab of linuxLabs) {
    assert.equal(linuxLabById.get(lab.id), lab);
  }
});

test('every Linux lab carries the complete implementation lesson contract', () => {
  for (const lab of linuxLabs) {
    for (const field of [
      'title',
      'mechanism',
      'stateDiagram',
      'source',
      'buildCommand',
      'runCommand',
      'expectedEvidence',
      'failureAnalysis',
      'verification',
    ]) {
      assert.equal(typeof lab[field], 'string', `${lab.id}.${field} must be a string`);
      const minimumLength = field === 'runCommand' ? 4 : 12;
      assert.ok(lab[field].trim().length >= minimumLength, `${lab.id}.${field} is too shallow`);
    }

    assert.ok(Array.isArray(lab.buildFlags), `${lab.id}.buildFlags must be an array`);
    for (const flag of requiredFlags) {
      assert.ok(lab.buildFlags.includes(flag), `${lab.id} omits ${flag}`);
      assert.ok(lab.buildCommand.includes(flag), `${lab.id} build command omits ${flag}`);
    }
    assert.match(lab.buildCommand, /^gcc /, `${lab.id} must document a gcc build`);
    assert.match(lab.source, /#include\s*</, `${lab.id} lacks real headers`);
    assert.match(lab.source, /\bint\s+main\s*\(/, `${lab.id} lacks a complete main`);
    assert.match(lab.source, /\breturn\b/, `${lab.id} source is incomplete`);
    assert.doesNotMatch(lab.source, /\b(?:TODO|TBD|pseudocode|implement here)\b/i, `${lab.id} contains a placeholder`);
    assert.match(lab.verification, /(?:grep|cmp|diff|test|timeout|awk|sort|sha|printf)/i, `${lab.id} verification is not deterministic`);
  }
});

test('thread and synchronization labs document pthread builds', () => {
  for (const id of ['A12', 'A13', 'A20', 'A21', 'A22']) {
    const lab = linuxLabById.get(id);
    assert.ok(lab.buildFlags.includes('-pthread'), `${id} needs -pthread`);
    assert.ok(lab.buildCommand.includes('-pthread'), `${id} command needs -pthread`);
  }
});

test('A05 separates orphan adoption from zombie retention and reaping', () => {
  const lab = linuxLabById.get('A05');
  const text = `${lab.mechanism}\n${lab.expectedEvidence}\n${lab.failureAnalysis}\n${lab.source}`;

  assert.match(text, /orphan/i);
  assert.match(text, /adopt/i);
  assert.match(text, /zombie/i);
  assert.match(text, /reap/i);
  assert.match(lab.source, /PR_SET_CHILD_SUBREAPER/);
  assert.match(lab.source, /waitpid\s*\(/);
  assert.match(lab.source, /\/proc\/%ld\/status/);
});

test('A19 is a localhost-only UDP allowlist without shell execution', () => {
  const lab = linuxLabById.get('A19');
  const text = `${lab.mechanism}\n${lab.failureAnalysis}\n${lab.source}`;

  assert.match(lab.source, /SOCK_DGRAM/);
  assert.match(lab.source, /INADDR_LOOPBACK/);
  assert.match(lab.source, /command_table/);
  assert.match(lab.source, /\brequest_id\b/);
  assert.match(lab.source, /\bpoll\s*\(/);
  assert.doesNotMatch(text, /\b(?:system|popen)\s*\(/);
  assert.doesNotMatch(text, /\/bin\/(?:sh|bash)/);
  assert.match(text, /does not guarantee|duplicate|delivery/i);
});

test('A01-A22 are searchable deep lessons in the Linux category', () => {
  const linuxLabTopics = allTopics.filter((topic) => topic.group === 'Linux Systems Programming Labs');
  assert.equal(linuxLabTopics.length, 22);

  for (const lab of linuxLabs) {
    const topicId = `linux-${lab.id.toLowerCase()}`;
    const topic = allTopics.find((entry) => entry.id === topicId);
    assert.ok(topic, `missing curriculum topic for ${lab.id}`);
    assert.equal(topic.sectionId, 'os-linux');
    assert.equal(topic.level, 'deep');

    const lesson = getLessonForTopic(topicId);
    assert.equal(lesson.depth, 'deep');
    assert.equal(lesson.labId, lab.id);
    const pair = lesson.blocks.find((block) => block.type === 'code-pair');
    assert.ok(pair, `${lab.id} missing paired implementations`);
    assert.equal(pair.variants.find((variant) => variant.id === 'c')?.code, lab.source);
    assert.ok(pair.variants.find((variant) => variant.id === 'cpp')?.code.length > 40);
    for (const type of ['prediction', 'visual', 'failure', 'practice', 'recall']) {
      assert.ok(lesson.blocks.some((block) => block.type === type), `${lab.id} missing ${type}`);
    }
    assert.equal(searchTopics(lab.id)[0].id, topicId);
  }
});

test('all Linux lab C and C++ sources compile warning-clean when GNU compilers run on Linux', {
  skip: process.platform !== 'linux' ? 'Linux GCC verification is unavailable on this host' : false,
}, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'leetcards-linux-labs-'));

  try {
    for (const lab of linuxLabs) {
      const sourcePath = join(directory, `${lab.id.toLowerCase()}.c`);
      const outputPath = join(directory, lab.id.toLowerCase());
      await writeFile(sourcePath, lab.source);
      const result = spawnSync('gcc', [...lab.buildFlags, sourcePath, '-o', outputPath], {
        encoding: 'utf8',
      });
      assert.equal(
        result.status,
        0,
        `${lab.id} C source failed to compile:\n${result.stdout}${result.stderr}`,
      );
      assert.equal(result.stderr, '', `${lab.id} C source emitted diagnostics:\n${result.stderr}`);

      const lesson = getLessonForTopic(`linux-${lab.id.toLowerCase()}`);
      const pair = lesson.blocks.find((block) => block.type === 'code-pair');
      const cppSource = pair.variants.find((variant) => variant.id === 'cpp').code;
      const cppSourcePath = join(directory, `${lab.id.toLowerCase()}.cpp`);
      const cppOutputPath = join(directory, `${lab.id.toLowerCase()}-cpp`);
      await writeFile(cppSourcePath, cppSource);
      const cppFlags = lab.buildFlags.map((flag) => (
        flag === '-std=c17' ? '-std=c++20' : flag
      ));
      const cppResult = spawnSync(
        'g++',
        [...cppFlags, cppSourcePath, '-o', cppOutputPath],
        { encoding: 'utf8' },
      );
      assert.equal(
        cppResult.status,
        0,
        `${lab.id} C++ source failed to compile:\n${cppResult.stdout}${cppResult.stderr}`,
      );
      assert.equal(
        cppResult.stderr,
        '',
        `${lab.id} C++ source emitted diagnostics:\n${cppResult.stderr}`,
      );
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
