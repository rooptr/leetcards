# Leetcards Editorial Reader and Visual DSA Design

## Product direction

Leetcards is a focused C, C++, Linux, computer architecture, electronics, embedded systems, STM32F446RE, RTOS, networking, Git, debugging, testing, and selected DSA curriculum. It is a quiet technical publication rather than a dashboard or game.

The teaching voice is curious, concrete, and mechanism-first. It may use everyday analogies and prediction prompts, but it must not impersonate Rancho, quote *3 Idiots*, or copy Bartosz Ciechanowski or AlgoMonster. The product borrows the useful teaching principles: begin with a visible puzzle, isolate one moving part, reveal state changes, assemble the whole mechanism, and test transfer.

## Variable lesson depth

Every catalog topic has a real lesson. No topic may fall back to generic placeholder prose.

- `brief`: 2–4 minute explanations for vocabulary, straightforward commands, and narrow concepts.
- `standard`: 6–10 minute explanations with an example, state trace, failure mode, and recall prompt.
- `deep`: 12–20 minute mechanism lessons with a prediction, intuition, staged diagram, detailed trace, failure analysis, practical debugging or measurement exercise, and recall prompt.

Deep treatment is mandatory for stack/heap layout, cache behavior, virtual memory, system-call transitions, UART, SPI, I2C, schematic reading, debugging, concurrency, RTOS scheduling, STM32 startup/interrupts/DMA/clocks, and reusable DSA patterns.

## Lesson shape

Deep lessons use this sequence:

1. `hook`: a concrete question or surprising observation.
2. `prediction`: the learner commits to an expected outcome before the reveal.
3. `intuition`: an everyday physical model with explicit limits.
4. `mechanism`: the minimum correct model and vocabulary.
5. `trace`: numbered state changes from input to output.
6. `visual`: one or more static frames showing only the state that changes.
7. `failure`: what breaks, what is observable, and why.
8. `practice`: code, debugger, schematic, measurement, or reasoning exercise.
9. `recall`: explain the mechanism without looking.

Brief lessons use a precise explanation, one concrete example, one common mistake, and one recall prompt. Standard lessons use the same fields plus a state trace or static visual.

## DSA pattern curriculum

DSA stays selected and systems-relevant. Explicitly excluded graph and storage-tree topics remain excluded.

The curriculum includes:

- Complexity, invariants, and amortized analysis
- Multidimensional array and matrix traversal
- Linked-list pointer rewiring, reversal, middle, and cycle detection
- Stacks, queues, circular buffers, and deques
- Hash tables, collisions, chaining, open addressing, tombstones, and resizing
- Heaps and priority queues
- Binary trees, BSTs, AVL trees, and red-black trees
- Sorting: insertion, selection, merge, quick, and heap sort
- Binary search on indexes and answer spaces
- Two pointers
- Fixed and variable sliding windows
- Fast and slow pointers
- Prefix sums and difference arrays
- Interval merge and sweep reasoning
- Monotonic stacks and queues
- Recursion, backtracking, and pruning
- Divide and conquer
- Greedy reasoning
- Dynamic programming: state, transition, base case, iteration order, and space reduction
- Bitwise patterns and bitmasks

Each reusable pattern answers:

- What clue suggests this pattern?
- What state is carried?
- What invariant remains true?
- What changes at each step?
- Why is the brute-force alternative wasteful?
- When does the pattern not apply?
- What is the C++ template?

## Static visual language

V1 remains non-interactive. Visuals are semantic HTML/CSS or inline SVG with accessible captions.

- Arrays use indexed cells.
- Pointers use labeled markers above or below cells.
- Active state uses the single rust accent; inactive state stays neutral.
- Windows use a pale bounded region.
- Stacks and queues show entry and removal direction.
- Linked lists show nodes, addresses, and pointer arrows.
- Trees show nodes and highlighted traversal paths.
- Recursion and backtracking use compact state trees with the reverted edge visually distinguished.
- Dynamic programming uses a table with dependency arrows and a highlighted current cell.
- Timelines use `T0`, `T1`, and `T2` frames.
- Bus protocols use aligned signal lanes and annotated sampling edges.
- Architecture diagrams show request, lookup, hit/miss, and returned data as separate stages.

Every visual has a one-sentence caption stating what changed. Monospace is reserved for code, addresses, values, registers, commands, and bus symbols.

## Reader interface

- Warm off-white canvas, near-black ink, muted warm gray, and one restrained rust accent.
- A compact top bar with wordmark, current section breadcrumb, search trigger, and catalog trigger.
- Desktop uses a sticky narrow catalog and one centered reading column.
- The permanent right rail is removed.
- Definitions open in a small optional drawer only when requested.
- Headings use a restrained serif or humanist display face; body copy uses a clean sans-serif.
- Desktop prose is 62–68 characters wide at roughly 18px/1.7.
- Major lesson boundaries use whitespace; ordinary sections do not receive boxes or separator lines.
- Diagrams sit wider than prose when helpful, but never overflow the viewport.
- Mobile uses a full-height catalog drawer and a single reading column.
- Reduced-motion preferences are respected; V1 uses no decorative animation.

## Curriculum corrections

Add dedicated coverage for:

- C qualifiers, integer promotions/overflow, alignment/endianness, strict aliasing, allocation failure/fragmentation, build and linker fundamentals
- C++ references, constructors/destructors, const correctness, overload resolution, namespaces, compile-time evaluation, build/toolchain foundations
- Linux process lifecycle, users/permissions, filesystems/mounting, `mmap`, copy-on-write, swapping and reclamation
- Networking MTU/fragmentation, NAT, routing decisions, interface configuration, and common application protocols
- Git working tree/index/staging, conflicts, tags/detached HEAD, and collaborative workflows
- Electronics KCL/KVL, series/parallel networks, capacitor/inductor behavior, transistor fundamentals, analog front ends, protection/ESD, and safe measurement grounding
- RTOS critical sections, interrupt masking, barriers, starvation/deadlock, software timers, event groups, task notifications, and resource budgeting
- STM32F446RE faults/exceptions, SysTick, memory map, boot and option bytes, CMSIS/register-level versus HAL, Nucleo pin mapping, and datasheet/reference-manual/errata workflow

Required mechanism lessons must also cover:

- UART parity, flow control, buffering, TX/RX sequencing, baud error, and failure diagnosis
- SPI modes, bit order, word size, chip-select timing, multi-byte protocols, and failure diagnosis
- I2C direction bits, repeated starts, arbitration, clock stretching, bus recovery, and multi-byte transactions
- Cache mapping, associativity, replacement, write policies, false sharing, and DMA coherency
- Stack guards, allocator metadata, fragmentation, failure, and linker-defined embedded memory
- Virtual-memory mapping, TLBs, page faults, protection, `mmap`, copy-on-write, swapping, and reclamation
- Syscall register conventions, privilege transition, validation, blocking, interruption, return values, and tracing

## Acceptance criteria

- Every topic resolves to substantive lesson content.
- Variable depth is visible but does not feel like gamified difficulty.
- Deep mechanism lessons include predictions, state traces, visuals, failure modes, and practice.
- DSA patterns include static frame-by-frame explanations and C++ templates.
- All explicit exclusions remain absent.
- The permanent right rail and generic fallback lesson are removed.
- Search still finds titles and keywords.
- Keyboard and mobile navigation remain usable.
- Tests validate coverage, exclusions, depth, diagrams, and topic-to-lesson mapping.
- The production build succeeds without warnings caused by the application code.
