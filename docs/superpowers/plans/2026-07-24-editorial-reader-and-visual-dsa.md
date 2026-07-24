# Editorial Reader and Visual DSA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Leetcards as a clean variable-depth technical reader with exhaustive topic-to-lesson coverage and visual DSA pattern explanations.

**Architecture:** Curriculum metadata, authored lesson content, and static visual definitions remain plain JavaScript data. Focused React components render the catalog, lesson blocks, recall prompts, and reusable mechanism visuals. Node tests enforce coverage and exclusions; Vite verifies the production bundle.

**Tech Stack:** React, Vite, semantic HTML, CSS, inline SVG, Node built-in test runner.

## Global Constraints

- Keep the product focused on C, C++, Linux, computer architecture, networking, Git, debugging, testing, electronics, schematic reading, embedded systems, STM32F446RE, RTOS, and selected DSA.
- Do not add the explicitly excluded C, graph, trie, or storage-tree topics.
- V1 visuals are static; Visual Lab remains unmounted and deferred to v2.
- Every catalog topic must resolve to substantive lesson content.
- Use one restrained accent color, no gradients, minimal shadows, and no dashboard UI.
- Do not impersonate or copy the named teaching references.

---

### Task 1: Enforce the content contract

**Files:**
- Modify: `tests/curriculum.test.js`
- Create: `src/data/contentModel.js`

**Interfaces:**
- Produces: `LESSON_DEPTHS`, `validateLesson(lesson)`, and `getLessonForTopic(topicId)`.

- [ ] **Step 1: Write failing tests**

Add tests asserting that each topic has one lesson, every lesson has a valid depth, deep lessons contain prediction/trace/visual/failure/practice blocks, DSA pattern lessons have at least one visual and a C++ template, and removed topics are absent.

- [ ] **Step 2: Verify RED**

Run `npm.cmd test`.

Expected: failure because topic-to-lesson coverage and the content-model exports do not exist.

- [ ] **Step 3: Implement the content contract**

Create the exported depth constants and validators. Index lessons by `topicId` rather than matching display titles.

- [ ] **Step 4: Verify GREEN**

Run `npm.cmd test`.

Expected: contract tests pass once the data in Tasks 2–4 is complete; earlier tests continue to pass during incremental work.

### Task 2: Correct and expand the curriculum taxonomy

**Files:**
- Modify: `src/data/curriculum.js`
- Modify: `src/data/search.js`
- Test: `tests/curriculum.test.js`

**Interfaces:**
- Consumes: lesson depth constants from `src/data/contentModel.js`.
- Produces: corrected `curriculum`, `allTopics`, `topicById`, and topic search metadata.

- [ ] **Step 1: Add failing taxonomy tests**

Assert the presence of each dedicated foundation listed in the design specification and the absence of every explicit exclusion.

- [ ] **Step 2: Verify RED**

Run `npm.cmd test`.

Expected: missing-foundation assertions fail.

- [ ] **Step 3: Expand the topic lists**

Add dedicated C, C++, Linux, networking, Git, electronics, RTOS, STM32, and DSA pattern topics. Split Git, debugging, and testing into catalog subgroups while retaining the required top-level learning area.

- [ ] **Step 4: Verify GREEN**

Run `npm.cmd test`.

Expected: taxonomy and search tests pass.

### Task 3: Author variable-depth lesson content

**Files:**
- Create: `src/data/lessonHelpers.js`
- Create: `src/data/lessons/coreLessons.js`
- Create: `src/data/lessons/embeddedLessons.js`
- Create: `src/data/lessons/dsaLessons.js`
- Create: `src/data/lessons/briefLessons.js`
- Modify: `src/data/curriculum.js`
- Test: `tests/curriculum.test.js`

**Interfaces:**
- Produces: `lessons`, where every lesson has `topicId`, `depth`, `summary`, and typed blocks.
- Block types: `prose`, `prediction`, `steps`, `visual`, `code`, `failure`, `practice`, and `recall`.

- [ ] **Step 1: Add failing coverage tests**

Assert `lessons.length === allTopics.length`, unique `topicId` values, non-empty summaries, no generic fallback text, and the deep-lesson block requirements.

- [ ] **Step 2: Verify RED**

Run `npm.cmd test`.

Expected: lesson coverage and schema assertions fail.

- [ ] **Step 3: Add helper constructors**

Implement helpers for brief, standard, and deep lessons that reject empty examples and repeated placeholder copy.

