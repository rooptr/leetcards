# Leetcards Interactive DSA Simulators Design

## Goal

Make every lesson visibly accessible when opened, replace DSA’s side-by-side static frames with deterministic step simulations, improve structure-specific visuals, and add missing non-graph interview problem families.

The interface remains quiet and editorial. Interactivity explains state changes; it does not turn the reader into a game or dashboard.

## Navigation and information architecture

The app uses a three-level reading flow:

1. **Library:** the start page lists the curriculum categories in the recommended learning order. Each category shows its purpose, lesson count, and a few representative lessons.
2. **Category:** selecting a category opens its ordered lesson index with local search and short descriptions.
3. **Lesson:** selecting a lesson opens the existing focused editorial reader.

The persistent catalog and the unused `Topics` button are removed. Lesson pages contain only a breadcrumb back to their category, adjacent lessons from the same category, and the optional glossary action. The Leetcards wordmark always returns to the library.

Lightweight hash routes preserve refresh, deep links, and browser Back/Forward behavior:

- `#/` for the library.
- `#/category/:sectionId` for a category.
- `#/lesson/:topicId` for a lesson.

Global search is available on the library and category views. Search results may cross categories, but opening a result always lands in the correct lesson. Every route change resets the natural document scroll position to the top.

The library is an editorial index, not a dashboard. Categories use typography, spacing, restrained color fields, and irregular column spans to create hierarchy without progress meters, equal card grids, or decorative status elements.

## Root cause and reader fix

The Two Pointers and Sliding Window lessons already render complete content. In the controlled browser run, wheel scrolling over both the article and filtered catalog reaches the lesson body, so the global lock is not reproducible there. However, the desktop layout currently relies on body scrolling while the catalog contains a competing scroll container. That makes scroll ownership implicit and browser/input dependent. The tall lesson hero and 76px gap also make `Open glossary` look like the end of the page.

The reader will:

- Reduce unused vertical space above and below the lesson hero.
- Keep the prediction block partially visible in the initial viewport at common laptop heights.
- Give the lesson body a stable `lesson-content` target and appropriate sticky-header scroll margin.
- Use natural document scrolling on desktop and mobile, with no competing catalog scroller beside the article.
- Reset document scroll whenever the route changes.
- Confirm that wheel, touch, keyboard, and Page Down navigation reach all lesson blocks.

## Ordered systems curriculum

The catalog will become the learning order. It will not add a dashboard, prerequisite graph, or recommendation engine.

Recommended cross-track sequence:

1. C representation, pointers, lifetime, build, linking, and debugging.
2. Computer architecture foundations.
3. Linux system programming and operating-system internals.
4. Electronics and schematic reading.
5. Vendor-neutral embedded systems.
6. Microcontroller architecture.
7. STM32F446RE implementation.
8. RTOS and embedded concurrency.

### Computer architecture order

1. Binary, hexadecimal, signed representation, width, and endianness.
2. Boolean logic, combinational logic, clocks, registers, and finite-state machines.
3. ISA concepts, assembly, registers, addressing modes, and instruction encoding.
4. CPU datapath and control.
5. Stack frames and calling conventions.
6. Pipelines, hazards, forwarding, stalls, and branch handling.
7. Memory hierarchy and cache mapping.
8. Cache coherence, atomics, and memory ordering.
9. Buses, interrupts, and DMA.
10. MMU, TLB, page tables, and protection.
11. Performance counters and measurement.

### Linux and operating-systems order

