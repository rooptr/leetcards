const conceptGuidance = {
  'os-purpose': 'C++ does not replace the operating system boundary. A C++ program still receives processes, virtual memory, files, sockets, and protection from the Linux kernel; classes and RAII only make ownership of those kernel resources easier to express.',
  'os-environment': 'Compile Linux C++ with g++ -std=c++20 -Wall -Wextra -Wpedantic. The same man-page sections and errno values apply, while std::system_error can attach the captured errno value to a typed exception or error object.',
  'os-cli': 'A C++ command-line tool still receives argc, argv, environment variables, descriptors, and exit status from Linux. std::string and std::filesystem can manage text and paths, but pipeline construction still uses pipe, dup2, fork, exec, close, and wait.',
  'os-user-kernel': 'C++ expressions execute in user mode exactly like C expressions. A library wrapper or inline runtime stub eventually follows the architecture syscall ABI; language objects do not grant permission to execute privileged instructions.',
  'os-syscalls': 'The kernel sees register arguments, user addresses, sizes, and flags rather than C++ types. Before a syscall, convert spans, strings, and RAII handles into stable pointer-length or integer-handle pairs, then rebuild type-safe results only after checking the return value.',
  'os-syscall-contract': 'A C++ wrapper must still loop around partial read or write results and define its EINTR policy. std::span makes buffer extent explicit, std::error_code can retain errno without throwing, and an RAII descriptor ensures cleanup without hiding short-work semantics.',
  'os-files': 'A C++ FileDescriptor class can own one descriptor, but dup still creates another reference to the same open-file description and therefore the same offset and status flags. Object identity in C++ must not be confused with kernel-object identity.',
  'os-filesystems': 'std::filesystem offers type-safe path composition and metadata queries, yet Linux path lookup, mounts, symlinks, permissions, and race rules still govern the result. Security-sensitive code should use descriptor-relative operations such as openat instead of assuming a path remains unchanged.',
  'os-permissions': 'C++ wrappers can represent UIDs, mode bits, and capabilities with scoped types, but the effective credentials and kernel access check remain authoritative. Throwing an exception on EACCES changes error propagation, not the permission decision.',
  'os-file-io': 'Use a move-only RAII descriptor in C++, but keep open, read, write, lseek, fstat, and close behavior visible. A std::vector<std::byte> owns storage; std::span exposes the current unwritten suffix while a loop handles partial progress.',
  'os-fd-dup': 'A C++ pipeline builder should model every descriptor as an owner and explicitly release unused pipe ends before exec. Moving a wrapper transfers one descriptor number; dup2 creates a new kernel reference and is not a C++ move operation.',
  'os-fcntl': 'C++ can wrap flag sets in enum classes and preserve them with bitwise helpers, but F_GETFL/F_SETFL and F_GETFD/F_SETFD still refer to different kernel state. A wrapper must read-modify-write the documented flag family instead of replacing unrelated bits.',
  'os-processes': 'A C++ process contains a C++ runtime inside one Linux address space. After fork, only the calling thread survives in the child, so locks held by vanished threads and buffered iostream state make post-fork C++ code especially constrained before exec.',
  'os-virtual-memory': 'new, allocator containers, and smart pointers ultimately operate over virtual mappings supplied to the process. Their ownership rules do not reveal whether a page is resident, shared, copy-on-write, swapped, or backed by a file.',
  'os-virtual-translation': 'A C++ pointer carries a virtual address, not a physical frame. References, iterators, and smart pointers remain subject to page-table permissions, TLB translation, page faults, and object-lifetime rules at the same time.',
  'os-mmap-cow': 'Wrap an mmap region in a move-only object that records address and length and calls munmap in its destructor. MAP_PRIVATE and MAP_SHARED control kernel visibility; copying the wrapper must never pretend to copy or duplicate the mapping.',
  'os-reclamation': 'C++ destructors can release application ownership, but Linux may reclaim clean cache pages or swap anonymous pages while objects remain alive. Container size and allocator statistics therefore do not directly equal resident physical memory.',
  'os-process-lifecycle': 'A C++ launcher still follows fork, child-side descriptor setup, exec, parent-side wait, and decoded status. RAII is useful in the parent, but a failed post-fork child should use async-signal-safe operations and _exit rather than unwinding arbitrary inherited C++ state.',
  'os-process-create': 'Do not treat fork like copying a C++ object. It clones process state with copy-on-write mappings and shared kernel references; after a multithreaded fork, only async-signal-safe work is reliable until exec.',
  'os-exec': 'Build argv and envp from stable string storage, expose mutable char pointers only for the call boundary, and mark unrelated RAII descriptors close-on-exec. A successful exec destroys the entire old C++ process image without running its destructors.',
  'os-exit': 'Normal C++ return from main and std::exit run language and library termination work, while _exit terminates at the kernel boundary without stack unwinding or iostream flushing. The child-after-fork path often requires _exit precisely because inherited C++ cleanup is unsafe there.',
  'os-wait': 'A C++ ChildProcess owner can store a PID and provide join-like waitpid behavior, but it must decode WIFEXITED, WIFSIGNALED, and WNOHANG exactly as the C interface specifies. Destructors should not silently block unless that ownership policy is explicit.',
  'os-zombie-orphan': 'A C++ process wrapper cannot reap a child merely by destroying a local PID integer. It must call wait or waitpid, and it must distinguish a living adopted orphan from a terminated zombie whose status still occupies a kernel task slot.',
  'os-ipc': 'C++ containers can serialize messages and RAII can own endpoints, but IPC still requires explicit framing, synchronization, lifetime, and failure policy. Do not send object representations containing pointers, vptrs, padding, or process-local invariants as if they were portable wire data.',
  'os-pipes': 'A C++ Pipe type should own one read end and one write end, be move-only, and close unused ends in every process branch. std::string may hold payload bytes, but EOF and PIPE_BUF atomicity are controlled by kernel reference counts and write sizes.',
  'os-fifo': 'A C++ FIFO wrapper may create and unlink the pathname through RAII, but open can block and the byte stream has the same EOF rules as a pipe. Name ownership and descriptor ownership are separate lifetimes and should be represented separately.',
  'os-shm': 'Map shared memory into a move-only Region object and place only explicitly shared-safe layouts inside it. Ordinary std::mutex, pointers, strings, and allocator-owned containers are not automatically process-shared; use process-shared pthread primitives or a documented atomic layout.',
  'os-signals': 'C++ signal handlers have the same async-signal-safety restrictions as C handlers and must not allocate, lock iostreams, or throw. Hand off the signal through sig_atomic_t, a self-pipe, signalfd, or eventfd, then resume normal C++ processing outside the handler.',
  'os-linux-sockets': 'A C++ Socket owner can close automatically and use span/string_view for explicit byte ranges, but TCP remains an unframed byte stream and UDP remains an unreliable datagram service. Loop partial I/O and keep protocol state separate from the descriptor wrapper.',
  'os-threads': 'std::thread and std::jthread use the process-wide Linux threading implementation while adding C++ lifetime rules. Shared objects still require synchronization, and every referenced object must outlive the worker that accesses it.',
  'os-scheduling': 'C++ threads are Linux schedulable tasks. RAII and atomics cannot guarantee fairness, priority, affinity, or deadlines; use the appropriate pthread or sched APIs and measure actual runnable, blocked, and preempted intervals.',
  'os-sync': 'std::mutex, std::condition_variable, semaphores, and atomics express C++ memory-model guarantees and are commonly implemented with Linux futexes. Choose the primitive from the invariant and waiting condition, not because its surface syntax is shorter.',
  'os-pthreads': 'C++ can call pthread_create directly, but std::thread or std::jthread usually gives safer argument lifetime and join ownership. POSIX return codes still need checking when pthread attributes, scheduling, affinity, or process-shared primitives require the native API.',
  'os-mutex': 'Compare pthread_mutex_t with std::mutex at two layers: both protect a compound invariant, while the C++ lock/unlock operations also participate in the C++ memory model. std::lock_guard and std::unique_lock make release exception-safe; condition waits still require a predicate loop.',
  'os-semaphores': 'C++20 counting_semaphore expresses an in-process count with RAII-friendly syntax, while POSIX sem_t also supports named and process-shared cases. Neither semaphore records mutex ownership, and both require a documented rule connecting each permit to one event or resource.',
  'os-boot': 'Most C++ user programs begin only after the kernel and init system have established the process environment. C++ services should make startup dependencies explicit in systemd units and keep constructors from hiding fallible global initialization before main.',
  'os-proc': 'Read /proc and /sys as kernel-defined text or binary interfaces, preferably through descriptor-safe C++ parsers that reject malformed and changing input. Namespaces and cgroups alter what the process can see and consume; a wrapper does not bypass those views.',
};