- [ ] **Step 4: Author deep systems lessons**

Expand stack/heap, cache, virtual memory, syscalls, UART, SPI, I2C, schematic reading, debugging, concurrency, RTOS, STM32 startup, clocks, interrupts, and DMA.

- [ ] **Step 5: Author substantive brief and standard lessons**

Give every remaining topic a topic-specific mechanism, example, common failure, and recall prompt. Do not use a shared paragraph with only title substitution.

- [ ] **Step 6: Verify GREEN**

Run `npm.cmd test`.

Expected: all coverage and schema assertions pass.

### Task 4: Add visual DSA pattern lessons

**Files:**
- Create: `src/data/dsaVisuals.js`
- Modify: `src/data/lessons/dsaLessons.js`
- Create: `src/components/MechanismVisual.jsx`
- Create: `src/components/MechanismVisual.css`
- Test: `tests/curriculum.test.js`

**Interfaces:**
- Produces visual kinds: `array`, `pointer-array`, `window`, `stack`, `queue`, `linked-list`, `tree`, `recursion-tree`, `dp-grid`, and `timeline`.

- [ ] **Step 1: Add failing visual tests**

Assert deep DSA pattern lessons include a recognized visual kind, at least two frames, a caption for every frame, an invariant, recognition clues, misuse guidance, complexity, and a C++ template.

- [ ] **Step 2: Verify RED**

Run `npm.cmd test`.

Expected: DSA visual contract fails.

- [ ] **Step 3: Define visual data**

Create frame data for two pointers, sliding windows, fast/slow pointers, prefix sums, interval merging, monotonic stacks, binary search, backtracking, dynamic programming, linked-list rewiring, hashing, heaps, and balanced-tree rotation.

- [ ] **Step 4: Render accessible visuals**

Render semantic cells, pointers, arrows, active paths, captions, and code templates. Keep visuals static and responsive.

- [ ] **Step 5: Verify GREEN**

Run `npm.cmd test`.

Expected: DSA visual contract passes.

### Task 5: Rebuild the editorial reader

**Files:**
- Create: `src/components/Catalog.jsx`
- Create: `src/components/LessonReader.jsx`
- Create: `src/components/LessonBlock.jsx`
- Create: `src/components/GlossaryDrawer.jsx`
- Modify: `src/App.jsx`
- Modify: `src/styles.css`
- Test: `tests/curriculum.test.js`

**Interfaces:**
- Consumes: `getLessonForTopic(topicId)` and typed lesson blocks.
- Produces: desktop two-column reader, mobile catalog drawer, and optional glossary drawer.

- [ ] **Step 1: Add failing source-structure tests**

Assert the app no longer renders `TopicOverview` or `context-panel`, and that every selected topic is resolved through `getLessonForTopic`.

- [ ] **Step 2: Verify RED**

Run `npm.cmd test`.

Expected: legacy-fallback assertions fail.

- [ ] **Step 3: Split the reader into focused components**

Build the catalog, reader, block renderer, recall interaction, previous/next navigation, and glossary drawer.

- [ ] **Step 4: Apply the editorial design system**

Use a warm paper palette, near-black text, rust accent, serif headings, clean sans body, 62–68ch measure, whitespace-led hierarchy, larger catalog targets, full-height mobile drawer, and diagram overflow protection.

- [ ] **Step 5: Verify GREEN**

Run `npm.cmd test`.

Expected: all source-structure and content tests pass.

### Task 6: Verify the complete application

**Files:**
- Modify: `README.md` if present
- Modify: `leetcard.md`
- Verify: all production and test files

**Interfaces:**
- Consumes: the complete reader, curriculum, content, and visual system.

- [ ] **Step 1: Run the full test suite**

Run `npm.cmd test`.

Expected: zero failed tests.

- [ ] **Step 2: Build production assets**

Run `npm.cmd run build`.

Expected: Vite exits with code 0 and produces `dist`.

- [ ] **Step 3: Inspect the responsive reader**

Run the Vite development server and inspect desktop and mobile layouts. Confirm catalog navigation, search, lesson selection, recall reveal, glossary opening, diagram overflow, keyboard focus, and reduced-motion behavior.

- [ ] **Step 4: Check acceptance criteria**

Compare the implementation line by line with `docs/superpowers/specs/2026-07-24-editorial-reader-and-visual-dsa.md`. Record any remaining gaps instead of claiming completion.
