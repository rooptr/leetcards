import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { curriculum, allTopics, lessons } from '../src/data/curriculum.js';
import { getLessonForTopic, validateLesson } from '../src/data/contentModel.js';
import { searchTopics } from '../src/data/search.js';
import { deepProfiles } from '../src/data/deepProfiles.js';
import { dsaVisuals } from '../src/data/dsaVisuals.js';
import { linuxMechanismSpecs } from '../src/data/linuxMechanisms.js';
import { collegeMcuLabs, collegeMcuCoverage } from '../src/data/collegeMcuLabs.js';
import { collegeDsaLabs, collegeDsaCoverage } from '../src/data/collegeDsaLabs.js';
import { cppLessonProfiles } from '../src/data/cppLessonProfiles.js';
import { cppConcepts } from '../src/data/cppConcepts.js';
import { linuxCppGuidance } from '../src/data/linuxCppGuidance.js';

test('curriculum exposes every required learning area', () => {
  const titles = new Set(curriculum.map((section) => section.title));

  for (const title of [
    'C and C Tricks',
    'C++',
    'Operating Systems and Linux',
    'Computer Architecture',
    'Networking',
    'Git, Debugging, and Testing',
    'Electronics and Schematics',
    'General Embedded Systems',
    'STM32F446RE',
    'RTOS and Embedded Concurrency',
    'Data Structures and Algorithms',
  ]) {
    assert.ok(titles.has(title), `missing section: ${title}`);
  }
});

test('curriculum excludes the explicitly removed topics', () => {
  const text = JSON.stringify(curriculum).toLowerCase();

  for (const removed of [
    'b-tree',
    'storage-oriented',
    'trie',
    'topological sorting',
    'connected components',
    'union-find',
    'dijkstra',
    'bellman-ford',
    'floyd-warshall',
    'prim',
    'kruskal',
  ]) {
    assert.equal(text.includes(removed), false, `removed topic found: ${removed}`);
  }
});

test('required static mechanism lessons are present', () => {
  const lessonTitles = new Set(lessons.map((lesson) => lesson.title));

  for (const title of [
    'Stack and heap layout',
    'Cache behavior',
    'Virtual memory translation',
    'System-call transitions',
    'UART transaction',
    'SPI transaction',
    'I2C transaction',
    'How to read a schematic',
  ]) {
    assert.ok(lessonTitles.has(title), `missing lesson: ${title}`);
  }
});

test('topic search finds concepts by title and lesson keywords', () => {
  assert.equal(searchTopics('pull-up')[0].title, 'Pull-ups and open-drain buses');
  assert.equal(searchTopics('kernel register')[0].title, 'System-call transitions');
  assert.equal(searchTopics('stm32f446re')[0].title, 'STM32F446RE board bring-up');
});