const labGuidance = {
  'linux-a01': 'Implement the copier with a move-only descriptor, a byte buffer owned by std::array, and a write_all loop. Preserve mode and timestamps with the same fstat, fchmod, and futimens calls used by C.',
  'linux-a02': 'Use std::array<char, N> for storage and keep the byte-wise state machine explicit. Streams are optional here; raw read demonstrates partial input and byte counts more directly.',
  'linux-a03': 'Wrap the opened descriptor, call dup or dup2 deliberately, then release the wrapper copy whose descriptor is no longer needed. A moved C++ owner is different from a duplicated kernel descriptor.',
  'linux-a04': 'Represent selected flags with scoped constants, but preserve F_GETFL/F_SETFL, FD_CLOEXEC, advisory-lock, and ioctl semantics exactly. RAII should close the descriptor after every error path.',
  'linux-a05': 'Represent PIDs as observed kernel identities and print both parent transitions. C++ object destruction does not reap a process; waitpid remains the operation that consumes zombie status.',
  'linux-a06': 'Use a small ChildReaper owner around the SIGCHLD or double-fork policy, but keep signal-handler work async-signal-safe. Any exception reporting belongs after control returns to ordinary flow.',
  'linux-a07': 'Build argv from stable std::string storage before fork, convert it to char pointers for exec, and call _exit on child-side failure. Do not run inherited C++ cleanup after the fork boundary.',
  'linux-a08': 'Store child PIDs in std::array, create each child only from the original parent branch, and wait for every recorded PID. Container ownership helps bookkeeping but does not change the process tree.',
  'linux-a09': 'Use a move-only Pipe owner and a length-prefixed std::vector<std::byte> message. Close the parent and child copies that do not participate so EOF remains provable.',
  'linux-a10': 'Model each pipeline stage with explicit input and output descriptor owners. Move ownership into the branch that needs it and close every inherited duplicate before reading or writing.',
  'linux-a11': 'Store pipe endpoint pairs and child PIDs in vectors sized from the command count. C++ reduces bookkeeping errors, while dup2, exec, EOF, and wait status remain unchanged.',
  'linux-a12': 'Wrap shm_open, ftruncate, mmap, munmap, close, and shm_unlink in separate owners. Store a fixed-layout protocol record in shared memory rather than a std::string or process-local pointer.',
  'linux-a13': 'Give the pipe, FIFO pathname, and shared mapping separate RAII owners because their cleanup and visibility rules differ. Keep one explicit frame format across all three transports.',
  'linux-a14': 'The SIGSEGV handler must remain C-like and async-signal-safe even in a C++ program. Capture si_addr and hand off or write minimal fixed data; never throw from the handler.',
  'linux-a15': 'Represent alarm and snooze as an enum-class state machine outside the handler. The handler records a signal-safe event, while normal C++ control flow performs parsing, timing policy, and output.',
  'linux-a16': 'Use an RAII signal-mask guard around pthread_sigmask or sigprocmask, but define whether destruction restores the old mask. Signal delivery and pending-state behavior remain per-thread kernel rules.',
  'linux-a17': 'A normal C++ function should loop waitpid(-1, ..., WNOHANG) after a minimal SIGCHLD notification. One signal can cover several children, so one callback must not imply one reap.',
  'linux-a18': 'Wrap accepted sockets, store input in a bounded byte container, and make line framing a protocol class independent of the socket owner. recv may split or combine lines regardless of C++ object boundaries.',
  'linux-a19': 'Use a variant or enum for the fixed allowlisted commands and reject every other datagram without invoking a shell. Socket RAII and typed parsing improve safety without changing UDP loss or spoofing limits.',
  'linux-a20': 'std::jthread can own and join the factorial worker automatically, while the computation result can travel through a promise/future or protected value. Keep overflow validation explicit.',
  'linux-a21': 'Compare std::mutex-protected aggregation with per-thread results reduced after join. lock_guard protects the shared invariant, while join establishes completion before the final read.',
  'linux-a22': 'Store matrices in contiguous vectors, validate dimensions before launching workers, and partition rows into bounded std::jthread tasks. Joining every task precedes reading the completed output.',
};

export function linuxCppGuidanceFor(topic) {
  const guidance = conceptGuidance[topic.id] ?? labGuidance[topic.id];
  if (!guidance) {
    throw new Error(`Missing Linux C++ guidance: ${topic.id}`);
  }
  return guidance;
}

export const linuxCppGuidance = {
  ...conceptGuidance,
  ...labGuidance,
};
