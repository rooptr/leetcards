import { topicNotes } from './topicNotes.js';
import { linuxLabById } from './linuxLabs.js';
import { collegeMcuLabByTopicId } from './collegeMcuLabs.js';
import { collegeDsaLabByTopicId } from './collegeDsaLabs.js';

const dsaApplications = {
  'dsa-complexity': 'A navigation service compares candidate route algorithms against a latency budget before traffic grows; asymptotic and amortized costs predict whether one request remains fast when the road graph becomes millions of edges.',
  'dsa-matrix': 'Image filters, game boards, spreadsheets, and sensor grids store values by row and column; row-major traversal processes contiguous pixels or samples efficiently.',
  'dsa-sequence-terms': 'Search engines distinguish a contiguous substring match from a subsequence match, while telemetry systems identify consecutive timestamps and contiguous bursts.',
  'dsa-frequency-anagram': 'Fraud pipelines and log analyzers use frequency tables to compare multisets, detect reordered identifiers, and count bounded categories without sorting every record.',
  'dsa-palindrome': 'DNA analysis, text normalization, and bidirectional protocol checks compare symbols from both ends or expand around candidate centers.',
  'dsa-linked': 'Operating-system free lists, intrusive driver queues, and media playlists insert or remove entries without shifting an array; pointer rewiring must preserve the only path to remaining nodes.',
  'dsa-stack-queue': 'Editors implement undo with a stack, print servers dispatch jobs with a queue, and network drivers use circular buffers to absorb bytes arriving faster than foreground code can process them.',
  'dsa-hash': 'Compilers resolve symbol names, caches locate objects, and routers track active flows through hash tables where collision handling is part of correctness.',
  'dsa-heap': 'Schedulers choose the next deadline, monitoring systems retain the largest alerts, and graph searches select the next lowest-cost state with a priority queue.',
  'dsa-binary-tree': 'Filesystem indexes, syntax trees, and hierarchical UI layouts use tree traversals to visit parents and children in an order that matches serialization, evaluation, or display.',
  'dsa-bst': 'In-memory ordered indexes support lookup, insertion, deletion, predecessor, successor, and range reporting while preserving key order.',
  'dsa-avl': 'Read-heavy in-memory indexes use AVL trees when predictable lookup height matters more than minimizing rotations during updates.',
  'dsa-red-black': 'Linux kernel structures and standard ordered maps use red-black trees to keep updates and lookups logarithmic with relatively few rotations.',
  'dsa-sorting': 'Databases sort rows for merge joins, billing systems order transactions by timestamp, and UIs sort records before grouping or deduplication.',
  'dsa-search': 'Storage engines find the first record at or after a key, deployment systems find the smallest safe capacity, and media players seek timestamps with boundary-oriented binary search.',
  'dsa-two-pointers': 'Deduplication scans sorted records in place, media tools compare frames from opposite ends, and pair-sum checks discard many candidate pairs after one comparison.',
  'dsa-sliding': 'Rate limiters count requests in a recent interval, monitoring systems compute rolling averages, and packet inspection searches contiguous byte windows without recomputing each range.',
  'dsa-longest-substring': 'Input validators and stream analyzers find the longest span with no repeated token by retaining only the active window and each token’s last position.',
  'dsa-k-distinct': 'Analytics systems find the longest interval containing at most K categories, such as a session involving no more than K page types or device IDs.',
  'dsa-fast-slow': 'Memory allocators detect corrupted free-list cycles and linked structures locate a midpoint without storing every visited address.',
  'dsa-prefix': 'Telemetry dashboards answer thousands of time-range totals after building one cumulative table, turning each range query into two boundary reads.',
  'dsa-difference': 'Calendar capacity systems and graphics pipelines apply many interval updates by recording only where each effect starts and stops.',
  'dsa-kadane': 'Trading and capacity-planning tools find the contiguous interval with the greatest net gain or overload while scanning each measurement once.',
  'dsa-longest-consecutive': 'Event processors find the longest uninterrupted run of sequence numbers or dates even when records arrive unordered.',
  'dsa-cyclic-placement': 'Inventory validators detect missing or duplicate IDs when values are expected to occupy a bounded one-to-one index range.',
  'dsa-intervals': 'Meeting calendars, CPU reservations, memory maps, and network ACL ranges merge overlaps after sorting by start position.',
  'dsa-monotonic': 'Weather dashboards compute next-warmer days, storage systems find span boundaries, and streaming systems maintain a window maximum with a monotonic deque.',
  'dsa-top-k': 'Search ranking, alerting, and telemetry retain only the most relevant K results instead of sorting an entire incoming dataset.',
  'dsa-quickselect': 'Percentile calculations and dashboards find a median or kth value without paying for a complete sort when only one rank is needed.',
  'dsa-k-way-merge': 'Search engines and log platforms merge many already sorted shards into one chronological stream using a heap of current shard heads.',
  'dsa-recursion': 'Directory walkers, parsers, and configuration explorers solve nested structures by carrying the current path and restoring state when a branch returns.',
  'dsa-subsets': 'Feature-flag testing and configuration search enumerate combinations of enabled options with choose-or-skip decisions.',
  'dsa-permutations': 'Scheduling and protocol test generation enumerate distinct orderings when execution order changes the result.',
  'dsa-combination-sum': 'Resource planners enumerate bounded combinations of package sizes or denominations while pruning branches that already exceed the target.',
  'dsa-divide': 'Parallel image processing, merge sort, and spatial algorithms split independent regions, solve each region, and combine already-correct results.',
  'dsa-greedy': 'Network scheduling and interval selection make a locally optimal choice only when an exchange argument proves an optimal solution can safely include it.',
  'dsa-dp': 'Spell checking, sequence alignment, resource allocation, and route planning reuse answers to overlapping states instead of recomputing the same future.',
  'dsa-dp-take-skip': 'A backup planner chooses non-conflicting jobs or files where taking one item prevents taking an adjacent alternative.',
  'dsa-dp-grid': 'Robots and games count or optimize paths through obstacle grids when each cell depends on already solved neighboring positions.',
  'dsa-knapsack': 'Deployment planners choose features under memory, power, or cost limits, distinguishing one-time items from reusable capacity choices.',
  'dsa-coin-change-min': 'A dispenser or packaging system finds the fewest available unit sizes required to reach an exact requested amount.',
  'dsa-coin-change-ways': 'A pricing or packaging tool counts distinct combinations that produce a target while avoiding duplicate orderings of the same choices.',
  'dsa-lis': 'Version analysis and scheduling find the longest order-preserving improvement sequence without requiring selected records to be adjacent.',
  'dsa-lcs': 'Diff tools and synchronization systems find a longest shared ordered backbone between two files or event streams.',
  'dsa-edit-distance': 'Spell checkers, OCR correction, and approximate record matching price insertions, deletions, and replacements between strings.',
  'dsa-dp-compression': 'Memory-constrained firmware stores only the previous dynamic-programming row when later states no longer depend on older rows.',
  'dsa-bitwise': 'Embedded registers, permission masks, protocol flags, and compact state sets encode independent boolean facts into specific bit positions.',
  'college-dsa-singly-linked-list-toolkit': 'Kernel queues, allocator free lists, and playlist editors need insertion, deletion, reversal, merging, and cycle checks while preserving reachability.',
  'college-dsa-doubly-linked-list-toolkit': 'Browser history, LRU caches, and intrusive scheduler lists remove a known node or move in both directions without scanning from the head.',
  'college-dsa-stack-implementations': 'Undo history, expression evaluators, and parser call states need last-in-first-out storage with either fixed capacity or dynamic nodes.',
  'college-dsa-expression-conversion': 'Compilers and calculators convert human infix notation into postfix or prefix forms whose evaluation order is explicit.',
  'college-dsa-queue-implementations': 'Device drivers buffer incoming bytes in circular arrays, while job dispatchers use linked queues when capacity must grow dynamically.',
  'college-dsa-binary-search-implementations': 'Database indexes and firmware lookup tables locate exact keys or insertion boundaries in sorted data without scanning every entry.',
  'college-dsa-elementary-sorts': 'Small embedded tables use insertion sort because code size and nearly sorted input can matter more than asymptotic performance.',
  'college-dsa-divide-and-conquer-sorts': 'Large record sets use quicksort for in-place average performance or merge sort when stable ordering and sequential access matter.',
  'college-dsa-binary-search-tree-toolkit': 'Ordered in-memory indexes expose search, deletion, maximum, height, and size while preserving the left-smaller/right-larger invariant.',
  'college-dsa-hash-table-toolkit': 'Symbol tables, caches, and session stores need complete insert, update, search, deletion, collision handling, and destruction behavior.',
};