test('topic ids are unique and searchable topics are non-empty', () => {
  const ids = allTopics.map((topic) => topic.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(allTopics.length >= 80);
});

test('the expanded curriculum names foundations that were previously hidden in broad labels', () => {
  const ids = new Set(allTopics.map((topic) => topic.id));

  for (const id of [
    'c-qualifiers',
    'c-integer-rules',
    'c-alignment-endianness',
    'c-aliasing',
    'c-allocation-failure',
    'cpp-references',
    'cpp-constructors',
    'cpp-const',
    'cpp-overload',
    'cpp-build',
    'os-process-lifecycle',
    'os-permissions',
    'os-filesystems',
    'os-mmap-cow',
    'os-reclamation',
    'net-mtu',
    'net-nat',
    'net-routing-decision',
    'net-interfaces',
    'git-index',
    'git-conflicts',
    'git-tags',
    'electronics-kcl-kvl',
    'electronics-passives',
    'electronics-transistors',
    'electronics-protection',
    'electronics-measurement-safety',
    'rtos-critical',
    'rtos-events',
    'rtos-notifications',
    'rtos-budgeting',
    'stm32-faults',
    'stm32-systick',
    'stm32-memory-map',
    'stm32-boot-options',
    'stm32-cmsis-hal',
    'stm32-pin-map',
    'stm32-docs',
    'dsa-two-pointers',
    'dsa-fast-slow',
    'dsa-difference',
    'dsa-intervals',
  ]) {
    assert.ok(ids.has(id), `missing dedicated topic: ${id}`);
  }
});

test('every topic resolves to one substantive variable-depth lesson', () => {
  const lessonTopicIds = lessons.map((lesson) => lesson.topicId);

  assert.equal(lessons.length, allTopics.length);
  assert.equal(new Set(lessonTopicIds).size, lessons.length);

  for (const topic of allTopics) {
    const lesson = getLessonForTopic(topic.id);
    assert.ok(lesson, `missing lesson for ${topic.id}`);
    assert.equal(validateLesson(lesson).valid, true, `invalid lesson for ${topic.id}`);
    assert.ok(lesson.summary.length >= 45, `summary too shallow for ${topic.id}`);
    assert.ok(lesson.blocks.length >= 3, `not enough teaching blocks for ${topic.id}`);
    assert.equal(lesson.contentSource, 'authored', `lesson still uses generated filler for ${topic.id}`);
    assert.equal(lesson.depth, topic.level, `catalog depth and lesson depth disagree for ${topic.id}`);
    assert.equal(
      JSON.stringify(lesson).includes('Build the smallest mental model'),
      false,
      `generic fallback retained for ${topic.id}`,
    );
  }
});

test('every lesson starts definition-first and then grounds the idea in a real system', () => {
  const vagueDefinitionPatterns = [
    /\bthis topic\b/i,
    /\bthis feature\b/i,
    /\bthis mechanism\b/i,
    /\blearn about\b/i,
    /\bthe useful idea\b/i,
    /\bprovides? a way\b/i,
  ];
  const vagueApplicationPatterns = [
    /\breal systems\b/i,
    /\bproduction systems\b/i,
    /\buses? this (?:topic|feature|mechanism|practice)\b/i,
    /\brel(?:y|ies) on this\b/i,
  ];

  for (const lesson of lessons) {
    const definitions = lesson.blocks.filter((block) => block.type === 'definition');
    const definition = definitions[0];
    const application = lesson.blocks[1];

    assert.equal(definitions.length, 1, `${lesson.topicId} must have one definition`);
    assert.equal(lesson.blocks[0], definition, `${lesson.topicId} definition is not first`);
    assert.equal(definition.heading, 'What it is', `${lesson.topicId} definition heading drifted`);
    assert.ok(definition.body.length >= 80, `${lesson.topicId} definition is too thin`);
    assert.equal(lesson.summary, definition.body, `${lesson.topicId} hero summary differs from its definition`);
    assert.equal(application.type, 'application', `${lesson.topicId} has no real-system grounding after its definition`);
    assert.ok(application.body.length >= 100, `${lesson.topicId} real-system example is too thin`);

    for (const pattern of vagueDefinitionPatterns) {
      assert.doesNotMatch(definition.body, pattern, `${lesson.topicId} has a placeholder definition`);
    }
    for (const pattern of vagueApplicationPatterns) {
      assert.doesNotMatch(application.body, pattern, `${lesson.topicId} has a placeholder application`);
    }

    const duplicateExplanation = lesson.blocks.slice(1).find((block) => (
      block.type === 'prose' && block.body?.trim() === definition.body.trim()
    ));
    assert.equal(duplicateExplanation, undefined, `${lesson.topicId} repeats its definition as explanation`);
  }
});

test('the reader presents the definition once instead of repeating it in the hero', async () => {
  const source = await readFile(new URL('../src/components/LessonReader.jsx', import.meta.url), 'utf8');
  assert.equal(source.includes('<p>{lesson.summary}</p>'), false);
  assert.ok(source.includes('lesson.blocks.map'), 'the explicit definition blocks are not rendered');
});

test('the glossary uses authored concept definitions instead of keyword placeholders', async () => {
  const source = await readFile(new URL('../src/components/GlossaryDrawer.jsx', import.meta.url), 'utf8');
  assert.ok(source.includes("block.type === 'concepts'"));
  assert.ok(source.includes("block.type === 'definition'"));
  assert.ok(source.includes('{item.definition}'));
  assert.equal(source.includes('Read this term in the context of'), false);
});

test('standard and deep lessons explain a complete case instead of stopping at vocabulary', () => {
  for (const lesson of lessons.filter((item) => item.depth !== 'brief')) {
    const types = new Set(lesson.blocks.map((block) => block.type));
    const hasTrace = types.has('steps')
      || lesson.blocks.some((block) => block.type === 'visual' && block.frames?.length >= 2);

    assert.ok(hasTrace, `${lesson.topicId} has no ordered mechanism or state trace`);
    assert.ok(types.has('practice'), `${lesson.topicId} has no learner verification`);
    assert.ok(types.has('recall'), `${lesson.topicId} has no explain-it-back check`);
  }
});

test('every C++ topic has a dedicated definition, causal explanation, complete example, and failure model', () => {
  const cppTopics = allTopics.filter((topic) => topic.sectionId === 'cpp');
  assert.deepEqual(
    new Set(Object.keys(cppLessonProfiles)),
    new Set(cppTopics.map((topic) => topic.id)),
    'C++ authored profile coverage drifted from the curriculum',
  );

  for (const topic of cppTopics) {
    const profile = cppLessonProfiles[topic.id];
    const lesson = getLessonForTopic(topic.id);
    const explanation = lesson.blocks.find((block) => block.heading === 'How it works');
    const code = lesson.blocks.find((block) => block.type === 'code');
    const failure = lesson.blocks.find((block) => block.type === 'failure');
    const application = lesson.blocks.find((block) => block.type === 'application');

    assert.ok(profile.definition.length >= 120, `${topic.id} has a shallow definition`);
    assert.ok(profile.explanation.length >= 140, `${topic.id} has a shallow mechanism`);
    assert.ok(profile.steps.length >= 3, `${topic.id} has no causal sequence`);
    assert.ok(profile.prediction.length >= 40, `${topic.id} has no useful prediction`);
    assert.ok(profile.failure.length >= 120, `${topic.id} has a shallow failure model`);
    assert.ok(profile.application.length >= 100, `${topic.id} has no concrete use`);
    assert.ok(profile.example.length >= 80, `${topic.id} has no reproducible check`);
    assert.ok(profile.code.length >= 100, `${topic.id} has no complete code example`);

    assert.equal(lesson.summary, profile.definition, `${topic.id} does not use its authored definition`);
    assert.equal(explanation?.body, profile.explanation, `${topic.id} does not explain how the rule works`);
    assert.equal(code?.code, profile.code, `${topic.id} code example drifted`);
    assert.equal(failure?.body, profile.failure, `${topic.id} failure model drifted`);
    assert.equal(application?.body, profile.application, `${topic.id} real use drifted`);
  }
});

test('every C++ sub-concept is individually defined and grounded with a concrete check', () => {
  const cppTopics = allTopics.filter((topic) => topic.sectionId === 'cpp');
  assert.deepEqual(
    new Set(Object.keys(cppConcepts)),
    new Set(cppTopics.map((topic) => topic.id)),
    'C++ concept dictionary coverage drifted from the curriculum',
  );

  for (const topic of cppTopics) {
    const lesson = getLessonForTopic(topic.id);
    const block = lesson.blocks.find((item) => item.type === 'concepts');
    const concepts = cppConcepts[topic.id];

    assert.ok(block, `${topic.id} does not render its concept dictionary`);
    assert.deepEqual(block.items, concepts, `${topic.id} renders the wrong concepts`);
    assert.equal(new Set(concepts.map((item) => item.term.toLowerCase())).size, concepts.length);

    for (const item of concepts) {
      assert.ok(item.term.length >= 3, `${topic.id} has an unnamed concept`);
      assert.ok(item.definition.length >= 80, `${topic.id}/${item.term} has a shallow definition`);
      assert.ok(item.example.length >= 30, `${topic.id}/${item.term} has no concrete check`);
    }
  }
});

test('the requested C++ object-model, generic, STL, lambda, and modern-language coverage is explicit', () => {
  const required = {
    'cpp-modern-syntax': ['auto', 'decltype', 'nullptr', 'enum class', 'range-based for', 'structured binding', 'inline function'],
    'cpp-encapsulation': ['encapsulation', 'public', 'private', 'protected', 'data hiding', 'getter', 'setter'],
    'cpp-constructors': ['default constructor', 'parameterized constructor', 'copy constructor', 'move constructor', 'delegating constructor', 'conversion constructor', 'explicit constructor', 'deleted constructor', 'defaulted constructor', 'trivial destructor', 'non-trivial destructor', 'virtual destructor', 'defaulted destructor'],
    'cpp-copy-move': ['rule of three', 'rule of five', 'rule of zero', 'copy assignment', 'move assignment', 'std::move', 'moving from const'],
    'cpp-references': ['lvalue', 'rvalue', 'perfect forwarding', 'std::forward'],
    'cpp-operators': ['operator overloading'],
    'cpp-inheritance': ['diamond inheritance', 'virtual inheritance'],
    'cpp-polymorphism': ['runtime polymorphism', 'vtable and vptr', 'object slicing', 'override', 'final'],
    'cpp-exceptions': ['try block', 'throw expression', 'catch handler', 'multiple catch handlers', 'catch (...) / catch-all', 'noexcept', 'stack unwinding', 'basic exception guarantee', 'strong exception guarantee', 'no-throw guarantee'],
    'cpp-templates': ['function template', 'class template', 'template instantiation', 'generic stack', 'generic queue', 'generic swap'],
    'cpp-template-specialization': ['full specialization', 'partial specialization', 'variadic template', 'explicit instantiation'],
    'cpp-stl': ['sequence container', 'ordered associative container', 'unordered associative container', 'container adaptor', 'algorithm', 'function object', 'std::function'],
    'cpp-iterators': ['begin and end', 'cbegin and cend', 'rbegin and rend'],
    'cpp-lambdas': ['lambda expression', 'capture by value', 'capture by reference', 'generic lambda', 'lambda with algorithm'],
    'cpp-smart-pointers': ['unique_ptr', 'shared_ptr', 'weak_ptr', 'make_unique', 'make_shared', 'use_count', 'cyclic reference'],
    'cpp-constexpr': ['constexpr variable', 'constexpr function', 'type-safe utility'],
    'cpp-errors': ['std::optional', 'std::variant', 'std::visit', 'std::any', 'std::expected'],
  };

  for (const [topicId, expectedTerms] of Object.entries(required)) {
    const terms = new Set(cppConcepts[topicId].map((item) => item.term.toLowerCase()));
    for (const term of expectedTerms) {
      assert.ok(terms.has(term), `${topicId} does not explicitly define ${term}`);
    }
  }
});

test('constructor lesson defines construction and destruction before tracing order', () => {
  const lesson = getLessonForTopic('cpp-constructors');
  const definition = lesson.blocks[0].body;
  const explanation = lesson.blocks.find((block) => block.heading === 'How it works')?.body ?? '';
  const code = lesson.blocks.find((block) => block.type === 'code')?.code ?? '';

  for (const term of ['constructor', 'destructor', 'lifetime', 'valid state', 'resources']) {
    assert.match(definition, new RegExp(term, 'i'), `constructor definition omits ${term}`);
  }
  for (const term of ['declaration order', 'initializer list', 'constructor body', 'reverse']) {
    assert.match(explanation, new RegExp(term, 'i'), `constructor mechanism omits ${term}`);
  }
  for (const term of ['Buffer()', 'Buffer(const Buffer&', 'Buffer(Buffer&&', 'explicit Buffer', '= delete', '= default', 'virtual ~Interface']) {
    assert.ok(code.includes(term), `constructor example omits ${term}`);
  }
});

test('every deep topic has the complete mechanism lesson contract', () => {
  for (const topic of allTopics.filter((item) => item.level === 'deep')) {
    const lesson = getLessonForTopic(topic.id);
    const blockTypes = new Set(lesson.blocks.map((block) => block.type));
    for (const type of ['prediction', 'visual', 'failure', 'practice', 'recall']) {
      assert.ok(blockTypes.has(type), `${topic.id} missing deep block ${type}`);
    }
    const visual = lesson.blocks.find((block) => block.type === 'visual');
    assert.ok(visual.frames?.length >= 2, `${topic.id} lacks a staged visual`);
    assert.ok(blockTypes.has('steps') || visual.frames.length >= 2, `${topic.id} lacks a state trace`);
  }
});

test('non-special deep lessons use topic-specific authored profiles', () => {
  const special = new Set([
    'c-stack-heap', 'cpp-concurrency', 'os-sync', 'arch-cache', 'os-virtual-translation',
    'os-virtual-memory', 'os-mmap-cow', 'os-syscalls', 'embedded-uart', 'embedded-spi',
    'embedded-i2c', 'schematic-basics', 'debug-method', 'rtos-tasks', 'stm32-startup',
    'stm32-clock', 'stm32-interrupts', 'embedded-dma',
    ...Object.keys(linuxMechanismSpecs),
  ]);

  for (const topic of allTopics.filter((item) => (
    item.level === 'deep'
    && item.sectionId !== 'dsa'
    && item.sectionId !== 'cpp'
    && item.group !== 'Linux Systems Programming Labs'
    && item.group !== 'College MCU C Labs'
    && item.sectionId !== 'qualcomm-prep'
    && !special.has(item.id)
  ))) {
    const profile = deepProfiles[topic.id];
    assert.ok(profile, `missing explicit deep profile for ${topic.id}`);
    assert.ok(profile.prediction.length >= 25, `weak prediction for ${topic.id}`);
    assert.ok(profile.trace.length >= 3, `short trace for ${topic.id}`);
    assert.ok(profile.failure.length >= 25, `weak failure analysis for ${topic.id}`);
    assert.ok(profile.probe.length >= 25, `weak observation exercise for ${topic.id}`);
  }
});

test('every STM32 lesson connects board, registers, HAL, timing, debugging, and testing', () => {
  for (const topic of allTopics.filter((item) => item.sectionId === 'stm32')) {
    const practice = getLessonForTopic(topic.id).blocks.find((block) => block.type === 'practice')?.body ?? '';
    for (const term of ['Nucleo-F446RE', 'register', 'HAL', 'timing', 'SWD', 'test']) {
      assert.match(practice, new RegExp(term, 'i'), `${topic.id} practice omits ${term}`);
    }
  }
});

test('required mechanisms receive deep prediction-to-practice treatment', () => {
  for (const topicId of [
    'c-stack-heap',
    'arch-cache',
    'os-virtual-translation',
    'os-syscalls',
    'embedded-uart',
    'embedded-spi',
    'embedded-i2c',
    'schematic-basics',
    'debug-method',
    'rtos-tasks',
    'stm32-startup',
    'stm32-clock',
    'stm32-interrupts',
    'embedded-dma',
  ]) {
    const lesson = getLessonForTopic(topicId);
    assert.equal(lesson.depth, 'deep', `${topicId} is not deep`);
    const blockTypes = new Set(lesson.blocks.map((block) => block.type));
    for (const type of ['prediction', 'steps', 'visual', 'failure', 'practice', 'recall']) {
      assert.ok(blockTypes.has(type), `${topicId} missing ${type}`);
    }
  }
});

test('DSA patterns include visual state frames, recognition guidance, and C plus C++ templates', () => {
  for (const topicId of [
    'dsa-linked',
    'dsa-matrix',
    'dsa-stack-queue',
    'dsa-hash',
    'dsa-heap',
    'dsa-binary-tree',
    'dsa-bst',
    'dsa-avl',
    'dsa-red-black',
    'dsa-sorting',
    'dsa-search',
    'dsa-recursion',
    'dsa-dp',
    'dsa-two-pointers',
    'dsa-sliding',
    'dsa-fast-slow',
    'dsa-prefix',
    'dsa-difference',
    'dsa-intervals',
    'dsa-monotonic',
    'dsa-complexity',
    'dsa-divide',
    'dsa-greedy',
    'dsa-bitwise',
  ]) {
    const lesson = getLessonForTopic(topicId);
    assert.equal(lesson.depth, 'deep', `${topicId} is not deep`);
    assert.ok(lesson.recognition?.length >= 2, `${topicId} lacks recognition clues`);
    assert.ok(lesson.invariant, `${topicId} lacks an invariant`);
    assert.equal(
      lesson.invariant.includes('processed state'),
      false,
      `${topicId} still uses the shared generic invariant`,
    );
    assert.ok(lesson.avoidWhen, `${topicId} lacks misuse guidance`);
    assert.match(lesson.complexity, /O\(/, `${topicId} lacks complexity`);
    assert.match(lesson.cTemplate, /[;{}]/, `${topicId} lacks a C template`);
    assert.match(lesson.cppTemplate, /[;{}]/, `${topicId} lacks a C++ template`);

    const codePair = lesson.blocks.find((block) => block.type === 'code-pair');
    assert.deepEqual(codePair.variants.map((variant) => variant.id), ['c', 'cpp']);

    const visual = lesson.blocks.find((block) => block.type === 'visual');
    assert.ok(visual.frames.length >= 2, `${topicId} needs multiple frames`);
    assert.ok(visual.frames.every((frame) => frame.caption), `${topicId} has an uncaptioned frame`);
  }
});

test('the reader has no generic topic fallback or permanent context rail', async () => {
  const source = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.equal(source.includes('TopicOverview'), false);
  assert.equal(source.includes('context-panel'), false);
  assert.ok(source.includes('getLessonForTopic'));
});

test('off-canvas drawers cannot widen the document while closed', async () => {
  const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(styles, /body\s*\{[^}]*overflow-x:\s*hidden;/s);
  assert.match(styles, /\.visual-block\s*\{[^}]*width:\s*100%;/s);
  assert.equal(/\.visual-block\s*\{[^}]*width:\s*min\(/s.test(styles), false);
});

test('visual renderer has distinct structure-specific render paths', async () => {
  const source = await readFile(new URL('../src/components/MechanismVisual.jsx', import.meta.url), 'utf8');
  for (const renderer of ['LinkedListVisual', 'TreeVisual', 'ArrayVisual', 'GridVisual', 'StackQueueVisual', 'BucketVisual', 'TimelineVisual']) {
    assert.ok(source.includes(renderer), `missing visual renderer: ${renderer}`);
  }
  assert.match(source, /<line[\s\S]*x1=/, 'tree renderer lacks parent-child edges');
  assert.match(source, /queueFrame/, 'stack and queue directions are not distinguished');
  assert.match(source, /kind === 'buckets'.*BucketVisual/s, 'hash buckets still use a generic timeline');
  assert.match(source, /dependency=\{kind === 'dp-grid'\}/, 'ordinary matrices still show DP dependency arrows');
  assert.match(source, /addressFor\(value\)/, 'linked-list addresses do not follow stable node identity');
});

test('tree examples encode their claimed topology explicitly', () => {
  assert.deepEqual(dsaVisuals['dsa-avl'].frames[0].values, ['5', '4', null, '3']);
  assert.deepEqual(dsaVisuals['dsa-red-black'].frames[0].values, ['10B', '5R', null, '1R']);
});

test('off-canvas navigation is removed from keyboard flow and closes with Escape', async () => {
  const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const catalog = await readFile(new URL('../src/components/Catalog.jsx', import.meta.url), 'utf8');
  const glossary = await readFile(new URL('../src/components/GlossaryDrawer.jsx', import.meta.url), 'utf8');
  assert.ok(app.includes("event.key === 'Escape'"));
  assert.ok(catalog.includes('inert='));
  assert.ok(catalog.includes('aria-hidden='));
  assert.ok(catalog.includes('disabled={!open}'));
  assert.ok(catalog.includes('aria-modal='));
  assert.ok(glossary.includes('inert='));
  assert.ok(glossary.includes('aria-hidden='));
  assert.ok(glossary.includes('disabled={!open}'));
  assert.ok(glossary.includes('aria-modal='));
  assert.match(app, /className="page-surface"[\s\S]*inert=\{glossaryOpen/s);
});

test('broad DSA lessons cover their named families instead of one example only', () => {
  const sorting = JSON.stringify(getLessonForTopic('dsa-sorting'));
  for (const name of ['Insertion sort', 'Selection sort', 'Merge sort', 'Quicksort', 'Heap sort']) {
    assert.match(sorting, new RegExp(name, 'i'));
  }

  const hashing = JSON.stringify(getLessonForTopic('dsa-hash'));
  for (const name of ['chaining', 'open addressing', 'tombstones', 'Resizing']) {
    assert.match(hashing, new RegExp(name, 'i'));
  }
});

test('the application opens as library, category, then lesson without a Topics drawer', async () => {
  const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.ok(app.includes('LibraryView'), 'missing category library start view');
  assert.ok(app.includes('CategoryView'), 'missing category lesson-index view');
  assert.equal(app.includes("from './components/Catalog.jsx'"), false, 'persistent catalog is still mounted');
  assert.equal(/>Topics</.test(app), false, 'unused Topics action is still visible');
  assert.ok(app.includes('hashchange'), 'browser Back/Forward route updates are not handled');
  assert.ok(app.includes('window.scrollTo'), 'route changes do not reset natural document scroll');
});

test('hash routes parse and format library, category, and lesson locations', async () => {
  const { parseRoute, routeForCategory, routeForLesson } = await import('../src/data/routes.js');

  assert.deepEqual(parseRoute('#/'), { view: 'library' });
  assert.deepEqual(parseRoute('#/category/dsa'), { view: 'category', sectionId: 'dsa' });
  assert.deepEqual(parseRoute('#/lesson/dsa-two-pointers'), { view: 'lesson', topicId: 'dsa-two-pointers' });
  assert.equal(routeForCategory('os-linux'), '#/category/os-linux');
  assert.equal(routeForLesson('embedded-uart'), '#/lesson/embedded-uart');
  assert.deepEqual(parseRoute('#/unknown/place'), { view: 'library' });
});

test('reader layout uses natural document scrolling without a competing catalog pane', async () => {
  const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
  const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');

  assert.equal(app.includes('<Catalog'), false);
  assert.equal(/\.reader-main\s*\{[^}]*height:\s*calc\(/s.test(styles), false);
  assert.equal(/\.reader-main\s*\{[^}]*overflow-y:\s*(auto|scroll)/s.test(styles), false);
  assert.match(styles, /html\s*\{[^}]*scroll-behavior:/s);
});

test('simulator state is deterministic and manual controls pause playback', async () => {
  const { createSimulationState, simulationReducer } = await import('../src/data/simulation.js');
  const initial = createSimulationState(4);

  assert.deepEqual(initial, { step: 0, frameCount: 4, playing: false });
  assert.deepEqual(simulationReducer(initial, { type: 'previous' }), initial);
  assert.deepEqual(
    simulationReducer({ ...initial, playing: true }, { type: 'set', step: 2 }),
    { step: 2, frameCount: 4, playing: false },
  );
  assert.deepEqual(
    simulationReducer({ step: 2, frameCount: 4, playing: true }, { type: 'tick' }),
    { step: 3, frameCount: 4, playing: false },
  );
  assert.deepEqual(
    simulationReducer({ step: 3, frameCount: 4, playing: false }, { type: 'next' }),
    { step: 3, frameCount: 4, playing: false },
  );
});

test('mechanism visuals expose discrete accessible simulator controls without a redundant slider', async () => {
  const source = await readFile(new URL('../src/components/MechanismVisual.jsx', import.meta.url), 'utf8');

  for (const label of ['Previous step', 'Next step', 'Play simulation', 'Pause simulation']) {
    assert.ok(source.includes(label), `missing simulator control: ${label}`);
  }
  assert.ok(source.includes('aria-live="polite"'), 'step caption is not announced');
  assert.equal(source.includes('type="range"'), false, 'redundant step slider is still mounted');
  assert.ok(source.includes('Step {state.step + 1} / {frames.length}'), 'simulator lacks a compact step counter');
  for (const label of ['What changed', 'Rule being preserved', 'Next move']) {
    assert.ok(source.includes(label), `missing reasoning label: ${label}`);
  }
  assert.ok(source.includes('currentFrame'), 'renderer still displays every frame at once');
  assert.equal(source.includes('block.frames.map'), false, 'all frames are still rendered side by side');
});

test('visual renderers support explicit pointers, windows, and circular-buffer state', async () => {
  const source = await readFile(new URL('../src/components/MechanismVisual.jsx', import.meta.url), 'utf8');

  assert.ok(source.includes('frame.pointers'), 'array pointers are not explicit');
  assert.ok(source.includes('frame.window'), 'window bounds are not explicit');
  assert.ok(source.includes('frame.discarded'), 'discarded ranges are not shown');
  assert.ok(source.includes('CircularBufferVisual'), 'circular buffer has no dedicated renderer');
  assert.ok(source.includes('frame.links'), 'linked-list edges are still inferred only from display order');
});

test('selected DSA includes the missing interview problem families', () => {
  const ids = new Set(allTopics.map((topic) => topic.id));
  for (const id of [
    'dsa-sequence-terms',
    'dsa-frequency-anagram',
    'dsa-palindrome',
    'dsa-longest-substring',
    'dsa-k-distinct',
    'dsa-kadane',
    'dsa-longest-consecutive',
    'dsa-cyclic-placement',
    'dsa-top-k',
    'dsa-quickselect',
    'dsa-k-way-merge',
    'dsa-subsets',
    'dsa-permutations',
    'dsa-combination-sum',
    'dsa-dp-take-skip',
    'dsa-dp-grid',
    'dsa-knapsack',
    'dsa-coin-change-min',
    'dsa-coin-change-ways',
    'dsa-lis',
    'dsa-lcs',
    'dsa-edit-distance',
    'dsa-dp-compression',
  ]) {
    assert.ok(ids.has(id), `missing DSA family: ${id}`);
  }
});

test('every DSA pattern simulation is a complete trace with explicit final reasoning', () => {
  for (const topic of allTopics.filter((item) => item.sectionId === 'dsa' && item.group !== 'College DSA C Labs')) {
    const visual = dsaVisuals[topic.id];
    assert.ok(visual, `${topic.id} has no visual`);
    assert.ok(visual.frames.length >= 5, `${topic.id} trace is still a few snapshots`);
    assert.match(
      visual.frames.at(-1).caption,
      /answer|complete|final|result|proved|preserved|finished|done|returns|optimal|cost/i,
      `${topic.id} final frame does not explain the result`,
    );
  }
});

test('pointer and window simulations encode positions and bounds rather than only captions', () => {
  assert.ok(dsaVisuals['dsa-two-pointers'].frames.every((frame) => frame.pointers));
  assert.ok(dsaVisuals['dsa-sliding'].frames.every((frame) => frame.window));
  assert.ok(dsaVisuals['dsa-longest-substring'].frames.every((frame) => frame.window));
});

test('systems categories and lessons follow the recommended learning order', () => {
  const sectionIds = curriculum.map((item) => item.id);
  assert.deepEqual(sectionIds, [
    'c',
    'engineering',
    'cpp',
    'dsa',
    'architecture',
    'os-linux',
    'networking',
    'electronics',
    'embedded',
    'stm32',
    'rtos',
    'qualcomm-prep',
  ]);

  const ids = new Set(allTopics.map((topic) => topic.id));
  for (const id of [
    'os-environment',
    'os-syscall-contract',
    'os-file-io',
    'os-fd-dup',
    'os-fcntl',
    'os-process-create',
    'os-exec',
    'os-exit',
    'os-wait',
    'os-zombie-orphan',
    'os-pipes',
    'os-fifo',
    'os-shm',
    'os-pthreads',
    'os-mutex',
    'os-semaphores',
    'os-linux-sockets',
  ]) {
    assert.ok(ids.has(id), `missing Linux systems topic: ${id}`);
  }
});

test('C++, architecture, embedded, STM32, and Linux follow prerequisite-first topic order', () => {
  const idsFor = (sectionId) => curriculum.find((section) => section.id === sectionId).topics.map((topic) => topic.id);
  const assertExactOrder = (sectionId, expected) => {
    assert.deepEqual(idsFor(sectionId), expected, `${sectionId} learning order drifted`);
  };

  assertExactOrder('cpp', [
    'cpp-build',
    'cpp-namespaces',
    'cpp-modern-syntax',
    'cpp-object-model',
    'cpp-encapsulation',
    'cpp-constructors',
    'cpp-const',
    'cpp-references',
    'cpp-overload',
    'cpp-operators',
    'cpp-copy-move',
    'cpp-raii',
    'cpp-smart-pointers',
    'cpp-composition',
    'cpp-inheritance',
    'cpp-polymorphism',
    'cpp-exceptions',
    'cpp-templates',
    'cpp-template-specialization',
    'cpp-constexpr',
    'cpp-stl',
    'cpp-iterators',
    'cpp-lambdas',
    'cpp-errors',
    'cpp-testing',
    'cpp-concurrency',
  ]);

  assertExactOrder('architecture', [
    'arch-binary',
    'arch-logic',
    'arch-isa',
    'arch-datapath',
    'arch-calling',
    'arch-pipeline',
    'arch-branch',
    'arch-cache',
    'arch-mmu',
    'arch-coherence',
    'arch-dma',
    'arch-performance',
  ]);

  assertExactOrder('embedded', [
    'embedded-mcu',
    'embedded-memory',
    'embedded-registers',
    'embedded-startup',
    'embedded-clocks',
    'embedded-gpio',
    'embedded-debug',
    'embedded-interrupts',
    'embedded-timers',
    'embedded-uart',
    'embedded-spi',
    'embedded-i2c',
    'embedded-adc',
    'embedded-dma',
    'embedded-can',
    'embedded-watchdog',
    'embedded-flash',
    'embedded-bootloader',
    'embedded-power',
    'embedded-portability',
    ...collegeMcuLabs.map((lab) => `college-mcu-${lab.id}`),
  ]);

  assertExactOrder('stm32', [
    'stm32-docs',
    'stm32-bringup',
    'stm32-pin-map',
    'stm32-memory-map',
    'stm32-cmsis-hal',
    'stm32-startup',
    'stm32-boot-options',
    'stm32-swd',
    'stm32-faults',
    'stm32-clock',
    'stm32-gpio',
    'stm32-uart',
    'stm32-systick',
    'stm32-interrupts',
    'stm32-timers',
    'stm32-spi',
    'stm32-i2c',
    'stm32-adc',
    'stm32-can',
    'stm32-watchdog',
    'stm32-rtc',
    'stm32-storage',
    'stm32-low-power',
    'stm32-freertos',
  ]);

  assertExactOrder('os-linux', [
    'os-purpose',
    'os-environment',
    'os-cli',
    'os-user-kernel',
    'os-syscalls',
    'os-syscall-contract',
    'os-files',
    'os-filesystems',
    'os-permissions',
    'os-file-io',
    'os-fd-dup',
    'os-fcntl',
    'linux-a01',
    'linux-a02',
    'linux-a03',
    'linux-a04',
    'os-processes',
    'os-virtual-memory',
    'os-virtual-translation',
    'os-mmap-cow',
    'os-reclamation',
    'os-process-lifecycle',
    'os-process-create',
    'os-exec',
    'os-exit',
    'os-wait',
    'os-zombie-orphan',
    'linux-a05',
    'linux-a06',
    'linux-a07',
    'linux-a08',
    'os-ipc',
    'os-pipes',
    'os-fifo',
    'os-shm',
    'linux-a09',
    'linux-a10',
    'linux-a11',
    'linux-a12',
    'linux-a13',
    'os-signals',
    'linux-a14',
    'linux-a15',
    'linux-a16',
    'linux-a17',
    'os-linux-sockets',
    'linux-a18',
    'linux-a19',
    'os-threads',
    'os-scheduling',
    'os-sync',
    'os-pthreads',
    'os-mutex',
    'os-semaphores',
    'linux-a20',
    'linux-a21',
    'linux-a22',
    'os-boot',
    'os-proc',
  ]);

  for (const id of ['cpp-composition', 'cpp-polymorphism', 'cpp-stl', 'cpp-iterators']) {
    assert.equal(allTopics.find((topic) => topic.id === id).sectionId, 'cpp', `${id} escaped the C++ curriculum`);
  }
});

test('Linux implementation topics teach paired C and C++ code plus internals', () => {
  for (const id of [
    'os-process-create',
    'os-exec',
    'os-exit',
    'os-wait',
    'os-zombie-orphan',
    'os-mutex',
    'os-semaphores',
  ]) {
    const lesson = getLessonForTopic(id);
    assert.equal(lesson.depth, 'deep', `${id} is not deep`);
    const pair = lesson.blocks.find((block) => block.type === 'code-pair');
    assert.ok(pair, `${id} lacks an implementation pair`);
    assert.deepEqual(pair.variants.map((variant) => variant.id), ['c', 'cpp']);
    assert.match(JSON.stringify(lesson), /user space|kernel|internal|state/i, `${id} lacks internals`);
  }
});

test('every Linux lesson explains how the same kernel contract is used from C++', () => {
  const linuxTopics = allTopics.filter((topic) => topic.sectionId === 'os-linux');
  assert.deepEqual(
    new Set(Object.keys(linuxCppGuidance)),
    new Set(linuxTopics.map((topic) => topic.id)),
    'Linux C++ guidance coverage drifted from the curriculum',
  );

  for (const topic of linuxTopics) {
    const lesson = getLessonForTopic(topic.id);
    const bridge = lesson.blocks.find((block) => block.heading === 'The same Linux contract in C++');
    assert.ok(bridge, `${topic.id} has no C++ treatment`);
    assert.equal(bridge.body, linuxCppGuidance[topic.id], `${topic.id} uses the wrong C++ treatment`);
    assert.ok(bridge.body.length >= 140, `${topic.id} has shallow C++ guidance`);
  }
});

test('Linux programming labs are language-paired rather than labeled as C-only', () => {
  const labTopics = allTopics.filter((topic) => topic.group === 'Linux Systems Programming Labs');
  assert.equal(labTopics.length, 22);
  assert.equal(allTopics.some((topic) => topic.group === 'Linux C Labs'), false);

  for (const topic of labTopics) {
    const pair = getLessonForTopic(topic.id).blocks.find((block) => block.type === 'code-pair');
    assert.ok(pair, `${topic.id} has no C/C++ implementation pair`);
    assert.deepEqual(pair.variants.map((variant) => variant.id), ['c', 'cpp']);
  }
});

test('every code-bearing lesson outside C++, except explicit college C labs, exposes both implementations', () => {
  for (const topic of allTopics.filter((item) => (
    item.sectionId !== 'cpp'
    && item.sectionId !== 'qualcomm-prep'
    && item.group !== 'College MCU C Labs'
    && item.group !== 'College DSA C Labs'
  ))) {
    const lesson = getLessonForTopic(topic.id);
    const codeBlocks = lesson.blocks.filter((block) => ['code', 'code-pair'].includes(block.type));
    if (codeBlocks.length === 0) continue;

    assert.equal(codeBlocks.length, 1, `${topic.id} splits one comparison across multiple blocks`);
    assert.equal(codeBlocks[0].type, 'code-pair', `${topic.id} still has a single-language code block`);
    assert.deepEqual(codeBlocks[0].variants.map((variant) => variant.id), ['c', 'cpp']);
    assert.ok(codeBlocks[0].variants.every((variant) => variant.code.trim().length > 40));
  }
});

test('every supplied college assignment maps to a visible C-only lab without assignment numbering', () => {
  assert.equal(collegeMcuCoverage.length, 32);
  assert.equal(collegeDsaCoverage.length, 27);

  for (const { assignment, topicId } of [...collegeMcuCoverage, ...collegeDsaCoverage]) {
    assert.ok(assignment.length > 8, `weak assignment label for ${topicId}`);
    const topic = allTopics.find((item) => item.id === topicId);
    assert.ok(topic, `missing mapped topic for ${assignment}`);
    assert.doesNotMatch(topic.title, /^A\d+\b|^A\d+\s*[-:]/i, `${topic.id} leaks assignment numbering`);
    assert.ok(
      searchTopics(assignment).some((result) => result.id === topicId),
      `${assignment} does not find ${topicId}`,
    );
  }
});

test('college assignment labs contain one complete C implementation and no C++ variant', () => {
  const labTopics = allTopics.filter((item) => (
    item.group === 'College MCU C Labs' || item.group === 'College DSA C Labs'
  ));
  assert.equal(labTopics.length, collegeMcuLabs.length + collegeDsaLabs.length);

  for (const topic of labTopics) {
    const lesson = getLessonForTopic(topic.id);
    const codeBlocks = lesson.blocks.filter((block) => ['code', 'code-pair'].includes(block.type));
    assert.equal(codeBlocks.length, 1, `${topic.id} must expose one source file`);
    assert.equal(codeBlocks[0].type, 'code', `${topic.id} must remain C-only`);
    assert.match(codeBlocks[0].language, /^C(?:\b|\d)/);
    assert.match(codeBlocks[0].code, /\bint\s+main\s*\(\s*void\s*\)/);
    assert.ok(codeBlocks[0].code.length > 900, `${topic.id} source is too small to be complete`);
    assert.doesNotMatch(codeBlocks[0].code, /\b(?:TODO|TBD|pseudocode)\b|\.{3}/i);
  }
});

test('college MCU labs target STM32F446RE and teach the controller-independent port', () => {
  for (const lab of collegeMcuLabs) {
    assert.match(lab.source, /NUCLEO-F446RE/);
    assert.match(lab.source, /#include "stm32f4xx_hal\.h"/);
    assert.match(lab.source, /\bHAL_[A-Za-z0-9_]+\b/);
    assert.doesNotMatch(lab.source, /PIC16|XC8|MPLAB|#include\s*<xc\.h>/i);
    for (const field of ['contract', 'replace', 'timing', 'verify']) {
      assert.ok(lab.portability[field].length > 70, `${lab.id} has weak portability ${field}`);
    }

    const lesson = getLessonForTopic(`college-mcu-${lab.id}`);
    assert.ok(
      lesson.blocks.some((block) => block.heading === 'The portable contract'),
      `${lab.id} lacks its portable contract`,
    );
    const portingSteps = lesson.blocks.find((block) => block.heading === 'Move it to another microcontroller');
    assert.equal(portingSteps?.items.length, 3, `${lab.id} lacks complete porting steps`);
  }
});

test('every lesson explains one concrete real-system application without analogy scaffolding', () => {
  assert.equal(lessons.length, allTopics.length);
  for (const lesson of lessons) {
    const applications = lesson.blocks.filter((block) => block.type === 'application');
    assert.equal(applications.length, 1, `${lesson.topicId} needs exactly one application`);
    assert.equal(applications[0].heading, 'Where this is used');
    assert.ok(applications[0].body.length >= 100, `${lesson.topicId} application is too shallow`);
    assert.doesNotMatch(
      applications[0].body,
      /\b(?:imagine|pretend|think of it as|is like a|just like a)\b/i,
      `${lesson.topicId} uses analogy scaffolding instead of a real application`,
    );
  }
  assert.match(
    getLessonForTopic('dsa-stack-queue').blocks.find((block) => block.type === 'application').body,
    /undo|print server|network driver/i,
  );
});

test('high-value embedded transactions use signal-lane visuals', async () => {
  const source = await readFile(new URL('../src/components/MechanismVisual.jsx', import.meta.url), 'utf8');
  assert.ok(source.includes('SignalLaneVisual'), 'missing signal-lane renderer');

  for (const id of ['embedded-uart', 'embedded-spi', 'embedded-i2c']) {
    const visual = getLessonForTopic(id).blocks.find((block) => block.type === 'visual');
    assert.equal(visual.kind, 'signals', `${id} is still a generic timeline`);
    assert.ok(visual.frames.every((frame) => frame.values.length >= 2), `${id} lacks multiple signal lanes`);
  }
});