1. Linux build environment, compiler, linker, Make, manual pages, errno, and debugger.
2. System-call ABI, libc wrappers, return values, partial work, and interruption.
3. File descriptors and file I/O: `open`, `read`, `write`, `close`, `lseek`, `stat`, and metadata.
4. Descriptor duplication and control: `dup`, `dup2`, `dup3`, `fcntl`, descriptor flags, open-file-description flags, and advisory locking.
5. Process creation and replacement: `fork`, `_exit`, `exit`, `exec`, environment, and descriptor inheritance.
6. Waiting and lifecycle: `wait`, `waitpid`, exit status, zombies, orphans, adoption, and nonblocking reaping.
7. Signals: `sigaction`, masks, pending signals, `SIGCHLD`, `SIGALRM`, safe handlers, and synchronous fault information.
8. IPC: anonymous pipes, FIFOs, POSIX and System V shared memory, memory mapping, and synchronization.
9. POSIX threads: creation, join, cancellation boundaries, shared state, and thread-local state.
10. Synchronization: mutexes, condition variables, unnamed/named semaphores, deadlock, starvation, and futex-backed blocking.
11. Sockets: TCP/UDP lifecycle, application framing, terminal-style protocols, readiness, and failure handling.
12. Internals: scheduling, virtual memory, copy-on-write, filesystems/VFS, `/proc`, `/sys`, namespaces, cgroups, boot, and observability.

### General embedded and MCU order

1. MCU versus MPU and the CPU/peripheral/bus model.
2. Memory maps, flash, SRAM, nonvolatile storage, and linker placement.
3. Reset, startup code, vector tables, and fault entry.
4. Registers, memory-mapped I/O, volatile access, bit operations, and reserved fields.
5. GPIO electrical modes, alternate functions, and pin multiplexing.
6. Clock sources, PLLs, dividers, resets, and peripheral clock gates.
7. Interrupt controller, priorities, latency, nesting, and ISR rules.
8. Timers, counters, capture/compare, PWM, and time bases.
9. UART, SPI, and I2C transactions.
10. ADC, DAC, sampling, reference error, and analog source constraints.
11. DMA, buffering, ownership, and cache coherency.
12. CAN and robust multidrop communication.
13. Watchdogs, reset causes, and fault recovery.
14. Flash programming, bootloaders, image validation, and updates.
15. Low-power modes, wake sources, and current measurement.
16. JTAG/SWD, logic analyzers, oscilloscopes, and hardware-in-the-loop tests.
17. Vendor portability and HAL boundaries.

### STM32F446RE order

1. Nucleo board, documentation set, schematics, ST-LINK, and toolchain.
2. Pin map, memory map, startup, linker script, vector table, and boot options.
3. CMSIS/register access, LL, HAL, and CubeMX-generated state.
4. Faults, SysTick, GPIO, and the RCC clock tree.
5. UART, SPI, I2C, timers/PWM, ADC/DMA, EXTI/NVIC, and CAN.
6. Watchdogs, RTC/backup domain, flash storage, and low-power modes.
7. SWD diagnosis and FreeRTOS integration.

Every STM32 lesson continues to connect the general mechanism, board schematic, register fields, HAL path, timing constraint, debugging evidence, and repeatable test.

## Linux C implementation track

Linux lessons will include compilable C17 implementations, not only conceptual prose. Examples use narrow interfaces, explicit error checking, cleanup on every failure path, and commands that expose the resulting kernel-visible state.

Build contract:

- `gcc -std=c17 -Wall -Wextra -Wpedantic`.
- Add `-pthread` for POSIX threads and synchronization.
- Use feature-test macros deliberately when an interface requires them.
- Check every syscall and pthread return value.
- Handle short reads/writes and `EINTR`.
- Distinguish `exit` from `_exit` after `fork`.
- Avoid unsafe operations in signal handlers.
- Include a deterministic test command and expected observable result.

### User-space C and internals pairing

Each implementation lesson has two connected layers:

1. A user-space POSIX C program using the public interface.
2. An original simplified C state model plus a guided current-kernel source-reading path explaining the internal lifecycle.

Required internal mechanism lessons:

- `fork`: task creation, copied versus shared state, copy-on-write, descriptor inheritance, and failure cleanup.
- `exec`: replacement of mappings and process image while selected process attributes survive.
- `exit`/`_exit`: thread-group exit, resource release, exit status, and parent notification.
- `wait`/zombies/orphans: zombie state, status retention, reaping, parent exit, and adoption.
- `pthread_mutex`: uncontended atomic fast path, futex-backed wait/wake slow path, ownership, and memory ordering.
- POSIX semaphores: count transition, blocking, wake-up, process-shared placement, and named-object lifecycle.
- Pipes/FIFOs: byte-stream buffers, EOF rules, reference counts, blocking, and atomic-write boundary.
- Shared memory: object creation, sizing, mapping, visibility, and the separate need for synchronization.
- Signals: delivery, masks, pending state, saved execution context, and safe return.

