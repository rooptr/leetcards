import { allTopics } from './topics.js';
import { visualForDsa } from './dsaVisuals.js';
import { noteForTopic } from './topicNotes.js';
import { deepProfileFor } from './deepProfiles.js';
import {
  problemFamilyGuidance,
  problemFamilyNarrative,
  problemFamilyScope,
} from './dsaProblemFamilies.js';
import { linuxMechanismSpecs } from './linuxMechanisms.js';
import { linuxLabById } from './linuxLabs.js';
import { dsaCImplementations } from './dsaCImplementations.js';
import { collegeMcuLabByTopicId } from './collegeMcuLabs.js';
import { collegeDsaLabByTopicId } from './collegeDsaLabs.js';
import { realApplicationFor } from './realApplications.js';
import { cppProfileFor } from './cppLessonProfiles.js';
import { cppConceptsFor } from './cppConcepts.js';
import { linuxCppGuidanceFor } from './linuxCppGuidance.js';
import { qualcommPrepProfileFor } from './qualcommPrep.js';

const sentenceKeywords = (topic) => {
  const words = topic.keywords.slice(0, 4);
  if (words.length === 1) return words[0];
  return `${words.slice(0, -1).join(', ')}, and ${words.at(-1)}`;
};

const recall = (prompt) => ({ type: 'recall', prompt });

const codePair = ({
  heading = 'Compare the implementations',
  c,
  cpp,
  note = 'The invariant and complexity stay the same. The language changes how storage, containers, and cleanup are expressed.',
}) => ({
  type: 'code-pair',
  heading,
  note,
  variants: [
    { id: 'c', label: 'C', standard: 'C17', code: c },
    { id: 'cpp', label: 'C++', standard: 'C++20', code: cpp },
  ],
});

const asCpp20PosixSource = (source) => source
  .replaceAll('_Static_assert', 'static_assert')
  .replaceAll('(struct task){', 'task{')
  .replace('char *shared = mmap(', 'char *shared = (char *)mmap(')
  .replace(
    'struct shared_result *shared = mmap(',
    'struct shared_result *shared = (struct shared_result *)mmap(',
  )
  .replace(
    'struct task *task = calloc(1, sizeof *task);',
    'struct task *task = (struct task *)calloc(1, sizeof *task);',
  )
  .replace(
    'static void *allocate_matrix(size_t rows, size_t columns)',
    'static int64_t *allocate_matrix(size_t rows, size_t columns)',
  )
  .replace(
    'return calloc(rows * columns, sizeof(int64_t));',
    'return (int64_t *)calloc(rows * columns, sizeof(int64_t));',
  );

const teachingLenses = {
  c: {
    state: 'object bytes, type rules, lifetime, and compiler-visible assumptions',
    observer: 'compiler warnings, disassembly, sanitizers, and a byte-level printout',
    failure: 'Undefined behavior or a false lifetime, alignment, or aliasing assumption can make the observed result change with optimization.',
  },
  cpp: {
    state: 'object lifetime, ownership, overload selection, and generated operations',
    observer: 'constructor traces, compiler diagnostics, sanitizers, and debugger watchpoints',
    failure: 'A hidden copy, dangling reference, invalidated iterator, or ownership cycle can preserve valid syntax while breaking the object invariant.',
  },
  'os-linux': {
    state: 'process state, virtual mappings, kernel objects, credentials, and scheduler transitions',
    observer: 'strace, /proc, perf counters, return values, and kernel-visible state',
    failure: 'Ignoring partial work, interruption, permissions, or concurrent state changes turns a valid-looking call into a race or resource leak.',
  },
  architecture: {
    state: 'addresses, registers, pipeline stages, cache lines, and bus ownership',
    observer: 'disassembly, performance counters, timing, and memory traces',
    failure: 'A wrong assumption about ordering, width, locality, or visibility can produce correct values in one run and stale or slow behavior in another.',
  },
  networking: {
    state: 'frame, packet, route, socket, sequence, and retransmission state',
    observer: 'packet captures, socket errors, routing tables, and timing',
    failure: 'Layer boundaries hide fragmentation, buffering, loss, reordering, and partial I/O unless each header and state transition is checked.',
  },
  engineering: {
    state: 'source, build artifact, repository state, evidence, and the first bad transition',
    observer: 'diffs, debugger stops, traces, sanitizer reports, and repeatable tests',
    failure: 'Changing several variables at once destroys the evidence needed to distinguish cause from coincidence.',
  },
  electronics: {
    state: 'power rails, net voltages, current paths, pin modes, and component limits',
    observer: 'datasheets, schematics, multimeter readings, logic traces, and oscilloscope waveforms',
    failure: 'A missing reference ground, unsafe probe point, absent pull device, or exceeded absolute maximum can invalidate the measurement or damage hardware.',
  },
  embedded: {
    state: 'clock gates, registers, flags, buffers, interrupt state, and peripheral ownership',
    observer: 'register views, GPIO markers, serial logs, logic-analyzer traces, and fault registers',
    failure: 'A stale flag, wrong clock, incorrect pin function, or ownership race can make correct-looking driver code produce no signal.',
  },
  stm32: {
    state: 'the general mechanism, Nucleo schematic net, STM32 register fields, HAL state, and timing budget',
    observer: 'reference-manual registers, SWD, fault status, GPIO markers, and bench measurements',
    failure: 'CubeMX or HAL configuration is not proof: the clock gate, alternate function, status flags, timing limits, and board wiring must agree.',
  },
  rtos: {
    state: 'task readiness, priority, ownership, wait objects, interrupt masks, and bounded resource use',
    observer: 'task lists, trace hooks, high-water marks, GPIO timing, and deadline measurements',
    failure: 'An unbounded critical section, wrong priority, lost wake-up, or undersized stack can satisfy average tests while failing worst-case timing.',
  },
  dsa: {
    state: 'the carried state, live candidate set, invariant, and stopping condition',
    observer: 'a hand trace, assertions, adversarial examples, and complexity accounting',
    failure: 'A memorized template fails as soon as its invariant cannot justify the next state update.',
  },
};

const lensForTopic = (topic) => teachingLenses[topic.sectionId] ?? teachingLenses.dsa;

const briefLesson = (topic) => {
  const note = noteForTopic(topic.id);
  return {
    topicId: topic.id,
    title: topic.title,
    section: topic.sectionTitle,
    depth: 'brief',
    contentSource: 'authored',
    summary: note.mechanism,
    blocks: [
      { type: 'prose', heading: 'The useful idea', body: note.mechanism },
      { type: 'example', heading: 'A concrete check', body: note.example },
      recall(`Explain ${topic.title.toLowerCase()} using one input, one state change, and one observable output.`),
    ],
  };
};

const standardLesson = (topic) => {
  const note = noteForTopic(topic.id);
  const lens = lensForTopic(topic);
  return {
    topicId: topic.id,
    title: topic.title,
    section: topic.sectionTitle,
    depth: 'standard',
    contentSource: 'authored',
    summary: note.mechanism,
    blocks: [
      { type: 'prose', heading: 'Start from the mechanism', body: note.mechanism },
      { type: 'example', heading: 'Make it concrete', body: note.example },
      {
        type: 'steps',
        heading: 'Work one case from start to finish',
        items: [
          `Start with the concrete case: ${note.example}`,
          `Identify the relevant ${sentenceKeywords(topic)} in that case and record their initial state.`,
          `Apply this governing rule: ${note.mechanism}`,
          `Check the resulting state with ${lens.observer}.`,
        ],
      },
      { type: 'practice', heading: 'Try it', body: `${note.example} Record the result with ${lens.observer}.` },
      recall(`Rebuild ${topic.title.toLowerCase()} from its initial state, operation, and final state.`),
    ],
  };
};

