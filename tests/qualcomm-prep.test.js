import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { access, readFile, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';
import { allTopics, curriculum } from '../src/data/topics.js';
import { getLessonForTopic, validateLesson } from '../src/data/contentModel.js';
import {
  qualcommPrepProfiles,
} from '../src/data/qualcommPrep.js';
import { qualcommPrepProfilesLinux } from '../src/data/qualcommPrepProfilesLinux.js';
import { qualcommPrepTopics, qualcommTopicIds } from '../src/data/qualcommPrepTopics.js';
import {
  qualcommSourceAudit,
  qualcommSourceCoverage,
} from '../src/data/qualcommSourceCoverage.js';

const sourceRoot = resolve(process.cwd(), '..', 'qual');

async function fileHash(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

test('Qualcomm Prep is a distinct 45-lesson curriculum section', () => {
  const section = curriculum.find((item) => item.id === 'qualcomm-prep');

  assert.ok(section);
  assert.equal(section.topics.length, 45);
  assert.equal(qualcommPrepTopics.length, 45);
  assert.equal(qualcommTopicIds.size, 45);
  assert.equal(Object.keys(qualcommPrepProfiles).length, 45);
  assert.equal(new Set(qualcommPrepTopics.map((topic) => topic.id)).size, 45);
  assert.equal(allTopics.filter((topic) => topic.sectionId === 'qualcomm-prep').length, 45);
});

test('all 42 downloaded files and all 37 visual assets remain in the provenance ledger', () => {
  assert.equal(qualcommSourceAudit.sourceFileCount, 42);
  assert.equal(qualcommSourceAudit.visualAssetCount, 37);
  assert.equal(qualcommSourceAudit.extractionErrors, 0);
  assert.equal(qualcommSourceCoverage.length, 42);
  assert.equal(new Set(qualcommSourceCoverage.map((item) => item.path)).size, 42);
  assert.equal(
    qualcommSourceCoverage.reduce((total, item) => total + item.visualAssets, 0),
    37,
  );

  for (const item of qualcommSourceCoverage) {
    assert.match(item.sha256, /^[a-f0-9]{64}$/, `${item.path} lacks a SHA-256`);
    assert.ok(item.topics.length > 0, `${item.path} is not mapped to a lesson`);
    for (const topicId of item.topics) {
      assert.ok(qualcommTopicIds.has(topicId), `${item.path} maps to unknown ${topicId}`);
    }
  }

  for (const group of qualcommSourceAudit.duplicateGroups) {
    for (const path of group) {
      assert.ok(
        qualcommSourceCoverage.some((item) => item.path === path),
        `duplicate source disappeared: ${path}`,
      );
    }
  }
});

test('the local Downloads/qual folder exactly matches the audited filenames and hashes', async (context) => {
  try {
    await access(sourceRoot, constants.R_OK);
  } catch {
    context.skip('Downloads/qual is not present on this host');
    return;
  }

  const entries = await readdir(sourceRoot, { recursive: true, withFileTypes: true });
  const localFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.parentPath
      ? resolve(entry.parentPath, entry.name)
      : resolve(sourceRoot, entry.name));
  const localNames = localFiles
    .map((path) => path.slice(sourceRoot.length + 1).replaceAll('\\', '/'))
    .sort();
  const auditedNames = qualcommSourceCoverage.map((item) => item.path).sort();

  assert.deepEqual(localNames, auditedNames);

  const auditedByName = new Map(qualcommSourceCoverage.map((item) => [item.path, item]));
  for (const path of localFiles) {
    const relative = path.slice(sourceRoot.length + 1).replaceAll('\\', '/');
    assert.equal(await fileHash(path), auditedByName.get(relative).sha256, `${relative} changed`);
  }
});

test('every Qualcomm lesson is definition-first, explanatory, visual, and traceable to source prompts', () => {
  for (const topic of qualcommPrepTopics) {
    const profile = qualcommPrepProfiles[topic.id];
    const lesson = getLessonForTopic(topic.id);

    assert.ok(profile, `${topic.id} has no profile`);
    assert.ok(profile.definition.length >= 90, `${topic.id} definition is shallow`);
    assert.ok(profile.application.length >= 70, `${topic.id} application is shallow`);
    assert.ok(profile.explanation.length >= 120, `${topic.id} explanation is shallow`);
    assert.ok(profile.concepts.length >= 5, `${topic.id} lacks concept definitions`);
    assert.ok(profile.steps.length >= 4, `${topic.id} lacks a reasoning trace`);
    assert.ok(profile.sourcePrompts.length >= 2, `${topic.id} lacks source provenance`);
    assert.ok(profile.failure.length >= 70, `${topic.id} lacks failure analysis`);
    assert.ok(profile.practice.length >= 55, `${topic.id} lacks practice`);

    const validation = validateLesson(lesson);
    assert.equal(validation.valid, true, `${topic.id}: ${validation.errors.join(', ')}`);
    assert.equal(lesson.blocks[0].type, 'definition');
    assert.ok(lesson.blocks.some((block) => block.type === 'application'));
    assert.ok(lesson.blocks.some((block) => block.type === 'concepts'));
    assert.ok(lesson.blocks.some((block) => block.type === 'source-prompts'));
    assert.ok(lesson.blocks.some((block) => block.type === 'visual'));
  }
});

test('Qualcomm Linux lessons explain both C and C++ unless the source explicitly chooses shell', () => {
  for (const [topicId, profile] of Object.entries(qualcommPrepProfilesLinux)) {
    assert.match(profile.explanation, /\bC\b/, `${topicId} omits the C view`);
    assert.match(profile.explanation, /C\+\+/, `${topicId} omits the C++ view`);

    for (const example of profile.codeExamples) {
      const isShell = /(?:bash|shell)/i.test(example.language ?? '');
      assert.ok(
        isShell || (typeof example.c === 'string' && typeof example.cpp === 'string'),
        `${topicId} has an unpaired non-shell implementation`,
      );
    }
  }
});

test('the collection includes the recovered coding screenshots and correction lessons', () => {
  const ids = new Set(qualcommPrepTopics.map((topic) => topic.id));
  for (const id of [
    'qualcomm-problem-bitwise-recurrence',
    'qualcomm-problem-k-distinct-window',
    'qualcomm-problem-palindrome-intervals',
    'qualcomm-problem-prefix-cost',
    'qualcomm-problem-dam-design',
    'qualcomm-problem-clarification',
    'qualcomm-embedded-feedback',
    'qualcomm-puzzles-cubes-cuts',
  ]) {
    assert.ok(ids.has(id), `missing recovered topic ${id}`);
  }

  assert.match(
    qualcommPrepProfiles['qualcomm-puzzles-cubes-cuts'].failure,
    /11 or 15/,
  );
  assert.match(
    qualcommPrepProfiles['qualcomm-c-output-semantics'].failure,
    /undefined|portable/i,
  );
});

test('the home screen presents Qualcomm Prep separately from the core category grid', async () => {
  const sourceText = await readFile(
    resolve(process.cwd(), 'src', 'components', 'LibraryView.jsx'),
    'utf8',
  );
  const appText = await readFile(resolve(process.cwd(), 'src', 'App.jsx'), 'utf8');

  assert.match(sourceText, /className="qualcomm-entry"/);
  assert.match(sourceText, /curriculum\.filter\(\(category\) => category\.id !== 'qualcomm-prep'\)/);
  assert.match(sourceText, /42 source files/);
  assert.match(sourceText, /37 visual assets inspected/);
  assert.match(appText, /openQualcommPrep/);
});
