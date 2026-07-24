import { topicById } from './curriculum.js';
import { dsaCImplementations } from './dsaCImplementations.js';
import { problemFamilySpecs } from './dsaProblemFamilies.js';

const questionGroups = {
  'dsa-sequence-terms': 'Reading the question',
  'dsa-frequency-anagram': 'Strings and counting',
  'dsa-palindrome': 'Strings and counting',
  'dsa-two-pointers': 'Two pointers and windows',
  'dsa-sliding': 'Two pointers and windows',
  'dsa-longest-substring': 'Sliding windows',
  'dsa-k-distinct': 'Sliding windows',
  'dsa-kadane': 'Arrays and running state',
  'dsa-longest-consecutive': 'Arrays and hashing',
  'dsa-cyclic-placement': 'Arrays and index placement',
  'dsa-top-k': 'Selection and heaps',
  'dsa-quickselect': 'Selection and heaps',
  'dsa-k-way-merge': 'Selection and heaps',
  'dsa-subsets': 'Backtracking',
  'dsa-permutations': 'Backtracking',
  'dsa-combination-sum': 'Backtracking',
  'dsa-dp-take-skip': 'Dynamic programming',
  'dsa-dp-grid': 'Dynamic programming',
  'dsa-knapsack': 'Dynamic programming',
  'dsa-coin-change-min': 'Dynamic programming',
  'dsa-coin-change-ways': 'Dynamic programming',
  'dsa-lis': 'Dynamic programming',
  'dsa-lcs': 'Dynamic programming',
  'dsa-edit-distance': 'Dynamic programming',
  'dsa-dp-compression': 'Dynamic programming',
};

const leetcodeAliases = {
  'dsa-frequency-anagram': ['valid-anagram', 'find-all-anagrams-in-a-string'],
  'dsa-palindrome': ['valid-palindrome', 'longest-palindromic-substring'],
  'dsa-two-pointers': [
    'two-sum-ii-input-array-is-sorted',
    'container-with-most-water',
    '3sum',
    'remove-duplicates-from-sorted-array',
  ],
  'dsa-sliding': [
    'maximum-average-subarray-i',
    'minimum-size-subarray-sum',
    'permutation-in-string',
  ],
  'dsa-longest-substring': ['longest-substring-without-repeating-characters'],
  'dsa-k-distinct': [
    'longest-substring-with-at-most-k-distinct-characters',
    'subarrays-with-k-different-integers',
  ],
  'dsa-kadane': ['maximum-subarray'],
  'dsa-longest-consecutive': ['longest-consecutive-sequence'],
  'dsa-cyclic-placement': ['first-missing-positive', 'find-all-duplicates-in-an-array'],
  'dsa-top-k': ['top-k-frequent-elements', 'k-closest-points-to-origin'],
  'dsa-quickselect': ['kth-largest-element-in-an-array'],
  'dsa-k-way-merge': ['merge-k-sorted-lists'],
  'dsa-subsets': ['subsets', 'subsets-ii'],
  'dsa-permutations': ['permutations', 'permutations-ii'],
  'dsa-combination-sum': ['combination-sum', 'combination-sum-ii'],
  'dsa-dp-take-skip': ['house-robber', 'house-robber-ii'],
  'dsa-dp-grid': ['unique-paths', 'minimum-path-sum'],
  'dsa-knapsack': ['partition-equal-subset-sum', 'target-sum'],
  'dsa-coin-change-min': ['coin-change'],
  'dsa-coin-change-ways': ['coin-change-ii'],
  'dsa-lis': ['longest-increasing-subsequence'],
  'dsa-lcs': ['longest-common-subsequence'],
  'dsa-edit-distance': ['edit-distance'],
};

const normalize = (value = '') => value
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const slugify = (value = '') => normalize(value).replaceAll(' ', '-');

const buildFlashcards = (spec) => [
  {
    prompt: 'What wording or constraint should make you consider this approach?',
    answer: spec.guidance[0],
  },
  {
    prompt: 'What must remain true while the algorithm runs?',
    answer: spec.invariant,
  },
  {
    prompt: 'What is the useful state update or structural move?',
    answer: spec.guidance[1],
  },
  {
    prompt: 'What condition warns that this approach is the wrong fit?',
    answer: spec.guidance[2],
  },
  {
    prompt: 'What time and space cost should you be able to defend?',
    answer: spec.guidance[3],
  },
];

export const questionCards = Object.entries(problemFamilySpecs).map(([id, spec]) => {
  const topic = topicById.get(id);
  if (!topic) throw new Error(`Question card ${id} has no curriculum topic`);

  return {
    id,
    title: topic.title,
    group: questionGroups[id] ?? 'Problem-solving patterns',
    keywords: topic.keywords,
    aliases: leetcodeAliases[id] ?? [],
    summary: spec.summary,
    prediction: spec.prediction,
    recognition: spec.guidance[0],
    move: spec.guidance[1],
    boundary: spec.guidance[2],
    complexity: spec.guidance[3],
    invariant: spec.invariant,
    code: spec.guidance[4],
    cCode: dsaCImplementations[id],
    cppCode: spec.guidance[4],
    visual: spec.visual,
    flashcards: buildFlashcards(spec),
    lessonTopicId: id,
  };
});

export const questionById = new Map(questionCards.map((card) => [card.id, card]));

const aliasIndex = new Map(
  questionCards.flatMap((card) => card.aliases.map((alias) => [alias, card])),
);

const meaningfulTokens = (value) => new Set(
  normalize(value)
    .split(' ')
    .filter((token) => token.length > 2 && !['with', 'without', 'from', 'into', 'using'].includes(token)),
);

export function matchCapturedQuestion(capture) {
  const slug = slugify(capture?.slug);
  if (aliasIndex.has(slug)) return aliasIndex.get(slug);

  const normalizedTitle = normalize(capture?.title);
  if (!normalizedTitle) return null;

  const exact = questionCards.find((card) => normalize(card.title) === normalizedTitle);
  if (exact) return exact;

  const capturedTokens = meaningfulTokens(`${capture.title} ${capture.slug}`);
  if (capturedTokens.size === 0) return null;

  const ranked = questionCards
    .map((card) => {
      const cardTokens = meaningfulTokens(
        `${card.title} ${card.keywords.join(' ')} ${card.aliases.join(' ')}`,
      );
      const shared = [...capturedTokens].filter((token) => cardTokens.has(token)).length;
      return {
        card,
        shared,
        score: shared / capturedTokens.size,
      };
    })
    .sort((left, right) => right.score - left.score || right.shared - left.shared);

  const best = ranked[0];
  return best?.shared >= 2 && best.score >= 0.66 ? best.card : null;
}

export function searchQuestionCards(query) {
  const needle = normalize(query);
  if (!needle) return questionCards;

  return questionCards.filter((card) => normalize([
    card.title,
    card.group,
    card.summary,
    card.recognition,
    card.keywords.join(' '),
    card.aliases.join(' '),
  ].join(' ')).includes(needle));
}