const expandedDeepLesson = (topic) => {
  const note = noteForTopic(topic.id);
  const profile = deepProfileFor(topic.id);
  const stm32Checklist = topic.sectionId === 'stm32'
    ? ' Tie that topic-specific trace to the Nucleo-F446RE schematic, controlling register fields, equivalent HAL path, timing limit, SWD debugging evidence, and a repeatable hardware test.'
    : '';

  return {
    topicId: topic.id,
    title: topic.title,
    section: topic.sectionTitle,
    depth: 'deep',
    contentSource: 'authored',
    summary: note.mechanism,
    blocks: [
      {
        type: 'prediction',
        heading: 'Commit before the reveal',
        prompt: profile.prediction,
      },
      { type: 'prose', heading: 'Build the mental model', body: note.mechanism },
      { type: 'steps', heading: 'Follow the mechanism', items: profile.trace },
      {
        type: 'visual',
        heading: 'Static state trace',
        kind: 'timeline',
        frames: profile.trace.map((caption, index) => ({
          caption,
          values: [topic.keywords[index] ?? topic.keywords[0], `state ${index}`],
          markers: [`T${index}`],
          active: [topic.keywords[index] ?? topic.keywords[0]],
        })),
      },
      { type: 'failure', heading: 'What breaks and how it looks', body: profile.failure },
      { type: 'practice', heading: 'Make it observable', body: `${note.example} ${profile.probe}${stm32Checklist}` },
      recall(`Explain ${topic.title.toLowerCase()} as an initial state, one governing rule, each state transition, the first observable failure, and the measurement that proves it.`),
    ],
  };
};

const qualcommLesson = (topic) => {
  const profile = qualcommPrepProfileFor(topic.id);
  const stepLabels = profile.steps.map((_, index) => `Step ${index + 1}`);
  const implementations = profile.codeExamples.flatMap((example) => {
    if (example.c && example.cpp) {
      return [codePair({
        heading: example.heading,
        note: example.note,
        c: example.c,
        cpp: example.cpp,
      })];
    }
    return [{
      type: 'code',
      language: example.language ?? 'C17',
      heading: example.heading,
      code: example.code,
    }];
  });

  return {
    topicId: topic.id,
    title: topic.title,
    section: topic.sectionTitle,
    depth: topic.level,
    contentSource: 'authored',
    summary: profile.definition,
    application: profile.application,
    blocks: [
      {
        type: 'definition',
        heading: 'What it is',
        body: profile.definition,
      },
      {
        type: 'prediction',
        heading: 'Commit before the reveal',
        prompt: profile.prediction,
      },
      {
        type: 'prose',
        heading: 'Build the answer from the mechanism',
        body: profile.explanation,
      },
      {
        type: 'concepts',
        heading: 'Define every moving part',
        items: profile.concepts,
      },
      {
        type: 'steps',
        heading: 'Reason in this order',
        items: profile.steps,
      },
      {
        type: 'visual',
        heading: 'Trace the reasoning',
        kind: 'timeline',
        invariant: 'Each step must follow from a stated definition, constraint, or observed state.',
        frames: profile.steps.map((caption, index) => ({
          caption,
          values: stepLabels,
          active: [stepLabels[index]],
          markers: [`Step ${index + 1} / ${profile.steps.length}`],
        })),
      },
      {
        type: 'source-prompts',
        heading: 'Questions found in the source folder',
        items: profile.sourcePrompts,
      },
      ...implementations,
      {
        type: 'failure',
        heading: 'What weak answers miss',
        body: profile.failure,
      },
      {
        type: 'practice',
        heading: 'Prove you can use it',
        body: profile.practice,
      },
      recall(`Define ${topic.title.toLowerCase()}, explain the governing mechanism, trace one real case, and identify the first failure you would measure.`),
    ],
  };
};

const cppLesson = (topic) => {
  const lessonProfile = cppProfileFor(topic.id);
  const concepts = cppConceptsFor(topic.id);
  const includeFullTrace = topic.level !== 'brief';
  const includeVisual = topic.level === 'deep';

  return {
    topicId: topic.id,
    title: topic.title,
    section: topic.sectionTitle,
    depth: topic.level,
    contentSource: 'authored',
    summary: lessonProfile.definition,
    application: lessonProfile.application,
    blocks: [
      {
        type: 'definition',
        heading: 'What it is',
        body: lessonProfile.definition,
      },
      ...(includeFullTrace ? [{
        type: 'prediction',
        heading: 'Predict before the explanation',
        prompt: lessonProfile.prediction,
      }] : []),
      {
        type: 'prose',
        heading: 'How it works',
        body: lessonProfile.explanation,
      },
      {
        type: 'concepts',
        heading: 'Define every moving part',
        items: concepts,
      },
      ...(includeFullTrace ? [{
        type: 'steps',
        heading: 'Follow the language rules in order',
        items: lessonProfile.steps,
      }] : []),
      ...(includeVisual ? [{
        type: 'visual',
        heading: 'Watch the state change',
        kind: 'timeline',
        invariant: lessonProfile.explanation,
        frames: lessonProfile.steps.map((caption, index) => ({
          caption: `${index + 1}. ${caption}${index + 1 === lessonProfile.steps.length ? ' — result complete' : ''}`,
          values: lessonProfile.steps.map((_, stepIndex) => `state ${stepIndex + 1}`),
          markers: [`step ${index + 1}`],
          active: [`state ${index + 1}`],
        })),
      }] : []),
      {
        type: 'code',
        language: lessonProfile.standard,
        heading: 'See the rule in code',
        code: lessonProfile.code,
      },
      {
        type: 'example',
        heading: 'Run this check',
        body: lessonProfile.example,
      },
      {
        type: 'failure',
        heading: 'Where the model breaks',
        body: lessonProfile.failure,
      },
      ...(includeFullTrace ? [{
        type: 'practice',
        heading: 'Prove it to yourself',
        body: lessonProfile.example,
      }] : []),
      recall(`Define ${topic.title.toLowerCase()}, explain its governing language rule, trace the example, and name the first failure caused by violating that rule.`),
    ],
  };
};

