import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  decodeCapturePayload,
  encodeCapturePayload,
  validateCapturePayload,
} from '../src/data/capture.js';
import { problemFamilySpecs } from '../src/data/dsaProblemFamilies.js';
import {
  matchCapturedQuestion,
  questionById,
  questionCards,
  searchQuestionCards,
} from '../src/data/questionCards.js';
import {
  parseRoute,
  routeForCapture,
  routeForQuestion,
  routeForQuestions,
} from '../src/data/routes.js';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));

const maximumSubarrayCapture = {
  version: 1,
  provider: 'leetcode',
  slug: 'maximum-subarray',
  title: 'Maximum Subarray',
  difficulty: 'medium',
  tags: ['Array', 'Dynamic Programming'],
  url: 'https://leetcode.com/problems/maximum-subarray/',
  capturedAt: '2026-07-25T06:30:00.000Z',
};

test('every authored problem family becomes a complete question card', () => {
  assert.equal(questionCards.length, Object.keys(problemFamilySpecs).length);
  assert.equal(questionById.size, questionCards.length);

  for (const card of questionCards) {
    assert.ok(card.title.length > 4, `${card.id} has no title`);
    assert.ok(card.summary.length > 40, `${card.id} has a weak summary`);
    assert.ok(card.recognition.length > 15, `${card.id} has no recognition clue`);
    assert.ok(card.invariant.length > 30, `${card.id} has no invariant`);
    assert.ok(card.move.length > 15, `${card.id} has no state move`);
    assert.ok(card.boundary.length > 15, `${card.id} has no misuse boundary`);
    assert.match(card.complexity, /O\(|Exponential/i, `${card.id} has no complexity`);
    assert.ok(card.cCode.length > 20, `${card.id} has no C implementation`);
    assert.ok(card.cppCode.length > 20, `${card.id} has no C++ implementation`);
    assert.ok(card.visual.frames.length >= 5, `${card.id} has no complete trace`);
    assert.equal(card.flashcards.length, 5, `${card.id} has incomplete recall cards`);
  }
});

test('question search covers titles, aliases, constraints, and groups', () => {
  assert.equal(searchQuestionCards('maximum subarray')[0].id, 'dsa-kadane');
  assert.equal(searchQuestionCards('house robber')[0].id, 'dsa-dp-take-skip');
  assert.equal(searchQuestionCards('two sum ii')[0].id, 'dsa-two-pointers');
  assert.equal(searchQuestionCards('maximum average subarray')[0].id, 'dsa-sliding');
  assert.ok(searchQuestionCards('backtracking').length >= 3);
  assert.equal(searchQuestionCards('no matching question').length, 0);
});

test('safe captures match only supported questions', () => {
  assert.equal(matchCapturedQuestion(maximumSubarrayCapture)?.id, 'dsa-kadane');
  assert.equal(matchCapturedQuestion({
    ...maximumSubarrayCapture,
    slug: 'coin-change-ii',
    title: 'Coin Change II',
    url: 'https://leetcode.com/problems/coin-change-ii/',
  })?.id, 'dsa-coin-change-ways');
  assert.equal(matchCapturedQuestion({
    ...maximumSubarrayCapture,
    slug: 'two-sum-ii-input-array-is-sorted',
    title: 'Two Sum II - Input Array Is Sorted',
    url: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/',
  })?.id, 'dsa-two-pointers');
  assert.equal(matchCapturedQuestion({
    ...maximumSubarrayCapture,
    slug: 'maximum-average-subarray-i',
    title: 'Maximum Average Subarray I',
    url: 'https://leetcode.com/problems/maximum-average-subarray-i/',
  })?.id, 'dsa-sliding');
  assert.equal(matchCapturedQuestion({
    ...maximumSubarrayCapture,
    slug: 'design-a-number-container-system',
    title: 'Design a Number Container System',
    url: 'https://leetcode.com/problems/design-a-number-container-system/',
  }), null);
});

test('capture payloads round-trip and reject untrusted sources', () => {
  const encoded = encodeCapturePayload(maximumSubarrayCapture);
  assert.deepEqual(decodeCapturePayload(encoded), maximumSubarrayCapture);

  assert.throws(
    () => validateCapturePayload({
      ...maximumSubarrayCapture,
      url: 'https://example.com/problems/maximum-subarray/',
    }),
    /must come from leetcode\.com/,
  );
  assert.throws(
    () => validateCapturePayload({
      ...maximumSubarrayCapture,
      slug: 'different-problem',
    }),
    /slug does not match/,
  );
  assert.throws(
    () => decodeCapturePayload('a'.repeat(16_001)),
    /too large/,
  );
});

test('question and capture routes are explicit and reversible', () => {
  assert.equal(routeForQuestions(), '#/questions');
  assert.deepEqual(parseRoute(routeForQuestions()), { view: 'questions' });
  assert.deepEqual(
    parseRoute(routeForQuestion('dsa-kadane')),
    { view: 'question', questionId: 'dsa-kadane' },
  );

  const payload = encodeCapturePayload(maximumSubarrayCapture);
  assert.deepEqual(
    parseRoute(routeForCapture(payload)),
    { view: 'capture', payload },
  );
});

test('safe extension uses temporary active-tab access only', async () => {
  const manifest = JSON.parse(
    await readFile(join(projectRoot, 'extension', 'manifest.json'), 'utf8'),
  );
  const popup = await readFile(join(projectRoot, 'extension', 'popup.js'), 'utf8');
  const popupHtml = await readFile(join(projectRoot, 'extension', 'popup.html'), 'utf8');

  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.version, '1.0.0');
  assert.deepEqual(manifest.permissions, ['activeTab', 'scripting']);
  assert.equal(manifest.host_permissions, undefined);
  assert.equal(manifest.optional_host_permissions, undefined);
  assert.doesNotMatch(JSON.stringify(manifest), /cookies|history|webRequest|<all_urls>|incognito/i);
  assert.match(manifest.content_security_policy.extension_pages, /script-src 'self'/);
  assert.match(manifest.content_security_policy.extension_pages, /object-src 'none'/);
  assert.deepEqual(Object.keys(manifest.icons), ['16', '32', '48', '128']);
  for (const icon of Object.values(manifest.icons)) {
    const contents = await readFile(join(projectRoot, 'extension', icon));
    assert.deepEqual([...contents.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  }
  assert.match(popup, /location\.origin !== 'https:\/\/leetcode\.com'/);
  assert.match(popup, /world: 'ISOLATED'/);
  assert.doesNotMatch(popup, /\bfetch\s*\(|XMLHttpRequest|document\.cookie|chrome\.cookies/);
  assert.doesNotMatch(popupHtml, /<script[^>]+src=["']https?:\/\//i);
});
