# Leetcards Library, Simulators, and Linux Labs Implementation Plan

> **For agentic workers:** Use test-driven development for each task and perform a task-scoped review before moving on.

**Goal:** Ship the category-first Leetcards reader, reliable lesson scrolling, complete interactive DSA traces, ordered systems curricula, and Linux C labs A01-A22.

**Architecture:** Plain JavaScript curriculum and lesson data feed route-aware React views. Hash routes provide deep links without a router dependency. One reusable simulator owns deterministic frame state and delegates to structure-specific renderers. Linux labs are data-backed lessons with complete C17 source and verification commands.

**Tech stack:** React, Vite, native CSS, inline semantic HTML/SVG, Node test runner, GCC in Linux when available.

## Global constraints

- Preserve the approved C/C++/Linux/architecture/networking/electronics/embedded/STM32F446RE/RTOS/selected-DSA scope and all explicit exclusions.
- The first screen is the category library. Category selection reveals ordered lessons. Lesson selection reveals the focused reader.
- Remove the persistent Topics catalog and avoid nested reader scrolling.
- Keep the interface warm, quiet, editorial, and accessible. One rust accent, no gradients, minimal shadow, no dashboard patterns.
- Deep topics require topic-specific mechanism prose. Brief topics stay concise.
- DSA visuals are interactive now; the broader editable Visual Lab remains v2.
- Do not commit or push from this malformed shared Git root.

### Task 1: Category-first navigation and scrolling

**Files:** `tests/curriculum.test.js`, `src/App.jsx`, `src/components/LibraryView.jsx`, `src/components/CategoryView.jsx`, `src/components/LessonReader.jsx`, `src/data/routes.js`, `src/styles.css`.

- [ ] Add failing tests for route parsing, library/category/lesson source structure, removal of `Catalog` and `Topics`, same-category adjacent lessons, and natural scrolling.
- [ ] Run `npm.cmd test` and confirm RED.
- [ ] Implement hash routes, category and library views, search, breadcrumbs, Back/Forward support, and scroll reset.
- [ ] Restyle the complete flow and add empty search handling.
- [ ] Run focused tests and build until GREEN.

### Task 2: Deterministic DSA simulator

**Files:** `tests/curriculum.test.js`, `src/components/MechanismVisual.jsx`, `src/data/simulation.js`, `src/data/dsaVisuals.js`, `src/styles.css`.

- [ ] Add failing reducer and source tests for slider, Previous, Next, Play/Pause, bounds, manual pause, and final-step stop.
- [ ] Run tests and confirm RED.
- [ ] Implement the pure simulator state transitions and accessible controls.
- [ ] Render one frame at a time with explicit pointers, windows, discarded ranges, links, tree edges, stack/queue/ring state, hash probes, matrices, and signal lanes.
- [ ] Run tests and build until GREEN.

### Task 3: DSA problem-family expansion

**Files:** `tests/curriculum.test.js`, `src/data/topics.js`, `src/data/topicNotes.js`, `src/data/dsaVisuals.js`, `src/data/lessonCatalog.js`.

- [ ] Add failing coverage tests for sequence vocabulary, substring patterns, Kadane, longest consecutive, selection/merge families, backtracking families, and the requested DP families.
- [ ] Run tests and confirm RED.
- [ ] Add ordered topics, specific recognition clues, brute-force comparison, invariant, counterexample, complexity, C++ template, and complete traces.
- [ ] Ensure every DSA topic uses a typed complete visual and no generic invariant.
- [ ] Run tests and build until GREEN.

### Task 4: Ordered systems curriculum and Linux mechanisms

**Files:** `tests/curriculum.test.js`, `src/data/topics.js`, `src/data/topicNotes.js`, `src/data/deepProfiles.js`, `src/data/lessonCatalog.js`.

- [ ] Add failing order and dedicated-topic tests for architecture, Linux, embedded, MCU, STM32, and RTOS.
- [ ] Run tests and confirm RED.
- [ ] Reorder the tracks and add dedicated Linux lessons for build environment, syscall contracts, file I/O, descriptor control, process lifecycle, signals, IPC, pthreads, mutexes, semaphores, and sockets.
- [ ] Pair public POSIX C usage with original simplified Linux-internals state models.
- [ ] Run tests and build until GREEN.

### Task 5: Linux C labs A01-A22

**Files:** `tests/linux-labs.test.js`, `src/data/linuxLabs.js`, `src/data/topics.js`, `src/data/lessonCatalog.js`.

- [ ] Add failing tests requiring all 22 unique lab IDs, source, flags, run command, expected evidence, failure analysis, and deterministic verification.
- [ ] Run tests and confirm RED.
- [ ] Author complete C17 programs for A01-A22, including the corrected A05 semantics and safe localhost-only A19.
- [ ] Connect every lab to a searchable lesson in prerequisite order.
- [ ] Compile warning-clean with documented flags in a Linux environment when available.
- [ ] Run all tests and build until GREEN.

### Task 6: Explanation and visual QA

**Files:** all changed application and content files.

- [ ] Run `npm.cmd test` and `npm.cmd run build`.
- [ ] Search visible copy for encoding damage, forbidden placeholder prose, and excluded topics.
- [ ] Browser-test library, search, category, lesson, glossary, scrolling, simulator controls, keyboard access, mobile layout, and Back/Forward.
- [ ] Read Two Pointers, sliding windows, longest substring, Kadane, longest consecutive, and both Coin Change lessons end to end.
- [ ] Check concise topics remain concise and required mechanisms are genuinely deep.
- [ ] Record any environment-limited Linux compile checks explicitly.