const mechanismSpecs = {
  ...linuxMechanismSpecs,
  'c-stack-heap': {
    summary: 'A program’s memory is not one undifferentiated box: stack frames, allocator-managed heap blocks, static regions, and linker placement obey different lifetime rules.',
    prediction: 'A function returns a pointer to one local object and one allocated object. Which pointer can still name a live object after the return?',
    steps: ['A call creates a frame containing return state and automatic objects.', 'An allocator finds a suitably sized free heap block and records metadata.', 'Returning destroys the frame as a lifetime boundary, even if its bytes remain unchanged.', 'free returns the heap block to the allocator; the pointer value itself is not cleared.'],
    visual: [['T0 · text | data | heap block free | frame(main)'], ['T1 · text | data | heap object live | frame(main) | frame(make)'], ['T2 · text | data | heap object live | frame(main); make locals are dead']],
    failure: 'Stack overflow crosses a guard or corrupts nearby memory. Heap fragmentation can leave enough free bytes in total but no usable contiguous block. A dangling pointer may appear to work until those bytes are reused.',
    practice: 'Draw the linker-defined flash and SRAM regions for a tiny embedded program, then annotate the lifetime of one local buffer and one allocated buffer.',
  },
  'cpp-concurrency': {
    summary: 'C++ concurrency combines threads, locks, condition variables, atomics, and a memory model that defines which writes another thread is allowed to observe.',
    prediction: 'If one thread writes a buffer and then sets a plain bool flag, must a thread that sees true also see the completed buffer?',
    steps: ['Identify every field covered by the shared invariant.', 'Publish completed writes with a mutex unlock or release operation.', 'Consume only after the matching lock or acquire operation.', 'Define wake-up predicates, ownership, shutdown, and object lifetime.'],
    visual: [['T0 · producer owns buffer · ready=false'], ['T1 · write buffer · release ready=true'], ['T2 · consumer acquire sees ready · buffer is visible']],
    failure: 'A data race is undefined behavior, spurious wakeups break one-shot condition checks, relaxed atomics do not publish unrelated data, and detached threads can outlive referenced objects.',
    practice: 'Build a one-slot handoff with a mutex and condition variable, then explain the exact release/acquire edge.',
  },
  'os-sync': {
    summary: 'Synchronization protects multi-field invariants by controlling mutual exclusion, waiting, wake-up order, and memory visibility, not merely individual instructions.',
    prediction: 'Two threads each execute load, add, store for the same counter. Which final values are possible?',
    steps: ['Write the shared invariant and all state it covers.', 'Make the entire transition indivisible with a lock or correct atomic protocol.', 'Wait in a loop that rechecks its predicate after every wake-up.', 'Choose one lock order and bound critical-section duration.'],
    visual: [['T0 · A load 0 · B load 0'], ['T1 · A store 1 · B store 1 → update lost'], ['mutex · A transition completes before B starts']],
    failure: 'Protecting only half an invariant leaves races, opposite lock order deadlocks, missing predicate loops fail on spurious wakeups, and long lock holds create latency.',
    practice: 'Draw the lost-update interleaving and then mark the ordering edges added by one mutex.',
  },
  'arch-cache': {
    summary: 'A cache moves fixed-size lines through a hierarchy, so address mapping, access order, associativity, write policy, and DMA ownership determine whether data is fast or stale.',
    prediction: 'Two loops read the same matrix values: one walks rows and one walks columns. Which loop causes fewer cache-line fills in row-major storage?',
    steps: ['Split the address into tag, set index, and byte offset.', 'Check every way in the indexed set for a matching valid tag.', 'On a miss, fetch the entire line and choose a victim if the set is full.', 'Apply the write-through or write-back policy and maintain coherence with other observers.'],
    visual: [['CPU request → [tag | set | offset]'], ['set lookup → way 0 miss · way 1 HIT'], ['selected line → requested bytes; later accesses reuse neighbors']],
    failure: 'Conflict misses can thrash one set, false sharing can bounce a line between cores, and DMA can observe stale memory unless cache maintenance and buffer ownership are explicit.',
    practice: 'Compare row-major and column-major matrix walks, then predict which cache counters should change before measuring with perf.',
  },
  'os-virtual-translation': {
    summary: 'The MMU translates each process’s virtual pages through a TLB and page tables while preserving the offset and enforcing permissions.',
    prediction: 'If two processes use virtual address 0x4000, must they read the same physical bytes?',
    steps: ['Split the virtual address into virtual page number and offset.', 'Look for a matching translation and permissions in the TLB.', 'On a TLB miss, walk page-table levels to find the physical frame.', 'Combine the frame number with the unchanged offset and perform the access.'],
    visual: [['VA [virtual page 0x4 | offset 0x120]'], ['TLB miss → page-table walk → frame 0x93'], ['PA [frame 0x93 | offset 0x120]']],
    failure: 'An absent mapping raises a page fault; a present but disallowed mapping raises a protection fault. The kernel may allocate, load, copy, or reject the page.',
    practice: 'Use /proc/<pid>/maps and a debugger to compare a variable’s virtual address with the region that owns it.',
  },
  'os-virtual-memory': {
    summary: 'Virtual memory gives each process protected page mappings, uses the TLB to cache recent translations, and lets the kernel allocate, share, copy, evict, and lazily populate physical storage behind them.',
    prediction: 'Why can reserving a large region succeed before the machine has enough free RAM to back every page?',
    steps: ['Reserve a virtual range and record its mapping policy.', 'Raise a page fault on the first access to an absent page.', 'Supply a zero page, file page, private copy, or access error.', 'Under pressure, reclaim clean pages or move anonymous contents to swap.'],
    visual: [['reserve · virtual pages present · physical frames absent'], ['first write → page fault → allocate frame → map writable'], ['pressure → reclaim clean page or swap anonymous page']],
    failure: 'Overcommit delays failure, protection faults differ from missing-page faults, memory pressure adds latency, and the OOM killer may terminate a process when reclaim fails.',
    practice: 'Reserve and touch memory one page at a time while watching resident size and page-fault counters.',
  },
  'os-mmap-cow': {
    summary: 'mmap installs file-backed or anonymous mappings, while copy-on-write shares physical frames until a writer faults and receives a private copy.',
    prediction: 'After fork, why can parent and child initially read the same bytes without immediately duplicating every physical page?',
    steps: ['Map both page tables to one frame with write permission removed.', 'Allow reads to use the shared frame.', 'Treat a write protection fault as a copy-on-write request.', 'Copy the frame and remap only the writer as writable.'],
    visual: [['parent VA ─┐'], ['           ├→ shared read-only frame'], ['child VA  ─┘ · write fault → private copied frame']],
    failure: 'Confusing private and shared mappings loses updates, assuming memory writes are durable ignores msync rules, and heavy post-fork writing destroys sharing benefits.',
    practice: 'Map one file privately and shared, write both mappings, and compare memory with the on-disk bytes.',
  },
  'os-syscalls': {
    summary: 'A system call is a controlled trap-like privilege transition: user code places arguments in kernel-defined registers, enters a validated kernel handler, may block, and follows an explicit return path.',
    prediction: 'Why can a normal function call not safely read a disk device register directly from an unprivileged process?',
    steps: ['A user-space wrapper places the syscall number and arguments in architecture-defined registers.', 'The syscall instruction switches privilege and transfers control to a kernel entry point.', 'The kernel validates pointers, permissions, lengths, and object state before doing work.', 'A result or negative error is placed in the return register and control returns to user mode.'],
    visual: [['user · rax=read, rdi=fd, rsi=buf, rdx=count'], ['syscall instruction ⇣ privilege boundary'], ['kernel · validate → perform/block → return; user wrapper sets errno']],
    failure: 'Invalid pointers can return EFAULT, signals can interrupt blocking calls, partial reads are legal, and tracing the wrapper alone can hide retries performed by a library.',
    practice: 'Run strace on a tiny read program and match each argument and return value to the corresponding C call.',
  },
  'embedded-uart': {
    summary: 'UART reconstructs asynchronous characters from agreed bit timing, start/stop framing, optional parity, buffering, and independent transmit and receive state machines.',
    prediction: 'With no shared clock wire, how can the receiver know where the eight data bits begin?',
    steps: ['The idle line stays high until the transmitter drives a start bit low.', 'The receiver detects the edge and samples near the center of each expected bit period.', 'Data bits arrive in configured order, followed by optional parity and one or more stop bits.', 'Hardware moves the character into a receive register or FIFO and raises a flag, DMA request, or interrupt.'],
    visual: [['idle ─────╲ start ╱ d0 ╱ d1 ╱ d2 … parity ╱ stop ───'], ['sample      ↑      ↑    ↑    ↑          ↑       ↑'], ['RX register → FIFO/ring buffer → parser']],
    failure: 'Baud mismatch causes framing errors, mismatched parity causes parity errors, slow software causes overrun, and absent flow control lets a fast sender overwhelm a small buffer.',
    practice: 'At 115200 8-N-1, calculate one bit time and one character time, then predict what a logic analyzer should decode.',
  },
  'embedded-spi': {
    summary: 'SPI is a synchronous full-duplex shift exchange whose correctness depends on clock mode, word width, bit order, chip-select timing, and the peripheral’s multi-byte command protocol.',
    prediction: 'Why does receiving one byte require transmitting one byte, even when the controller only wants to read?',
    steps: ['Assert the target’s chip-select line and respect its setup time.', 'On each configured clock edge, both sides change one output bit and sample one input bit.', 'After the configured word width, read the receive register even if the incoming byte is disposable.', 'Keep or release chip select according to the device’s command framing and hold-time requirements.'],
    visual: [['CS  ─────╲________________________╱────'], ['SCK ____/‾\\_/‾\\_/‾\\_/‾\\_/‾\\_/‾\\____'], ['MOSI cmd7 cmd6 cmd5 … · MISO x x data7 …']],
    failure: 'The wrong CPOL/CPHA mode shifts every sample, an early chip-select edge terminates a command, unread receive data can overrun, and byte order can differ from bit order.',
    practice: 'Choose one sensor register read, draw command and response bytes, and mark the edge where every bit is sampled.',
  },
  'embedded-i2c': {
    summary: 'I2C coordinates open-drain participants through START/STOP conditions, an address plus direction bit, ACK phases, repeated starts, arbitration, clock stretching, and recovery rules.',
    prediction: 'Why are pull-up resistors required even when every device can drive the bus?',
    steps: ['A controller creates START by pulling SDA low while SCL is high.', 'It shifts seven address bits and a direction bit, then releases SDA for the receiver’s ACK.', 'Data bytes and ACK/NACK bits follow; a repeated START can change direction without releasing the bus.', 'STOP releases SDA high while SCL is high, returning the bus to idle.'],
    visual: [['SDA ‾‾╲ START · address+W · ACK · register · ACK'], ['SDA    repeated START · address+R · ACK · data · NACK ╱ STOP'], ['SCL ‾\\_/‾\\_/‾\\_/‾\\_ … open-drain, sampled while high']],
    failure: 'Missing pull-ups prevent valid highs, a slave may stretch SCL, two controllers arbitrate by observing SDA, and a reset mid-byte can leave SDA stuck until clock-pulse recovery.',
    practice: 'Trace a two-byte register read and identify which participant drives SDA during every ACK and data phase.',
  },
  'schematic-basics': {
    summary: 'A schematic is a logical map of power domains, named nets, components, signal direction, and design intent, not a picture of physical placement.',
    prediction: 'A wire appears to stop near the MCU, yet the same net label appears beside a sensor. Are those pins connected?',
    steps: ['Find input power, regulators, rail names, grounds, and decoupling first.', 'Locate the MCU power, reset, boot, clock, and debug pins.', 'Follow net labels across pages and verify signal direction and electrical type.', 'Cross-check alternate functions, voltage limits, pull devices, and timing in the datasheets.'],
    visual: [['VIN → regulator → 3V3 rail → decoupling → MCU VDD'], ['MCU PB8/SCL ── net I2C_SCL ── pull-up ── 3V3'], ['net I2C_SCL ── sensor SCL · same label means same node']],
    failure: 'Common mistakes include treating ground symbols as interchangeable across isolation boundaries, missing active-low names, overlooking open-drain pull-ups, and trusting pin names without checking alternate-function tables.',
    practice: 'On the Nucleo-F446RE schematic, trace one LED or button from MCU pin to the physical component and predict voltage readings in both logic states.',
  },
  'debug-method': {
    summary: 'Debugging is controlled uncertainty reduction: preserve the symptom, narrow the first bad state, test one hypothesis, and retain the evidence.',
    prediction: 'A crash disappears when logging is enabled. Is the logging statement the fix, or evidence that timing or memory layout changed?',
    steps: ['Write a reproducible observation with exact input, build, environment, and expected result.', 'Locate the earliest state that differs between a good and bad run.', 'Form one falsifiable hypothesis and choose the cheapest observation that distinguishes it.', 'Change one variable, record the result, and convert the finding into a regression test.'],
    visual: [['symptom → reproduce → first bad state'], ['hypothesis A / hypothesis B → discriminating observation'], ['cause confirmed → smallest fix → regression test']],
    failure: 'Random edits destroy evidence, logging can perturb races, stale binaries invalidate conclusions, and fixing the final crash can leave the earlier corruption untouched.',
    practice: 'Take a small failing program and write three hypotheses before running a debugger; reject each with one concrete observation.',
  },
  'rtos-tasks': {
    summary: 'An RTOS scheduler repeatedly chooses the highest-priority ready task, while blocking operations, interrupts, ticks, and yields move tasks between explicit states.',
    prediction: 'A high-priority task waits on an empty queue. Can a lower-priority ready task run?',
    steps: ['A task is running, ready, blocked, or suspended.', 'An interrupt or API event can unblock a task and place it into a ready list.', 'The scheduler selects the highest-priority ready task, using the configured tie rule.', 'Context switching saves the old task state and restores the selected task state.'],
    visual: [['T0 · high=blocked(queue) · low=running'], ['ISR posts queue → high becomes ready'], ['scheduler → save low context → restore high → high running']],
    failure: 'Polling prevents blocking, incorrect priorities starve useful work, undersized stacks corrupt state, and long critical sections turn acceptable latency into missed deadlines.',
    practice: 'Draw the task-state timeline for a UART ISR waking a parser task while a background task is running.',
  },
  'stm32-startup': {
    summary: 'On STM32F446RE reset, the Cortex-M loads the initial stack pointer and reset vector, startup code initializes memory, and the linker script decides every address.',
    prediction: 'Before main runs, who copies initialized global variables from flash into SRAM?',
    steps: ['Hardware reads the initial MSP value and Reset_Handler address from the vector table.', 'Reset_Handler copies .data from its flash load address to its SRAM execution address.', 'It zeros .bss, may initialize clocks and C/C++ runtime state, then calls main.', 'The linker script supplies section boundaries used by both the image and startup loop.'],
    visual: [['flash 0x08000000 · [initial MSP][Reset_Handler][vectors…]'], ['flash .data load ──copy──▶ SRAM .data · zero SRAM .bss'], ['Reset_Handler → SystemInit → runtime init → main']],
    failure: 'A wrong vector-table address prevents exception entry, a mismatched linker script corrupts copies, and early clock assumptions can break code before the debugger reaches main.',
    practice: 'Open the map file and identify the vector table, .text, .data load address, .data runtime address, .bss, heap, and stack limit.',
  },
  'stm32-clock': {
    summary: 'The STM32F446RE clock tree derives core and peripheral clocks through oscillators, PLL factors, bus prescalers, and timer-specific multipliers.',
    prediction: 'If APB1 is prescaled by four, does every APB1 timer also run at one quarter of the source clock?',
    steps: ['Select HSI or HSE as a PLL source and satisfy input-frequency limits.', 'Apply PLLM, PLLN, and PLLP to derive the system clock.', 'Apply AHB and APB prescalers to produce HCLK, PCLK1, and PCLK2.', 'When an APB timer prescaler is not one, the timer kernel clock is commonly twice its PCLK.'],
    visual: [['HSE 8 MHz → /PLLM 8 → ×PLLN 336 → /PLLP 2 = SYSCLK 168 MHz'], ['SYSCLK → AHB /1 = HCLK 168 MHz'], ['HCLK → APB1 /4 = 42 MHz · TIMx clock = 84 MHz']],
    failure: 'Invalid voltage/flash-latency settings make high clocks unreliable, wrong peripheral-clock assumptions break baud rates, and switching sources before they are ready can stall the system.',
    practice: 'Derive a 1 kHz timer update from the actual timer kernel clock and verify it on a GPIO pin with an oscilloscope.',
  },
  'stm32-interrupts': {
    summary: 'EXTI detects configured edges, NVIC decides priority and masking, and Cortex-M exception entry automatically stacks a core register frame before the ISR runs.',
    prediction: 'If two pending interrupts have the same preemption priority, what decides which handler runs first?',
    steps: ['A GPIO edge sets an EXTI pending bit when the line and trigger are enabled.', 'NVIC combines pending, enabled, active, mask, and priority state.', 'Exception entry stacks R0-R3, R12, LR, PC, and xPSR, then loads the vector.', 'The handler clears the peripheral source before exception return restores the frame.'],
    visual: [['GPIO edge → EXTI pending bit → NVIC pending'], ['exception entry → automatic stack frame → vector fetch'], ['ISR clears source → exception return → interrupted code']],
    failure: 'Failing to clear the source retriggers immediately, priority grouping can surprise preemption assumptions, and unsafe shared data creates races between ISR and task context.',
    practice: 'Toggle a pin at ISR entry and exit, measure latency and duration, and explain every register involved in clearing the interrupt.',
  },
  'embedded-dma': {
    summary: 'DMA moves data between peripherals and memory without one CPU instruction per item, but buffer ownership, alignment, completion, errors, and cache coherency remain software responsibilities.',
    prediction: 'If DMA writes a receive buffer, when is it safe for the CPU to parse that buffer?',
    steps: ['Software configures source, destination, count, width, direction, and trigger.', 'A peripheral request lets the DMA controller perform a bus transfer.', 'The count advances until half-transfer, completion, or error state occurs.', 'Ownership passes to software only after the chosen completion condition and required memory/cache synchronization.'],
    visual: [['peripheral data register ──request──▶ DMA stream'], ['DMA bus master ──write──▶ buffer[0…N−1]'], ['half/full flag → ISR/task handoff → parser owns completed region']],
    failure: 'Wrong widths corrupt neighboring bytes, circular buffers can be overwritten while parsed, cache lines can remain stale, and reconfiguration while enabled can produce undefined transfers.',
    practice: 'Design a double-buffered ADC capture and mark exactly when DMA and the processing task own each half.',
  },
};