Current upstream manual pages, kernel documentation, and source will be checked before naming internal functions so the lesson does not fossilize one kernel version.

## Linux implementation exercises

The Linux track will answer and implement the following exercises in prerequisite order.

### Files and descriptors

- **A01** — Implement `cp` with `-p`, preserving mode and timestamps and explaining what ownership can or cannot be preserved without privilege.
- **A02** — Implement `wc` with `-l`, `-w`, and `-c`, including streaming input, whitespace transitions, multibyte limitations, and short reads.
- **A03** — Demonstrate `dup`, `dup2`, and descriptor redirection, including shared open-file offsets.
- **A04** — Use advanced file-control calls: selected `fcntl` operations, descriptor/status flags, advisory locks, and one justified `ioctl` example.

### Processes and lifecycle

- **A05** — Correct the wording and demonstrate two mechanisms: a living child becoming an orphan and being adopted, and a terminated child remaining a zombie until its parent exits or reaps it. Print each observed status.
- **A06** — Prevent zombies without blocking the parent using a `SIGCHLD` strategy and a complete `waitpid(..., WNOHANG)` reap loop.
- **A07** — Create a child that executes a command supplied on the command line using an `exec` family call.
- **A08** — Create three sibling child processes from one parent without accidental process-tree multiplication.

### Pipes and shared memory

- **A09** — Two related processes communicating through one anonymous pipe.
- **A10** — Three related processes communicating through two pipes with correct closure of every unused end.
- **A11** — Construct `n` pipes for an `n+1` command pipeline using `fork`, `dup2`, `exec`, and deterministic cleanup.
- **A12** — Two independent processes communicating through shared memory, with a separate synchronization mechanism.
- **A13** — Three processes connected through PIPE, FIFO, and shared memory, with an explicit message/framing and shutdown protocol.

### Signals and faults

- **A14** — Print the faulting address for `SIGSEGV` using `sigaction` and `siginfo_t`, while explaining which operations are safe in a handler.
- **A15** — Implement alarm plus snooze using `SIGALRM` and a state machine that does not perform unsafe handler work.
- **A16** — Parse signal names/numbers from the command line and block/unblock them with `sigprocmask`.
- **A17** — Reap children from a `SIGCHLD` notification without losing coalesced child exits.

### Sockets and threads

- **A18** — Implement a line-framed terminal-style client/server protocol over TCP, including partial I/O and disconnect behavior.
- **A19** — Implement a localhost-only UDP request server with an allowlisted command table, no shell invocation, request IDs, timeouts, and an explanation of why UDP does not guarantee execution or delivery. This teaches the requested remote-command shape without creating an unauthenticated remote shell.
- **A20** — Compute factorial in a worker thread, including argument/result lifetime and `pthread_join`.
- **A21** — Compute sum and maximum using worker threads and mutex-protected shared aggregation; compare with per-thread partial results merged after join.
- **A22** — Multiply matrices using threads with bounded work partitioning, dimension validation, overflow discussion, and correctness comparison against a serial implementation.

Every exercise includes:

- Mechanism explanation.
- Process/descriptor/thread state diagram.
- Compilable C source.
- Build and run commands.
- Expected output.
- Failure cases.
- `strace`, `/proc`, GDB, sanitizer, or timing observation where useful.
- Automated test or deterministic verification script.

## Simulator controls

Every DSA visual uses one focused stage rather than displaying all states in narrow columns.

Controls:

- A labeled range slider from step 1 to the final step.
- Previous and Next buttons.
- Play/Pause, never autoplaying when the lesson opens.
- Play advances deterministically and stops at the final state.
- Moving the slider or pressing Previous/Next pauses playback.
- Left/Right arrow keys work through the native slider.
- The current step number and caption are always visible.
- The caption is announced through a polite live region.
- Reduced-motion users receive immediate state changes without animated interpolation.