const highlightedApplications = {
  'c-stack-heap': 'A network server places each request call chain and local parser state on its thread stack, while response buffers and connection objects live on the heap because their size and lifetime are decided at runtime.',
  'c-multidimensional': 'Camera firmware stores an image as rows of pixels; correct row stride and contiguous traversal determine both address correctness and cache performance.',
  'c-pointers': 'DMA drivers pass buffer addresses to peripherals, linked structures store next-node addresses, and memory-mapped drivers dereference documented register locations.',
  'c-qualifiers': 'A UART status register is volatile because hardware changes it outside program flow; a DMA buffer may need alignment and explicit ownership, while restrict can help vectorize non-overlapping signal buffers.',
  'cpp-raii': 'A file descriptor, mutex, DMA mapping, or socket must be released on every return and exception path; a scoped owner makes cleanup occur when the object leaves scope.',
  'cpp-smart-pointers': 'A UI tree can give each parent unique ownership of children while observers use non-owning references; shared ownership is reserved for objects whose lifetime truly has multiple owners.',
  'cpp-stl': 'Firmware configuration tools use vectors for contiguous records, maps for ordered keys, and algorithms for sorting or searching while respecting iterator invalidation.',
  'cpp-concurrency': 'A telemetry service runs acquisition, parsing, and storage on separate threads; atomics publish small state, mutexes protect compound invariants, and condition variables sleep until work arrives.',
  'os-syscalls': 'When cp calls read and write, the CPU crosses from user mode into the kernel so permissions, descriptor state, and user pointers can be validated before storage I/O.',
  'os-syscall-contract': 'A file copier loops around short reads, short writes, and EINTR because a successful syscall can complete less work than requested without violating its contract.',
  'os-file-io': 'A database writes pages through file descriptors, seeks to exact offsets, checks metadata, and handles partial I/O before claiming a durable update.',
  'os-fd-dup': 'A shell implements command redirection by duplicating an opened file onto standard output before exec replaces the process image.',
  'os-fcntl': 'A server marks accepted sockets nonblocking and close-on-exec, while cooperating processes use advisory locks to coordinate file updates.',
  'os-virtual-memory': 'A browser gives each renderer an isolated virtual address space; page tables map its addresses to physical frames and faults lazily load code or allocate private pages.',
  'os-virtual-translation': 'A debugger translates a faulting virtual address through page-table levels to determine whether the failure came from an absent page, permissions, or a corrupted pointer.',
  'os-mmap-cow': 'After fork, parent and child initially share physical pages read-only; the first write faults and creates a private copy instead of duplicating the whole process immediately.',
  'os-process-create': 'A shell forks so the child can prepare redirections and execute a command while the parent remains available to manage the job.',
  'os-exec': 'A process launcher uses execve to replace the child with the requested program while preserving selected descriptors and supplying a new argument and environment vector.',
  'os-exit': 'A worker uses _exit after fork when exec fails so it does not flush the parent’s copied stdio buffers or run inherited cleanup handlers.',
  'os-wait': 'A process supervisor uses waitpid to collect exit status, distinguish normal exit from signals, and prevent completed children from remaining as zombies.',
  'os-zombie-orphan': 'A service manager reaps exited workers and adopts orphaned descendants so process-table entries do not accumulate after parents terminate.',
  'os-pipes': 'A shell connects grep output to sort input with a pipe and closes every unused end so readers receive EOF when the final writer exits.',
  'os-shm': 'A video pipeline shares large frame buffers between processes with mmap-backed memory while semaphores or mutexes coordinate ownership.',
  'os-linux-sockets': 'A network daemon accepts TCP clients, loops around partial byte-stream I/O, frames application messages, and closes connections under an explicit protocol.',
  'os-sync': 'A banking service protects an account transfer invariant across multiple shared fields and applies a fixed lock order to avoid deadlock.',
  'os-pthreads': 'A parallel image tool divides rows among pthread workers, joins every thread, and keeps each worker’s arguments alive until completion.',
  'os-mutex': 'A multithreaded server protects a shared connection table with a pthread mutex; uncontended locking stays in user space and contention asks the kernel futex path to sleep and wake threads.',
  'os-semaphores': 'A bounded producer-consumer pipeline uses one semaphore for free slots and another for filled slots so producers cannot overwrite unread work.',
  'arch-cache': 'Matrix multiplication becomes much faster when loops reuse values already in cache lines instead of repeatedly fetching distant rows from memory.',
  'arch-mmu': 'An operating system isolates processes and controls device mappings by translating virtual pages through page tables and a TLB.',
  'embedded-uart': 'A bootloader receives firmware bytes and a service console emits diagnostic logs through UART frames with a negotiated baud, parity, and stop format.',
  'embedded-spi': 'A display controller or flash chip receives commands and data on clocked SPI transfers where chip-select boundaries and sampling edge are part of the protocol.',
  'embedded-i2c': 'A sensor hub reads registers from several addressed sensors on two shared open-drain wires, using ACK, repeated START, and bus recovery.',
  'embedded-dma': 'An audio recorder uses DMA to move ADC samples into alternating buffers while the CPU processes the previous buffer without servicing every sample interrupt.',
  'embedded-portability': 'A product family may ship on STM32, NXP, TI, Renesas, or Microchip controllers; keeping protocol state and product policy independent from the board-support layer lets hardware change without rewriting validated behavior.',
  'debug-method': 'When firmware resets intermittently, an engineer first makes the failure reproducible, changes one variable, captures the fault registers, and tests the smallest hypothesis before editing code.',
  'schematic-basics': 'Before powering a board, an engineer follows the regulator, decoupling, reset, clock, boot straps, and debug connector so expected voltages and signal directions are known.',
  'schematic-trace': 'During board bring-up, an engineer traces USART TX from the STM32 alternate-function pin through solder bridges and the ST-LINK virtual COM connection before blaming firmware.',
  'stm32-startup': 'A boot failure before main is diagnosed by checking the vector table, initial stack pointer, Reset_Handler, copied .data, zeroed .bss, and linker-script addresses over SWD.',
  'stm32-clock': 'A motor controller derives timer PWM, UART baud, ADC timing, and CPU execution rate from the RCC tree; one wrong APB prescaler makes several peripherals wrong together.',
  'stm32-interrupts': 'A button or sensor edge enters through EXTI, is prioritized by NVIC, performs minimal capture in the ISR, and wakes foreground or RTOS work.',
  'rtos-tasks': 'An industrial controller assigns acquisition, control, communication, and logging to tasks whose priorities and blocking behavior determine whether deadlines are met.',
  'git-bisect': 'A firmware team uses binary-search-like Git bisect across known-good and known-bad commits to identify the exact change that introduced a boot failure.',
};