const transactionSignalFrames = {
  'embedded-uart': [
    ['TX: idle 1 | start 0 | d0 | d1 | d2 | d3 | d4 | d5 | d6 | d7 | stop 1', 'RX sample:       ^    ^    ^    ^    ^    ^    ^    ^', 'state: start edge detected'],
    ['TX: start | 1 | 0 | 1 | 0 | 1 | 0 | 1 | 0 | stop', 'RX sample: ^   ^   ^   ^   ^   ^   ^   ^   ^', 'state: eight data bits reconstructed'],
    ['TX: idle high', 'RX register: 0x55', 'software: RX register -> ring buffer -> parser'],
  ],
  'embedded-spi': [
    ['CS: 1 -> 0', 'SCK: idle at CPOL', 'MOSI: command bit 7 prepared', 'MISO: not valid yet'],
    ['CS: 0', 'SCK: eight sample edges', 'MOSI: command 10010000', 'MISO: response shifted simultaneously'],
    ['CS: 0 -> 1 after hold time', 'SCK: returns to idle', 'RX register: response byte', 'software: consume RX before next word'],
  ],
  'embedded-i2c': [
    ['SCL: high', 'SDA: high -> low', 'bus owner: controller creates START'],
    ['SCL: eight pulses plus ACK pulse', 'SDA: address + write bit, then released', 'bus owner: target pulls SDA low for ACK'],
    ['SCL: held high for repeated START', 'SDA: high -> low, then address + read', 'bus owner: controller changes direction without STOP'],
    ['SCL: final data and ninth pulse', 'SDA: controller leaves NACK, then low -> high', 'bus owner: controller creates STOP'],
  ],
};

