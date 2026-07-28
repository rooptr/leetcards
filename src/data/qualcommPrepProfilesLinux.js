const concept = (term, definition, example) => ({ term, definition, example });

export const qualcommPrepProfilesLinux = {
  'qualcomm-linux-processes-signals': {
    definition: 'A Linux process is a kernel-managed execution context with a virtual address space and resources; threads share most process resources, `fork` creates a child process, `exec` replaces a process image, and signals deliver asynchronous process events.',
    application: 'Shells create pipelines with `fork`, descriptor setup, and `exec`; supervisors reap children and use signals for controlled termination and restart.',
    prediction: 'After `fork`, which state is copied, which kernel objects remain shared by reference, and why must both parent and child close unused pipe descriptors?',
    explanation: 'C and C++ call the same POSIX system interfaces. C normally manages descriptors and child status explicitly. C++ should wrap owned descriptors and process handles in move-only RAII types while preserving `fork`/`exec` async-signal-safety rules.',
    concepts: [
      concept('Program versus process', 'A program is executable data on storage; a process is a running instance with an address space, credentials, threads, descriptors, and kernel scheduling state.', 'Launching the same executable twice creates distinct processes.'),
      concept('Process versus thread', 'Processes have separate virtual address spaces by default, while threads in one process share code, heap, globals, and open descriptors but have separate stacks and register state.', 'A data race is possible when two threads access the same heap object without synchronization.'),
      concept('fork', '`fork` creates a child with a copy-on-write view of the parent address space and inherited references to open file descriptions; it returns twice with different values.', 'The parent receives the child PID, the child receives zero, and failure returns -1 only to the caller.'),
      concept('exec', 'An `exec` function replaces the calling process image while retaining selected process attributes and descriptors not marked close-on-exec.', 'A shell child redirects descriptors, then calls `execvp` to run the requested command.'),
      concept('wait and zombie', 'A terminated child retains minimal status as a zombie until its parent collects that status with a wait function or an applicable disposition handles it.', 'A nonblocking parent can reap in a SIGCHLD loop with `waitpid(-1, ..., WNOHANG)`.'),
      concept('Orphan', 'A living child whose parent exits becomes reparented to a subreaper or init-like process; orphan and zombie describe different conditions.', 'A child can be an orphan while still running normally.'),
      concept('Signal', 'A signal is a kernel-delivered notification with a disposition such as default action, ignore, or a registered handler, subject to masks and pending state.', 'SIGTERM requests normal termination, while SIGKILL cannot be caught, blocked, or ignored.'),
      concept('Signal-safe handler', 'A signal handler can interrupt code at almost any point and may call only async-signal-safe operations; complex work should be deferred.', 'Set a `volatile sig_atomic_t` flag or write one byte to a self-pipe, then handle the event in normal flow.'),
      concept('Process termination', 'Normal return or `exit` flushes C library state and runs registered handlers, while `_exit` terminates immediately without repeating inherited buffered cleanup.', 'A failed child after `fork` should normally use `_exit` if `exec` cannot start.'),
      concept('C++ process ownership', 'C++ standard library does not replace POSIX process creation; C++ wrappers add typed errors and deterministic descriptor cleanup around the same kernel calls.', 'A move-only `unique_fd` closes exactly once when a scope exits.'),
    ],
    steps: [
      'Create or acquire descriptors before `fork` and set close-on-exec deliberately.',
      'In the child, perform only the required async-signal-safe descriptor setup.',
      'Call `exec`; on failure report safely and terminate with `_exit`.',
      'In the parent, close child-only descriptors and collect status with `waitpid`.',
      'Decode exit, signal, and core-dump status instead of comparing the raw integer directly.',
    ],
    failure: 'Calling allocation-heavy C++ code in a multithreaded child between `fork` and `exec` can deadlock on inherited library locks. Failing to reap creates zombies, while calling a zombie an orphan hides the actual lifecycle.',
    practice: 'Write a parent that launches one command, redirects stdout through a pipe, handles `EINTR`, closes all unused ends, and reports normal exit versus signal termination.',
    sourcePrompts: [
      'Explain program, process, and thread.',
      'Explain `fork()` and `exec()`.',
      'Terminate a running process and choose an appropriate signal.',
      'Explain signals and signal handling.',
      'Explain zombie, orphan, waiting, and reaping.',
      'Explain the same lifecycle from C and C++.',
    ],
    codeExamples: [{
      heading: 'Create and reap one child process',
      note: 'Both implementations use the same Linux process contract. C++ adds exception-safe parent-side diagnostics but keeps the child path minimal.',
      c: `#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/wait.h>
#include <unistd.h>

int main(void)
{
    pid_t child = fork();
    if (child == -1) {
        perror("fork");
        return 1;
    }
    if (child == 0) {
        execlp("printf", "printf", "child process\\n", (char *)0);
        perror("exec");
        _exit(127);
    }

    int status;
    while (waitpid(child, &status, 0) == -1) {
        if (errno != EINTR) {
            perror("waitpid");
            return 1;
        }
    }
    if (WIFEXITED(status))
        printf("exit=%d\\n", WEXITSTATUS(status));
    else if (WIFSIGNALED(status))
        printf("signal=%d\\n", WTERMSIG(status));
    return 0;
}`,
      cpp: `#include <cerrno>
#include <cstdio>
#include <iostream>
#include <sys/wait.h>
#include <unistd.h>

int main()
{
    const pid_t child = ::fork();
    if (child == -1) {
        std::perror("fork");
        return 1;
    }
    if (child == 0) {
        ::execlp("printf", "printf", "child process\\n",
                 static_cast<char*>(nullptr));
        std::perror("exec");
        ::_exit(127);
    }

    int status = 0;
    while (::waitpid(child, &status, 0) == -1) {
        if (errno != EINTR) {
            std::perror("waitpid");
            return 1;
        }
    }
    if (WIFEXITED(status))
        std::cout << "exit=" << WEXITSTATUS(status) << '\\n';
    else if (WIFSIGNALED(status))
        std::cout << "signal=" << WTERMSIG(status) << '\\n';
}`,
    }],
  },

  'qualcomm-linux-kernel-vm': {
    definition: 'User mode restricts privileged operations, kernel mode executes trusted OS code, a system call is a controlled transition between them, virtual addresses are translated through page tables, and a page fault asks the kernel to resolve or reject a missing/protected translation.',
    application: 'A file read, socket operation, memory mapping, or process creation crosses the user/kernel boundary or depends on virtual-memory machinery, even when a C++ library presents the surface API.',
    prediction: 'When a valid mapped page has never been physically populated, why can its first access fault without indicating a programming error?',
    explanation: 'C reaches these mechanisms through libc wrappers such as `read`, `mmap`, and `sigaction`; C++ uses the same Linux interfaces and should place descriptor, mapping, and error ownership behind RAII types. Below both languages ultimately follow the same path: the CPU executes a syscall instruction with a documented register convention, switches privilege and entry state, and enters a kernel dispatcher. For memory, the MMU checks the TLB and page-table hierarchy; a fault may allocate a zero page, load file data, perform copy-on-write, grow a permitted stack, deliver SIGSEGV, or kill the process.',
    concepts: [
      concept('User space', 'User space is the per-process execution environment with restricted privilege and virtual mappings; ordinary code cannot directly program privileged CPU or arbitrary physical memory.', 'Dereferencing a kernel virtual address from a normal process is prohibited.'),
      concept('Kernel space', 'Kernel space executes privileged code that schedules tasks, manages memory, devices, filesystems, and security, and validates requests from user processes.', 'A driver handles device interrupts and exposes controlled operations to user programs.'),
      concept('System call', 'A system call is a defined user-to-kernel request entered through an architecture-specific instruction and ABI, returning a value or error to user mode.', '`read` may be a libc wrapper around the kernel read syscall.'),
      concept('Virtual address', 'A virtual address is interpreted in the current process address space and translated to a physical frame or another outcome by MMU state.', 'Two processes can use the same virtual address for different physical pages.'),
      concept('Page table', 'Page tables are kernel-managed translation structures stored in physical memory; the CPU uses a privileged root pointer and cached TLB entries to walk them.', 'The process cannot safely edit its own page-table entries as ordinary user data.'),
      concept('TLB', 'The translation lookaside buffer caches recent virtual-to-physical translations and permissions to avoid a page-table walk on every memory access.', 'Context switches and mapping changes require ASID handling or invalidation.'),
      concept('Page fault', 'A page fault is a synchronous exception raised when translation is absent or permissions reject an access; the kernel inspects the address, access type, and mapping.', 'Demand paging resolves a valid first touch, while an unmapped access usually results in SIGSEGV.'),
      concept('C syscall use', 'C exposes POSIX wrappers that return sentinel values and set `errno`; callers must handle partial work and interruption.', '`write` can return fewer bytes than requested and must be retried on the remainder.'),
      concept('C++ syscall use', 'C++ calls the same POSIX wrappers but can wrap descriptors, spans, and error codes so ownership and buffer length are explicit.', 'An RAII descriptor closes on every normal or exceptional scope exit.'),
    ],
    steps: [
      'Place syscall number and arguments according to the architecture ABI or call the libc wrapper.',
      'Execute the syscall entry instruction and switch to kernel-controlled entry state.',
      'Validate pointers, lengths, permissions, and object state in the kernel.',
      'Perform or schedule the operation and return a result or encoded error.',
      'For a memory access, resolve TLB hit, page-table walk, recoverable fault, or fatal fault.',
    ],
    failure: '“A page fault means segmentation fault” is false. Page faults are the mechanism behind demand paging and copy-on-write. Another weak answer says page tables are on the disk; inactive pages may have backing storage, but translation tables themselves are kernel structures in physical memory.',
    practice: 'Trace one `write` call and one first-touch anonymous mapping from user instruction through return. Use `strace`, `/proc/self/maps`, and a debugger fault address to connect the model to evidence.',
    sourcePrompts: [
      'Explain user space and kernel space.',
      'Explain system calls and the transition.',
      'Explain page faults and how they are handled.',
      'Explain where page tables are stored.',
      'Explain virtual memory, TLB, and physical frames.',
      'Show robust Linux I/O from C and C++.',
    ],
    codeExamples: [{
      heading: 'Handle partial and interrupted writes',
      c: `#include <errno.h>
#include <stddef.h>
#include <unistd.h>

int write_all(int descriptor, const void *buffer, size_t length)
{
    const unsigned char *bytes = buffer;
    size_t written = 0;
    while (written < length) {
        const ssize_t result =
            write(descriptor, bytes + written, length - written);
        if (result > 0) {
            written += (size_t)result;
        } else if (result == -1 && errno == EINTR) {
            continue;
        } else {
            return -1;
        }
    }
    return 0;
}`,
      cpp: `#include <cerrno>
#include <cstddef>
#include <span>
#include <system_error>
#include <unistd.h>

void write_all(int descriptor, std::span<const std::byte> bytes)
{
    std::size_t written = 0;
    while (written < bytes.size()) {
        const ssize_t result = ::write(
            descriptor, bytes.data() + written, bytes.size() - written);
        if (result > 0) {
            written += static_cast<std::size_t>(result);
        } else if (result == -1 && errno == EINTR) {
            continue;
        } else {
            throw std::system_error(errno, std::generic_category(), "write");
        }
    }
}`,
    }],
  },

  'qualcomm-linux-synchronization': {
    definition: 'Synchronization coordinates concurrent access: a mutex provides ownership-based mutual exclusion, a semaphore counts permits or events, a critical section is the protected code, and deadlock is a cycle of waits that prevents progress.',
    application: 'Threads protecting a shared queue need a mutex and condition variable; processes limiting access to a fixed pool may use a process-shared semaphore; kernel short critical paths may use spinlocks.',
    prediction: 'Why is a binary semaphore initialized to one still not equivalent to a mutex even though both can allow one entrant?',
    explanation: 'C uses pthread mutexes, POSIX semaphores, and atomics explicitly. C++ uses `std::mutex`, scoped locks, condition variables, semaphores, and atomics. The kernel scheduling and memory-ordering requirements are the same; C++ makes ownership and scope harder to misuse.',
    concepts: [
      concept('Critical section', 'A critical section accesses shared mutable state whose invariant can be broken by interleaving, so entry and exit require a synchronization protocol.', 'Updating both queue tail and item count must appear atomic to other threads.'),
      concept('Mutex', 'A mutex is an ownership lock: one thread acquires it and that owning thread must release it after the protected invariant is restored.', 'C++ `std::lock_guard` releases the mutex at scope exit.'),
      concept('Binary semaphore', 'A binary semaphore is a zero-or-one permit counter used for signaling or admission and does not inherently enforce owner-only release.', 'An ISR or producer can post a semaphore that a different task waits on.'),
      concept('Counting semaphore', 'A counting semaphore represents multiple interchangeable permits and blocks waiters when the count is zero.', 'A buffer pool of eight entries can expose eight permits.'),
      concept('Preemption', 'Preemption allows the scheduler to suspend a running thread and execute another, including inside an unprotected multi-step update.', 'Correct code cannot rely on a short source expression finishing before a context switch.'),
      concept('Deadlock', 'Deadlock occurs when threads form an unbreakable wait cycle while holding resources needed by others.', 'Thread A holds X and waits for Y while thread B holds Y and waits for X.'),
      concept('Recursive deadlock', 'A non-recursive mutex deadlocks when its owning thread attempts to acquire it again before release.', 'A public method locks and calls a helper that tries to lock the same mutex.'),
      concept('Spinlock', 'A spinlock repeatedly checks ownership instead of sleeping, suitable only for very short nonblocking sections where the holder can run promptly.', 'Spinning does not prevent deadlock; global lock ordering does.'),
      concept('Deadlock prevention', 'Consistent lock ordering, avoiding hold-and-wait, bounded try-lock protocols, and reduced lock scope prevent wait cycles.', '`std::scoped_lock` can acquire multiple mutexes with a deadlock-avoidance algorithm.'),
    ],
    steps: [
      'Write the shared invariant before selecting a primitive.',
      'Choose ownership locking for shared state and semaphore signaling for permits/events.',
      'Acquire locks in one documented global order.',
      'Keep the critical section bounded and never perform blocking external work while holding it.',
      'Release through cleanup paths or RAII and stress-test with forced scheduling variation.',
    ],
    failure: 'A spinlock does not “avoid deadlock” by itself. Spinning while waiting for a lock held by a thread that cannot run can make progress worse. Treating a semaphore as owner-tracked also permits accidental over-posting.',
    practice: 'Implement one protected counter and one bounded-buffer permit scheme in both languages. Then construct an AB/BA deadlock and remove it with lock ordering.',
    sourcePrompts: [
      'Explain mutex versus binary semaphore.',
      'Explain critical sections and preemption.',
      'Explain deadlock and recursive deadlock.',
      'Explain spinlocks and correct deadlock prevention.',
      'Explain mutexes and semaphores from C and C++.',
      'Explain RTOS synchronization differences where scheduling constraints matter.',
    ],
    codeExamples: [{
      heading: 'Protect one shared invariant',
      c: `#include <pthread.h>
#include <stdio.h>

static pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;
static long counter;

static void *increment(void *unused)
{
    (void)unused;
    for (int i = 0; i < 100000; ++i) {
        pthread_mutex_lock(&lock);
        ++counter;
        pthread_mutex_unlock(&lock);
    }
    return NULL;
}

int main(void)
{
    pthread_t first, second;
    if (pthread_create(&first, NULL, increment, NULL) != 0 ||
        pthread_create(&second, NULL, increment, NULL) != 0) return 1;
    pthread_join(first, NULL);
    pthread_join(second, NULL);
    printf("%ld\\n", counter);
    pthread_mutex_destroy(&lock);
    return 0;
}`,
      cpp: `#include <iostream>
#include <mutex>
#include <thread>

int main()
{
    std::mutex mutex;
    long counter = 0;
    auto increment = [&] {
        for (int i = 0; i < 100000; ++i) {
            std::lock_guard guard(mutex);
            ++counter;
        }
    };
    std::jthread first(increment);
    std::jthread second(increment);
    first.join();
    second.join();
    std::cout << counter << '\\n';
}`,
    }],
  },

  'qualcomm-linux-ipc': {
    definition: 'Inter-process communication uses kernel or shared-memory mechanisms to exchange bytes or synchronize state between separate processes, each with different message boundaries, copying, lifetime, naming, and failure behavior.',
    application: 'Shell pipelines favor byte streams, unrelated local services use Unix sockets or named FIFOs, telemetry can use message queues, and high-rate shared buffers combine shared memory with explicit synchronization.',
    prediction: 'Why does shared memory have low data-copy overhead but require more synchronization design than a pipe?',
    explanation: 'C and C++ use the same pipe, FIFO, message-queue, shared-memory, and socket syscalls. C++ can wrap descriptors and mappings in RAII, but cannot remove protocol framing, partial I/O, peer death, or memory-ordering requirements.',
    concepts: [
      concept('Anonymous pipe', 'A pipe is a unidirectional kernel byte stream referenced by inherited descriptors and commonly connects related processes.', 'A shell joins one command’s stdout to the next command’s stdin.'),
      concept('FIFO', 'A named pipe has a filesystem name so unrelated processes can open the same byte stream, with blocking open and writer-lifetime semantics.', 'A local producer and consumer can rendezvous through `mkfifo`.'),
      concept('Shared memory', 'Shared memory maps the same physical pages into multiple processes, enabling direct loads and stores but providing no automatic record protocol or race protection.', 'Place a process-shared mutex or semaphore beside a shared ring buffer.'),
      concept('Message queue', 'A message queue preserves message boundaries and kernel-managed queue state, often supporting priorities or typed messages.', 'POSIX and System V message queues have different APIs and lifecycle conventions.'),
      concept('Socket', 'A socket is a bidirectional communication endpoint that can connect local or network processes and requires an application framing protocol for streams.', 'Unix-domain sockets support local request/response and credential checks.'),
      concept('Copy and context cost', 'Kernel-buffered IPC usually copies data between user and kernel space, while shared memory reduces copies but increases coordination complexity.', 'Measure message size and rate before choosing based on a slogan.'),
      concept('C IPC ownership', 'C code records descriptor/mapping ownership explicitly and uses structured cleanup labels to release partial setup.', 'Close both pipe ends on every error path.'),
      concept('C++ IPC ownership', 'C++ move-only wrappers bind descriptor or mapping lifetime to scope while exposing the same syscall results and protocol state.', 'Moving a `unique_fd` transfers sole close responsibility.'),
    ],
    steps: [
      'Identify whether processes are related, local, or remote.',
      'Define message boundaries, direction, throughput, latency, and crash recovery.',
      'Choose the mechanism and create every endpoint with close-on-exec where appropriate.',
      'Close unused references so EOF and peer death become observable.',
      'Handle partial I/O, interruption, synchronization, and cleanup in both processes.',
    ],
    failure: 'Leaving an extra pipe write end open prevents the reader from seeing EOF. Shared memory without a synchronization and versioning protocol merely creates a fast data race.',
    practice: 'Compare one 4 KiB message sent through a pipe, POSIX queue, Unix socket, and shared mapping. Record boundaries, copies, blocking, cleanup, and behavior when the peer exits.',
    sourcePrompts: [
      'Compare IPC mechanisms with advantages and disadvantages.',
      'Explain pipes, FIFOs, shared memory, message queues, and sockets.',
      'Explain message queues.',
      'Use IPC from C and C++.',
      'Explain how synchronization changes a shared-memory design.',
    ],
    codeExamples: [{
      heading: 'Send one framed value through a related-process pipe',
      c: `#include <stdint.h>
#include <stdio.h>
#include <sys/wait.h>
#include <unistd.h>

int main(void)
{
    int descriptors[2];
    if (pipe(descriptors) == -1) return 1;
    const pid_t child = fork();
    if (child == -1) return 1;
    if (child == 0) {
        close(descriptors[1]);
        uint32_t value;
        const ssize_t bytes = read(descriptors[0], &value, sizeof value);
        close(descriptors[0]);
        if (bytes != (ssize_t)sizeof value) _exit(2);
        printf("%u\\n", value);
        _exit(0);
    }
    close(descriptors[0]);
    const uint32_t value = 42;
    const ssize_t bytes = write(descriptors[1], &value, sizeof value);
    close(descriptors[1]);
    if (bytes != (ssize_t)sizeof value) return 1;
    return waitpid(child, NULL, 0) == -1;
}`,
      cpp: `#include <cstdint>
#include <cstdio>
#include <sys/wait.h>
#include <unistd.h>
#include <utility>

class unique_fd {
public:
    explicit unique_fd(int value = -1) : value_(value) {}
    ~unique_fd() { if (value_ >= 0) ::close(value_); }
    unique_fd(const unique_fd&) = delete;
    unique_fd& operator=(const unique_fd&) = delete;
    unique_fd(unique_fd&& other) noexcept
        : value_(std::exchange(other.value_, -1)) {}
    int get() const { return value_; }
private:
    int value_;
};

int main()
{
    int raw[2];
    if (::pipe(raw) == -1) return 1;
    unique_fd input(raw[0]), output(raw[1]);
    const pid_t child = ::fork();
    if (child == -1) return 1;
    if (child == 0) {
        std::uint32_t value = 0;
        if (::read(input.get(), &value, sizeof value) != sizeof value)
            ::_exit(2);
        std::printf("%u\\n", value);
        ::_exit(0);
    }
    const std::uint32_t value = 42;
    if (::write(output.get(), &value, sizeof value) != sizeof value)
        return 1;
    return ::waitpid(child, nullptr, 0) == -1;
}`,
    }],
  },

  'qualcomm-linux-boot-linking': {
    definition: 'Linux boot transfers control from platform firmware to a bootloader, kernel, early userspace, and the first userspace process; runtime linking maps shared objects and resolves dynamic symbols before or during program execution.',
    application: 'Boot failures are localized by the last visible stage, while loader failures are diagnosed through ELF metadata, dependency search paths, relocations, and symbol versions.',
    prediction: 'If the kernel starts but the root filesystem cannot be mounted, which boot stages have already succeeded and which userspace stage cannot begin?',
    explanation: 'C and C++ binaries use the same ELF loader, relocations, shared objects, and process startup. C++ adds generated initialization, exception/runtime support, and ABI-sensitive symbols, but the kernel does not run a separate “C++ linking process.”',
    concepts: [
      concept('Firmware', 'Platform firmware initializes enough hardware to locate and launch a boot target and provides platform information to the next stage.', 'UEFI can load a bootloader executable from an EFI system partition.'),
      concept('Bootloader', 'The bootloader selects and loads a kernel and optional initramfs, supplies a command line, and transfers control in the required machine state.', 'GRUB is one common host bootloader; embedded boards often use U-Boot or a vendor loader.'),
      concept('Kernel initialization', 'The kernel initializes architecture state, memory management, scheduler, interrupts, drivers, and filesystems before starting userspace.', 'Early console messages reveal failures before the root filesystem is available.'),
      concept('initramfs and root filesystem', 'An initramfs provides temporary early userspace for discovering devices and mounting the real root filesystem.', 'Encrypted or network roots require early userspace helpers before the switch to real root.'),
      concept('PID 1', 'The first userspace process becomes PID 1 and has special responsibility for service startup and orphan/zombie handling.', 'systemd is common, but the kernel contract does not require that particular implementation.'),
      concept('Static link', 'Static linking copies selected object code into the executable at link time, increasing self-containment but also binary size and update coupling.', 'Static does not mean every possible system facility is free from runtime dependencies.'),
      concept('Dynamic link', 'Dynamic linking records shared-object dependencies and relocations for a loader to map and resolve at startup or lazy binding time.', '`ldd`, `readelf -d`, and `LD_DEBUG=libs` expose dependency decisions.'),
      concept('C++ runtime startup', 'Before `main`, the C++ runtime initializes static objects in a defined partial order and registers destruction; cross-translation-unit ordering remains constrained.', 'A global constructor that depends on another translation unit can create a static-initialization-order bug.'),
    ],
    steps: [
      'Identify the last stage that produced observable output.',
      'Separate firmware/bootloader failure from kernel and userspace failure.',
      'For binaries, inspect ELF interpreter, needed objects, RPATH/RUNPATH, and unresolved symbols.',
      'Use the same loader tools for C and C++, then inspect C++ mangled names and runtime dependencies when relevant.',
      'Make service and global-object initialization order explicit rather than relying on incidental timing.',
    ],
    failure: 'Calling BIOS, bootloader, kernel, and init one undifferentiated “booting process” makes diagnosis impossible. Similarly, static versus dynamic linking is about artifact binding, not whether source is C or C++.',
    practice: 'Trace a normal boot and three failures: no boot target, kernel panic before root mount, and PID 1 missing. Compare `readelf -d` and `ldd` for a C and C++ executable.',
    sourcePrompts: [
      'Explain the Linux boot sequence.',
      'Explain static and dynamic linking.',
      'Compare process startup for C and C++ programs.',
      'Explain what the dynamic loader does before main.',
      'Explain what fails when the root filesystem or init process is unavailable.',
    ],
    codeExamples: [],
  },

  'qualcomm-linux-shell-tools': {
    definition: 'Unix text tools form explicit pipelines: `grep` selects matching records, `sed` transforms streams, `cut` selects delimiter-based fields, `awk` parses fields and computes, `cat` concatenates, and redirection connects commands to files.',
    application: 'Build logs, service output, inventory reports, and quick incident diagnostics are often filtered more safely with a small inspectable pipeline than with an ad hoc binary.',
    prediction: 'Why is `cut -d" " -f1,4` unreliable for the shown `ls -l` output even though the desired values look like columns?',
    explanation: 'The source explicitly asks for command-line tools, so the primary answer is shell. The same work in C would use directory, `stat`, regular-expression, and process APIs with explicit buffers and errors; C++ would add `std::filesystem`, strings, algorithms, and RAII while still calling Linux for process metadata. In shell, `ls -l` uses variable whitespace and locale-sensitive dates, while `cut` treats repeated delimiters as empty fields. `awk` collapses whitespace and is a better fit, although robust programs should avoid parsing `ls` entirely.',
    concepts: [
      concept('grep', '`grep` prints records matching a pattern and supports line numbers, counts, recursive search, fixed-string mode, inversion, and extended regular expressions.', '`grep -nF "Qualcomm" file.txt` finds literal matches with line numbers.'),
      concept('sed', '`sed` applies editing commands to a stream, commonly substituting, deleting, selecting, or rewriting lines without loading the complete file.', '`sed -E "s/[[:space:]]+/ /g"` normalizes runs of whitespace for display.'),
      concept('cut', '`cut` selects character positions or delimiter-separated fields but does not collapse repeated delimiters and does not understand shell quoting.', 'It works well for controlled tab-separated input.'),
      concept('awk', '`awk` splits records into fields, evaluates patterns, and performs actions with variables and arithmetic.', '`awk \'{print $1, $6, $7}\'` extracts permissions, month, and day from the supplied `ls -l` shape.'),
      concept('cat', '`cat` concatenates file content to standard output; it is useful for joining files but unnecessary when another command can read the file directly.', '`grep pattern file` is clearer than `cat file | grep pattern`.'),
      concept('Redirection', 'Shell redirection changes a command’s file descriptors before execution, independently of the command’s own parsing.', '`> output.txt` truncates and writes stdout; `>>` appends; `2>` redirects stderr.'),
      concept('Pipeline', 'A pipeline connects one process’s stdout to the next process’s stdin through pipes, with each stage retaining its own exit status.', 'Use `set -o pipefail` when any stage failure should fail the script.'),
      concept('Parsing ls warning', 'Human-formatted `ls` output is not a stable machine interface for arbitrary filenames, locale, or timestamps.', 'Use `find -printf` or `stat` for scripts that own the data contract.'),
    ],
    steps: [
      'Inspect the raw delimiter and filename assumptions.',
      'Choose fixed-string or regular-expression matching deliberately.',
      'Use `awk` for collapsed whitespace and computed fields.',
      'Quote every shell expansion unless intentional splitting is required.',
      'Send data and diagnostics to separate descriptors and check pipeline status.',
    ],
    failure: 'Unquoted variables, parsing arbitrary `ls`, and assuming grep’s match count equals matching-line count produce brittle scripts. `grep -c` counts matching lines, not total occurrences.',
    practice: 'Run each tool separately on the supplied `ls -l` sample, then compose a pipeline that writes permissions, link count, month, and day. Test filenames containing spaces.',
    sourcePrompts: [
      'Explain grep, sed, cut, and cat with useful options.',
      'Extract selected columns from the supplied `ls -l` output.',
      'Redirect the transformed output to a file.',
      'Explain why awk is safer than cut for variable whitespace.',
      'Explain pipeline and redirection descriptors.',
    ],
    codeExamples: [{
      heading: 'Extract the requested fields from the supplied display format',
      language: 'POSIX shell + awk',
      code: `#!/bin/sh
set -eu

input_file=\${1:?usage: extract-columns.sh LS_OUTPUT_FILE}
output_file=\${2:?usage: extract-columns.sh LS_OUTPUT_FILE OUTPUT_FILE}

awk 'NF >= 8 { print $1, $2, $6, $7 }' "$input_file" > "$output_file"`,
    }],
  },

  'qualcomm-linux-shell-programs': {
    definition: 'A reliable shell program defines its input grammar, quotes data, checks command failures, uses bounded traversal, and writes records without confusing filenames or content with shell syntax.',
    application: 'The source folder asks for practical screening scripts: extract email/URL candidates, count literal Qualcomm occurrences per line, list files, and reproduce a tree view to three levels.',
    prediction: 'If one line contains “Qualcomm Qualcomm,” why is a Boolean `grep` result insufficient for the requested output?',
    explanation: 'The prompt explicitly requests scripts, so the complete implementations remain shell. A C version would combine `getline`, regex or a parser, `opendir`/`readdir`, and checked writes; a C++ version would use streams, `std::regex` or a parser, and `std::filesystem`, while preserving the same record contract. The line matcher needs line number and occurrence count, the tree must cap depth and preserve filenames, and the extractor must admit that regular expressions identify candidates rather than prove RFC validity or reachability.',
    concepts: [
      concept('Literal line matching', 'A fixed-string search treats punctuation as ordinary data and avoids unexpected regular-expression meaning.', '`grep -F` is appropriate for the literal company name.'),
      concept('Occurrence count per line', 'Counting occurrences requires scanning all non-overlapping matches inside each line rather than only asking whether the line matched.', '`awk` can replace each literal match and increment a counter.'),
      concept('Candidate extraction', 'A practical email/URL regular expression extracts likely tokens from a controlled text source but is not a complete standards validator.', 'Deduplicate candidates with `sort -u` after extraction.'),
      concept('Bounded tree traversal', 'A tree-style listing needs an explicit root, maximum depth, deterministic order, and a policy for symbolic links and unreadable directories.', '`find -P root -mindepth 1 -maxdepth 3` avoids following directory symlinks.'),
      concept('Filename safety', 'Shell filenames may contain spaces, tabs, newlines, glob characters, and leading dashes, so line-oriented loops and unquoted expansions are unsafe for arbitrary names.', 'Prefer `find -print0` with a null-delimited reader when processing paths.'),
      concept('C implementation path', 'A C version uses `getline`, `regexec` or explicit scanning, `opendir/readdir`, and checked file descriptors while manually owning buffers.', 'The API makes every read error and allocation cleanup explicit.'),
      concept('C++ implementation path', 'A C++ version uses `std::getline`, regex or explicit scanning, `std::filesystem`, containers, and RAII streams while preserving the same grammar.', 'Exceptions or `std::error_code` must be handled for unreadable paths.'),
    ],
    steps: [
      'Write one sample input and exact expected records.',
      'Choose literal matching or a documented candidate regular expression.',
      'Quote paths and choose null-delimited traversal for arbitrary filenames.',
      'Limit depth before recursion and do not follow symlinks unless required.',
      'Write to a temporary output and replace the final file only after success when partial output is harmful.',
    ],
    failure: 'The weakest implementation uses `for file in $(find ...)`, which splits names on whitespace and glob characters. Another common miss is reporting matching lines when the prompt asks for occurrences per line.',
    practice: 'Run the scripts on empty files, repeated matches, uppercase variants, malformed candidates, spaces in filenames, unreadable directories, and a symlink cycle.',
    sourcePrompts: [
      'Extract email IDs and websites into separate files.',
      'Find “Qualcomm” line by line and print line number plus count in that line.',
      'Implement a tree-like command limited to three levels.',
      'Print all files in the current directory.',
      'Find the sum from 0 to 100 in a script without loop or condition.',
      'Explain equivalent implementation choices in C and C++.',
    ],
    codeExamples: [{
      heading: 'Count every literal occurrence per matching line',
      language: 'POSIX shell + awk',
      code: `#!/bin/sh
set -eu

input_file=\${1:?usage: qualcomm-count.sh FILE}

awk '
{
    rest = $0
    count = 0
    while ((position = index(rest, "Qualcomm")) != 0) {
        ++count
        rest = substr(rest, position + length("Qualcomm"))
    }
    if (count != 0) {
        printf "line %d: %d match(es)\\n", NR, count
    }
}
' "$input_file"`,
    }, {
      heading: 'List a directory tree to three levels without following symlinks',
      language: 'POSIX shell + find + awk',
      code: `#!/bin/sh
set -eu

root=\${1:-.}

find -P "$root" -mindepth 1 -maxdepth 3 -print |
awk -v root="$root" '
{
    relative = $0
    prefix = root "/"
    if (index(relative, prefix) == 1) {
        relative = substr(relative, length(prefix) + 1)
    }
    depth = gsub(/\//, "/", relative)
    for (i = 0; i < depth; ++i) printf "  "
    sub(/^.*\//, "", relative)
    print relative
}'`,
    }],
  },

  'qualcomm-linux-thread-matrix': {
    definition: 'A threaded matrix scan partitions cells among workers, computes thread-local top-three candidates without contention, and merges those fixed-size results after joining.',
    application: 'The same reduction design scales statistics, checksums, extrema, and sensor-frame analysis while keeping synchronization outside the hot inner loop.',
    prediction: 'Why is one mutex acquisition per matrix element slower and harder to reason about than one local reduction followed by a merge?',
    explanation: 'The C implementation uses pthread worker arguments and explicit join/error cleanup. The C++ implementation uses `std::jthread`, spans/vectors, and value-owned local results. Both need a clear duplicate policy: this lesson returns the three largest elements including equal values.',
    concepts: [
      concept('Work partition', 'Partitioning assigns disjoint index ranges to workers so each input element is processed once and no input synchronization is required.', 'Worker `t` handles `[n*t/T, n*(t+1)/T)`.'),
      concept('Thread-local reduction', 'Each worker maintains only its best three values, avoiding shared writes during the scan.', 'Insertion into a sorted three-element local array is constant work per input.'),
      concept('Join', 'Joining waits for a worker to finish and establishes that its completed result is safe for the joining thread to read.', 'Merge local results only after successful join.'),
      concept('Merge reduction', 'The parent combines at most three candidates per worker using the same top-three update rule.', 'With eight workers, the final merge examines only 24 candidates.'),
      concept('Duplicate policy', '“Highest three numbers” must clarify whether duplicate values at different cells count as separate results.', 'For `[9,9,8]`, this lesson returns 9, 9, 8.'),
      concept('C pthread ownership', 'C allocates worker state, records which threads were created, joins each, and releases all storage even after partial failure.', 'A production implementation cannot abandon already-created joinable threads.'),
      concept('C++ thread ownership', '`std::jthread` joins automatically at destruction, while value containers own local results and eliminate manual worker-allocation cleanup.', 'Explicit join can still make the result-read point obvious.'),
    ],
    steps: [
      'Flatten the matrix to a contiguous element range or carry row stride explicitly.',
      'Choose worker count no larger than the number of useful partitions.',
      'Scan disjoint ranges into thread-local top-three state.',
      'Join every worker before reading its result.',
      'Merge local candidates and define behavior when fewer than three elements exist.',
    ],
    failure: 'A mutex around every comparison serializes the scan. Returning pointers to worker stack locals or reading results before join creates lifetime or race bugs.',
    practice: 'Test fewer than three elements, all equal values, negative values, uneven partitions, one worker, and more requested workers than cells. Run ThreadSanitizer on Linux.',
    sourcePrompts: [
      'Use threads to print the highest three values in an m by n matrix.',
      'Explain the required mutex synchronization.',
      'Provide both pthread C and modern C++ thread designs.',
      'Explain process versus thread in the context of shared matrix storage.',
    ],
    codeExamples: [{
      heading: 'Reduce locally, then merge after join',
      c: `#include <limits.h>
#include <pthread.h>
#include <stddef.h>
#include <stdio.h>

struct task {
    const int *values;
    size_t begin;
    size_t end;
    int top[3];
};

static void add_top(int top[3], int value)
{
    for (int i = 0; i < 3; ++i) {
        if (value > top[i]) {
            for (int j = 2; j > i; --j) top[j] = top[j - 1];
            top[i] = value;
            break;
        }
    }
}

static void *scan(void *argument)
{
    struct task *task = argument;
    for (int i = 0; i < 3; ++i) task->top[i] = INT_MIN;
    for (size_t i = task->begin; i < task->end; ++i)
        add_top(task->top, task->values[i]);
    return NULL;
}

int main(void)
{
    const int matrix[] = {4, 12, 7, 12, -3, 9, 20, 1};
    enum { THREADS = 2 };
    pthread_t threads[THREADS];
    struct task tasks[THREADS];
    for (size_t t = 0; t < THREADS; ++t) {
        tasks[t] = (struct task){
            matrix, 8 * t / THREADS, 8 * (t + 1) / THREADS,
            {INT_MIN, INT_MIN, INT_MIN}
        };
        if (pthread_create(&threads[t], NULL, scan, &tasks[t]) != 0)
            return 1;
    }
    int answer[3] = {INT_MIN, INT_MIN, INT_MIN};
    for (size_t t = 0; t < THREADS; ++t) {
        pthread_join(threads[t], NULL);
        for (int i = 0; i < 3; ++i) add_top(answer, tasks[t].top[i]);
    }
    printf("%d %d %d\\n", answer[0], answer[1], answer[2]);
    return 0;
}`,
      cpp: `#include <algorithm>
#include <array>
#include <climits>
#include <iostream>
#include <span>
#include <thread>
#include <vector>

void add_top(std::array<int, 3>& top, int value)
{
    if (value > top[0]) {
        top[2] = top[1]; top[1] = top[0]; top[0] = value;
    } else if (value > top[1]) {
        top[2] = top[1]; top[1] = value;
    } else if (value > top[2]) {
        top[2] = value;
    }
}

int main()
{
    const std::vector values{4, 12, 7, 12, -3, 9, 20, 1};
    constexpr std::size_t thread_count = 2;
    std::array<std::array<int, 3>, thread_count> local{};
    for (auto& top : local) top.fill(INT_MIN);

    std::vector<std::jthread> workers;
    for (std::size_t t = 0; t < thread_count; ++t) {
        workers.emplace_back([&, t] {
            const auto begin = values.size() * t / thread_count;
            const auto end = values.size() * (t + 1) / thread_count;
            for (auto value : std::span(values).subspan(begin, end - begin))
                add_top(local[t], value);
        });
    }
    for (auto& worker : workers) worker.join();

    std::array<int, 3> answer{INT_MIN, INT_MIN, INT_MIN};
    for (const auto& top : local)
        for (int value : top) add_top(answer, value);
    std::cout << answer[0] << ' ' << answer[1] << ' ' << answer[2] << '\\n';
}`,
    }],
  },

  'qualcomm-linux-unix-families': {
    definition: 'BSD and System V are influential Unix lineages whose historical APIs, commands, startup systems, signals, IPC, and descendants differ; modern Linux combines ideas and compatibility interfaces from both rather than belonging cleanly to either.',
    application: 'The distinction matters when reading legacy code, porting scripts, choosing IPC APIs, or diagnosing platform-specific command options.',
    prediction: 'If Linux supports both POSIX message queues and System V message queues, why is “Linux is System V” still an inaccurate conclusion?',
    explanation: 'C headers expose these historical and POSIX interfaces directly; C++ programs call the same system APIs and normally add typed ownership and error wrappers rather than gaining a different Unix contract. Answer historically and concretely: System V contributed APIs such as `msgget`, `semget`, and `shmget`; BSD contributed sockets, the `vi`/`csh` ecosystem, and networking work. POSIX later standardized common interfaces, and current systems mix heritage with independent evolution.',
    concepts: [
      concept('System V lineage', 'AT&T System V developed one major commercial Unix lineage and associated IPC, init, command, and ABI conventions.', 'System V IPC uses numeric identifiers and APIs such as `shmget` and `semget`.'),
      concept('BSD lineage', 'Berkeley Software Distribution developed another Unix lineage with major networking, virtual-memory, tools, and socket contributions.', 'The sockets API originated in BSD and became broadly adopted.'),
      concept('POSIX', 'POSIX standardizes portable operating-system interfaces across Unix-like systems without making every implementation behavior identical.', 'Use POSIX pthreads and file APIs for a portable baseline, then isolate extensions.'),
      concept('Linux relationship', 'Linux is an independently developed kernel with GNU and other userspace components that implements POSIX-like behavior and supports interfaces influenced by both lineages.', 'Linux offers sockets, System V IPC, POSIX IPC, and systemd on many distributions.'),
      concept('Portability check', 'A practical comparison names the exact API, command option, filesystem behavior, or startup mechanism rather than relying on family labels.', 'GNU `grep` options may not all exist on a BSD userland.'),
    ],
    steps: [
      'Identify whether the question concerns history, kernel API, userland command, init, or IPC.',
      'Name one concrete System V contribution and one BSD contribution.',
      'Explain the POSIX portability layer.',
      'Describe Linux as a mixed modern system, not a direct synonym for one lineage.',
      'Test exact APIs and command options on the target platform.',
    ],
    failure: 'A memorized two-column table often repeats outdated absolutes. Modern macOS, BSDs, Linux distributions, and commercial Unix systems must be compared by the exact interface in question.',
    practice: 'Compare sockets, System V IPC, POSIX IPC, init/service management, and grep/sed options across Linux and one BSD system using manual pages.',
    sourcePrompts: [
      'Explain the difference between BSD and System V Unix.',
      'Relate System V IPC and BSD sockets to modern Linux.',
      'Explain what POSIX standardizes.',
      'Avoid treating Linux as purely one historical lineage.',
    ],
    codeExamples: [],
  },
};
