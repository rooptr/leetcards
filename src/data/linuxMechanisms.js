const sharedPractice = 'Compile with gcc -std=c17 -Wall -Wextra -Wpedantic, run under strace, and compare each return value with the kernel-visible state in /proc.';

const spec = ({
  summary,
  prediction,
  steps,
  failure,
  code,
  practice = sharedPractice,
  visual,
}) => ({
  summary,
  prediction,
  steps,
  failure,
  code,
  practice,
  visual: visual ?? steps.map((step, index) => [`T${index}: ${step}`]),
});

export const linuxMechanismSpecs = {
  'os-syscall-contract': spec({
    summary: 'A libc wrapper translates a C or C++ call into the architecture syscall convention, while correct callers handle errors, partial I/O, short work, and EINTR rather than assuming one call completes the request.',
    prediction: 'If write(fd, buffer, 4096) returns 700 without errno, did it fail?',
    steps: ['Place the syscall number and arguments according to the ABI.', 'Enter kernel mode and validate the user arguments.', 'Perform as much work as current object state permits.', 'Return a nonnegative result or a negative kernel error translated to -1 and errno by libc.'],
    failure: 'Treating a short result as success loses bytes. Retrying every EINTR blindly can violate timeout or cancellation rules.',
    code: `#include <errno.h>
#include <stddef.h>
#include <unistd.h>

int write_all(int fd, const void *data, size_t size) {
  const char *cursor = data;
  while (size > 0) {
    ssize_t written = write(fd, cursor, size);
    if (written > 0) { cursor += written; size -= (size_t)written; continue; }
    if (written < 0 && errno == EINTR) continue;
    return -1;
  }
  return 0;
}`,
  }),
  'os-file-io': spec({
    summary: 'Linux file I/O moves bytes through descriptors and a shared open-file description whose offset, flags, and underlying inode state survive across duplicated descriptors.',
    prediction: 'Can a successful read legally return fewer bytes than requested before end of file?',
    steps: ['Open a path and obtain the lowest available descriptor.', 'Read or write in a loop, preserving partial progress.', 'Inspect metadata with fstat when identity matters.', 'Close every owned descriptor on success and every failure path.'],
    failure: 'Assuming one read fills a buffer, overwriting the original errno during cleanup, or leaking a descriptor in a child changes later program behavior.',
    code: `#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <unistd.h>

int main(int argc, char **argv) {
  if (argc != 2) return 2;
  int fd = open(argv[1], O_RDONLY);
  if (fd < 0) { perror("open"); return 1; }
  char buffer[4096];
  for (;;) {
    ssize_t n = read(fd, buffer, sizeof buffer);
    if (n > 0) { if (write(STDOUT_FILENO, buffer, (size_t)n) != n) return 1; continue; }
    if (n == 0) break;
    if (errno == EINTR) continue;
    perror("read"); close(fd); return 1;
  }
  return close(fd) == 0 ? 0 : 1;
}`,
  }),
  'os-fd-dup': spec({
    summary: 'dup-family calls create another descriptor-table entry for the same open-file description, so offsets and status flags are shared while close-on-exec remains descriptor-local.',
    prediction: 'After dup(fd), what offset does the new descriptor observe after the original reads ten bytes?',
    steps: ['Resolve the source descriptor to its open-file description.', 'Install another descriptor-table reference to that same object.', 'Use dup2 or dup3 to atomically replace a chosen destination number.', 'Close unused copies so EOF and process lifetime behave as intended.'],
    failure: 'Closing only one pipe copy does not produce EOF if another process still owns a write end. close plus dup is racy where dup2 is atomic.',
    code: `#define _POSIX_C_SOURCE 200809L
#include <fcntl.h>
#include <stdio.h>
#include <unistd.h>

int main(void) {
  int fd = open("dup-output.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
  if (fd < 0) { perror("open"); return 1; }
  if (dup2(fd, STDOUT_FILENO) < 0) { perror("dup2"); close(fd); return 1; }
  close(fd);
  puts("stdout now reaches the file");
  return 0;
}`,
  }),
  'os-fcntl': spec({
    summary: 'fcntl reads and changes descriptor flags, open-file status flags, duplication behavior, and advisory locks; ioctl handles device-specific operations that do not fit the ordinary byte-stream interface.',
    prediction: 'Does setting FD_CLOEXEC on one duplicated descriptor set it on every duplicate?',
    steps: ['Distinguish descriptor-local flags from open-file-description status flags.', 'Read the current flags before changing selected bits.', 'Treat advisory locks as a cooperating-process protocol.', 'Use ioctl only with a documented device request and argument type.'],
    failure: 'Replacing rather than preserving existing status bits can silently clear access behavior. Advisory locks do not stop noncooperating writers.',
    code: `#include <fcntl.h>
#include <stdio.h>

int main(void) {
  int flags = fcntl(0, F_GETFL);
  if (flags < 0) { perror("F_GETFL"); return 1; }
  if (fcntl(0, F_SETFL, flags | O_NONBLOCK) < 0) { perror("F_SETFL"); return 1; }
  int fdflags = fcntl(0, F_GETFD);
  if (fdflags < 0 || fcntl(0, F_SETFD, fdflags | FD_CLOEXEC) < 0) return 1;
  return 0;
}`,
  }),
  'os-process-create': spec({
    summary: 'fork creates a child task with copied process metadata, copy-on-write memory mappings, and descriptor inheritance through new table references to the same open-file descriptions.',
    prediction: 'Immediately after fork, which bytes are physically copied and which kernel objects are only reference-counted?',
    steps: ['Validate limits and allocate a new task identity.', 'Duplicate process metadata and page-table structure.', 'Mark writable private mappings copy-on-write rather than copying every page.', 'Return the child PID to the parent and zero to the child.'],
    failure: 'Both branches continue from the same instruction. Unflushed stdio buffers can print twice, and calling exit in a failed post-fork child can flush inherited buffers again.',
    code: `#define _POSIX_C_SOURCE 200809L
#include <stdio.h>
#include <sys/wait.h>
#include <unistd.h>

int main(void) {
  fflush(NULL);
  pid_t pid = fork();
  if (pid < 0) { perror("fork"); return 1; }
  if (pid == 0) { dprintf(STDOUT_FILENO, "child pid=%ld\\n", (long)getpid()); _exit(0); }
  int status = 0;
  if (waitpid(pid, &status, 0) < 0) { perror("waitpid"); return 1; }
  return WIFEXITED(status) ? WEXITSTATUS(status) : 1;
}`,
    practice: `${sharedPractice} Then write one byte in the child and observe minor page faults to expose copy-on-write.`,
  }),
  'os-exec': spec({
    summary: 'execve replaces the calling process image with a new program while preserving the PID and selected process attributes, including descriptors not marked close-on-exec.',
    prediction: 'After a successful exec, where does control return in the old program?',
    steps: ['Resolve and authorize the executable.', 'Construct new mappings, stack, argv, environment, and entry state.', 'Close descriptors carrying FD_CLOEXEC and reset specified attributes.', 'Commit the new image and begin at its entry point; success never returns.'],
    failure: 'Code after a successful exec is unreachable. Leaked descriptors cross the boundary unless close-on-exec was deliberately set.',
    code: `#define _POSIX_C_SOURCE 200809L
#include <stdio.h>
#include <unistd.h>

extern char **environ;
int main(void) {
  char *const argv[] = { "printf", "exec replaced this process\\n", NULL };
  execve("/usr/bin/printf", argv, environ);
  perror("execve");
  return 127;
}`,
  }),
  'os-exit': spec({
    summary: 'exit performs C-library termination such as atexit handlers and stdio flushing, while _exit enters kernel process termination directly, ends the thread group, releases references, stores status, and notifies the parent.',
    prediction: 'Why should a child that cannot exec normally call _exit rather than exit?',
    steps: ['Choose library exit or direct process exit based on context.', 'End sibling threads and release memory, descriptors, and kernel references.', 'Retain only the small exit record required by the parent.', 'Notify the parent with SIGCHLD and become waitable.'],
    failure: 'Using exit after fork can flush inherited buffered output twice. Using _exit in a normal single-process path skips intended atexit cleanup.',
    code: `#include <stdio.h>
#include <stdlib.h>
#include <sys/wait.h>
#include <unistd.h>

static void goodbye(void) { fputs("parent cleanup\\n", stderr); }
int main(void) {
  if (atexit(goodbye) != 0) return 1;
  pid_t pid = fork();
  if (pid < 0) return 1;
  if (pid == 0) _exit(23);
  int status = 0;
  if (waitpid(pid, &status, 0) < 0) return 1;
  return WIFEXITED(status) && WEXITSTATUS(status) == 23 ? 0 : 1;
}`,
  }),
  'os-wait': spec({
    summary: 'wait and waitpid consume a child’s retained exit record, return its identity, encode termination status, and finally release the zombie task slot.',
    prediction: 'What does waitpid return when WNOHANG is used and matching children exist but none has exited?',
    steps: ['Select eligible child processes from the caller’s child set.', 'Return immediately, block, or report no state change according to options.', 'Copy the encoded exit or signal status to user space.', 'Reap the selected zombie so the same status cannot be collected twice.'],
    failure: 'Testing WEXITSTATUS without first testing WIFEXITED is invalid. One SIGCHLD can represent several exited children, so reaping must loop.',
    code: `#include <errno.h>
#include <stdio.h>
#include <sys/wait.h>

int main(void) {
  int status = 0;
  pid_t pid;
  do { pid = waitpid(-1, &status, 0); } while (pid < 0 && errno == EINTR);
  if (pid < 0) { perror("waitpid"); return 1; }
  if (WIFEXITED(status)) printf("pid=%ld exit=%d\\n", (long)pid, WEXITSTATUS(status));
  else if (WIFSIGNALED(status)) printf("pid=%ld signal=%d\\n", (long)pid, WTERMSIG(status));
  return 0;
}`,
  }),
  'os-zombie-orphan': spec({
    summary: 'An orphan is a living child whose parent exits and whose parent relationship is reassigned; a zombie is a terminated child whose status remains until a parent or subreaper waits.',
    prediction: 'Can a zombie later become a living orphan?',
    steps: ['A living child observes its original parent PID.', 'The parent exits, so the living child is adopted by an eligible reaper.', 'A child that exits first retains only status and accounting as a zombie.', 'wait consumes that status; parent exit can transfer reaping responsibility but never revive the child.'],
    failure: 'Calling every un-waited child an orphan confuses lifetime with parentage. Ignoring SIGCHLD without a deliberate policy can make status unavailable.',
    code: `#define _POSIX_C_SOURCE 200809L
#include <stdio.h>
#include <sys/wait.h>
#include <unistd.h>

int main(void) {
  pid_t pid = fork();
  if (pid < 0) return 1;
  if (pid == 0) {
    pid_t before = getppid();
    sleep(1);
    dprintf(STDOUT_FILENO, "orphan demo: ppid %ld -> %ld\\n", (long)before, (long)getppid());
    _exit(0);
  }
  dprintf(STDOUT_FILENO, "parent exits; child remains alive\\n");
  return 0;
}`,
    practice: 'Run the orphan example, then separately create an exiting child while the parent sleeps and inspect its Z state with ps before waitpid reaps it.',
  }),
  'os-pipes': spec({
    summary: 'A pipe is a kernel byte-stream buffer with separate read and write references; EOF appears only after every write reference is closed and buffered bytes are drained.',
    prediction: 'Why can a reader block forever after the intended writer exits?',
    steps: ['Create both pipe descriptors before fork.', 'Close every unused end in every process.', 'Use dup2 when the pipe becomes stdin or stdout for exec.', 'Read until zero for EOF and wait for all children.'],
    failure: 'One forgotten write descriptor suppresses EOF. Writes larger than PIPE_BUF can interleave with other writers.',
    code: `#include <stdio.h>
#include <sys/wait.h>
#include <unistd.h>

int main(void) {
  int ends[2];
  if (pipe(ends) < 0) return 1;
  pid_t pid = fork();
  if (pid < 0) return 1;
  if (pid == 0) { close(ends[0]); write(ends[1], "hello\\n", 6); close(ends[1]); _exit(0); }
  close(ends[1]);
  char buffer[32];
  ssize_t n = read(ends[0], buffer, sizeof buffer);
  if (n > 0) write(STDOUT_FILENO, buffer, (size_t)n);
  close(ends[0]); waitpid(pid, NULL, 0);
  return 0;
}`,
  }),
  'os-shm': spec({
    summary: 'POSIX shared memory creates a named kernel object that processes size and map into their address spaces; visibility is shared, but ordering and mutual exclusion still require synchronization.',
    prediction: 'If two processes map the same object, does that alone prevent them from overwriting each other?',
    steps: ['Create or open the shared-memory object.', 'Set its size before mapping.', 'Map with MAP_SHARED and establish ownership and synchronization.', 'Unmap, close descriptors, and unlink the name under a clear lifecycle policy.'],
    failure: 'Mapping before sizing can fault. Shared bytes without a semaphore, mutex, or atomic protocol still contain races.',
    code: `#define _POSIX_C_SOURCE 200809L
#include <fcntl.h>
#include <stdio.h>
#include <sys/mman.h>
#include <unistd.h>

int main(void) {
  int fd = shm_open("/leetcards-demo", O_CREAT | O_RDWR, 0600);
  if (fd < 0 || ftruncate(fd, 4096) < 0) return 1;
  char *shared = mmap(NULL, 4096, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
  if (shared == MAP_FAILED) return 1;
  snprintf(shared, 4096, "pid=%ld", (long)getpid());
  puts(shared);
  munmap(shared, 4096); close(fd); shm_unlink("/leetcards-demo");
  return 0;
}`,
  }),
  'os-pthreads': spec({
    summary: 'pthread_create adds another execution context sharing process memory and descriptors but owning its own stack, registers, cancellation state, and thread-local storage.',
    prediction: 'Which lifetime must outlast pthread_create: the pointer argument, the pointed object, or both?',
    steps: ['Prepare argument storage with a lifetime covering the worker.', 'Create the thread and check the pthread error number directly.', 'Join or detach exactly once under a documented ownership policy.', 'Merge results only after synchronization establishes visibility.'],
    failure: 'Passing the address of a loop variable races with later iterations. Returning a pointer to worker-stack storage creates a dangling result.',
    code: `#include <pthread.h>
#include <stdint.h>
#include <stdio.h>

static void *square(void *arg) {
  intptr_t value = (intptr_t)arg;
  return (void *)(value * value);
}
int main(void) {
  pthread_t thread;
  if (pthread_create(&thread, NULL, square, (void *)(intptr_t)12) != 0) return 1;
  void *result = NULL;
  if (pthread_join(thread, &result) != 0) return 1;
  printf("%ld\\n", (long)(intptr_t)result);
  return 0;
}`,
  }),
  'os-mutex': spec({
    summary: 'A pthread mutex protects a shared invariant: the uncontended path uses atomic user-space state, while contention may park and wake threads through Linux futex operations.',
    prediction: 'Does a successful mutex lock protect only the next assignment or every field in the invariant until unlock?',
    steps: ['Attempt an atomic fast-path transition from unlocked to owned.', 'On contention, record waiter state and enter a futex wait only if the value still matches.', 'The owner updates the complete invariant while memory is exclusively held.', 'Unlock publishes writes and wakes a waiter when required.'],
    failure: 'Unlocking from the wrong ownership context, copying a mutex object, or waiting on a condition without a predicate loop breaks the contract.',
    code: `#include <pthread.h>
#include <stdio.h>

static pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;
static long total;
static void *add(void *unused) {
  (void)unused;
  for (int i = 0; i < 100000; ++i) {
    pthread_mutex_lock(&lock);
    ++total;
    pthread_mutex_unlock(&lock);
  }
  return NULL;
}
int main(void) {
  pthread_t a, b;
  if (pthread_create(&a, NULL, add, NULL) || pthread_create(&b, NULL, add, NULL)) return 1;
  if (pthread_join(a, NULL) || pthread_join(b, NULL)) return 1;
  printf("%ld\\n", total);
  return total == 200000 ? 0 : 1;
}`,
    practice: 'Compile with -pthread, run under strace -f -e futex, and compare uncontended and deliberately contended executions.',
  }),
  'os-semaphores': spec({
    summary: 'A semaphore represents a count of available events or units; sem_wait consumes one or blocks, sem_post returns one and wakes a waiter when necessary.',
    prediction: 'Can a binary semaphore identify which thread owns the protected resource?',
    steps: ['Attempt to decrement a positive count atomically.', 'When no unit is available, join the wait set without losing a concurrent post.', 'sem_post increments the count and wakes an eligible waiter.', 'Named semaphores additionally require a name lifetime and sem_unlink policy.'],
    failure: 'A semaphore is not an ownership-tracking mutex. Destroying process-shared state while another process waits is undefined.',
    code: `#define _POSIX_C_SOURCE 200809L
#include <pthread.h>
#include <semaphore.h>
#include <stdio.h>

static sem_t ready;
static int payload;
static void *producer(void *unused) {
  (void)unused; payload = 42; sem_post(&ready); return NULL;
}
int main(void) {
  if (sem_init(&ready, 0, 0) < 0) return 1;
  pthread_t thread;
  if (pthread_create(&thread, NULL, producer, NULL) != 0) return 1;
  while (sem_wait(&ready) < 0) {}
  printf("%d\\n", payload);
  pthread_join(thread, NULL); sem_destroy(&ready);
  return payload == 42 ? 0 : 1;
}`,
    practice: 'Compile with -pthread, trace futex activity, then contrast event counting with mutex ownership and condition predicates.',
  }),
  'os-linux-sockets': spec({
    summary: 'Socket programs manage endpoint lifecycle, message framing, partial stream I/O, datagram boundaries, timeouts, shutdown, and peer failure explicitly.',
    prediction: 'Does one TCP send correspond to one recv at the peer?',
    steps: ['Create a socket and bind or connect the chosen address.', 'For TCP, define framing over the byte stream and loop partial I/O.', 'For UDP, preserve datagram boundaries and add IDs or timeouts where needed.', 'Close or shutdown under an explicit application protocol.'],
    failure: 'TCP preserves bytes but not application messages. UDP can lose, duplicate, reorder, or truncate datagrams.',
    code: `#include <arpa/inet.h>
#include <stdio.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

int main(void) {
  int fd = socket(AF_INET, SOCK_DGRAM, 0);
  if (fd < 0) return 1;
  struct sockaddr_in peer = { .sin_family = AF_INET, .sin_port = htons(9000) };
  if (inet_pton(AF_INET, "127.0.0.1", &peer.sin_addr) != 1) return 1;
  const char message[] = "PING";
  ssize_t sent = sendto(fd, message, sizeof message, 0, (void *)&peer, sizeof peer);
  close(fd);
  return sent == (ssize_t)sizeof message ? 0 : 1;
}`,
  }),
  'os-signals': spec({
    summary: 'Signals combine disposition, per-thread masks changed with sigprocmask or pthread_sigmask, process pending state, delivery selection, and a saved user context; handlers must do minimal async-signal-safe work.',
    prediction: 'If three identical standard signals arrive while blocked, must the handler run three times after unblocking?',
    steps: ['Install a disposition with sigaction before enabling the source.', 'Block signals while modifying state that delivery observes.', 'The kernel marks a signal pending and chooses an eligible thread for delivery.', 'Exception return restores the saved context after the handler or default action.'],
    failure: 'Standard signals may coalesce. printf, malloc, and most library calls are unsafe in a handler; use a flag, self-pipe, or eventfd handoff.',
    code: `#define _POSIX_C_SOURCE 200809L
#include <signal.h>
#include <unistd.h>

static volatile sig_atomic_t seen;
static void handle(int signal_number) { seen = signal_number; }
int main(void) {
  struct sigaction action = { .sa_handler = handle };
  sigemptyset(&action.sa_mask);
  if (sigaction(SIGALRM, &action, NULL) < 0) return 1;
  alarm(1);
  while (!seen) pause();
  return seen == SIGALRM ? 0 : 1;
}`,
  }),
};