const mechanismLesson = (topic, spec) => {
  const stm32Bridge = topic.sectionId === 'stm32'
    ? ' Then locate the Nucleo-F446RE schematic net, controlling register fields, equivalent HAL setup, timing limit, SWD observation, and one repeatable hardware test.'
    : '';

  return {
    topicId: topic.id,
    title: topic.title,
    section: topic.sectionTitle,
    depth: 'deep',
    contentSource: 'authored',
    summary: spec.summary,
    blocks: [
      { type: 'prediction', heading: 'First, make a prediction', prompt: spec.prediction },
      { type: 'prose', heading: 'The mechanism', body: spec.summary },
      { type: 'steps', heading: 'Follow the state', items: spec.steps },
      {
        type: 'visual',
        heading: 'Trace the mechanism',
        kind: transactionSignalFrames[topic.id] ? 'signals' : 'timeline',
        invariant: spec.summary,
        frames: (transactionSignalFrames[topic.id] ?? spec.visual).map((values, index) => ({
          caption: `T${index}: ${values[0]}`,
          values,
          markers: [`T${index}`],
          active: [Math.min(index, values.length - 1)],
        })),
      },
      ...(spec.code ? [codePair({
        heading: 'C and C++ implementations',
        c: spec.code,
        cpp: asCpp20PosixSource(spec.code),
        note: 'Both versions call the same Linux or POSIX interface. The C++ version stays intentionally close to the syscall boundary so descriptor, process, and synchronization behavior remains visible.',
      })] : []),
      { type: 'failure', heading: 'What breaks', body: spec.failure },
      { type: 'practice', heading: 'Make it observable', body: `${spec.practice}${stm32Bridge}` },
      recall(`Explain ${topic.title.toLowerCase()} from the initial state to the observable result, then name one failure mode.`),
    ],
  };
};

const dsaGuidance = {
  ...problemFamilyGuidance,
  'dsa-complexity': ['input growth matters more than one machine’s elapsed time', 'an invariant or aggregate argument can bound repeated operations', 'constant factors and actual constraints dominate the asymptotic comparison', 'O(f(n)) time and O(g(n)) space for the stated model', 'for (int value : values) {\n  // Charge each operation to the item that causes it.\n  process(value);\n}'],
  'dsa-matrix': ['rows and columns have meaningful neighborhoods', 'you need coordinate-to-offset reasoning', 'the structure is jagged or not indexable', 'O(rows × columns)', 'for (int r = 0; r < rows; ++r) {\n  for (int c = 0; c < cols; ++c) visit(a[r][c]);\n}'],
  'dsa-linked': ['nodes must be inserted, removed, or reversed without shifting storage', 'the problem names next pointers, a middle, or a cycle', 'random indexed access dominates', 'O(n) time, O(1) extra space for iterative rewiring', 'ListNode* prev = nullptr;\nfor (auto* cur = head; cur;) {\n  auto* next = cur->next;\n  cur->next = prev;\n  prev = cur;\n  cur = next;\n}\nreturn prev;'],
  'dsa-stack-queue': ['the newest or oldest unresolved item must be processed next', 'operations naturally say push/pop or enqueue/dequeue', 'you need arbitrary middle access', 'O(1) amortized insertion and removal at the supported ends', 'std::deque<int> q;\nq.push_back(value);\nint next = q.front();\nq.pop_front();'],
  'dsa-hash': ['fast membership or key-to-value lookup matters', 'ordering is irrelevant but identity matters', 'stable sorted order or strict worst-case latency is required', 'O(1) expected lookup, O(n) worst case', 'std::unordered_map<Key, Value> table;\nauto [it, inserted] = table.emplace(key, value);'],
  'dsa-heap': ['you repeatedly need only the smallest or largest remaining item', 'priorities change the next item to process', 'you need fast arbitrary lookup or full sorted iteration', 'O(log n) push/pop and O(1) top', 'std::priority_queue<int, std::vector<int>, std::greater<int>> heap;\nheap.push(value);\nint smallest = heap.top();'],
  'dsa-binary-tree': ['the input is hierarchical and each subtree can be solved similarly', 'the order of node, left, and right visits matters', 'relationships are not hierarchical', 'O(n) traversal time, O(h) stack space', 'void dfs(Node* node) {\n  if (!node) return;\n  visit(node);\n  dfs(node->left);\n  dfs(node->right);\n}'],
  'dsa-bst': ['ordered updates and lookup must coexist', 'each comparison can discard one subtree', 'input order is adversarial and no balancing is available', 'O(h), with h from log n to n', 'Node* find(Node* node, int key) {\n  while (node && node->key != key)\n    node = key < node->key ? node->left : node->right;\n  return node;\n}'],
  'dsa-avl': ['predictable logarithmic lookup is worth stricter balancing work', 'height differences are maintained after every update', 'updates dominate and looser balancing is preferable', 'O(log n) search, insert, and erase', 'int balance = height(node->left) - height(node->right);\nif (balance > 1) return rotateRight(node);'],
  'dsa-red-black': ['ordered maps need logarithmic operations with moderate update cost', 'color rules encode a bounded-height proof', 'a flat sorted vector is cheaper for mostly static data', 'O(log n) search, insert, and erase', 'if (isRed(parent) && isRed(node)) {\n  rotateAndRecolor(node);\n}'],
  'dsa-sorting': ['ordering exposes groups, duplicates, or monotonic structure', 'later work becomes simpler once values are ordered', 'original order is semantically required and cannot be copied', 'comparison sorts are typically O(n log n)', 'std::sort(values.begin(), values.end(), [](const Item& a, const Item& b) {\n  return a.key < b.key;\n});'],
  'dsa-search': ['a monotonic yes/no boundary exists', 'one comparison discards half the remaining candidates', 'feasibility is not monotonic', 'O(log n) predicate checks', 'int left = 0, right = n;\nwhile (left < right) {\n  int mid = left + (right - left) / 2;\n  if (feasible(mid)) right = mid;\n  else left = mid + 1;\n}'],
  'dsa-two-pointers': ['ordered endpoints let one comparison discard many pairs', 'two positions move monotonically toward a stopping condition', 'moving a pointer cannot safely discard the skipped candidates', 'O(n) time and O(1) extra space', 'int left = 0, right = values.size() - 1;\nwhile (left < right) {\n  int sum = values[left] + values[right];\n  if (sum < target) ++left;\n  else if (sum > target) --right;\n  else break;\n}'],
  'dsa-sliding': ['the answer concerns a contiguous range', 'window state can be updated when one item enters or leaves', 'the property cannot be maintained incrementally', 'O(n) when each boundary moves forward once', 'for (int right = 0; right < n; ++right) {\n  add(values[right]);\n  while (!valid()) remove(values[left++]);\n  answer = std::max(answer, right - left + 1);\n}'],
  'dsa-fast-slow': ['two traversals at different speeds reveal a middle or cycle', 'only next links are available', 'the structure can mutate concurrently', 'O(n) time and O(1) space', 'auto* slow = head;\nauto* fast = head;\nwhile (fast && fast->next) {\n  slow = slow->next;\n  fast = fast->next->next;\n  if (slow == fast) return true;\n}'],
  'dsa-prefix': ['many range queries reuse the same additive history', 'a range answer equals two cumulative boundaries', 'updates are frequent and must be reflected immediately', 'O(n) build and O(1) range sum', 'std::vector<long long> prefix(n + 1);\nfor (int i = 0; i < n; ++i) prefix[i + 1] = prefix[i] + a[i];\nauto sum = prefix[right] - prefix[left];'],
  'dsa-difference': ['many range additions can be delayed', 'each update has a start and one-past-end boundary', 'queries must be answered between updates', 'O(1) per update and O(n) materialization', 'diff[left] += delta;\nif (right + 1 < n) diff[right + 1] -= delta;\nstd::partial_sum(diff.begin(), diff.end(), values.begin());'],
  'dsa-intervals': ['ranges overlap or compete on one axis', 'sorting endpoints reveals the next possible interaction', 'the problem depends on multidimensional geometry', 'O(n log n) for sorting and O(n) scanning', 'std::sort(intervals.begin(), intervals.end());\nfor (auto [start, end] : intervals) {\n  if (out.empty() || start > out.back().second) out.push_back({start, end});\n  else out.back().second = std::max(out.back().second, end);\n}'],
  'dsa-monotonic': ['you need the nearest later or earlier item that is greater or smaller', 'unresolved candidates become permanently useless in monotonic order', 'queries require arbitrary historical comparisons', 'O(n) because each item enters and leaves once', 'std::vector<int> stack;\nfor (int i = 0; i < n; ++i) {\n  while (!stack.empty() && a[stack.back()] < a[i]) stack.pop_back();\n  stack.push_back(i);\n}'],
  'dsa-recursion': ['a choice creates smaller versions of the same problem', 'you must explore alternatives and undo temporary state', 'the state space is huge and has no pruning or memoization', 'O(number of explored states), often exponential', 'void search(State& state) {\n  if (complete(state)) { record(state); return; }\n  for (auto choice : choices(state)) {\n    apply(state, choice);\n    search(state);\n    undo(state, choice);\n  }\n}'],
  'dsa-divide': ['the problem splits into independent smaller instances of the same shape', 'a combine step can merge already-correct partial answers', 'subproblems overlap heavily and should be memoized instead', 'O(number of levels × work per level)', 'Result solve(Range range) {\n  if (small(range)) return direct(range);\n  auto [left, right] = split(range);\n  return combine(solve(left), solve(right));\n}'],
  'dsa-greedy': ['one locally best choice can be proven safe for every optimal completion', 'an exchange argument can replace an optimal solution’s first different choice', 'a local choice changes future options in a way the proof cannot repair', 'Often O(n log n) for ordering plus O(n) selection', 'std::sort(items.begin(), items.end(), by_finish_time);\nfor (const auto& item : items)\n  if (compatible(item, chosen)) chosen.push_back(item);'],
  'dsa-dp': ['subproblems repeat and the answer can be composed from smaller answers', 'a small state fully describes the remaining decision', 'subproblems do not overlap or state omits needed history', 'O(states × transitions)', 'std::vector<int> dp(n + 1, INF);\ndp[0] = 0;\nfor (int i = 1; i <= n; ++i)\n  for (int choice : choices) if (choice <= i)\n    dp[i] = std::min(dp[i], dp[i - choice] + 1);'],
  'dsa-bitwise': ['state consists of boolean flags or powers-of-two structure', 'mask, shift, AND, OR, and XOR can update several compact flags without containers', 'bit positions do not have stable, documented meaning', 'Usually O(number of machine words) with O(1) scalar space', 'unsigned set = mask | (1u << bit);\nunsigned cleared = set & ~(1u << bit);\nbool present = (set & (1u << bit)) != 0;'],
};

