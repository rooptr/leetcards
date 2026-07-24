# Leetcards

Leetcards is a clean systems learning reader for C, C++, Linux, computer architecture, networking, electronics, general embedded systems, and STM32F446RE.

## Product shape

- A quiet two-column reader with a compact topic catalog, search, explain-it-back prompts, exercises, an optional glossary drawer, and static mechanism diagrams.
- Warm off-white surfaces, near-black type, one restrained terracotta accent, thin rules, minimal shadows, and no dashboard chrome.
- The Visual Lab is a documented v2 boundary. V1 uses static explanations for protocols, memory, caches, virtual memory, system calls, and schematic paths.
- Lessons use three editorial depths: brief for narrow facts, standard for concepts needing a trace, and deep for stateful mechanisms.

## Teaching model

Deep lessons begin with a prediction, build the minimum correct mechanism, follow state step by step, expose a failure mode, provide a practical observation, and end with an explain-it-back prompt.

Every catalog topic resolves to lesson content. There is no generic fallback page.

## Curriculum

The canonical topic inventory lives in `src/data/curriculum.js` and is validated by `tests/curriculum.test.js`.

It covers:

- C and C tricks, including multidimensional arrays, pointers, memory, structs, preprocessing, undefined behavior, and sharp language traps.
- C++ ownership, RAII, object lifetime, templates, STL, smart pointers, errors, and concurrency.
- OS foundations, Linux processes, threads, scheduling, virtual memory, files, signals, IPC, syscalls, shell pipelines, and tracing.
- Architecture, assembly, CPU datapaths, pipelines, cache behavior, coherence, DMA, MMU translation, and measurement.
- Networking, sockets, TCP, UDP, DNS, IP, non-blocking I/O, epoll, and packet debugging.
- Git, debugging, sanitizers, GDB, core dumps, tracing, unit tests, fuzzing, static analysis, and hardware-in-the-loop testing.
- Electronics, component behavior, power integrity, and schematic reading.
- Vendor-neutral embedded systems, UART, SPI, I2C, CAN, interrupts, timers, ADC, DMA, watchdogs, bootloaders, low power, and hardware debugging.
- STM32F446RE board bring-up, CubeIDE, CubeMX, ST-LINK, startup, linker memory, GPIO, clocks, peripherals, SWD, and FreeRTOS.
- Selected data structures and algorithms, including matrix traversal, linked-list rewiring, stacks, queues, circular buffers, hashing, heaps, binary trees, BSTs, AVL and red-black trees, sorting, binary search, two pointers, sliding windows, fast/slow pointers, prefix and difference arrays, intervals, monotonic structures, recursion, backtracking, divide and conquer, greedy reasoning, dynamic programming, and bitwise patterns.

DSA pattern lessons include recognition clues, an invariant, static frame-by-frame state visuals, misuse guidance, complexity, and a reusable C++ skeleton.

## Explicit exclusions

The product does not include dedicated lessons for C functions, C function pointers or callbacks, general one-dimensional arrays, C interoperability or ABI boundaries, B-trees, storage-oriented trees, tries, graph reasoning, topological sorting, connected components, union-find, shortest-path algorithms, or minimum-spanning-tree algorithms.

## Development

```powershell
npm.cmd install
npm.cmd test
npm.cmd run dev
npm.cmd run build
```

Visual Lab v2 contracts are documented in `docs/visual-lab-v2.md` and are intentionally not mounted in the V1 reader.