const sectionContexts = {
  c: 'Firmware, kernels, parsers, and device drivers expose C rules directly through object bytes, generated loads and stores, memory layout, and lifetime.',
  cpp: 'Resource-owning services, tools, and embedded applications expose C++ object rules through construction, ownership transfer, generic interfaces, and deterministic cleanup.',
  architecture: 'A measured CPU workload exposes architectural rules through register values, instruction timing, cache traffic, addresses, and bus transactions.',
  'os-linux': 'A shell, server, container, debugger, or system utility exposes operating-system rules through process, file, memory, scheduling, and kernel-visible state.',
  networking: 'A browser request, API exchange, or routed packet exposes protocol rules through headers, addresses, retransmissions, socket state, and timing.',
  engineering: 'A production regression exposes engineering practice through a reproducible symptom, controlled change, retained evidence, and a test that distinguishes cause from coincidence.',
  electronics: 'A powered board exposes electrical rules through current paths, net voltages, component limits, and meter or oscilloscope readings.',
  embedded: 'A peripheral driver exposes embedded rules through clocks, registers, flags, pin state, buffers, interrupts, and measured timing.',
  stm32: 'A NUCLEO-F446RE experiment exposes the STM32 implementation through its schematic net, register fields, HAL state, SWD evidence, and measured waveform.',
  rtos: 'A real-time controller exposes scheduling and ownership rules through task states, priorities, queues, lock owners, interrupt latency, and deadline measurements.',
};

export function realApplicationFor(topic) {
  if (dsaApplications[topic.id]) return dsaApplications[topic.id];
  if (highlightedApplications[topic.id]) return highlightedApplications[topic.id];

  const mcuLab = collegeMcuLabByTopicId.get(topic.id);
  if (mcuLab) return mcuLab.realUse;

  const dsaLab = collegeDsaLabByTopicId.get(topic.id);
  if (dsaLab) return dsaApplications[topic.id];

  if (topic.group === 'Linux Systems Programming Labs') {
    const labId = topic.id.slice('linux-'.length).toUpperCase();
    const lab = linuxLabById.get(labId);
    return `${lab.title} is the real system utility or process experiment: ${lab.mechanism} The observable output demonstrates the same kernel contract used by shells, servers, and administration tools.`;
  }

  const note = topicNotes[topic.id];
  const context = sectionContexts[topic.sectionId];
  if (!note || !context) {
    throw new Error(`Missing concrete application context for ${topic.id}`);
  }
  return `${context} For ${topic.title.toLowerCase()}, the specific rule is: ${note[0]} Concrete check: ${note[1]}`;
}