The simulator stores only the current step and playback state. Lesson data remains deterministic and serializable.

## DSA visual schema

Each simulation frame may define:

- `caption`: what changed and why.
- `values`: stable values or nodes.
- `active`: the state changed by this operation.
- `pointers`: named positions such as `left`, `right`, `slow`, `fast`, or `mid`.
- `window`: inclusive active range.
- `discarded`: indexes or candidates proven impossible.
- `links`: explicit linked-list edges.
- `tree`: stable node IDs and parent-child edges.
- `stack`: vertical values with the top identified.
- `queue`: head, tail, capacity, and wrap state.
- `buckets`: bucket contents and collision/probe state.
- `matrix`: current coordinate, visited cells, and dependency cells.
- `metrics`: only mechanism-critical values such as sum, count, balance, or complexity charge.

Renderers must not infer topology or identity from display order when explicit state is available.

## Structure-specific improvements

### Arrays, pointers, and windows

- Pointer labels sit above the exact indexed cells.
- Discarded ranges become visibly muted.
- Sliding windows shade only `[left, right]`, not the entire array.
- Entering and leaving values are distinguished from values merely inside the window.
- Two Pointers shows every comparison and the proof behind the moved endpoint.

### Stacks, queues, and circular buffers

- A stack is vertical with a visible bottom, top, and one shared push/pop end.
- A queue is horizontal with independent enqueue and dequeue ends.
- A circular buffer is a ring with capacity slots, head, tail, empty/full state, and wraparound.
- Monotonic stack simulations show each push, comparison, pop, and resolved answer.

### Linked lists

- Nodes keep stable positions and addresses.
- Only pointer edges change during rewiring.
- Reversal, middle finding, and cycle detection use separate complete traces.

### Trees

- Parent-child edges come from explicit topology.
- Traversal highlights the current path and completed subtree.
- Rotations preserve node identity and visibly change edges.
- Heap simulation preserves complete-tree shape while showing sift-up/down.

### Hash tables

- Separate chaining shows bucket-local linked entries.
- Open addressing shows probe order, occupied slots, tombstones, and termination.
- Resizing shows old bucket, recomputed bucket, and movement of each live key.

### Dynamic programming and matrices

- Matrix traversal shows coordinates, bounds, and visited cells.
- DP shows the precise dependency cells used for the current transition.
- Space reduction is shown only after the full table’s dependency direction is understood.

### Non-DSA mechanism visuals

The same review will improve high-value system visuals:

- UART, SPI, and I2C become signal-lane simulations with sampling edges and active ownership.
- Stack/heap layout uses stable memory regions rather than generic timeline labels.
- Cache and virtual-memory traces show the currently active lookup stage.
- Existing static explanatory text remains available beneath every interactive visual.

## Full-process examples

Every DSA simulation contains enough steps to finish one representative input, not merely three snapshots.

Required complete traces include:

- Two-sum on a sorted array with Two Pointers.
- Longest substring without repeating characters.
- Fixed-size and variable-size sliding windows.
- Maximum subarray using Kadane’s algorithm.
- Longest consecutive sequence using hash-set run starts.
- Coin change for minimum coins and count-of-ways variants.
- Prefix sum and difference-array construction plus query/update.
- Binary search on indexes and on a monotonic answer space.
- Linked-list reversal and cycle detection.
- Stack, queue, circular buffer, and monotonic-stack operations.
- Hash collisions, open addressing, tombstones, and resizing.
- Heap insert and remove.
- BST search, AVL rotation, and red-black repair.
- Insertion, selection, merge, quick, and heap sort.
- Backtracking choose/recurse/undo.
- Greedy safe-choice proof.
- Dynamic-programming state, transition, base case, order, and space reduction.

## Curriculum additions

Add dedicated lessons where the existing broad pattern lesson is not enough.

### Sequence vocabulary and string patterns

- Substring versus subarray versus subsequence.
- Character frequency tables and anagram reasoning.
- Palindrome expansion and two-pointer checks.
- Longest substring without repeating characters.
- At-most/exactly K distinct substring windows.

