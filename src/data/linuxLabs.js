const baseFlags = ['-std=c17', '-Wall', '-Wextra', '-Wpedantic'];

const defineLab = ({ pthread = false, ...spec }) => {
  const buildFlags = pthread ? [...baseFlags, '-pthread'] : [...baseFlags];
  const binary = spec.id.toLowerCase();
  return Object.freeze({
    ...spec,
    buildFlags: Object.freeze(buildFlags),
    buildCommand: `gcc ${buildFlags.join(' ')} ${binary}.c -o ${binary}`,
  });
};

const labSpecs = [
  {
    id: 'A01',
    title: 'Copy a file while preserving mode and timestamps',
    mechanism: 'The copy loop owns two descriptors, retries interrupted reads and writes every short write. With -p it applies the source permission bits and atime/mtime after data transfer. An unprivileged process cannot generally preserve another owner or group, so this lab promises mode and timestamps and reports that ownership boundary explicitly.',
    stateDiagram: 'source inode -> read buffer -> destination open file description; after EOF: fchmod -> futimens -> close',
    source: `#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <unistd.h>

static void fail(const char *what) {
    perror(what);
    exit(EXIT_FAILURE);
}

static void write_all(int fd, const unsigned char *buf, size_t count) {
    size_t done = 0;
    while (done < count) {
        ssize_t n = write(fd, buf + done, count - done);
        if (n > 0) {
            done += (size_t)n;
        } else if (n < 0 && errno == EINTR) {
            continue;
        } else {
            fail("write");
        }
    }
}

int main(int argc, char **argv) {
    int preserve = 0;
    int arg = 1;
    if (argc > 1 && strcmp(argv[1], "-p") == 0) {
        preserve = 1;
        arg++;
    }
    if (argc - arg != 2) {
        fprintf(stderr, "usage: %s [-p] SOURCE DEST\\n", argv[0]);
        return EXIT_FAILURE;
    }

    int in = open(argv[arg], O_RDONLY);
    if (in < 0) fail("open source");
    struct stat st;
    if (fstat(in, &st) < 0) fail("fstat");
    if (!S_ISREG(st.st_mode)) {
        fprintf(stderr, "source must be a regular file\\n");
        return EXIT_FAILURE;
    }

    int out = open(argv[arg + 1], O_WRONLY | O_CREAT | O_TRUNC, st.st_mode & 0777);
    if (out < 0) fail("open destination");
    unsigned char buffer[16384];
    for (;;) {
        ssize_t n = read(in, buffer, sizeof buffer);
        if (n > 0) write_all(out, buffer, (size_t)n);
        else if (n == 0) break;
        else if (errno != EINTR) fail("read");
    }

    if (preserve) {
        if (fchmod(out, st.st_mode & 07777) < 0) fail("fchmod");
        struct timespec times[2] = { st.st_atim, st.st_mtim };
        if (futimens(out, times) < 0) fail("futimens");
    }
    if (close(in) < 0) fail("close source");
    if (close(out) < 0) fail("close destination");
    if (preserve) {
        printf("data, mode, and timestamps preserved; ownership was not changed\\n");
    }
    return EXIT_SUCCESS;
}`,
    runCommand: "printf 'alpha beta\\n' > input.txt; touch -t 202401020304 input.txt; chmod 0640 input.txt; ./a01 -p input.txt output.txt",
    expectedEvidence: 'cmp reports identical bytes, stat reports mode 640 and the same mtime, and the program states that ownership was not changed.',
    failureAnalysis: 'A read can be interrupted and a write can be short. Creating the destination before validating the source can destroy data. fchmod or futimens can fail on an unsupported filesystem. Preserving a source UID/GID requires suitable ownership and privilege; silently claiming full cp -p semantics would be false.',
    verification: "cmp input.txt output.txt && test \"$(stat -c %a input.txt)\" = \"$(stat -c %a output.txt)\" && test \"$(stat -c %Y input.txt)\" = \"$(stat -c %Y output.txt)\"",
  },
  {
    id: 'A02',
    title: 'Stream wc line, word, and byte counts',
    mechanism: 'A fixed buffer streams any input size. Byte count advances by read results, line count by newline bytes, and word count only on a whitespace-to-nonwhitespace transition that survives chunk boundaries. isspace receives an unsigned char; the result is byte-oriented and does not implement locale-aware multibyte character counting.',
    stateDiagram: 'read chunk -> for each byte update bytes/newlines/in_word -> EOF flushes final word state -> print selected counters',
    source: `#define _POSIX_C_SOURCE 200809L
#include <ctype.h>
#include <errno.h>
#include <fcntl.h>
#include <inttypes.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

int main(int argc, char **argv) {
    int show_l = 0, show_w = 0, show_c = 0, arg = 1;
    while (arg < argc && argv[arg][0] == '-') {
        for (size_t i = 1; argv[arg][i] != '\\0'; i++) {
            if (argv[arg][i] == 'l') show_l = 1;
            else if (argv[arg][i] == 'w') show_w = 1;
            else if (argv[arg][i] == 'c') show_c = 1;
            else {
                fprintf(stderr, "unknown option: -%c\\n", argv[arg][i]);
                return EXIT_FAILURE;
            }
        }
        arg++;
    }
    if (!show_l && !show_w && !show_c) show_l = show_w = show_c = 1;
    if (argc - arg > 1) {
        fprintf(stderr, "usage: %s [-lwc] [FILE]\\n", argv[0]);
        return EXIT_FAILURE;
    }

    int fd = STDIN_FILENO;
    if (arg < argc && (fd = open(argv[arg], O_RDONLY)) < 0) {
        perror("open");
        return EXIT_FAILURE;
    }
    uintmax_t lines = 0, words = 0, bytes = 0;
    int in_word = 0;
    unsigned char buffer[8192];
    for (;;) {
        ssize_t n = read(fd, buffer, sizeof buffer);
        if (n < 0 && errno == EINTR) continue;
        if (n < 0) {
            perror("read");
            return EXIT_FAILURE;
        }
        if (n == 0) break;
        bytes += (uintmax_t)n;
        for (ssize_t i = 0; i < n; i++) {
            if (buffer[i] == '\\n') lines++;
            int space = isspace(buffer[i]);
            if (!space && !in_word) words++;
            in_word = !space;
        }
    }
    if (fd != STDIN_FILENO && close(fd) < 0) {
        perror("close");
        return EXIT_FAILURE;
    }
    if (show_l) printf("%" PRIuMAX "%c", lines, show_w || show_c ? ' ' : '\\n');
    if (show_w) printf("%" PRIuMAX "%c", words, show_c ? ' ' : '\\n');
    if (show_c) printf("%" PRIuMAX "\\n", bytes);
    return EXIT_SUCCESS;
}`,
    runCommand: "printf 'one two\\nthree\\n' | ./a02 -lwc",
    expectedEvidence: 'The single output line is 2 3 14: two newline bytes, three whitespace-delimited byte words, and fourteen bytes.',
    failureAnalysis: 'Resetting in_word for each read overcounts a word split at a buffer boundary. Passing a negative signed char to isspace is undefined. This implementation counts bytes, not Unicode characters or display columns, and reports read errors instead of treating them as EOF.',
    verification: "test \"$(printf 'one two\\nthree\\n' | ./a02 -lwc)\" = '2 3 14'",
  },
  {
    id: 'A03',
    title: 'Duplicate descriptors and redirect standard output',
    mechanism: 'dup creates a new descriptor that refers to the same open file description, so both descriptors share one current offset and status flags. dup2 atomically replaces the target descriptor, making later writes to standard output reach the selected file while a saved duplicate restores the terminal.',
    stateDiagram: 'fd 3 --+-> one open file description(offset); dup fd 4 --+; dup2(fd, STDOUT) redirects descriptor 1',
    source: `#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

static void fail(const char *what) {
    perror(what);
    exit(EXIT_FAILURE);
}

int main(void) {
    char path[] = "/tmp/leetcards-a03-XXXXXX";
    int fd = mkstemp(path);
    if (fd < 0) fail("mkstemp");
    if (unlink(path) < 0) fail("unlink");
    if (write(fd, "abcdef", 6) != 6) fail("write seed");
    if (lseek(fd, 0, SEEK_SET) < 0) fail("lseek");

    int twin = dup(fd);
    if (twin < 0) fail("dup");
    char first[3] = {0}, second[3] = {0};
    if (read(fd, first, 2) != 2) fail("read first");
    if (read(twin, second, 2) != 2) fail("read second");
    printf("shared offset: %s then %s\\n", first, second);

    int saved_stdout = dup(STDOUT_FILENO);
    if (saved_stdout < 0) fail("save stdout");
    if (ftruncate(fd, 0) < 0 || lseek(fd, 0, SEEK_SET) < 0) fail("reset file");
    if (dup2(fd, STDOUT_FILENO) < 0) fail("dup2");
    if (dprintf(STDOUT_FILENO, "redirected\\n") < 0) fail("redirected write");
    if (dup2(saved_stdout, STDOUT_FILENO) < 0) fail("restore stdout");
    if (close(saved_stdout) < 0 || close(twin) < 0) fail("close duplicate");

    if (lseek(fd, 0, SEEK_SET) < 0) fail("rewind");
    char redirected[32] = {0};
    ssize_t n = read(fd, redirected, sizeof redirected - 1);
    if (n < 0) fail("read redirected");
    printf("file contains: %s", redirected);
    if (close(fd) < 0) fail("close");
    return EXIT_SUCCESS;
}`,
    runCommand: './a03',
    expectedEvidence: 'The terminal prints shared offset: ab then cd, proving the offset is shared, followed by file contains: redirected after standard output is restored.',
    failureAnalysis: 'Two independent open calls would have independent offsets. close followed by dup is racy in multithreaded code, whereas dup2 performs replacement atomically. Buffered stdio must be flushed before descriptor surgery; this lab uses dprintf for the redirected write.',
    verification: "./a03 | grep -Fx 'shared offset: ab then cd' && ./a03 | grep -Fx 'file contains: redirected'",
  },
  {
    id: 'A04',
    title: 'Control descriptor flags, status flags, locks, and device requests',
    mechanism: 'F_GETFD/F_SETFD control per-descriptor close-on-exec state, while F_GETFL/F_SETFL control status flags on the shared open file description. F_SETLK installs an advisory byte-range lock. FIONREAD is a justified ioctl on a pipe because it asks that kernel object for currently readable bytes, a query not represented by ordinary stream reads.',
    stateDiagram: 'descriptor flags(FD_CLOEXEC) -> open-file status(O_APPEND) -> inode advisory lock; pipe read end -> ioctl(FIONREAD) -> queued byte count',
    source: `#define _POSIX_C_SOURCE 200809L
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/ioctl.h>
#include <unistd.h>

static void fail(const char *what) {
    perror(what);
    exit(EXIT_FAILURE);
}

int main(void) {
    char path[] = "/tmp/leetcards-a04-XXXXXX";
    int fd = mkstemp(path);
    if (fd < 0) fail("mkstemp");
    if (unlink(path) < 0) fail("unlink");

    int descriptor_flags = fcntl(fd, F_GETFD);
    if (descriptor_flags < 0) fail("F_GETFD");
    if (fcntl(fd, F_SETFD, descriptor_flags | FD_CLOEXEC) < 0) fail("F_SETFD");
    int status_flags = fcntl(fd, F_GETFL);
    if (status_flags < 0) fail("F_GETFL");
    if (fcntl(fd, F_SETFL, status_flags | O_APPEND) < 0) fail("F_SETFL");

    struct flock lock = {
        .l_type = F_WRLCK, .l_whence = SEEK_SET, .l_start = 0, .l_len = 1, .l_pid = 0
    };
    if (fcntl(fd, F_SETLK, &lock) < 0) fail("F_SETLK");

    int channel[2];
    if (pipe(channel) < 0) fail("pipe");
    if (write(channel[1], "hello", 5) != 5) fail("pipe write");
    int queued = 0;
    if (ioctl(channel[0], FIONREAD, &queued) < 0) fail("FIONREAD");

    printf("cloexec=%d append=%d lock=write queued=%d\\n",
           (fcntl(fd, F_GETFD) & FD_CLOEXEC) != 0,
           (fcntl(fd, F_GETFL) & O_APPEND) != 0,
           queued);
    lock.l_type = F_UNLCK;
    if (fcntl(fd, F_SETLK, &lock) < 0) fail("unlock");
    if (close(channel[0]) < 0 || close(channel[1]) < 0 || close(fd) < 0) fail("close");
    return EXIT_SUCCESS;
}`,
    runCommand: './a04',
    expectedEvidence: 'The output is cloexec=1 append=1 lock=write queued=5, separating descriptor state, open-file-description state, inode lock state, and pipe queue state.',
    failureAnalysis: 'Treating FD_CLOEXEC as an open-file status flag confuses descriptor-local and shared state. Advisory locks only coordinate cooperating processes and may be converted or released by later operations. ioctl requests are object-specific; FIONREAD is not a portable substitute for protocol framing.',
    verification: "test \"$(./a04)\" = 'cloexec=1 append=1 lock=write queued=5'",
  },
  {
    id: 'A05',
    title: 'Observe orphan adoption separately from zombie reaping',
    mechanism: 'An orphan is a living child whose parent exits; Linux reparents it to the nearest child subreaper or PID 1, and it continues running. A zombie is already terminated: the kernel retains its PID and exit status until its parent calls wait or exits. This program makes itself a subreaper for deterministic adoption, observes the orphan in /proc, then separately observes a Z-state child and reaps status 42.',
    stateDiagram: 'adoption: root(subreaper) <- middle exits <- living grandchild is reparented; zombie: parent -> child exits -> Z/status retained -> waitpid -> PID released',
    source: `#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/prctl.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <time.h>
#include <unistd.h>

static void fail(const char *what) {
    perror(what);
    exit(EXIT_FAILURE);
}

static void nap(long milliseconds) {
    struct timespec delay = { milliseconds / 1000, (milliseconds % 1000) * 1000000L };
    while (nanosleep(&delay, &delay) < 0 && errno == EINTR) {}
}

static int process_state(pid_t pid, pid_t *ppid, char *state) {
    char path[64];
    snprintf(path, sizeof path, "/proc/%ld/status", (long)pid);
    FILE *file = fopen(path, "r");
    if (file == NULL) return -1;
    char line[256];
    int got_parent = 0, got_state = 0;
    while (fgets(line, sizeof line, file) != NULL) {
        long value;
        if (sscanf(line, "PPid:%ld", &value) == 1) {
            *ppid = (pid_t)value;
            got_parent = 1;
        }
        if (sscanf(line, "State:%*[ \\t]%c", state) == 1) got_state = 1;
    }
    if (fclose(file) != 0) fail("fclose");
    return got_parent && got_state ? 0 : -1;
}

static void read_exact(int fd, void *buffer, size_t count) {
    size_t done = 0;
    while (done < count) {
        ssize_t n = read(fd, (char *)buffer + done, count - done);
        if (n > 0) done += (size_t)n;
        else if (n < 0 && errno == EINTR) continue;
        else fail("read pid");
    }
}

int main(void) {
    if (prctl(PR_SET_CHILD_SUBREAPER, 1) < 0) fail("prctl");
    int ids[2];
    if (pipe(ids) < 0) fail("pipe");
    pid_t middle = fork();
    if (middle < 0) fail("fork middle");
    if (middle == 0) {
        if (close(ids[0]) < 0) _exit(120);
        pid_t orphan = fork();
        if (orphan < 0) _exit(121);
        if (orphan == 0) {
            if (close(ids[1]) < 0) _exit(122);
            nap(700);
            _exit(7);
        }
        if (write(ids[1], &orphan, sizeof orphan) != (ssize_t)sizeof orphan) _exit(123);
        if (close(ids[1]) < 0) _exit(124);
        _exit(0);
    }
    if (close(ids[1]) < 0) fail("close ids write");
    pid_t orphan;
    read_exact(ids[0], &orphan, sizeof orphan);
    if (close(ids[0]) < 0) fail("close ids read");
    if (waitpid(middle, NULL, 0) != middle) fail("wait middle");

    pid_t observed_parent = -1;
    char observed_state = '?';
    for (int attempt = 0; attempt < 100; attempt++) {
        if (process_state(orphan, &observed_parent, &observed_state) == 0 &&
            observed_parent == getpid()) break;
        nap(10);
    }
    if (observed_parent != getpid()) {
        fprintf(stderr, "orphan was not adopted by subreaper\\n");
        return EXIT_FAILURE;
    }
    printf("orphan: living child adopted by subreaper, state=%c\\n", observed_state);
    int status;
    if (waitpid(orphan, &status, 0) != orphan) fail("wait adopted child");

    pid_t zombie = fork();
    if (zombie < 0) fail("fork zombie");
    if (zombie == 0) _exit(42);
    char zombie_state = '?';
    for (int attempt = 0; attempt < 100; attempt++) {
        if (process_state(zombie, &observed_parent, &zombie_state) == 0 &&
            zombie_state == 'Z') break;
        nap(10);
    }
    if (zombie_state != 'Z') {
        fprintf(stderr, "terminated child was not observed as zombie\\n");
        return EXIT_FAILURE;
    }
    printf("zombie: terminated child retained, state=Z\\n");
    if (waitpid(zombie, &status, 0) != zombie) fail("wait zombie");
    if (!WIFEXITED(status) || WEXITSTATUS(status) != 42) {
        fprintf(stderr, "wrong retained exit status\\n");
        return EXIT_FAILURE;
    }
    printf("reaped: exit=42 and zombie PID released\\n");
    return EXIT_SUCCESS;
}`,
    runCommand: './a05',
    expectedEvidence: 'Three lines separately report a living orphan adopted by the configured subreaper, a terminated child visible in zombie state Z, and waitpid reaping the retained exit status 42.',
    failureAnalysis: 'Calling every parentless child a zombie merges two independent mechanisms. Adoption concerns a living process parent relationship; reaping concerns retained termination status. PID namespaces or a configured subreaper change the adopter, so assuming every orphan goes directly to global PID 1 is also wrong.',
    verification: "./a05 | grep -E 'orphan: living child adopted.*state=[RSDI]' && ./a05 | grep -Fx 'zombie: terminated child retained, state=Z' && ./a05 | grep -Fx 'reaped: exit=42 and zombie PID released'",
  },
  {
    id: 'A06',
    title: 'Reap children asynchronously without blocking the parent',
    mechanism: 'The SIGCHLD handler performs only an async-signal-safe write to a nonblocking self-pipe. The normal control path drains that notification and repeatedly calls waitpid(-1, ..., WNOHANG) until no exited child remains. One signal may represent several exits, so the loop, not the signal count, establishes completeness.',
    stateDiagram: 'children exit -> SIGCHLD handler writes self-pipe -> poll wakes parent -> waitpid WNOHANG loop drains all zombies',
    source: `#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <fcntl.h>
#include <poll.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/wait.h>
#include <unistd.h>

static int signal_pipe[2];

static void on_sigchld(int signal_number) {
    (void)signal_number;
    int saved = errno;
    unsigned char byte = 1;
    (void)write(signal_pipe[1], &byte, 1);
    errno = saved;
}

static void fail(const char *what) {
    perror(what);
    exit(EXIT_FAILURE);
}

int main(void) {
    if (pipe(signal_pipe) < 0) fail("pipe");
    int flags = fcntl(signal_pipe[1], F_GETFL);
    if (flags < 0 || fcntl(signal_pipe[1], F_SETFL, flags | O_NONBLOCK) < 0) fail("fcntl");
    struct sigaction action;
    memset(&action, 0, sizeof action);
    action.sa_handler = on_sigchld;
    if (sigemptyset(&action.sa_mask) < 0) fail("sigemptyset");
    action.sa_flags = SA_RESTART;
    if (sigaction(SIGCHLD, &action, NULL) < 0) fail("sigaction");

    const int child_count = 4;
    for (int i = 0; i < child_count; i++) {
        pid_t pid = fork();
        if (pid < 0) fail("fork");
        if (pid == 0) _exit(10 + i);
    }

    int reaped = 0;
    while (reaped < child_count) {
        struct pollfd watch;
        watch.fd = signal_pipe[0];
        watch.events = POLLIN;
        watch.revents = 0;
        int ready;
        do ready = poll(&watch, 1, 2000); while (ready < 0 && errno == EINTR);
        if (ready <= 0) {
            fprintf(stderr, "timed out waiting for SIGCHLD\\n");
            return EXIT_FAILURE;
        }
        unsigned char notifications[64];
        ssize_t ignored = read(signal_pipe[0], notifications, sizeof notifications);
        if (ignored < 0 && errno != EINTR) fail("read self-pipe");
        for (;;) {
            int status;
            pid_t pid = waitpid(-1, &status, WNOHANG);
            if (pid > 0) {
                printf("reaped pid=%ld exit=%d\\n", (long)pid,
                       WIFEXITED(status) ? WEXITSTATUS(status) : -1);
                reaped++;
            } else if (pid == 0) {
                break;
            } else if (errno == EINTR) {
                continue;
            } else if (errno == ECHILD) {
                break;
            } else {
                fail("waitpid");
            }
        }
    }
    printf("parent remained responsive; reaped=%d\\n", reaped);
    if (close(signal_pipe[0]) < 0 || close(signal_pipe[1]) < 0) fail("close");
    return EXIT_SUCCESS;
}`,
    runCommand: './a06',
    expectedEvidence: 'Four reaped records appear in nondeterministic PID order, followed by parent remained responsive; reaped=4. No blocking wait is used before notification.',
    failureAnalysis: 'Calling printf or waitpid from a complex handler makes handler safety and application state harder to reason about. Reaping only once loses children when SIGCHLD notifications coalesce. A self-pipe can fill, so the handler ignores EAGAIN and the ordinary path always drains waitpid to exhaustion.',
    verification: "test \"$(./a06 | grep -c '^reaped pid=')\" -eq 4 && ./a06 | grep -Fx 'parent remained responsive; reaped=4'",
  },
  {
    id: 'A07',
    title: 'Fork a child and replace it with a requested command',
    mechanism: 'fork creates a child with copied process state and inherited descriptors; execvp replaces that child process image while retaining its PID and selected attributes. The child uses _exit(127) if exec fails so it does not run parent stdio cleanup, and the parent decodes the wait status.',
    stateDiagram: 'parent -> fork -> child copy -> execvp(command, argv) replaces mappings -> command exits -> parent waitpid decodes status',
    source: `#define _POSIX_C_SOURCE 200809L
#include <stdio.h>
#include <stdlib.h>
#include <sys/wait.h>
#include <unistd.h>

int main(int argc, char **argv) {
    if (argc < 2) {
        fprintf(stderr, "usage: %s COMMAND [ARG ...]\\n", argv[0]);
        return EXIT_FAILURE;
    }
    pid_t child = fork();
    if (child < 0) {
        perror("fork");
        return EXIT_FAILURE;
    }
    if (child == 0) {
        execvp(argv[1], &argv[1]);
        perror("execvp");
        _exit(127);
    }
    int status;
    if (waitpid(child, &status, 0) != child) {
        perror("waitpid");
        return EXIT_FAILURE;
    }
    if (WIFEXITED(status)) {
        printf("child exit=%d\\n", WEXITSTATUS(status));
        return WEXITSTATUS(status) == 0 ? EXIT_SUCCESS : EXIT_FAILURE;
    }
    if (WIFSIGNALED(status)) {
        printf("child signal=%d\\n", WTERMSIG(status));
    }
    return EXIT_FAILURE;
}`,
    runCommand: "./a07 printf 'exec worked\\n'",
    expectedEvidence: 'The requested printf program emits exec worked, and the original parent then emits child exit=0.',
    failureAnalysis: 'Returning from the child branch after exec failure would run copied parent cleanup and flush copied stdio buffers. Passing a shell command line as one argument is not exec argument parsing; argv boundaries are explicit and no shell is introduced.',
    verification: "test \"$(./a07 printf 'exec worked\\n')\" = \"exec worked\nchild exit=0\"",
  },
  {
    id: 'A08',
    title: 'Create three sibling children without tree multiplication',
    mechanism: 'Only the original parent executes the three fork calls. Each child records its slot, PID, and unchanged parent PID to one pipe and immediately calls _exit, preventing children from re-entering the creation loop and multiplying the process tree. Pipe records are smaller than PIPE_BUF and are collected before waitpid.',
    stateDiagram: 'one parent -> child 0; same parent -> child 1; same parent -> child 2; no child executes another fork',
    source: `#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

struct record {
    int slot;
    pid_t pid;
    pid_t ppid;
};

static void read_exact(int fd, void *buffer, size_t count) {
    size_t done = 0;
    while (done < count) {
        ssize_t n = read(fd, (char *)buffer + done, count - done);
        if (n > 0) done += (size_t)n;
        else if (n < 0 && errno == EINTR) continue;
        else {
            perror("read");
            exit(EXIT_FAILURE);
        }
    }
}

int main(void) {
    int reports[2];
    if (pipe(reports) < 0) {
        perror("pipe");
        return EXIT_FAILURE;
    }
    pid_t parent = getpid();
    pid_t children[3];
    for (int i = 0; i < 3; i++) {
        children[i] = fork();
        if (children[i] < 0) {
            perror("fork");
            return EXIT_FAILURE;
        }
        if (children[i] == 0) {
            if (close(reports[0]) < 0) _exit(120);
            struct record report = { i, getpid(), getppid() };
            ssize_t n = write(reports[1], &report, sizeof report);
            _exit(n == (ssize_t)sizeof report ? 0 : 121);
        }
    }
    if (close(reports[1]) < 0) {
        perror("close");
        return EXIT_FAILURE;
    }
    struct record records[3];
    for (int i = 0; i < 3; i++) {
        read_exact(reports[0], &records[i], sizeof records[i]);
    }
    if (close(reports[0]) < 0) {
        perror("close");
        return EXIT_FAILURE;
    }
    for (int slot = 0; slot < 3; slot++) {
        for (int i = 0; i < 3; i++) {
            if (records[i].slot == slot) {
                printf("slot=%d sibling=yes parent-match=%s\\n", slot,
                       records[i].ppid == parent ? "yes" : "no");
            }
        }
    }
    for (int i = 0; i < 3; i++) {
        int status;
        if (waitpid(children[i], &status, 0) != children[i] ||
            !WIFEXITED(status) || WEXITSTATUS(status) != 0) {
            fprintf(stderr, "child %d failed\\n", i);
            return EXIT_FAILURE;
        }
    }
    return EXIT_SUCCESS;
}`,
    runCommand: './a08',
    expectedEvidence: 'Exactly three ordered records report slots 0, 1, and 2, each with sibling=yes and parent-match=yes.',
    failureAnalysis: 'A loop in which children continue iterating creates descendants rather than three siblings. Output written through buffered stdio in every child can duplicate pre-fork buffers; one small pipe record plus _exit avoids that ambiguity.',
    verification: "test \"$(./a08 | grep -c 'sibling=yes parent-match=yes')\" -eq 3 && test \"$(./a08 | grep -c '^slot=')\" -eq 3",
  },
  {
    id: 'A09',
    title: 'Send a framed message through one anonymous pipe',
    mechanism: 'The pipe is a kernel byte stream inherited across fork. The parent closes the read end and writes a fixed-width length followed by the payload; the child closes the write end, reads each field completely, and observes EOF only after every writer reference is closed.',
    stateDiagram: 'parent write descriptor -> kernel pipe buffer -> child read descriptor; parent close -> zero writers -> child reads EOF',
    source: `#define _POSIX_C_SOURCE 200809L
#include <arpa/inet.h>
#include <errno.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/wait.h>
#include <unistd.h>

static int transfer(int fd, void *buffer, size_t count, int writing) {
    size_t done = 0;
    while (done < count) {
        ssize_t n = writing
            ? write(fd, (char *)buffer + done, count - done)
            : read(fd, (char *)buffer + done, count - done);
        if (n > 0) done += (size_t)n;
        else if (n < 0 && errno == EINTR) continue;
        else return -1;
    }
    return 0;
}

int main(void) {
    int channel[2];
    if (pipe(channel) < 0) {
        perror("pipe");
        return EXIT_FAILURE;
    }
    pid_t child = fork();
    if (child < 0) {
        perror("fork");
        return EXIT_FAILURE;
    }
    if (child == 0) {
        if (close(channel[1]) < 0) _exit(120);
        uint32_t network_length;
        if (transfer(channel[0], &network_length, sizeof network_length, 0) < 0) _exit(121);
        uint32_t length = ntohl(network_length);
        if (length > 128) _exit(122);
        char message[129] = {0};
        if (transfer(channel[0], message, length, 0) < 0) _exit(123);
        if (close(channel[0]) < 0) _exit(124);
        dprintf(STDOUT_FILENO, "child received %u bytes: %s\\n", length, message);
        _exit(0);
    }
    if (close(channel[0]) < 0) {
        perror("close");
        return EXIT_FAILURE;
    }
    char message[] = "anonymous-pipe";
    uint32_t length = (uint32_t)(sizeof message - 1);
    uint32_t network_length = htonl(length);
    if (transfer(channel[1], &network_length, sizeof network_length, 1) < 0 ||
        transfer(channel[1], message, length, 1) < 0) {
        perror("write");
        return EXIT_FAILURE;
    }
    if (close(channel[1]) < 0) {
        perror("close");
        return EXIT_FAILURE;
    }
    int status;
    if (waitpid(child, &status, 0) != child || !WIFEXITED(status) || WEXITSTATUS(status) != 0) {
        fprintf(stderr, "child failed\\n");
        return EXIT_FAILURE;
    }
    return EXIT_SUCCESS;
}`,
    runCommand: './a09',
    expectedEvidence: 'The related child prints child received 14 bytes: anonymous-pipe after reconstructing one length-prefixed frame.',
    failureAnalysis: 'A pipe preserves bytes, not application messages, so one read need not match one write. Keeping an unused write end open prevents EOF. A fixed length bound prevents a corrupt frame from overflowing the receiver.',
    verification: "test \"$(./a09)\" = 'child received 14 bytes: anonymous-pipe'",
  },
  {
    id: 'A10',
    title: 'Connect three sibling stages with two pipes',
    mechanism: 'The parent creates both pipes before forking three siblings. Producer owns only pipe 1 write, transformer owns pipe 1 read and pipe 2 write, and consumer owns only pipe 2 read. Closing every unused copy makes backpressure and EOF reflect the actual graph.',
    stateDiagram: 'producer --pipe 1--> uppercase transformer --pipe 2--> consumer; every process closes the other four descriptor roles',
    source: `#define _POSIX_C_SOURCE 200809L
#include <ctype.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/wait.h>
#include <unistd.h>

static void close_fd(int fd) {
    if (close(fd) < 0) _exit(120);
}

static void copy_upper(int in, int out) {
    unsigned char buffer[256];
    for (;;) {
        ssize_t n = read(in, buffer, sizeof buffer);
        if (n < 0 && errno == EINTR) continue;
        if (n < 0) _exit(121);
        if (n == 0) break;
        for (ssize_t i = 0; i < n; i++) buffer[i] = (unsigned char)toupper(buffer[i]);
        size_t done = 0;
        while (done < (size_t)n) {
            ssize_t written = write(out, buffer + done, (size_t)n - done);
            if (written > 0) done += (size_t)written;
            else if (written < 0 && errno == EINTR) continue;
            else _exit(122);
        }
    }
}

int main(void) {
    int first[2], second[2];
    if (pipe(first) < 0 || pipe(second) < 0) {
        perror("pipe");
        return EXIT_FAILURE;
    }
    pid_t children[3];
    for (int role = 0; role < 3; role++) {
        children[role] = fork();
        if (children[role] < 0) {
            perror("fork");
            return EXIT_FAILURE;
        }
        if (children[role] == 0) {
            if (role == 0) {
                close_fd(first[0]); close_fd(second[0]); close_fd(second[1]);
                const char message[] = "three stages\\n";
                if (write(first[1], message, sizeof message - 1) != (ssize_t)(sizeof message - 1)) _exit(123);
                close_fd(first[1]);
            } else if (role == 1) {
                close_fd(first[1]); close_fd(second[0]);
                copy_upper(first[0], second[1]);
                close_fd(first[0]); close_fd(second[1]);
            } else {
                close_fd(first[0]); close_fd(first[1]); close_fd(second[1]);
                char buffer[256];
                ssize_t n = read(second[0], buffer, sizeof buffer);
                if (n <= 0 || write(STDOUT_FILENO, buffer, (size_t)n) != n) _exit(124);
                close_fd(second[0]);
            }
            _exit(0);
        }
    }
    if (close(first[0]) < 0 || close(first[1]) < 0 ||
        close(second[0]) < 0 || close(second[1]) < 0) {
        perror("close");
        return EXIT_FAILURE;
    }
    for (int i = 0; i < 3; i++) {
        int status;
        if (waitpid(children[i], &status, 0) != children[i] ||
            !WIFEXITED(status) || WEXITSTATUS(status) != 0) {
            fprintf(stderr, "stage %d failed\\n", i);
            return EXIT_FAILURE;
        }
    }
    return EXIT_SUCCESS;
}`,
    runCommand: './a10',
    expectedEvidence: 'The final consumer emits exactly THREE STAGES after EOF travels through both correctly closed pipes.',
    failureAnalysis: 'Leaving the parent or transformer holding an extra write descriptor causes the downstream read to wait forever for EOF. Forking before both pipes exist makes inheritance inconsistent. The transformer must handle short writes rather than assuming one write transfers its whole read.',
    verification: "test \"$(./a10)\" = 'THREE STAGES'",
  },
  {
    id: 'A11',
    title: 'Build an n-pipe, n+1-command pipeline',
    mechanism: 'A command table determines stage_count, and pipe_count is exactly stage_count minus one. Each child maps only its predecessor to stdin and successor to stdout with dup2, closes every original pipe descriptor, then execs. The parent closes all copies and waits for every stage.',
    stateDiagram: 'printf argv -> pipe[0] -> tr argv -> pipe[1] -> wc argv; loop generalizes to n pipes for n+1 argv vectors',
    source: `#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/wait.h>
#include <unistd.h>

int main(void) {
    char *stage0[] = { "printf", "alpha\\nbeta\\n", NULL };
    char *stage1[] = { "tr", "a-z", "A-Z", NULL };
    char *stage2[] = { "wc", "-l", NULL };
    char **commands[] = { stage0, stage1, stage2 };
    const size_t stage_count = sizeof commands / sizeof commands[0];
    const size_t pipe_count = stage_count - 1;
    int pipes[2][2];
    pid_t children[3];
    size_t started = 0;

    for (size_t i = 0; i < pipe_count; i++) {
        if (pipe(pipes[i]) < 0) {
            perror("pipe");
            return EXIT_FAILURE;
        }
    }
    for (size_t stage = 0; stage < stage_count; stage++) {
        pid_t pid = fork();
        if (pid < 0) {
            perror("fork");
            for (size_t i = 0; i < started; i++) (void)kill(children[i], SIGTERM);
            return EXIT_FAILURE;
        }
        if (pid == 0) {
            if (stage > 0 && dup2(pipes[stage - 1][0], STDIN_FILENO) < 0) _exit(120);
            if (stage < pipe_count && dup2(pipes[stage][1], STDOUT_FILENO) < 0) _exit(121);
            for (size_t i = 0; i < pipe_count; i++) {
                if (close(pipes[i][0]) < 0 || close(pipes[i][1]) < 0) _exit(122);
            }
            execvp(commands[stage][0], commands[stage]);
            _exit(127);
        }
        children[started++] = pid;
    }
    for (size_t i = 0; i < pipe_count; i++) {
        if (close(pipes[i][0]) < 0 || close(pipes[i][1]) < 0) {
            perror("close");
            return EXIT_FAILURE;
        }
    }
    int failed = 0;
    for (size_t i = 0; i < stage_count; i++) {
        int status;
        pid_t result;
        do result = waitpid(children[i], &status, 0); while (result < 0 && errno == EINTR);
        if (result != children[i] || !WIFEXITED(status) || WEXITSTATUS(status) != 0) failed = 1;
    }
    return failed ? EXIT_FAILURE : EXIT_SUCCESS;
}`,
    runCommand: './a11',
    expectedEvidence: 'The fixed three-command example prints 2, while the pipe_count expression and loop establish the general n pipes for n+1 stages construction.',
    failureAnalysis: 'Allocating one pipe per command wastes a pipe and complicates closure. A child retaining any unrelated write end can suppress EOF. If exec fails, the child must _exit and the parent must still reap every stage.',
    verification: "test \"$(./a11 | awk '{$1=$1};1')\" = '2'",
  },
  {
    id: 'A12',
    title: 'Share memory between independently launched processes',
    mechanism: 'A creator uses shm_open, ftruncate, and mmap to establish a named object, while an independently execed reader opens and maps the same name. Two named POSIX semaphores separately publish data readiness and reader completion; shared bytes alone provide visibility storage, not a synchronization order.',
    stateDiagram: 'creator exec -> shm object(mapping + message) -> reader exec; ready semaphore orders publish/read, done semaphore orders cleanup',
    pthread: true,
    source: `#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <fcntl.h>
#include <semaphore.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <time.h>
#include <unistd.h>

struct shared_data {
    unsigned sequence;
    char message[128];
};

static void names(const char *base, char *ready, char *done, size_t size) {
    if (snprintf(ready, size, "%s_ready", base) >= (int)size ||
        snprintf(done, size, "%s_done", base) >= (int)size) {
        fprintf(stderr, "name too long\\n");
        exit(EXIT_FAILURE);
    }
}

static void *map_object(int fd) {
    void *mapping = mmap(NULL, sizeof(struct shared_data), PROT_READ | PROT_WRITE,
                         MAP_SHARED, fd, 0);
    if (mapping == MAP_FAILED) {
        perror("mmap");
        exit(EXIT_FAILURE);
    }
    return mapping;
}

int main(int argc, char **argv) {
    if (argc != 3 || argv[2][0] != '/' ||
        (strcmp(argv[1], "create") != 0 && strcmp(argv[1], "read") != 0)) {
        fprintf(stderr, "usage: %s create|read /NAME\\n", argv[0]);
        return EXIT_FAILURE;
    }
    char ready_name[128], done_name[128];
    names(argv[2], ready_name, done_name, sizeof ready_name);

    if (strcmp(argv[1], "create") == 0) {
        int fd = shm_open(argv[2], O_CREAT | O_EXCL | O_RDWR, 0600);
        if (fd < 0) { perror("shm_open create"); return EXIT_FAILURE; }
        if (ftruncate(fd, (off_t)sizeof(struct shared_data)) < 0) { perror("ftruncate"); return EXIT_FAILURE; }
        struct shared_data *data = map_object(fd);
        sem_t *ready = sem_open(ready_name, O_CREAT | O_EXCL, 0600, 0);
        sem_t *done = sem_open(done_name, O_CREAT | O_EXCL, 0600, 0);
        if (ready == SEM_FAILED || done == SEM_FAILED) { perror("sem_open"); return EXIT_FAILURE; }
        data->sequence = 17;
        snprintf(data->message, sizeof data->message, "independent shared memory");
        if (sem_post(ready) < 0) { perror("sem_post"); return EXIT_FAILURE; }
        while (sem_wait(done) < 0 && errno == EINTR) {}
        if (sem_close(ready) < 0 || sem_close(done) < 0 ||
            munmap(data, sizeof *data) < 0 || close(fd) < 0) {
            perror("creator cleanup");
            return EXIT_FAILURE;
        }
        if (sem_unlink(ready_name) < 0 || sem_unlink(done_name) < 0 ||
            shm_unlink(argv[2]) < 0) {
            perror("unlink");
            return EXIT_FAILURE;
        }
        return EXIT_SUCCESS;
    }

    int fd = -1;
    for (int attempt = 0; attempt < 100 && fd < 0; attempt++) {
        fd = shm_open(argv[2], O_RDWR, 0);
        if (fd < 0 && errno == ENOENT) {
            struct timespec delay = {0, 10000000L};
            nanosleep(&delay, NULL);
        }
    }
    if (fd < 0) { perror("shm_open read"); return EXIT_FAILURE; }
    struct shared_data *data = map_object(fd);
    sem_t *ready = sem_open(ready_name, 0);
    sem_t *done = sem_open(done_name, 0);
    if (ready == SEM_FAILED || done == SEM_FAILED) { perror("sem_open read"); return EXIT_FAILURE; }
    while (sem_wait(ready) < 0 && errno == EINTR) {}
    printf("sequence=%u message=%s\\n", data->sequence, data->message);
    if (sem_post(done) < 0 || sem_close(ready) < 0 || sem_close(done) < 0 ||
        munmap(data, sizeof *data) < 0 || close(fd) < 0) {
        perror("reader cleanup");
        return EXIT_FAILURE;
    }
    return EXIT_SUCCESS;
}`,
    runCommand: 'name=/leetcards_a12_$$; ./a12 create "$name" & creator=$!; ./a12 read "$name"; wait "$creator"',
    expectedEvidence: 'The independently started reader prints sequence=17 message=independent shared memory, then the creator unlinks both semaphores and the shared-memory name.',
    failureAnalysis: 'mmap makes bytes shared but does not publish a happens-before edge. Reading before sem_wait can observe incomplete data. Unlinking before both processes open the objects breaks rendezvous; never unlinking leaves persistent kernel names after crashes.',
    verification: "name=/leetcards_a12_$$; ./a12 create \"$name\" & creator=$!; test \"$(./a12 read \"$name\")\" = 'sequence=17 message=independent shared memory'; wait \"$creator\"",
  },
  {
    id: 'A13',
    title: 'Bridge PIPE, FIFO, and shared memory with framed shutdown',
    mechanism: 'Three child stages use three different IPC objects. Stage one writes a length-prefixed DATA frame to a pipe. Stage two validates it and forwards the same frame to a FIFO. Stage three validates the FIFO frame, writes the payload into shared memory, posts a process-shared semaphore, and treats a zero-length frame as explicit shutdown rather than relying on timing.',
    stateDiagram: 'P1 --PIPE frame--> P2 --FIFO frame--> P3 --shared mapping + semaphore--> parent; zero length means orderly shutdown',
    pthread: true,
    source: `#define _POSIX_C_SOURCE 200809L
#include <arpa/inet.h>
#include <errno.h>
#include <fcntl.h>
#include <semaphore.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <sys/wait.h>
#include <unistd.h>

struct shared_result {
    sem_t ready;
    uint32_t length;
    char payload[128];
};

static int io_all(int fd, void *buffer, size_t count, int writing) {
    size_t done = 0;
    while (done < count) {
        ssize_t n = writing ? write(fd, (char *)buffer + done, count - done)
                            : read(fd, (char *)buffer + done, count - done);
        if (n > 0) done += (size_t)n;
        else if (n < 0 && errno == EINTR) continue;
        else return -1;
    }
    return 0;
}

static int send_frame(int fd, const char *payload, uint32_t length) {
    uint32_t header = htonl(length);
    return io_all(fd, &header, sizeof header, 1) ||
           (length > 0 && io_all(fd, (void *)payload, length, 1));
}

static int receive_frame(int fd, char *payload, uint32_t *length) {
    uint32_t header;
    if (io_all(fd, &header, sizeof header, 0) < 0) return -1;
    *length = ntohl(header);
    if (*length >= 128) return -1;
    if (*length > 0 && io_all(fd, payload, *length, 0) < 0) return -1;
    payload[*length] = '\\0';
    return 0;
}

int main(void) {
    int channel[2];
    if (pipe(channel) < 0) { perror("pipe"); return EXIT_FAILURE; }
    char fifo[128];
    snprintf(fifo, sizeof fifo, "/tmp/leetcards-a13-%ld", (long)getpid());
    if (mkfifo(fifo, 0600) < 0) { perror("mkfifo"); return EXIT_FAILURE; }
    struct shared_result *shared = mmap(NULL, sizeof *shared, PROT_READ | PROT_WRITE,
                                        MAP_SHARED | MAP_ANONYMOUS, -1, 0);
    if (shared == MAP_FAILED) { perror("mmap"); return EXIT_FAILURE; }
    if (sem_init(&shared->ready, 1, 0) < 0) { perror("sem_init"); return EXIT_FAILURE; }

    pid_t children[3];
    for (int role = 0; role < 3; role++) {
        children[role] = fork();
        if (children[role] < 0) { perror("fork"); return EXIT_FAILURE; }
        if (children[role] == 0) {
            if (role == 0) {
                close(channel[0]);
                if (send_frame(channel[1], "pipe-fifo-shm", 13) < 0 ||
                    send_frame(channel[1], "", 0) < 0) _exit(120);
                close(channel[1]);
            } else if (role == 1) {
                close(channel[1]);
                int out = open(fifo, O_WRONLY);
                if (out < 0) _exit(121);
                for (;;) {
                    char payload[128];
                    uint32_t length;
                    if (receive_frame(channel[0], payload, &length) < 0 ||
                        send_frame(out, payload, length) < 0) _exit(122);
                    if (length == 0) break;
                }
                close(out); close(channel[0]);
            } else {
                close(channel[0]); close(channel[1]);
                int in = open(fifo, O_RDONLY);
                if (in < 0) _exit(123);
                for (;;) {
                    uint32_t length;
                    if (receive_frame(in, shared->payload, &length) < 0) _exit(124);
                    if (length == 0) break;
                    shared->length = length;
                    if (sem_post(&shared->ready) < 0) _exit(125);
                }
                close(in);
            }
            _exit(0);
        }
    }
    if (close(channel[0]) < 0 || close(channel[1]) < 0) { perror("close"); return EXIT_FAILURE; }
    while (sem_wait(&shared->ready) < 0 && errno == EINTR) {}
    printf("shared length=%u payload=%s shutdown=framed\\n", shared->length, shared->payload);
    for (int i = 0; i < 3; i++) {
        int status;
        if (waitpid(children[i], &status, 0) != children[i] ||
            !WIFEXITED(status) || WEXITSTATUS(status) != 0) {
            fprintf(stderr, "role %d failed\\n", i);
            return EXIT_FAILURE;
        }
    }
    if (sem_destroy(&shared->ready) < 0 || munmap(shared, sizeof *shared) < 0 ||
        unlink(fifo) < 0) {
        perror("cleanup");
        return EXIT_FAILURE;
    }
    return EXIT_SUCCESS;
}`,
    runCommand: './a13',
    expectedEvidence: 'The parent prints shared length=13 payload=pipe-fifo-shm shutdown=framed only after the process-shared semaphore publishes the final mapping.',
    failureAnalysis: 'PIPE and FIFO are byte streams, so boundaries need explicit headers. Opening a FIFO in the wrong order can block rendezvous. Shared memory still needs synchronization. A zero-length control frame distinguishes protocol shutdown from a delayed producer.',
    verification: "timeout 3 ./a13 | grep -Fx 'shared length=13 payload=pipe-fifo-shm shutdown=framed'",
  },
  {
    id: 'A14',
    title: 'Report a SIGSEGV fault address safely',
    mechanism: 'sigaction with SA_SIGINFO supplies siginfo_t, including si_addr for a memory-access fault. The handler performs only integer conversion into a stack buffer, write, and _exit. Those operations avoid stdio, allocation, and other non-async-signal-safe work while the main path creates a deterministic PROT_NONE page fault.',
    stateDiagram: 'write to PROT_NONE mapping -> synchronous SIGSEGV -> kernel saves context and si_addr -> safe handler write -> _exit',
    source: `#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <signal.h>
#include <stdint.h>
#include <stdlib.h>
#include <sys/mman.h>
#include <unistd.h>

static size_t append_hex(char *out, uintptr_t value) {
    static const char digits[] = "0123456789abcdef";
    char reversed[2 * sizeof(uintptr_t)];
    size_t count = 0;
    do {
        reversed[count++] = digits[value & 15U];
        value >>= 4U;
    } while (value != 0);
    size_t written = 0;
    while (count > 0) out[written++] = reversed[--count];
    return written;
}

static void on_fault(int signal_number, siginfo_t *info, void *context) {
    (void)signal_number;
    (void)context;
    int saved = errno;
    char message[96] = "SIGSEGV address=0x";
    size_t length = sizeof("SIGSEGV address=0x") - 1;
    length += append_hex(message + length, (uintptr_t)info->si_addr);
    message[length++] = '\\n';
    (void)write(STDERR_FILENO, message, length);
    errno = saved;
    _exit(128 + SIGSEGV);
}

int main(void) {
    struct sigaction action = {0};
    action.sa_sigaction = on_fault;
    action.sa_flags = SA_SIGINFO;
    if (sigemptyset(&action.sa_mask) < 0 || sigaction(SIGSEGV, &action, NULL) < 0) {
        return EXIT_FAILURE;
    }
    long page_size = sysconf(_SC_PAGESIZE);
    if (page_size <= 0) return EXIT_FAILURE;
    void *page = mmap(NULL, (size_t)page_size, PROT_NONE,
                      MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    if (page == MAP_FAILED) return EXIT_FAILURE;
    *(volatile unsigned char *)page = 1;
    return EXIT_FAILURE;
}`,
    runCommand: './a14 2>&1; test $? -eq 139',
    expectedEvidence: 'Standard error contains SIGSEGV address=0x followed by a nonzero hexadecimal mapping address, and the process exits with 128+SIGSEGV (139).',
    failureAnalysis: 'printf, malloc, and most library calls are unsafe in a signal handler. Returning from a synchronous fault handler without repairing the context repeats the fault. Address values vary under ASLR, so deterministic verification checks shape and exit status rather than a fixed pointer.',
    verification: "output=$(./a14 2>&1); status=$?; test \"$status\" -eq 139 && printf '%s\\n' \"$output\" | grep -E '^SIGSEGV address=0x[0-9a-f]+$'",
  },
  {
    id: 'A15',
    title: 'Implement alarm and snooze as a safe state machine',
    mechanism: 'The SIGALRM handler changes only a volatile sig_atomic_t flag. The main loop blocks SIGALRM while checking state, uses sigsuspend to atomically wait with the signal unblocked, and performs printing plus the next alarm call in ordinary process context. First expiry enters snooze; second expiry completes.',
    stateDiagram: 'ARMED --SIGALRM flag--> main observes -> SNOOZED --SIGALRM flag--> main observes -> DONE',
    source: `#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

static volatile sig_atomic_t alarm_fired = 0;

static void on_alarm(int signal_number) {
    (void)signal_number;
    alarm_fired = 1;
}

int main(void) {
    struct sigaction action = {0};
    action.sa_handler = on_alarm;
    if (sigemptyset(&action.sa_mask) < 0 || sigaction(SIGALRM, &action, NULL) < 0) {
        perror("sigaction");
        return EXIT_FAILURE;
    }
    sigset_t blocked, previous, waiting;
    if (sigemptyset(&blocked) < 0 || sigaddset(&blocked, SIGALRM) < 0 ||
        sigprocmask(SIG_BLOCK, &blocked, &previous) < 0) {
        perror("sigprocmask");
        return EXIT_FAILURE;
    }
    waiting = previous;
    if (sigdelset(&waiting, SIGALRM) < 0) {
        perror("sigdelset");
        return EXIT_FAILURE;
    }

    enum { ARMED, SNOOZED, DONE } state = ARMED;
    alarm(1);
    while (state != DONE) {
        while (!alarm_fired) {
            if (sigsuspend(&waiting) < 0 && errno != EINTR) {
                perror("sigsuspend");
                return EXIT_FAILURE;
            }
        }
        alarm_fired = 0;
        if (state == ARMED) {
            puts("alarm fired; snoozing for 1 second");
            state = SNOOZED;
            alarm(1);
        } else {
            puts("snooze fired; done");
            state = DONE;
        }
    }
    if (sigprocmask(SIG_SETMASK, &previous, NULL) < 0) {
        perror("restore mask");
        return EXIT_FAILURE;
    }
    return EXIT_SUCCESS;
}`,
    runCommand: './a15',
    expectedEvidence: 'After one second the main state machine prints alarm fired; snoozing for 1 second, then one second later prints snooze fired; done.',
    failureAnalysis: 'Checking a flag and then calling pause has a lost-wakeup race. sigsuspend atomically swaps the mask and waits. Printing or scheduling complex work inside the handler is unsafe; the handler only records an event.',
    verification: "timeout 3 ./a15 | diff -u - <(printf 'alarm fired; snoozing for 1 second\\nsnooze fired; done\\n')",
  },
  {
    id: 'A16',
    title: 'Parse, block, observe, and unblock a signal',
    mechanism: 'The parser accepts a controlled set of symbolic names or valid numeric signal values. sigprocmask blocks the selected signal before kill sends it to the same process; sigpending proves it is queued, and restoring the old mask permits delivery to a minimal handler.',
    stateDiagram: 'parse name/number -> block mask -> self-signal becomes pending -> inspect pending set -> restore mask -> handler marks delivered',
    source: `#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <limits.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

static volatile sig_atomic_t delivered = 0;

static void mark_delivered(int signal_number) {
    delivered = signal_number;
}

static int parse_signal(const char *text) {
    struct entry { const char *name; int number; };
    static const struct entry names[] = {
        { "SIGUSR1", SIGUSR1 }, { "USR1", SIGUSR1 },
        { "SIGUSR2", SIGUSR2 }, { "USR2", SIGUSR2 },
        { "SIGINT", SIGINT }, { "INT", SIGINT },
        { "SIGTERM", SIGTERM }, { "TERM", SIGTERM }
    };
    for (size_t i = 0; i < sizeof names / sizeof names[0]; i++) {
        if (strcmp(text, names[i].name) == 0) return names[i].number;
    }
    char *end = NULL;
    errno = 0;
    long value = strtol(text, &end, 10);
    if (errno == 0 && end != text && *end == '\\0' &&
        value > 0 && value <= INT_MAX) {
        sigset_t candidate;
        if (sigemptyset(&candidate) == 0 &&
            sigaddset(&candidate, (int)value) == 0) {
            return (int)value;
        }
    }
    return -1;
}

int main(int argc, char **argv) {
    if (argc != 2) {
        fprintf(stderr, "usage: %s SIGNAL_NAME_OR_NUMBER\\n", argv[0]);
        return EXIT_FAILURE;
    }
    int number = parse_signal(argv[1]);
    if (number < 0 || number == SIGKILL || number == SIGSTOP) {
        fprintf(stderr, "unsupported signal: %s\\n", argv[1]);
        return EXIT_FAILURE;
    }
    struct sigaction action = {0};
    action.sa_handler = mark_delivered;
    if (sigemptyset(&action.sa_mask) < 0 || sigaction(number, &action, NULL) < 0) {
        perror("sigaction");
        return EXIT_FAILURE;
    }
    sigset_t set, old, pending;
    if (sigemptyset(&set) < 0 || sigaddset(&set, number) < 0 ||
        sigprocmask(SIG_BLOCK, &set, &old) < 0 ||
        kill(getpid(), number) < 0 || sigpending(&pending) < 0) {
        perror("signal setup");
        return EXIT_FAILURE;
    }
    printf("blocked=%d pending=%d\\n", number, sigismember(&pending, number));
    if (sigprocmask(SIG_SETMASK, &old, NULL) < 0) {
        perror("unblock");
        return EXIT_FAILURE;
    }
    for (int spin = 0; spin < 1000000 && delivered == 0; spin++) {}
    printf("unblocked=%d delivered=%d\\n", number, (int)delivered);
    return delivered == number ? EXIT_SUCCESS : EXIT_FAILURE;
}`,
    runCommand: './a16 SIGUSR1',
    expectedEvidence: 'The first line reports the chosen signal blocked and pending=1; after restoring the mask, the second line reports the same numeric signal as delivered.',
    failureAnalysis: 'SIGKILL and SIGSTOP cannot be caught or blocked. Signal numbers vary across systems, so names are clearer. Standard signals coalesce rather than queueing every occurrence, and changing a process-wide mask in multithreaded code requires pthread_sigmask.',
    verification: "./a16 SIGUSR1 | awk -F'[ =]' 'NR==1 {n=$2; ok=$4==1} NR==2 {ok=ok && $2==n && $4==n} END {exit !ok}'",
  },
  {
    id: 'A17',
    title: 'Reap every child after coalesced SIGCHLD notifications',
    mechanism: 'Eight children wait behind one gate and then exit close together, making signal coalescing likely. SIGCHLD only sets a flag. The parent blocks the signal while checking that flag, atomically waits with sigsuspend, then runs waitpid(-1, WNOHANG) until the kernel reports no more waitable children. Correctness is based on eight reaped statuses, never eight handler calls.',
    stateDiagram: '8 gated children -> clustered exits -> one or more SIGCHLD events -> flag -> complete WNOHANG reap loop -> 8 statuses',
    source: `#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/wait.h>
#include <unistd.h>

static volatile sig_atomic_t child_event = 0;
static volatile sig_atomic_t notifications = 0;

static void on_sigchld(int signal_number) {
    (void)signal_number;
    child_event = 1;
    notifications++;
}

int main(void) {
    int gate[2];
    if (pipe(gate) < 0) { perror("pipe"); return EXIT_FAILURE; }
    struct sigaction action = {0};
    action.sa_handler = on_sigchld;
    action.sa_flags = SA_RESTART;
    if (sigemptyset(&action.sa_mask) < 0 || sigaction(SIGCHLD, &action, NULL) < 0) {
        perror("sigaction");
        return EXIT_FAILURE;
    }
    sigset_t blocked, old, waiting;
    if (sigemptyset(&blocked) < 0 || sigaddset(&blocked, SIGCHLD) < 0 ||
        sigprocmask(SIG_BLOCK, &blocked, &old) < 0) {
        perror("sigprocmask");
        return EXIT_FAILURE;
    }
    waiting = old;
    if (sigdelset(&waiting, SIGCHLD) < 0) return EXIT_FAILURE;

    const int count = 8;
    for (int i = 0; i < count; i++) {
        pid_t pid = fork();
        if (pid < 0) { perror("fork"); return EXIT_FAILURE; }
        if (pid == 0) {
            close(gate[1]);
            char token;
            while (read(gate[0], &token, 1) < 0 && errno == EINTR) {}
            _exit(i);
        }
    }
    if (close(gate[0]) < 0 || close(gate[1]) < 0) { perror("close gate"); return EXIT_FAILURE; }

    int reaped = 0;
    while (reaped < count) {
        while (!child_event) {
            if (sigsuspend(&waiting) < 0 && errno != EINTR) {
                perror("sigsuspend");
                return EXIT_FAILURE;
            }
        }
        child_event = 0;
        for (;;) {
            int status;
            pid_t pid = waitpid(-1, &status, WNOHANG);
            if (pid > 0) {
                if (!WIFEXITED(status)) return EXIT_FAILURE;
                reaped++;
            } else if (pid == 0) {
                break;
            } else if (errno == EINTR) {
                continue;
            } else if (errno == ECHILD) {
                break;
            } else {
                perror("waitpid");
                return EXIT_FAILURE;
            }
        }
    }
    if (sigprocmask(SIG_SETMASK, &old, NULL) < 0) { perror("restore mask"); return EXIT_FAILURE; }
    printf("children=8 reaped=%d notifications=%d complete=yes\\n",
           reaped, (int)notifications);
    return EXIT_SUCCESS;
}`,
    runCommand: './a17',
    expectedEvidence: 'The summary always reports children=8 reaped=8 and complete=yes; notifications may be any positive count because standard SIGCHLD delivery can coalesce.',
    failureAnalysis: 'Equating one SIGCHLD with one child loses exits. Clearing a flag and waiting without blocking the signal creates a lost-wakeup race. sigsuspend closes that race, and waitpid must loop until zero or ECHILD.',
    verification: "./a17 | awk -F'[ =]' '$2==8 && $4==8 && $8==\"yes\" {found=1} END {exit !found}'",
  },
  {
    id: 'A18',
    title: 'Exchange line-framed requests over TCP',
    mechanism: 'TCP supplies an ordered byte stream, not records. Both modes therefore buffer until newline, cap each frame, and loop over partial send/receive work and EINTR. The localhost server accepts one client, returns an uppercase line, and treats a clean read of zero as disconnect rather than a partial command.',
    stateDiagram: 'client connect -> send_all(line + newline) -> TCP stream -> server read_line -> uppercase response -> client read_line; EOF closes session',
    source: `#define _POSIX_C_SOURCE 200809L
#include <arpa/inet.h>
#include <ctype.h>
#include <errno.h>
#include <netinet/in.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

static int send_all(int fd, const char *data, size_t length) {
    size_t done = 0;
    while (done < length) {
        ssize_t n = send(fd, data + done, length - done, MSG_NOSIGNAL);
        if (n > 0) done += (size_t)n;
        else if (n < 0 && errno == EINTR) continue;
        else return -1;
    }
    return 0;
}

static ssize_t read_line(int fd, char *line, size_t capacity) {
    size_t used = 0;
    while (used + 1 < capacity) {
        char byte;
        ssize_t n = recv(fd, &byte, 1, 0);
        if (n == 0) return used == 0 ? 0 : -2;
        if (n < 0 && errno == EINTR) continue;
        if (n < 0) return -1;
        if (byte == '\\n') {
            line[used] = '\\0';
            return (ssize_t)used;
        }
        line[used++] = byte;
    }
    return -3;
}

static int parse_port(const char *text) {
    char *end = NULL;
    long value = strtol(text, &end, 10);
    return end != text && *end == '\\0' && value > 1024 && value <= 65535 ? (int)value : -1;
}

static int run_server(int port) {
    int listener = socket(AF_INET, SOCK_STREAM, 0);
    if (listener < 0) { perror("socket"); return EXIT_FAILURE; }
    int one = 1;
    if (setsockopt(listener, SOL_SOCKET, SO_REUSEADDR, &one, sizeof one) < 0) {
        perror("setsockopt"); return EXIT_FAILURE;
    }
    struct sockaddr_in address = {
        .sin_family = AF_INET,
        .sin_port = htons((uint16_t)port),
        .sin_addr.s_addr = htonl(INADDR_LOOPBACK)
    };
    if (bind(listener, (struct sockaddr *)&address, sizeof address) < 0 ||
        listen(listener, 4) < 0) {
        perror("bind/listen"); return EXIT_FAILURE;
    }
    int client = accept(listener, NULL, NULL);
    if (client < 0) { perror("accept"); return EXIT_FAILURE; }
    char line[512];
    ssize_t length = read_line(client, line, sizeof line);
    if (length <= 0) {
        fprintf(stderr, "disconnect or invalid frame\\n");
        return EXIT_FAILURE;
    }
    for (ssize_t i = 0; i < length; i++) line[i] = (char)toupper((unsigned char)line[i]);
    line[length++] = '\\n';
    if (send_all(client, line, (size_t)length) < 0) { perror("send"); return EXIT_FAILURE; }
    if (close(client) < 0 || close(listener) < 0) { perror("close"); return EXIT_FAILURE; }
    return EXIT_SUCCESS;
}

static int run_client(int port, const char *request) {
    int fd = socket(AF_INET, SOCK_STREAM, 0);
    if (fd < 0) { perror("socket"); return EXIT_FAILURE; }
    struct sockaddr_in address = {
        .sin_family = AF_INET,
        .sin_port = htons((uint16_t)port),
        .sin_addr.s_addr = htonl(INADDR_LOOPBACK)
    };
    if (connect(fd, (struct sockaddr *)&address, sizeof address) < 0) {
        perror("connect"); return EXIT_FAILURE;
    }
    if (send_all(fd, request, strlen(request)) < 0 || send_all(fd, "\\n", 1) < 0) {
        perror("send"); return EXIT_FAILURE;
    }
    char response[512];
    ssize_t length = read_line(fd, response, sizeof response);
    if (length < 0) { fprintf(stderr, "invalid response\\n"); return EXIT_FAILURE; }
    printf("response=%s\\n", response);
    if (close(fd) < 0) { perror("close"); return EXIT_FAILURE; }
    return EXIT_SUCCESS;
}

int main(int argc, char **argv) {
    if (argc < 3) {
        fprintf(stderr, "usage: %s server PORT | client PORT LINE\\n", argv[0]);
        return EXIT_FAILURE;
    }
    int port = parse_port(argv[2]);
    if (port < 0) { fprintf(stderr, "invalid port\\n"); return EXIT_FAILURE; }
    if (strcmp(argv[1], "server") == 0 && argc == 3) return run_server(port);
    if (strcmp(argv[1], "client") == 0 && argc == 4) return run_client(port, argv[3]);
    fprintf(stderr, "invalid mode\\n");
    return EXIT_FAILURE;
}`,
    runCommand: 'port=$((20000 + $$ % 20000)); ./a18 server "$port" & server=$!; sleep 0.1; ./a18 client "$port" "partial io"; wait "$server"',
    expectedEvidence: 'The client prints response=PARTIAL IO. The server binds only loopback, processes exactly one newline-delimited request, then closes the accepted socket.',
    failureAnalysis: 'TCP can split or combine writes, so recv is not a message API. EOF in the middle of a line is a truncated frame. Unbounded line accumulation enables memory exhaustion; this implementation rejects frames beyond 511 bytes.',
    verification: "port=$((20000 + $$ % 20000)); ./a18 server \"$port\" & server=$!; sleep 0.1; test \"$(./a18 client \"$port\" 'partial io')\" = 'response=PARTIAL IO'; wait \"$server\"",
  },
  {
    id: 'A19',
    title: 'Serve allowlisted UDP requests on localhost only',
    mechanism: 'The UDP socket binds explicitly to INADDR_LOOPBACK. Requests carry request_id|command|argument, and dispatch performs an exact lookup in a static command_table containing PING, UPPER, and ADD handlers. No shell or exec path exists. The client uses poll timeouts and retries the same request ID, illustrating that UDP does not guarantee delivery, ordering, uniqueness, or execution.',
    stateDiagram: 'localhost client datagram(id|name|arg) -> loopback-bound UDP socket -> exact allowlist lookup -> pure handler -> datagram(id|status|result); timeout may retry duplicate ID',
    source: `#define _POSIX_C_SOURCE 200809L
#include <arpa/inet.h>
#include <ctype.h>
#include <errno.h>
#include <poll.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

typedef int (*command_handler)(const char *, char *, size_t);

static int command_ping(const char *argument, char *out, size_t size) {
    (void)argument;
    return snprintf(out, size, "PONG") < (int)size ? 0 : -1;
}

static int command_upper(const char *argument, char *out, size_t size) {
    size_t length = strlen(argument);
    if (length + 1 > size) return -1;
    for (size_t i = 0; i < length; i++) out[i] = (char)toupper((unsigned char)argument[i]);
    out[length] = '\\0';
    return 0;
}

static int command_add(const char *argument, char *out, size_t size) {
    char *middle = NULL;
    errno = 0;
    long left = strtol(argument, &middle, 10);
    if (errno != 0 || middle == argument || *middle != ',') return -1;
    char *end = NULL;
    long right = strtol(middle + 1, &end, 10);
    if (errno != 0 || end == middle + 1 || *end != '\\0') return -1;
    int written = snprintf(out, size, "%ld", left + right);
    return written >= 0 && (size_t)written < size ? 0 : -1;
}

static const struct {
    const char *name;
    command_handler handler;
} command_table[] = {
    { "PING", command_ping },
    { "UPPER", command_upper },
    { "ADD", command_add }
};

static int parse_port(const char *text) {
    char *end = NULL;
    long value = strtol(text, &end, 10);
    return end != text && *end == '\\0' && value > 1024 && value <= 65535 ? (int)value : -1;
}

static int dispatch(char *request, char *reply, size_t reply_size) {
    char *request_id = request;
    char *command = strchr(request, '|');
    if (command == NULL) return -1;
    *command++ = '\\0';
    char *argument = strchr(command, '|');
    if (argument == NULL) return -1;
    *argument++ = '\\0';
    if (*request_id == '\\0' || strlen(request_id) > 32) return -1;
    for (size_t i = 0; i < sizeof command_table / sizeof command_table[0]; i++) {
        if (strcmp(command, command_table[i].name) == 0) {
            char result[512];
            if (command_table[i].handler(argument, result, sizeof result) < 0) return -1;
            int n = snprintf(reply, reply_size, "%s|OK|%s", request_id, result);
            return n >= 0 && (size_t)n < reply_size ? 0 : -1;
        }
    }
    int n = snprintf(reply, reply_size, "%s|DENIED|unknown-command", request_id);
    return n >= 0 && (size_t)n < reply_size ? 0 : -1;
}

static int run_server(int port) {
    int fd = socket(AF_INET, SOCK_DGRAM, 0);
    if (fd < 0) { perror("socket"); return EXIT_FAILURE; }
    struct sockaddr_in local = {
        .sin_family = AF_INET,
        .sin_port = htons((uint16_t)port),
        .sin_addr.s_addr = htonl(INADDR_LOOPBACK)
    };
    if (bind(fd, (struct sockaddr *)&local, sizeof local) < 0) {
        perror("bind"); return EXIT_FAILURE;
    }
    struct pollfd watch = { .fd = fd, .events = POLLIN };
    int ready;
    do ready = poll(&watch, 1, 3000); while (ready < 0 && errno == EINTR);
    if (ready <= 0) { fprintf(stderr, "server timeout\\n"); return EXIT_FAILURE; }
    char request[768];
    struct sockaddr_in peer;
    socklen_t peer_size = sizeof peer;
    ssize_t n = recvfrom(fd, request, sizeof request - 1, 0,
                         (struct sockaddr *)&peer, &peer_size);
    if (n < 0) { perror("recvfrom"); return EXIT_FAILURE; }
    if (peer.sin_addr.s_addr != htonl(INADDR_LOOPBACK)) return EXIT_FAILURE;
    request[n] = '\\0';
    char reply[768];
    if (dispatch(request, reply, sizeof reply) < 0) {
        snprintf(reply, sizeof reply, "invalid|ERROR|bad-request");
    }
    if (sendto(fd, reply, strlen(reply), 0, (struct sockaddr *)&peer, peer_size) < 0) {
        perror("sendto"); return EXIT_FAILURE;
    }
    if (close(fd) < 0) { perror("close"); return EXIT_FAILURE; }
    return EXIT_SUCCESS;
}

static int run_client(int port, const char *request_id, const char *command, const char *argument) {
    char request[768];
    int length = snprintf(request, sizeof request, "%s|%s|%s", request_id, command, argument);
    if (length < 0 || (size_t)length >= sizeof request) return EXIT_FAILURE;
    int fd = socket(AF_INET, SOCK_DGRAM, 0);
    if (fd < 0) { perror("socket"); return EXIT_FAILURE; }
    struct sockaddr_in server = {
        .sin_family = AF_INET,
        .sin_port = htons((uint16_t)port),
        .sin_addr.s_addr = htonl(INADDR_LOOPBACK)
    };
    for (int attempt = 0; attempt < 2; attempt++) {
        if (sendto(fd, request, (size_t)length, 0,
                   (struct sockaddr *)&server, sizeof server) < 0) {
            perror("sendto"); return EXIT_FAILURE;
        }
        struct pollfd watch = { .fd = fd, .events = POLLIN };
        int ready;
        do ready = poll(&watch, 1, 500); while (ready < 0 && errno == EINTR);
        if (ready > 0) {
            char reply[768];
            ssize_t n = recvfrom(fd, reply, sizeof reply - 1, 0, NULL, NULL);
            if (n < 0) { perror("recvfrom"); return EXIT_FAILURE; }
            reply[n] = '\\0';
            printf("%s\\n", reply);
            if (close(fd) < 0) return EXIT_FAILURE;
            return EXIT_SUCCESS;
        }
    }
    fprintf(stderr, "timeout: delivery or reply not guaranteed\\n");
    close(fd);
    return EXIT_FAILURE;
}

int main(int argc, char **argv) {
    if (argc < 3) {
        fprintf(stderr, "usage: %s server PORT | client PORT ID COMMAND ARG\\n", argv[0]);
        return EXIT_FAILURE;
    }
    int port = parse_port(argv[2]);
    if (port < 0) return EXIT_FAILURE;
    if (strcmp(argv[1], "server") == 0 && argc == 3) return run_server(port);
    if (strcmp(argv[1], "client") == 0 && argc == 6) {
        return run_client(port, argv[3], argv[4], argv[5]);
    }
    return EXIT_FAILURE;
}`,
    runCommand: 'port=$((30000 + $$ % 15000)); ./a19 server "$port" & server=$!; sleep 0.1; ./a19 client "$port" req-17 ADD 20,22; wait "$server"',
    expectedEvidence: 'The client receives req-17|OK|42. An unknown command receives DENIED rather than execution, and a missing datagram produces a bounded timeout rather than an indefinite wait.',
    failureAnalysis: 'UDP does not guarantee request delivery, reply delivery, ordering, uniqueness, or execution. Retrying can duplicate execution, so real side effects need authentication, replay protection, idempotency, and durable request state. Loopback binding limits reachability, and exact allowlisting plus direct function calls prevents command injection.',
    verification: "port=$((30000 + $$ % 15000)); ./a19 server \"$port\" & server=$!; sleep 0.1; test \"$(./a19 client \"$port\" req-17 ADD 20,22)\" = 'req-17|OK|42'; wait \"$server\"",
  },
  {
    id: 'A20',
    title: 'Compute factorial in a joined worker thread',
    mechanism: 'The main thread validates an input no larger than 20, allocates an argument/result object whose lifetime extends through pthread_join, and passes its address to one worker. The worker detects multiplication overflow, stores the result, and returns the same object; join establishes completion before main reads it.',
    stateDiagram: 'main owns task -> pthread_create borrows task pointer -> worker computes uint64 factorial -> pthread_join returns pointer -> main reads and frees',
    pthread: true,
    source: `#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <inttypes.h>
#include <pthread.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

struct task {
    unsigned input;
    uint64_t result;
    int overflow;
};

static void *factorial_worker(void *opaque) {
    struct task *task = opaque;
    task->result = 1;
    for (unsigned i = 2; i <= task->input; i++) {
        if (task->result > UINT64_MAX / i) {
            task->overflow = 1;
            return task;
        }
        task->result *= i;
    }
    return task;
}

int main(int argc, char **argv) {
    if (argc != 2) {
        fprintf(stderr, "usage: %s N (0..20)\\n", argv[0]);
        return EXIT_FAILURE;
    }
    char *end = NULL;
    errno = 0;
    unsigned long value = strtoul(argv[1], &end, 10);
    if (errno != 0 || end == argv[1] || *end != '\\0' || value > 20) {
        fprintf(stderr, "N must be between 0 and 20\\n");
        return EXIT_FAILURE;
    }
    struct task *task = calloc(1, sizeof *task);
    if (task == NULL) { perror("calloc"); return EXIT_FAILURE; }
    task->input = (unsigned)value;
    pthread_t thread;
    int error = pthread_create(&thread, NULL, factorial_worker, task);
    if (error != 0) {
        errno = error; perror("pthread_create"); free(task); return EXIT_FAILURE;
    }
    void *returned = NULL;
    error = pthread_join(thread, &returned);
    if (error != 0) {
        errno = error; perror("pthread_join"); free(task); return EXIT_FAILURE;
    }
    if (returned != task || task->overflow) {
        fprintf(stderr, "worker result invalid\\n");
        free(task);
        return EXIT_FAILURE;
    }
    printf("%u! = %" PRIu64 "\\n", task->input, task->result);
    free(task);
    return EXIT_SUCCESS;
}`,
    runCommand: './a20 10',
    expectedEvidence: 'After pthread_join, main prints 10! = 3628800; inputs above 20 are rejected before thread creation.',
    failureAnalysis: 'Passing the address of an expired stack temporary or freeing heap state before join creates a lifetime bug. Ignoring pthread return codes hides failures because pthread APIs return error numbers directly rather than setting errno.',
    verification: "test \"$(./a20 10)\" = '10! = 3628800' && ! ./a20 21 2>/dev/null",
  },
  {
    id: 'A21',
    title: 'Compare mutex aggregation with join-time reduction',
    mechanism: 'Each worker computes a disjoint local sum and maximum. It then locks once to merge into shared aggregation, minimizing critical-section time. After joining, main independently merges the retained per-thread partials and proves both methods produce the same sum and maximum.',
    stateDiagram: 'array partitions -> local partials in four workers -> mutex-protected shared merge; joins -> main merges same partials -> compare',
    pthread: true,
    source: `#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <inttypes.h>
#include <limits.h>
#include <pthread.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

struct aggregate {
    pthread_mutex_t mutex;
    int64_t sum;
    int maximum;
};

struct task {
    const int *values;
    size_t begin;
    size_t end;
    int64_t local_sum;
    int local_maximum;
    struct aggregate *shared;
    int error;
};

static void *worker(void *opaque) {
    struct task *task = opaque;
    task->local_sum = 0;
    task->local_maximum = INT_MIN;
    for (size_t i = task->begin; i < task->end; i++) {
        task->local_sum += task->values[i];
        if (task->values[i] > task->local_maximum) task->local_maximum = task->values[i];
    }
    task->error = pthread_mutex_lock(&task->shared->mutex);
    if (task->error != 0) return task;
    task->shared->sum += task->local_sum;
    if (task->local_maximum > task->shared->maximum) {
        task->shared->maximum = task->local_maximum;
    }
    task->error = pthread_mutex_unlock(&task->shared->mutex);
    return task;
}

int main(void) {
    const int values[] = { 7, -3, 12, 5, 9, -1, 4, 20, 6, 2, -8, 11 };
    const size_t count = sizeof values / sizeof values[0];
    enum { THREADS = 4 };
    struct aggregate shared = { .mutex = PTHREAD_MUTEX_INITIALIZER, .sum = 0, .maximum = INT_MIN };
    struct task tasks[THREADS];
    pthread_t threads[THREADS];

    for (size_t i = 0; i < THREADS; i++) {
        tasks[i] = (struct task){
            .values = values,
            .begin = i * count / THREADS,
            .end = (i + 1) * count / THREADS,
            .shared = &shared
        };
        int error = pthread_create(&threads[i], NULL, worker, &tasks[i]);
        if (error != 0) { errno = error; perror("pthread_create"); return EXIT_FAILURE; }
    }
    int64_t joined_sum = 0;
    int joined_maximum = INT_MIN;
    for (size_t i = 0; i < THREADS; i++) {
        int error = pthread_join(threads[i], NULL);
        if (error != 0) { errno = error; perror("pthread_join"); return EXIT_FAILURE; }
        if (tasks[i].error != 0) {
            errno = tasks[i].error; perror("worker mutex"); return EXIT_FAILURE;
        }
        joined_sum += tasks[i].local_sum;
        if (tasks[i].local_maximum > joined_maximum) joined_maximum = tasks[i].local_maximum;
    }
    int error = pthread_mutex_destroy(&shared.mutex);
    if (error != 0) { errno = error; perror("pthread_mutex_destroy"); return EXIT_FAILURE; }
    printf("mutex sum=%" PRId64 " max=%d\\n", shared.sum, shared.maximum);
    printf("joined sum=%" PRId64 " max=%d equal=%s\\n",
           joined_sum, joined_maximum,
           joined_sum == shared.sum && joined_maximum == shared.maximum ? "yes" : "no");
    return joined_sum == shared.sum && joined_maximum == shared.maximum
        ? EXIT_SUCCESS : EXIT_FAILURE;
}`,
    runCommand: './a21',
    expectedEvidence: 'Both lines report sum=64 and max=20, and the join-time reduction ends with equal=yes.',
    failureAnalysis: 'Updating sum or maximum without the mutex is a data race. Locking for each input serializes useful work. Per-thread partials avoid shared writes during computation, while the one-lock merge demonstrates safe shared aggregation.',
    verification: "./a21 | diff -u - <(printf 'mutex sum=64 max=20\\njoined sum=64 max=20 equal=yes\\n')",
  },
  {
    id: 'A22',
    title: 'Multiply validated matrices with bounded worker threads',
    mechanism: 'The program validates M, K, and N, checks allocation-size multiplication, and caps worker count at four and at the number of output rows. Each worker owns whole output rows, so no mutex is needed. Checked int64 multiply/add detects arithmetic overflow, and a serial pass independently verifies every cell.',
    stateDiagram: 'validated A[MxK] and B[KxN] -> at most min(M,4) disjoint row workers -> C_parallel -> serial C_reference -> cell-by-cell compare',
    pthread: true,
    source: `#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <inttypes.h>
#include <limits.h>
#include <pthread.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

struct task {
    const int64_t *a;
    const int64_t *b;
    int64_t *c;
    size_t m, k, n;
    size_t row_begin, row_end;
    int overflow;
};

static int checked_cell(const int64_t *a, const int64_t *b, size_t k, size_t n,
                        size_t row, size_t column, int64_t *result) {
    int64_t sum = 0;
    for (size_t inner = 0; inner < k; inner++) {
        int64_t left = a[row * k + inner];
        int64_t right = b[inner * n + column];
        if (left != 0 &&
            ((right > 0 && (left > INT64_MAX / right || left < INT64_MIN / right)) ||
             (right < 0 && ((left == INT64_MIN && right == -1) ||
                            left > INT64_MIN / right || left < INT64_MAX / right)))) {
            return -1;
        }
        int64_t product = left * right;
        if ((product > 0 && sum > INT64_MAX - product) ||
            (product < 0 && sum < INT64_MIN - product)) return -1;
        sum += product;
    }
    *result = sum;
    return 0;
}

static void *multiply_rows(void *opaque) {
    struct task *task = opaque;
    for (size_t row = task->row_begin; row < task->row_end; row++) {
        for (size_t column = 0; column < task->n; column++) {
            if (checked_cell(task->a, task->b, task->k, task->n,
                             row, column, &task->c[row * task->n + column]) < 0) {
                task->overflow = 1;
                return task;
            }
        }
    }
    return task;
}

static int parse_dimension(const char *text, size_t *value) {
    char *end = NULL;
    errno = 0;
    unsigned long parsed = strtoul(text, &end, 10);
    if (errno != 0 || end == text || *end != '\\0' || parsed == 0 || parsed > 128) return -1;
    *value = (size_t)parsed;
    return 0;
}

static void *allocate_matrix(size_t rows, size_t columns) {
    if (rows > SIZE_MAX / columns || rows * columns > SIZE_MAX / sizeof(int64_t)) return NULL;
    return calloc(rows * columns, sizeof(int64_t));
}

int main(int argc, char **argv) {
    if (argc != 4) {
        fprintf(stderr, "usage: %s M K N (each 1..128)\\n", argv[0]);
        return EXIT_FAILURE;
    }
    size_t m, k, n;
    if (parse_dimension(argv[1], &m) < 0 ||
        parse_dimension(argv[2], &k) < 0 ||
        parse_dimension(argv[3], &n) < 0) {
        fprintf(stderr, "invalid dimensions\\n");
        return EXIT_FAILURE;
    }
    int64_t *a = allocate_matrix(m, k);
    int64_t *b = allocate_matrix(k, n);
    int64_t *parallel = allocate_matrix(m, n);
    int64_t *serial = allocate_matrix(m, n);
    if (a == NULL || b == NULL || parallel == NULL || serial == NULL) {
        perror("allocate matrices");
        free(a); free(b); free(parallel); free(serial);
        return EXIT_FAILURE;
    }
    for (size_t i = 0; i < m * k; i++) a[i] = (int64_t)(i % 7) - 3;
    for (size_t i = 0; i < k * n; i++) b[i] = (int64_t)(i % 5) - 2;

    size_t worker_count = m < 4 ? m : 4;
    pthread_t threads[4];
    struct task tasks[4];
    for (size_t worker = 0; worker < worker_count; worker++) {
        tasks[worker] = (struct task){
            .a = a, .b = b, .c = parallel, .m = m, .k = k, .n = n,
            .row_begin = worker * m / worker_count,
            .row_end = (worker + 1) * m / worker_count
        };
        int error = pthread_create(&threads[worker], NULL, multiply_rows, &tasks[worker]);
        if (error != 0) { errno = error; perror("pthread_create"); return EXIT_FAILURE; }
    }
    for (size_t worker = 0; worker < worker_count; worker++) {
        int error = pthread_join(threads[worker], NULL);
        if (error != 0) { errno = error; perror("pthread_join"); return EXIT_FAILURE; }
        if (tasks[worker].overflow) { fprintf(stderr, "parallel arithmetic overflow\\n"); return EXIT_FAILURE; }
    }
    for (size_t row = 0; row < m; row++) {
        for (size_t column = 0; column < n; column++) {
            if (checked_cell(a, b, k, n, row, column, &serial[row * n + column]) < 0) {
                fprintf(stderr, "serial arithmetic overflow\\n");
                return EXIT_FAILURE;
            }
        }
    }
    int equal = 1;
    for (size_t i = 0; i < m * n; i++) {
        if (parallel[i] != serial[i]) equal = 0;
    }
    printf("M=%zu K=%zu N=%zu workers=%zu cells=%zu serial-match=%s checksum=%" PRId64 "\\n",
           m, k, n, worker_count, m * n, equal ? "yes" : "no", parallel[0]);
    free(a); free(b); free(parallel); free(serial);
    return equal ? EXIT_SUCCESS : EXIT_FAILURE;
}`,
    runCommand: './a22 6 5 4',
    expectedEvidence: 'The summary reports M=6 K=5 N=4 workers=4 cells=24 serial-match=yes with a deterministic first-cell checksum.',
    failureAnalysis: 'Dimension multiplication can overflow before allocation, arithmetic can overflow even when storage sizes are valid, and one thread per cell is unbounded overhead. Disjoint row ownership removes write races; the serial reference detects partition and indexing mistakes.',
    verification: "./a22 6 5 4 | grep -E '^M=6 K=5 N=4 workers=4 cells=24 serial-match=yes checksum=-?[0-9]+$' && ! ./a22 0 5 4 2>/dev/null",
  },
];

export const linuxLabs = Object.freeze(labSpecs.map(defineLab));
export const linuxLabById = new Map(linuxLabs.map((lab) => [lab.id, lab]));