const dsaNarrative = {
  ...problemFamilyNarrative,
  'dsa-complexity': {
    summary: 'Complexity analysis is an accounting method: decide what one operation costs, count how often it can happen, and keep the term that controls growth.',
    invariant: 'Every operation is charged exactly once to an input item, recursion level, or state transition; no hidden pass is left uncounted.',
    prediction: 'Which operation grows with the input, and what can you charge each repetition to?',
  },
  'dsa-matrix': {
    summary: 'Matrix reasoning turns a flat block of storage into coordinates, neighborhoods, and boundaries you can inspect without losing your place.',
    invariant: 'Every visited coordinate is in bounds, and the traversal order makes it clear which cells are finished and which remain untouched.',
    prediction: 'If this cell is at row r and column c, which neighboring coordinates are legal and where do they live in memory?',
  },
  'dsa-linked': {
    summary: 'Linked-list work is pointer surgery: preserve the only route to the remaining nodes before changing a link.',
    invariant: 'The rewired prefix has the intended links, while cur still reaches the complete untouched suffix through the saved next pointer.',
    prediction: 'Which pointer is the only remaining path to the rest of the list, and when must it be saved?',
  },
  'dsa-stack-queue': {
    summary: 'Stacks and queues encode who gets served next: newest-first for a stack, oldest-first for a queue.',
    invariant: 'The container order exactly matches the unresolved work order, so removing one end always selects the correct next item.',
    prediction: 'Does the newest unresolved item or the oldest unresolved item have to run next?',
  },
  'dsa-hash': {
    summary: 'Hashing trades ordered storage for a fast route from a key to the small bucket where that key could live.',
    invariant: 'Equal keys produce compatible hashes and each logical key maps to one retrievable entry, even when several keys collide.',
    prediction: 'What identity must be preserved, and what happens when two different keys choose the same bucket?',
  },
  'dsa-heap': {
    summary: 'A heap keeps only the next extreme fully organized; the rest is ordered just enough to repair the root after each update.',
    invariant: 'Every parent obeys the heap relation with its children, so the root is always the global minimum or maximum.',
    prediction: 'Do you need the whole collection sorted, or only the next smallest or largest item?',
  },
  'dsa-binary-tree': {
    summary: 'Tree traversal lets the call stack remember the path while the same small rule solves each subtree.',
    invariant: 'When a traversal call returns, every node in that subtree has been processed exactly once in the requested visit order.',
    prediction: 'What must be true when one subtree call returns, and when should the current node be visited?',
  },
  'dsa-bst': {
    summary: 'A binary search tree stores a comparison decision at every node, turning one comparison into the removal of an entire subtree.',
    invariant: 'Every key in a node’s left subtree is smaller and every key in its right subtree is larger under the chosen duplicate policy.',
    prediction: 'After comparing with this node, which complete subtree is now impossible?',
  },
  'dsa-avl': {
    summary: 'An AVL tree keeps binary-search ordering and actively repairs height imbalance with rotations that do not change sorted order.',
    invariant: 'BST ordering holds, stored heights are correct, and every node has a balance factor between -1 and +1 after repair.',
    prediction: 'Which node first became unbalanced, and which rotation restores height without changing inorder order?',
  },
  'dsa-red-black': {
    summary: 'A red-black tree encodes a loose balance proof in colors, buying logarithmic height with fewer rotations than strict height balancing.',
    invariant: 'BST order holds, the root is black, no red node has a red child, and every root-to-null path has equal black height.',
    prediction: 'Which color rule did the update break, and can recoloring repair it before a rotation is needed?',
  },
  'dsa-sorting': {
    summary: 'Sorting pays once to expose order, after which duplicates, groups, intervals, and monotonic decisions become visible.',
    invariant: 'The comparator defines a consistent strict order, and each completed region is in final order relative to the elements it can no longer cross.',
    prediction: 'What later decision becomes cheap once neighboring values reveal their order?',
  },
  'dsa-search': {
    summary: 'Binary search is boundary finding: maintain a region that must still contain the answer and prove why each discarded half cannot.',
    invariant: 'The target boundary remains inside the live half-open interval [left, right); every excluded index is proven to lie on the wrong side.',
    prediction: 'What monotonic yes-or-no question separates impossible values from possible ones?',
  },
  'dsa-two-pointers': {
    summary: 'Two pointers use order to discard many candidate pairs with one comparison while both positions move only forward through the search.',
    invariant: 'Every pair outside the live interval is already proven impossible, and moving one endpoint cannot discard a valid better answer.',
    prediction: 'Which endpoint can move without losing a possible answer, and what fact makes that move safe?',
  },
  'dsa-sliding': {
    summary: 'A sliding window reuses the state of one contiguous range by updating only what enters and leaves.',
    invariant: 'The maintained state describes exactly the current interval [left, right], and both boundaries move monotonically.',
    prediction: 'Can the answer for the next contiguous range be updated by removing one value and adding one value?',
  },
  'dsa-fast-slow': {
    summary: 'Fast and slow pointers turn different traversal speeds into evidence about a midpoint or a cycle without storing visited nodes.',
    invariant: 'Both pointers follow valid next links; in a cycle their relative distance changes modulo the cycle length until they meet.',
    prediction: 'If one pointer moves twice as fast, what must happen to their relative distance inside a cycle?',
  },
  'dsa-prefix': {
    summary: 'A prefix table stores additive history once so any later range can be recovered by subtracting two boundaries.',
    invariant: 'prefix[i] equals the aggregate of exactly the first i values, making range [left, right) equal prefix[right] minus prefix[left].',
    prediction: 'Which two cumulative boundaries contain the shared history that should cancel?',
  },
  'dsa-difference': {
    summary: 'A difference array records where a range effect starts and stops, delaying all interior work until one final accumulation.',
    invariant: 'Each update contributes +delta at its start and -delta just after its end; the running sum equals the active updates at every index.',
    prediction: 'Where does this range update begin affecting values, and at which boundary must that effect be cancelled?',
  },
  'dsa-intervals': {
    summary: 'Interval problems become a one-dimensional sweep after sorting makes the next possible overlap arrive in order.',
    invariant: 'The output intervals are sorted, disjoint, and cover exactly the union of every input interval processed so far.',
    prediction: 'After sorting, can the next range interact with anything except the last unresolved range?',
  },
  'dsa-monotonic': {
    summary: 'A monotonic stack keeps only candidates that can still answer a future nearest-greater or nearest-smaller query.',
    invariant: 'Indices remain in encounter order, values remain monotonic, and every popped item is permanently dominated by the new item.',
    prediction: 'Why can the candidate at the top never help any future query after this new value arrives?',
  },
  'dsa-recursion': {
    summary: 'Recursive search is a disciplined choice tree: make one choice, solve the smaller state, then restore the world before trying another.',
    invariant: 'On entry the state matches the current path; after each child returns, every temporary change from that child has been undone.',
    prediction: 'What state changes for one choice, and what must be restored before the next sibling choice?',
  },
  'dsa-divide': {
    summary: 'Divide and conquer solves independent smaller instances, then combines already-correct partial results into a larger one.',
    invariant: 'Each recursive result is correct for its own disjoint subrange, and combine preserves correctness for their union.',
    prediction: 'Are the smaller problems independent, and what exact information must the combine step preserve?',
  },
  'dsa-greedy': {
    summary: 'A greedy algorithm is not “pick what looks best”; it is a local choice backed by a proof that an optimal solution can adopt that choice safely.',
    invariant: 'The chosen partial solution is feasible and can still be extended to an optimal complete solution after every local choice.',
    prediction: 'Can any optimal solution be exchanged into one that makes this local choice first without becoming worse?',
  },
  'dsa-dp': {
    summary: 'Dynamic programming names the smallest state that determines the future, solves each such state once, and reuses it everywhere.',
    invariant: 'Every finalized table entry is the correct answer for its defined state because all transitions read only already-correct dependencies.',
    prediction: 'Which pieces of history actually change the remaining answer, and which details can be forgotten?',
  },
  'dsa-bitwise': {
    summary: 'Bitwise reasoning packs independent boolean facts into positions, then changes or tests those facts with masks.',
    invariant: 'Every bit position keeps one documented meaning, and each mask changes only the intended positions while preserving all others.',
    prediction: 'Which fact belongs in each bit, and what mask isolates that fact without disturbing its neighbors?',
  },
};