### Array and hash patterns

- Maximum subarray and Kadane’s invariant.
- Longest consecutive sequence.
- Cyclic index placement when values encode positions.
- Top K, quickselect, and K-way merge.

### Backtracking families

- Subsets.
- Permutations.
- Combination sum.
- Constraint pruning and duplicate handling.

### Dynamic-programming families

- One-dimensional take/skip DP.
- Grid path DP.
- 0/1 and unbounded knapsack.
- Coin change: minimum coins and number of ways.
- Longest increasing subsequence.
- Longest common subsequence.
- Edit distance.
- State compression and rolling storage.

These additions remain within the approved selected-DSA scope. Graph algorithms, tries, union-find, B-trees, and all previously excluded topics remain excluded.

## Teaching contract

Every new problem-family lesson answers:

1. What wording in the question signals the pattern?
2. What is the brute-force approach and exactly what work does it repeat?
3. What state is carried?
4. What invariant remains true?
5. Why is each state update safe?
6. What ends the process?
7. What counterexample breaks the pattern?
8. What are the time and space costs?
9. How does the C++ implementation follow from the invariant?

The explanation distinguishes similar terms explicitly. For example:

- `substring` is contiguous characters.
- `subsequence` preserves order but may skip characters.
- `subarray` is the array analogue of a substring.
- `consecutive values` concerns numeric adjacency, not adjacent indexes.
- Coin Change’s minimum-count and number-of-ways questions require different DP meanings and update rules.

## Explanation-quality review

After implementation, perform a second content pass independent of structural tests:

- Read Two Pointers, both sliding-window variants, longest substring, Kadane, longest consecutive sequence, and both Coin Change variants end to end.
- Reject any generic invariant that could be pasted into another lesson unchanged.
- Verify every caption states what changed and why.
- Verify examples reach their final answer without skipped operations.
- Verify C++ templates use the same variable names and state definitions as the visual.
- Verify failure cases include a concrete counterexample.
- Check terminology, grammar, punctuation, and character encoding.
- Confirm concise topics remain concise while required mechanisms stay deep.

## Tests and acceptance

- Opening Two Pointers or Sliding Window visibly reveals a path into the lesson body.
- Every lesson scrolls through the natural page on desktop and mobile.
- Selecting a different route resets the document to its top.
- The app opens on the category library, then moves from category to lesson without an unused Topics control.
- Browser Back/Forward and direct hash links restore the correct library, category, or lesson view.
- The full lesson remains reachable by wheel, touch, keyboard, and direct anchor navigation.
- Every DSA visual exposes slider, Previous, Next, and Play/Pause controls.
- Slider bounds equal the available frame count.
- Playback advances, pauses on manual input, and stops at the final frame.
- All controls have accessible names and correct disabled states.
- Two Pointers, sliding windows, stacks, queues, circular buffers, linked lists, trees, hashes, matrices, and DP render with structure-correct state.
- Every DSA topic has a complete representative trace.
- Every added topic resolves to substantive lesson content and is searchable.
- Computer architecture, Linux, general embedded, MCU, STM32, and RTOS catalog order follows the documented learning sequence.
- Linux has dedicated searchable lessons for file I/O, descriptor duplication/control, process creation, exec, exit, waiting, zombies, orphans, signals, pipes, FIFOs, shared memory, pthreads, mutexes, semaphores, and sockets.
- A01 through A22 each resolve to an implementation lesson with C source, build command, state explanation, failure analysis, and deterministic verification.
- Linux C examples compile warning-clean in a Linux environment with their documented flags.
- Internal explanations distinguish public POSIX behavior from current Linux implementation details and cite the inspected source revision.
- Explicit exclusions remain absent.
- No visual overflows at 320px width.
- Application tests, production build, browser console, scrolling, and visual QA pass.

## Scope boundary

This work implements the deterministic step-through portion of the previously deferred Visual Lab. It does not add editable inputs, code execution, scoring, accounts, progress tracking, or a recommendation engine.