const dsaScope = {
  ...problemFamilyScope,
  'dsa-matrix': 'Practice row-major offset calculation, boundary-safe neighbor traversal, rectangular versus jagged storage, and cache-friendly row order. Keep the coordinates and the physical stride separate.',
  'dsa-linked': 'Use the same pointer discipline for insertion, deletion, reversal, middle finding, and cycle detection: save the only route forward before rewiring, and state what each live pointer owns.',
  'dsa-stack-queue': 'A stack is LIFO, a queue is FIFO, a deque supports both ends, and a circular buffer represents head, tail, capacity, empty, and full without shifting stored elements.',
  'dsa-hash': 'Collision handling is part of the structure: chaining stores a bucket-local list, while open addressing probes slots and needs tombstones so deletion does not break a later search. Resizing rehashes every live key.',
  'dsa-sorting': 'Insertion sort grows a sorted prefix; selection sort fixes one minimum per pass; merge sort combines sorted halves; quicksort partitions around a pivot; heap sort repeatedly removes the root extreme. Compare stability, extra memory, adaptiveness, and worst-case behavior.',
  'dsa-binary-tree': 'Trace preorder, inorder, postorder, and breadth-first traversal. The visit position changes the meaning; the tree and its parent-child relationships do not.',
  'dsa-dp': 'Define the state in one sentence, write the transition, prove the base case, choose an iteration order that satisfies dependencies, then reduce space only after identifying which previous states remain live.',
};

const dsaLesson = (topic) => {
  const [clueOne, clueTwo, avoidWhen, complexity, cppTemplate] = dsaGuidance[topic.id] ?? [
    `the state can be represented with ${sentenceKeywords(topic)}`,
    'one invariant removes repeated work',
    'the invariant does not hold',
    'O(n) for one full scan',
    'for (const auto& value : values) {\n  observe(value);\n}',
  ];
  const visual = visualForDsa(topic.id);
  const narrative = dsaNarrative[topic.id];
  const cTemplate = dsaCImplementations[topic.id];
  if (!narrative) throw new Error(`Missing authored DSA narrative for ${topic.id}`);
  if (!cTemplate) throw new Error(`Missing C implementation for ${topic.id}`);

  return {
    topicId: topic.id,
    title: topic.title,
    section: topic.sectionTitle,
    depth: 'deep',
    contentSource: 'authored',
    summary: narrative.summary,
    recognition: [clueOne, clueTwo],
    invariant: narrative.invariant,
    avoidWhen,
    complexity,
    cTemplate,
    cppTemplate,
    blocks: [
      { type: 'prediction', heading: 'Pause and predict', prompt: narrative.prediction },
      { type: 'prose', heading: 'Recognition clues', body: `Reach for this pattern when ${clueOne}, especially when ${clueTwo}.` },
      { type: 'prose', heading: 'Invariant', body: narrative.invariant },
      ...(dsaScope[topic.id] ? [{ type: 'prose', heading: 'What this topic includes', body: dsaScope[topic.id] }] : []),
      {
        type: 'visual',
        heading: 'Trace the algorithm',
        invariant: narrative.invariant,
        prediction: narrative.prediction,
        ...visual,
      },
      codePair({
        heading: 'Same pattern, two language surfaces',
        c: cTemplate,
        cpp: cppTemplate,
        note: 'Read the C version for memory, indexes, and explicit ownership. Read the C++ version for container and library leverage. The proof and complexity must match.',
      }),
      { type: 'failure', heading: 'Do not force it', body: `Avoid this pattern when ${avoidWhen}. A memorized template cannot repair a false invariant.` },
      { type: 'practice', heading: 'Transfer test', body: `State the recognition clue, invariant, update rule, stopping condition, and ${complexity} cost before writing code.` },
      recall(`Explain the ${topic.title.toLowerCase()} invariant, connect it to each visual state change, and reconstruct both the C and C++ skeletons from that proof.`),
    ],
  };
};

const linuxLabLesson = (topic) => {
  const labId = topic.id.slice('linux-'.length).toUpperCase();
  const lab = linuxLabById.get(labId);
  if (!lab) throw new Error(`Missing Linux lab data for ${topic.id}`);
  const states = lab.stateDiagram.split(/\s*->\s*/).filter(Boolean);

  return {
    topicId: topic.id,
    labId,
    title: topic.title,
    section: topic.sectionTitle,
    depth: 'deep',
    contentSource: 'authored',
    summary: lab.mechanism,
    blocks: [
      {
        type: 'prediction',
        heading: 'Predict before running it',
        prompt: `For ${labId}, identify the first kernel-visible state change and predict the exact evidence the verification command should observe.`,
      },
      { type: 'prose', heading: 'What the program is proving', body: lab.mechanism },
      {
        type: 'visual',
        heading: 'Trace the kernel state',
        kind: 'timeline',
        invariant: lab.mechanism,
        frames: states.map((state, index) => ({
          caption: `${index + 1}. ${state}`,
          values: states,
          markers: [`state ${index + 1}`],
          active: [state],
        })),
      },
      codePair({
        heading: `${labId} in C and C++`,
        c: lab.source,
        cpp: asCpp20PosixSource(lab.source),
        note: 'These versions deliberately use the same POSIX interface. C++ does not replace fork, waitpid, pipe, mmap, pthreads, or sockets; it changes the language rules around the same kernel operations.',
      }),
      {
        type: 'prose',
        heading: 'Build and run',
        body: `${lab.buildCommand}\n${lab.runCommand}`,
      },
      { type: 'failure', heading: 'What breaks', body: lab.failureAnalysis },
      {
        type: 'practice',
        heading: 'Verify the result',
        body: `Expected evidence: ${lab.expectedEvidence}\n\nDeterministic check: ${lab.verification}`,
      },
      recall(`Explain ${labId} from its initial descriptors, processes, threads, or signals through the final observable evidence, then name the cleanup rule that prevents its failure mode.`),
    ],
  };
};

const collegeCLabLesson = (topic, lab, platform) => {
  if (!lab) throw new Error(`Missing college lab data for ${topic.id}`);
  const isMcu = platform === 'STM32F446RE';
  const mechanism = lab.concept ??
    `This lab turns ${lab.covers.join(', ').toLowerCase()} into one coherent C program. The implementation keeps representation, mutation, boundary handling, and cleanup explicit so each operation can be traced and tested independently.`;
  const trace = isMcu
    ? ['Configure pins and peripherals', 'Sample a debounced input or timer event', 'Update one explicit application state', 'Render output and verify it on the instrument']
    : ['Construct a small deterministic input', 'Apply the operation while preserving its invariant', 'Print or assert the observable result', 'Release every owned allocation'];

  return {
    topicId: topic.id,
    title: topic.title,
    section: topic.sectionTitle,
    depth: 'deep',
    contentSource: 'authored',
    summary: mechanism,
    blocks: [
      {
        type: 'prediction',
        heading: 'Predict before running it',
        prompt: isMcu
          ? 'Which register, state variable, or bus event changes first, and what should the LED, display, UART terminal, or probe show next?'
          : 'Which pointer, index, or ownership link must remain valid after the first mutation?',
      },
      { type: 'prose', heading: 'The idea before the code', body: mechanism },
      {
        type: 'prose',
        heading: 'Assignments covered',
        body: lab.covers.join('; '),
      },
      ...(isMcu ? [
        {
          type: 'prose',
          heading: 'The portable contract',
          body: lab.portability.contract,
        },
        {
          type: 'steps',
          heading: 'Move it to another microcontroller',
          items: [
            lab.portability.replace,
            lab.portability.timing,
            lab.portability.verify,
          ],
        },
      ] : []),
      {
        type: 'visual',
        heading: 'Follow one complete pass',
        kind: 'timeline',
        invariant: isMcu
          ? 'Inputs are sampled once, state changes once, and outputs only render that committed state.'
          : 'Every completed operation preserves reachability, ordering, bounds, and ownership.',
        frames: trace.map((caption, index) => ({
          caption: `${index + 1}. ${caption}${index + 1 === trace.length ? ' — result complete' : ''}`,
          values: trace,
          active: [caption],
          markers: [`step ${index + 1}`],
        })),
      },
      {
        type: 'code',
        language: isMcu ? 'C · STM32Cube HAL · STM32F446RE' : 'C17',
        heading: 'Complete C implementation',
        code: lab.source,
      },
      {
        type: 'prose',
        heading: 'Build and run',
        body: isMcu
          ? 'Create an STM32CubeIDE project for NUCLEO-F446RE with the STM32CubeF4 HAL, paste this complete source into Core/Src/main.c, keep the generated startup file, and reserve flash sector 7 by limiting the linker FLASH region to the first 384 KiB. Build with ARM GCC, flash through the onboard ST-LINK, then wire the external trainer modules using the pin profile printed at the top of the source.'
          : 'Build with: cc -std=c17 -Wall -Wextra -Wpedantic lab.c -o lab\nRun with: ./lab',
      },
      {
        type: 'failure',
        heading: 'What usually breaks',
        body: isMcu
          ? 'Most failures come from a mismatched board pin map, a missing RCC clock, the wrong GPIO alternate function, timer clocks misunderstood after APB prescaling, absent I²C pull-ups, flash storage overlapping the linked application, or missing shared ground. Verify the schematic, linker map, RCC, GPIO, and peripheral registers before changing application logic.'
          : 'Most failures come from changing a link before saving the remaining path, mixing signed and unsigned bounds, ignoring allocation failure, or forgetting to free ownership at the end.',
      },
      {
        type: 'practice',
        heading: 'Prove it works',
        body: isMcu
          ? 'Test one input edge at a time. Record the expected state, STM32 register or bus transition, visible output, and one boundary case. Inspect HAL state and peripheral registers over SWD, then verify timer, PWM, UART, and I²C timing with a logic analyzer or oscilloscope instead of judging by eye.'
          : 'Run the built-in example, then add empty, one-element, duplicate, missing-key, and maximum-capacity cases. Use AddressSanitizer or Valgrind for pointer-owning structures.',
      },
      recall(`Explain ${topic.title.toLowerCase()} from the initial state through every mutation, then reconstruct the C implementation and its boundary checks without looking.`),
    ],
  };
};

const lessonFor = (topic) => {
  if (topic.sectionId === 'qualcomm-prep') return qualcommLesson(topic);
  if (topic.group === 'Linux Systems Programming Labs') return linuxLabLesson(topic);
  if (topic.group === 'College MCU C Labs') {
    return collegeCLabLesson(topic, collegeMcuLabByTopicId.get(topic.id), 'STM32F446RE');
  }
  if (topic.group === 'College DSA C Labs') {
    return collegeCLabLesson(topic, collegeDsaLabByTopicId.get(topic.id), 'host');
  }
  if (topic.sectionId === 'cpp') return cppLesson(topic);
  if (topic.sectionId === 'dsa') return dsaLesson(topic);
  if (mechanismSpecs[topic.id]) return mechanismLesson(topic, mechanismSpecs[topic.id]);
  if (topic.level === 'standard') return standardLesson(topic);
  if (topic.level === 'deep') return expandedDeepLesson(topic);
  return briefLesson(topic);
};

const withTeachingFoundation = (topic, lesson) => {
  const existingDefinition = lesson.blocks.find((block) => block.type === 'definition');
  const definition = existingDefinition?.body ?? lesson.summary;
  const application = {
    type: 'application',
    heading: 'Where this is used',
    body: lesson.application ?? realApplicationFor(topic),
  };
  const linuxCppBridge = topic.sectionId === 'os-linux'
    ? [{
      type: 'prose',
      heading: 'The same Linux contract in C++',
      body: linuxCppGuidanceFor(topic),
    }]
    : [];
  const remainingBlocks = lesson.blocks.filter((block) => (
    block.type !== 'definition'
    && block.type !== 'application'
    && !(block.type === 'prose' && block.body?.trim() === definition.trim())
  ));

  return {
    ...lesson,
    summary: definition,
    application: undefined,
    blocks: [
      {
        type: 'definition',
        heading: 'What it is',
        body: definition,
      },
      application,
      ...linuxCppBridge,
      ...remainingBlocks,
    ],
  };
};

export const lessons = allTopics.map((topic) => withTeachingFoundation(topic, lessonFor(topic)));

export const lessonByTopicId = new Map(lessons.map((lesson) => [lesson.topicId, lesson]));
