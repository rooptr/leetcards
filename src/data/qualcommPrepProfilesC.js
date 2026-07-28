const concept = (term, definition, example) => ({ term, definition, example });

export const qualcommPrepProfilesC = {
  'qualcomm-c-output-semantics': {
    definition: 'A C output question is a language-law question before it is a calculation question: first decide whether the program is valid and defined, then apply sequencing, conversions, storage, and pointer rules to determine any portable result.',
    application: 'Firmware reviews use the same discipline. A line that appears to update three flags may actually contain an unsequenced modification, a short-circuited read, or an invalid register access that changes under optimization.',
    prediction: 'For `i = -1, j = -1, k = 0, l = 2`, predict every final value after `m = i++ && j++ && k++ || l++;` before reading the trace.',
    explanation: 'Do not execute punctuation from left to right. Parse by precedence, then honor the sequence points created by `&&` and `||`. Short-circuiting decides which operands run. Separately, reject code that violates a constraint, and label undefined or implementation-defined behavior instead of selecting a convenient machine result.',
    concepts: [
      concept('Defined behavior', 'The C standard specifies the relevant operation well enough that every conforming implementation must respect the same abstract result, although representation details may still differ.', 'The logical operators sequence their operands, so the post-increments in the short-circuit expression can be traced exactly.'),
      concept('Undefined behavior', 'The program violates a rule for which the C standard imposes no requirements; after that point the compiler is not required to preserve the source-level story.', 'Multiple unsequenced writes to one scalar are not a puzzle with a secret answer. They make the program undefined.'),
      concept('Constraint violation', 'A constraint is a compile-time language requirement for which a conforming implementation must issue a diagnostic; continuing after the diagnostic is implementation-specific.', 'Applying `&` to an object declared with the `register` storage-class specifier violates a C constraint.'),
      concept('Unspecified behavior', 'The implementation may choose one of several permitted outcomes and is not required to document which choice it makes for each execution.', 'Argument evaluation order is often unspecified even when each individual argument expression is otherwise valid.'),
      concept('Implementation-defined behavior', 'The implementation chooses one permitted behavior and must document its choice, usually for target properties such as integer widths or signed right shift.', 'Converting an arbitrary integer such as 100 to a pointer is implementation-defined and may not produce a usable address.'),
      concept('Short-circuit sequencing', '`&&` evaluates its right operand only if the left operand is nonzero, while `||` evaluates its right operand only if the left operand is zero; each left operand is sequenced before the right.', '`k++` evaluates to zero, so the `&&` chain stops and `l++` is then evaluated by `||`.'),
      concept('Array object is not assignable', 'An array name may convert to a pointer to its first element in many expressions, but the array object itself is not a modifiable lvalue and cannot be incremented or assigned.', 'For `int a[3]`, `a++` and `a = a + 1` are invalid, while `a[0] = a[1] + a[0]` is valid.'),
      concept('Recursive static state', 'A block-scope `static` object is initialized once and retains one shared value across every recursive invocation rather than creating one copy per stack frame.', 'The recursive `main` example prints 5 through 1 because all calls decrement the same static `var`.'),
      concept('Pointer-adjusted string write', 'Incrementing a pointer changes the address held by that pointer, not the original array; later indexing is relative to the adjusted address.', 'After `k++`, `k[2] = \'m\'` changes the original string element at index 3, but `*s` remains `\'h\'`.'),
      concept('Program argument count', '`argc` is nonnegative and normally includes the program name when the hosted implementation supplies it, so launching without extra arguments ordinarily gives one.', 'The intended interview answer for a normal hosted launch is `argc == 1`, while freestanding firmware has no hosted `main(argc, argv)` contract.'),
    ],
    steps: [
      'Parse precedence: `&&` binds more tightly than `||`, so the expression is `(i++ && j++ && k++) || l++`.',
      '`i++` yields -1, which is true, and leaves `i` as 0; therefore `j++` runs.',
      '`j++` yields -1, which is true, and leaves `j` as 0; therefore `k++` runs.',
      '`k++` yields 0, which is false, and leaves `k` as 1; the remaining `&&` work stops.',
      'The left side of `||` is false, so `l++` yields 2, leaves `l` as 3, and makes the logical result 1.',
      'Assignment stores 1 in `m`; the portable final state is `0 0 1 3 1`.',
    ],
    failure: 'The common failure is to compute an output for invalid code. `%u` with a pointer argument is a format mismatch, arbitrary integer-to-pointer arithmetic has no portable numeric answer, taking the address of a `register` object violates a language constraint, and unsequenced modifications can produce undefined behavior. Classify the program before attempting arithmetic.',
    practice: 'For each screenshot question, write one of four labels first: valid and defined, valid but unspecified, implementation-defined, or invalid/undefined. Only then write the output and justify every evaluated operand.',
    sourcePrompts: [
      'Trace the short-circuit post-increment expression that ends in `0 0 1 3 1`.',
      'Explain why taking the address of a `register int` is not a portable output question.',
      'Trace the adjusted string pointer and the write through `k[2]`.',
      'Predict `argc` when no user arguments are supplied.',
      'Trace static state through the recursive `main` example.',
      'Explain the enum values after explicit enumerators reset the sequence.',
      'Explain the struct-return and global-versus-local pointer member output.',
      'Explain why the hard-coded pointer-address arithmetic question has no portable numeric answer.',
      'Decide which operations on an array name are valid.',
      'Reject incomplete output questions when the actual code is missing.',
    ],
    codeExamples: [{
      heading: 'Make the sequencing visible',
      language: 'C17',
      code: `#include <stdio.h>

int main(void)
{
    int i = -1;
    int j = -1;
    int k = 0;
    int l = 2;
    int m = i++ && j++ && k++ || l++;

    printf("%d %d %d %d %d\\n", i, j, k, l, m);
    return 0;
}`,
    }],
  },

  'qualcomm-c-storage-lifetime': {
    definition: 'Storage duration tells when an object’s storage exists, scope tells where its name is visible, linkage tells whether declarations denote the same entity, and qualifiers such as `volatile` constrain how accesses may be optimized.',
    application: 'A file-local driver flag, an interrupt-updated register, an automatic parser buffer, and heap-owned packet storage can all contain identical bytes while obeying different lifetime and visibility rules.',
    prediction: 'If an interrupt changes a memory-mapped status register but the C object is not volatile-qualified, what is the compiler allowed to do with a polling loop?',
    explanation: 'Interview answers often collapse storage class, memory segment, and lifetime into one phrase. Keep them separate. `auto`, `static`, `extern`, and `register` are declaration tools; stack, data, BSS, read-only data, heap, and text are common executable/process regions; neither list is a one-to-one language guarantee.',
    concepts: [
      concept('Automatic storage duration', 'A block object without `static` has storage for the execution of its enclosing block or call, with a fresh instance for recursive calls.', 'A local parsing buffer normally belongs to one stack frame and disappears when the function returns.'),
      concept('Static storage duration', 'A file-scope object and a block object declared `static` exist for the entire program execution and are initialized before ordinary program work begins.', 'A block-scope retry counter declared static retains its value across function calls.'),
      concept('External linkage', 'An entity with external linkage can be named from other translation units through compatible declarations, usually declared in a header with `extern` and defined once in a source file.', 'A global device registry can be defined in one C file and declared in a shared header.'),
      concept('Internal linkage', 'A file-scope name declared `static` denotes an entity private to that translation unit, preventing accidental symbol collisions and limiting the public interface.', 'A helper lookup table used by one driver should normally have internal linkage.'),
      concept('Register storage-class specifier', '`register` is a historical optimization hint for an automatic object and prohibits applying the address operator to that declared object in C; it does not prove placement in a CPU register.', 'The compiler may spill a register-declared object to memory, but `&object` is still a language constraint violation.'),
      concept('volatile-qualified access', '`volatile` tells the compiler that each abstract-machine access is observable and must not be removed or merged as if no outside agent could change the object.', 'Memory-mapped peripheral registers and simple ISR-shared flags commonly require volatile-qualified accesses.'),
      concept('What volatile does not provide', '`volatile` does not make a compound operation atomic, does not create inter-thread ordering, and does not replace a mutex or C atomic type.', '`counter++` on a volatile shared counter can still lose updates between threads.'),
      concept('Text, data, BSS, heap, and stack', 'These are conventional executable and process-memory regions: code in text, initialized static objects in data, zero-initialized static objects in BSS, dynamic allocations in the heap, and call state in stacks.', 'Use the linker map and `/proc/<pid>/maps` to verify actual placement instead of treating the textbook diagram as a C guarantee.'),
      concept('Dynamic allocation lifetime', 'Storage returned by `malloc` remains allocated until it is released with `free`; its lifetime is independent of the block in which the pointer variable was declared.', 'Returning a heap pointer can be valid, while returning the address of an automatic local object is not.'),
    ],
    steps: [
      'Name the object and identify its declaration location.',
      'Determine scope, linkage, and storage duration separately.',
      'Determine who can change the stored value: this thread, another thread, an ISR, DMA, or hardware.',
      'Choose `volatile`, atomics, or synchronization based on that changer; they solve different problems.',
      'Use a linker map, debugger address, or process memory map to confirm physical placement.',
    ],
    failure: 'Saying “volatile stores the variable in RAM” or “static means global” loses the actual rules. Another frequent error is using volatile as thread synchronization, which preserves accesses but not atomicity or happens-before ordering.',
    practice: 'Classify a file-local lookup table, an ISR flag, an exported configuration object, a recursive local variable, and a heap buffer by scope, linkage, storage duration, likely region, and synchronization requirement.',
    sourcePrompts: [
      'Explain all C storage classes with examples.',
      'Explain static variables and static functions.',
      'Explain volatile, why it is used, and what it cannot do.',
      'Explain program memory segments and the specialty of heap storage.',
      'Distinguish static and dynamic allocation.',
      'Explain process memory structure in a C program.',
    ],
    codeExamples: [{
      heading: 'Separate visibility, lifetime, and hardware observation',
      language: 'C17',
      code: `#include <stdint.h>

static uint32_t file_private_count;
uint32_t exported_count;

static volatile const uint32_t *const status_register =
    (volatile const uint32_t *)0x40000000u;

static uint32_t next_sequence(void)
{
    static uint32_t sequence;
    return ++sequence;
}

int main(void)
{
    while ((*status_register & 1u) == 0u) {
        file_private_count = next_sequence();
    }
    exported_count = file_private_count;
    return 0;
}`,
    }],
  },

  'qualcomm-c-pointers-arrays': {
    definition: 'A pointer is an object that stores an address representation for a particular pointed-to type; array-to-pointer conversion, pointer arithmetic, const placement, and pointer depth determine what address movement and mutation are legal.',
    application: 'DMA buffers, register blocks, packet payloads, matrices, and linked structures all depend on preserving both the address and the type/extent information needed to interpret the bytes safely.',
    prediction: 'Given `const int *p`, `int *const q`, and `const int *const r`, which declarations allow changing the pointee and which allow changing the stored address?',
    explanation: 'Read declarators from the identifier outward. Preserve matrix stride in the pointer type. A pointer to the first element of a row is not enough to recover an unknown column count, so a request to index an unknown 2D array is incomplete unless dimensions or stride accompany the base address.',
    concepts: [
      concept('Null pointer', 'A null pointer value intentionally points to no object or function and is used as a sentinel; it must be checked before dereference.', '`int *p = NULL;` is a valid empty state, while `*p` is invalid until `p` receives an object address.'),
      concept('Dangling pointer', 'A dangling pointer retains an address after the pointed-to object’s lifetime has ended or allocation has been released.', 'A pointer to a freed node must not be read even if the old bytes appear unchanged.'),
      concept('Wild pointer', 'A wild pointer is informal terminology for an indeterminate or uninitialized pointer whose stored bits do not designate a known valid object.', 'Initialize optional pointers to null instead of testing an uninitialized local pointer.'),
      concept('Void pointer', '`void *` can carry an object pointer without pointed-to type information; it must be converted to a correctly aligned compatible object-pointer type before dereference.', '`malloc` returns `void *`, but the allocation still needs a chosen element type and count.'),
      concept('Pointer to const', '`const int *p` permits changing the address stored in `p` but prohibits modifying an `int` through that pointer expression.', 'The pointer may advance through a read-only input buffer.'),
      concept('Const pointer', '`int *const p` fixes the address stored in `p` after initialization but permits mutation of the pointed-to `int`.', 'A driver handle can keep one register-block base while allowing register writes.'),
      concept('Double pointer', 'A pointer-to-pointer stores the address of another pointer object and is used when a function must replace a caller-owned pointer or represent an array of pointers.', '`char **argv` is an array-like sequence of pointers to argument strings.'),
      concept('Safe double-pointer allocation', 'Allocate the outer pointer array and each inner allocation deliberately, unwind partial failure, and carry every extent needed for cleanup.', 'A matrix represented as row pointers needs `rows` outer entries and one allocation or explicit allocation per row.'),
      concept('Array decay', 'In most expressions an array expression converts to a pointer to its first element, but `sizeof array`, unary `&array`, and string-literal initialization are important exceptions.', '`sizeof a` inside the declaring scope can report the full array bytes, while a function parameter written `int a[]` is adjusted to `int *a`.'),
      concept('Pointer to an array', '`int (*p)[COLS]` points to one complete row of `COLS` integers, so incrementing `p` advances by the row stride.', 'Use `p[row][column]` when the column count is part of the pointer type.'),
      concept('Unknown 2D element type or stride', 'A raw base address alone cannot determine element width, row stride, dimensions, padding, or bounds, so general indexing is impossible without metadata.', 'Ask for element size, rows, columns, and row stride before computing a byte offset.'),
    ],
    steps: [
      'Read the declaration from the identifier outward and state whether the pointer, pointee, or both are const-qualified.',
      'Identify the pointed-to object and prove its lifetime still includes the access.',
      'Carry element count and, for matrices, row stride or a pointer-to-array type.',
      'Perform pointer arithmetic only within one array object or one past its end.',
      'Check allocation multiplication for overflow, then release every successful inner and outer allocation.',
    ],
    failure: 'The most dangerous answer treats an address as sufficient type information. It is not. Losing a matrix stride, dereferencing an arbitrary integer address, or returning a pointer to an expired automatic object makes the later arithmetic meaningless.',
    practice: 'Write declarations for a movable read-only input pointer, a fixed writable register pointer, and a fully fixed read-only pointer. Then implement a checked row-pointer matrix allocation and cleanup path.',
    sourcePrompts: [
      'Explain dangling, null, wild, and void pointers.',
      'Explain pointer-to-const versus const-pointer declarations.',
      'Explain double pointers and allocate memory for one safely.',
      'Explain pass-by-value and the pointer-based technique commonly called pass-by-reference in C.',
      'Explain arrays versus linked lists and why array names cannot be incremented.',
      'Explain 2D arrays and access through a base pointer when type and stride are known.',
      'Explain why an unknown element type makes the 2D indexing prompt underspecified.',
    ],
    codeExamples: [{
      heading: 'Allocate and release a row-pointer matrix',
      language: 'C17',
      code: `#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

static int **matrix_create(size_t rows, size_t columns)
{
    if (rows == 0 || columns == 0 ||
        rows > SIZE_MAX / sizeof(int *) ||
        columns > SIZE_MAX / sizeof(int)) {
        return NULL;
    }

    int **matrix = calloc(rows, sizeof(*matrix));
    if (matrix == NULL) {
        return NULL;
    }

    for (size_t row = 0; row < rows; ++row) {
        matrix[row] = calloc(columns, sizeof(*matrix[row]));
        if (matrix[row] == NULL) {
            while (row > 0) {
                free(matrix[--row]);
            }
            free(matrix);
            return NULL;
        }
    }
    return matrix;
}

static void matrix_destroy(int **matrix, size_t rows)
{
    if (matrix == NULL) {
        return;
    }
    for (size_t row = 0; row < rows; ++row) {
        free(matrix[row]);
    }
    free(matrix);
}

int main(void)
{
    int **matrix = matrix_create(3, 4);
    if (matrix == NULL) {
        return 1;
    }
    matrix[2][1] = 42;
    printf("%d\\n", matrix[2][1]);
    matrix_destroy(matrix, 3);
    return 0;
}`,
    }],
  },

  'qualcomm-c-aggregate-layout': {
    definition: 'Structures store all members in one object with implementation-chosen padding, unions overlap member storage, enumerations create named integer constants, and correct access depends on layout, alignment, and which representation is currently valid.',
    application: 'Protocol headers, peripheral register maps, tagged messages, and packed storage formats use aggregates, but production code must distinguish convenient C layout from a stable wire or hardware layout.',
    prediction: 'If a union stores an integer and is then read through its floating member, what evidence tells the program which interpretation is intended?',
    explanation: 'A structure’s size is at least the sum of member sizes but may be larger because each member and the overall object must satisfy alignment. A union’s size supports its largest member, but it does not automatically remember the active semantic type. Store an explicit tag beside it when runtime code needs to know.',
    concepts: [
      concept('Structure', 'A structure is an aggregate whose members have distinct storage locations in declaration order, separated by any padding required by the implementation.', 'A sensor sample structure can hold timestamp, channel, and reading simultaneously.'),
      concept('Structure padding', 'Padding bytes may be inserted before members or at the end so each member and every array element meets its alignment requirement.', 'Ordering `char`, `uint32_t`, `char` often produces more padding than grouping fields by alignment.'),
      concept('Union', 'A union provides overlapping storage large and aligned enough for any one member; writing one member changes the shared object representation.', 'A tagged packet value can store either an integer code or a floating measurement in the same payload storage.'),
      concept('Tagged union', 'A tagged union pairs the union with an enum or other discriminator that records which member the program is currently allowed to interpret.', 'Set `kind = VALUE_FLOAT` whenever the floating member is written, and switch on the tag before reading.'),
      concept('Enum progression', 'An unassigned enumerator receives zero for the first item or one more than the previous enumerator, including after an explicitly assigned value.', 'With `ORANGE=5, MANGO, BANANA=4, PEACH`, the values are 5, 6, 4, and 5.'),
      concept('Bit-field caution', 'Bit-field allocation order, alignment, and interaction with storage units are implementation-defined, so bit-fields are poor portable wire-format definitions.', 'Use masks and shifts for a protocol byte whose bit positions are specified externally.'),
      concept('Serialized layout', 'A stable file, network, or peripheral format must define exact widths, byte order, and offsets independently of compiler structure layout.', 'Read bytes and decode fields explicitly instead of sending a native padded structure over a socket.'),
    ],
    steps: [
      'List each member’s size and alignment requirement.',
      'Advance the offset to the next address satisfying that member’s alignment.',
      'After the last member, round total size to the structure alignment for array stride.',
      'For a union, choose one semantic member and store an explicit discriminator when later code must know the choice.',
      'For external formats, replace layout assumptions with fixed-width decoding and `_Static_assert` checks.',
    ],
    failure: 'The source notes sometimes treat “the last union field assigned” as discoverable metadata. C stores no automatic active-member tag. Without an explicit discriminator or a protocol-level rule, later code cannot reliably know the intended member.',
    practice: 'Compute the likely layout of three differently ordered structures, verify with `offsetof`, then implement a tagged union whose print function rejects an unknown tag.',
    sourcePrompts: [
      'Explain structure versus union with a real system use.',
      'Explain structure padding.',
      'Explain how to know which union member is valid.',
      'Trace the struct-return example with pointer-valued members.',
      'Trace enum values after explicit assignments.',
      'Explain why native struct layout is not automatically a protocol layout.',
    ],
    codeExamples: [{
      heading: 'Make the active union member explicit',
      language: 'C17',
      code: `#include <stdio.h>

enum value_kind {
    VALUE_INTEGER,
    VALUE_FLOAT
};

struct value {
    enum value_kind kind;
    union {
        int integer;
        double floating;
    } data;
};

static void print_value(const struct value *value)
{
    switch (value->kind) {
    case VALUE_INTEGER:
        printf("%d\\n", value->data.integer);
        break;
    case VALUE_FLOAT:
        printf("%.2f\\n", value->data.floating);
        break;
    default:
        fputs("invalid value tag\\n", stderr);
        break;
    }
}

int main(void)
{
    const struct value sample = {
        .kind = VALUE_FLOAT,
        .data.floating = 3.25
    };
    print_value(&sample);
    return 0;
}`,
    }],
  },

  'qualcomm-c-macros-build': {
    definition: 'The C build transforms source through preprocessing, compilation, assembly, and linking; macros rewrite tokens before type checking, while constants, functions, object files, libraries, and Make dependencies participate at later, more strongly checked stages.',
    application: 'Embedded builds use macros for target selection and register masks, headers for interfaces, static libraries for reusable firmware components, dynamic libraries for host tools, and Make or CMake to rebuild only artifacts affected by a change.',
    prediction: 'Why can a macro written as `#define MAX(a,b) a > b ? a : b` produce the wrong result even when both arguments are integers?',
    explanation: 'Macros do not evaluate C values; they substitute tokens. Parenthesize the full expansion and each parameter, avoid arguments with side effects, and prefer inline functions when type checking matters. Then explain the build as artifact creation: preprocessed translation unit, object code and symbols, and linker resolution.',
    concepts: [
      concept('Object-like macro', 'An object-like macro replaces an identifier token sequence before the compiler performs C parsing and type checking.', '`#define BUFFER_CAPACITY 64u` is useful for conditional compilation but has no C type.'),
      concept('Function-like macro', 'A function-like macro substitutes parameter tokens into its replacement list and can evaluate an argument more than once unless carefully designed.', '`MAX(i++, j++)` is unsafe when the macro references its winning argument again.'),
      concept('const object', 'A const-qualified object is a typed C object whose stored value cannot be modified through that lvalue; it obeys scope, linkage, and storage rules.', '`static const size_t capacity = 64;` gives the compiler and debugger a typed object.'),
      concept('Translation unit', 'After preprocessing, one source file together with included declarations forms a translation unit compiled independently into an object file.', 'A header should declare an exported function, while exactly one source file defines it.'),
      concept('Compiler and assembler output', 'Compilation analyzes C semantics and emits target assembly or machine-level representation; assembly turns assembly input into relocatable object code.', 'Warnings about types arise before the linker knows where external symbols will be placed.'),
      concept('Linker', 'The linker resolves symbols and relocations, combines sections, reports missing or duplicate definitions, and emits an executable or firmware image.', 'A declared but undefined function normally becomes an undefined-reference error at link time.'),
      concept('Static library', 'A static library is an archive of object files from which required members are copied into the final link, making those selected implementations part of the executable.', 'A firmware math helper can be linked from `libmathutil.a` without requiring a runtime library file.'),
      concept('Dynamic library', 'A dynamic or shared library is mapped and bound at load time or runtime, allowing code sharing and independent replacement subject to ABI compatibility.', 'A Linux host utility may load `libcapture.so` through the dynamic loader.'),
      concept('Make dependency graph', 'Make compares targets, prerequisites, and timestamps to run recipes needed to bring derived artifacts up to date.', 'An object target should depend on its source and every header that affects that translation unit.'),
      concept('Macro size query', 'A macro can expand to `sizeof(type)`, but a normal `sizeof` expression already yields a `size_t` and preserves type checking; a macro cannot discover an unknown runtime type.', '`#define TYPE_SIZE(type) sizeof(type)` is only syntactic convenience, not reflection.'),
    ],
    steps: [
      'Preprocess includes, conditional branches, and macro replacements into one translation unit.',
      'Compile with warnings enabled and stop on language errors before diagnosing the linker.',
      'Assemble into an object containing sections, symbols, and relocations.',
      'Link object files and selected library members; inspect unresolved or multiply defined symbols.',
      'Use a dependency-aware build file so header changes rebuild every affected object.',
    ],
    failure: 'Typical weak answers say “macro is faster than const” or “static linking happens at compile time.” Macros are token substitution, and libraries are selected or bound by link/load stages. Performance depends on generated code, not the spelling alone.',
    practice: 'Use `cc -E`, `cc -S`, `cc -c`, `nm`, and the final linker command on one small program. Record the artifact and unresolved symbols after every stage.',
    sourcePrompts: [
      'Explain macro versus const.',
      'Write a safe maximum-of-three macro and name its side-effect limitation.',
      'Write a macro for a datatype size and explain what it can and cannot infer.',
      'Explain preprocessing, compilation, assembly, and linking.',
      'Explain the purpose of a Makefile.',
      'Compare static and dynamic libraries.',
      'Explain dynamic versus static linking in Linux.',
    ],
    codeExamples: [{
      heading: 'Prefer a checked inline function for evaluated values',
      language: 'C17',
      code: `#include <stdio.h>

#define MAX_OF_THREE(a, b, c) \\
    (((a) > (b)) ? (((a) > (c)) ? (a) : (c)) \\
                   : (((b) > (c)) ? (b) : (c)))

static inline int max_of_three_int(int a, int b, int c)
{
    int maximum = a > b ? a : b;
    return maximum > c ? maximum : c;
}

int main(void)
{
    printf("%d\\n", MAX_OF_THREE(4, 9, 2));
    printf("%d\\n", max_of_three_int(4, 9, 2));
    return 0;
}`,
    }],
  },

  'qualcomm-c-bits-endian': {
    definition: 'Bit manipulation treats an unsigned integer as a fixed-width collection of bit positions; masks select fields, shifts move positions, rotations preserve all bits, and endianness describes byte order in memory rather than the written numeric value.',
    application: 'Peripheral registers, network headers, codecs, checksums, packed flags, and cryptographic primitives all require explicit width, unsigned operations, and reviewed shift counts.',
    prediction: 'For `0x4D3C2B1A`, list the four bytes in increasing memory addresses on a little-endian machine, then predict the result of a 32-bit byte swap.',
    explanation: 'Choose an unsigned fixed-width type first. Guard every shift count. A rotate combines opposite-direction shifts while masking the count; a byte swap extracts each byte and places it at the mirrored position. Do not detect machine endianness merely to decode a protocol whose byte order is already specified.',
    concepts: [
      concept('Bit mask', 'A mask has selected one-bits used with AND to extract, OR to set, XOR to toggle, or AND with a complement to clear positions.', '`value & (1u << bit)` tests one position after validating that `bit` is in range.'),
      concept('Logical shift', 'A shift on an unsigned value introduces zero bits and is defined only when the count is less than the promoted type width.', 'Use `uint32_t` and reject shift counts of 32 or more.'),
      concept('Rotation', 'A rotation moves bits circularly so bits shifted out of one end re-enter the other end, preserving the complete width.', 'A left rotate by `n` combines `(x << n)` with `(x >> (width - n))` after reducing and guarding `n`.'),
      concept('Population count', 'Population count is the number of one-bits in an integer representation; repeatedly clearing the lowest set bit runs once per one-bit.', '`x &= x - 1` removes the least significant set bit from nonzero unsigned `x`.'),
      concept('Swap two bit positions', 'Read the two selected bits; when they differ, XOR the value with masks for both positions so both flip in one operation.', 'Swapping equal bits changes nothing, which avoids separate set and clear branches.'),
      concept('Endianness', 'Endianness is the order in which bytes of a multi-byte object are stored at increasing addresses; it does not reverse bit order inside each byte.', 'Little endian stores the least significant byte `0x1A` first for `0x4D3C2B1A`.'),
      concept('Byte swap', 'A byte swap reverses byte positions within a fixed-width word and is often used when converting between host and specified external byte order.', '`0x4D3C2B1A` becomes `0x1A2B3C4D` after a 32-bit byte swap.'),
      concept('XOR unpaired element', 'When every integer occurs exactly twice except one, XOR cancellation leaves the unpaired value because `x ^ x` is zero and zero is the identity.', '`1 ^ 2 ^ 2 ^ 1 ^ 5` evaluates to 5 regardless of order.'),
    ],
    steps: [
      'Select `uint32_t` so width and shift behavior are explicit.',
      'Validate every caller-supplied bit position or shift count.',
      'Build masks from unsigned one values and inspect bits before changing them.',
      'For byte order, draw addresses and bytes rather than reversing the hexadecimal text mentally.',
      'Test zero, all ones, the highest bit, and counts at both width boundaries.',
    ],
    failure: 'Shifting a signed negative value, shifting by the type width, assuming `int` is 32 bits, or confusing byte order with textual digit order makes a seemingly clever bit trick nonportable.',
    practice: 'Implement and test population count, left/right rotate, two-bit swap, and 32-bit byte swap with `0`, one-bit values, `UINT32_MAX`, and boundary positions.',
    sourcePrompts: [
      'Count the one-bits in an integer.',
      'Rotate bits using bitwise operators.',
      'Swap two supplied bit positions.',
      'Convert `0x4D3C2B1A` to `0x1A2B3C4D`.',
      'Explain little endian versus big endian.',
      'Find the element without a duplicate using XOR.',
      'Explain bitwise recurrence operands before optimizing the recurrence.',
    ],
    codeExamples: [{
      heading: 'Use fixed-width unsigned bit operations',
      language: 'C17',
      code: `#include <inttypes.h>
#include <stdint.h>
#include <stdio.h>

static unsigned popcount32(uint32_t value)
{
    unsigned count = 0;
    while (value != 0u) {
        value &= value - 1u;
        ++count;
    }
    return count;
}

static uint32_t swap_bits32(uint32_t value, unsigned a, unsigned b)
{
    if (a >= 32u || b >= 32u) {
        return value;
    }
    const uint32_t bit_a = (value >> a) & 1u;
    const uint32_t bit_b = (value >> b) & 1u;
    if (bit_a != bit_b) {
        value ^= (UINT32_C(1) << a) | (UINT32_C(1) << b);
    }
    return value;
}

static uint32_t byte_swap32(uint32_t value)
{
    return ((value & UINT32_C(0x000000ff)) << 24) |
           ((value & UINT32_C(0x0000ff00)) << 8) |
           ((value & UINT32_C(0x00ff0000)) >> 8) |
           ((value & UINT32_C(0xff000000)) >> 24);
}

int main(void)
{
    const uint32_t value = UINT32_C(0x4d3c2b1a);
    printf("ones=%u swapped=%08" PRIx32 " bits=%08" PRIx32 "\\n",
           popcount32(value), byte_swap32(value), swap_bits32(value, 0, 31));
    return 0;
}`,
    }],
  },

  'qualcomm-c-safe-arithmetic': {
    definition: 'Safe integer arithmetic proves that each operation is representable before performing it, while control flow and recursion define which operations occur and how call state is bounded.',
    application: 'Sensor averaging, timestamp deltas, buffer sizes, financial counters, and packet lengths can fail at boundary values even when ordinary examples are correct.',
    prediction: 'Why can `(a + b) / 2` overflow even when the mathematical average lies inside the integer range, and which rewrite avoids that intermediate overflow?',
    explanation: 'Do not rely on wraparound for signed integers. Rearrange an average as `a + (b - a) / 2` only after considering subtraction range, or use half-plus-remainder decomposition. For swaps, XOR is legal only for distinct objects and is less clear than a temporary; arithmetic swaps can overflow.',
    concepts: [
      concept('Signed overflow', 'When a signed integer operation produces a result outside the representable range, C behavior is undefined rather than guaranteed wraparound.', '`INT_MAX + 1` is not a portable way to obtain `INT_MIN`.'),
      concept('Unsigned wraparound', 'Unsigned arithmetic is performed modulo one more than the maximum value, which is defined but may still violate an application invariant.', 'A byte counter wrapping at 256 is valid arithmetic but can break a length check.'),
      concept('Overflow-safe average', 'An average implementation must avoid an overflowing intermediate sum and define rounding for mixed signs.', 'Splitting each operand into halves and combining remainders avoids computing `a + b` directly.'),
      concept('Swap without a temporary', 'XOR swap can exchange two distinct integer objects without extra storage, but aliasing the same object zeroes it and the code is harder to audit.', 'In production C, a typed temporary is usually safer and optimizes just as well.'),
      concept('Switch versus if/else-if', '`switch` selects among integral constant labels for one controlling expression; an if-chain can express ranges, compound predicates, and unrelated conditions.', 'A command opcode fits `switch`; a thermal policy based on temperature ranges needs `if` conditions.'),
      concept('Recursion', 'A recursive function invokes itself on a smaller state and requires a reachable base case; each non-tail call consumes another activation record.', 'Factorial stops at zero or one and multiplies while calls return.'),
      concept('Sum without a loop or conditional statement', 'The closed form `n(n+1)/2` computes a range sum without iteration, but multiplication order must still avoid overflow.', 'For 0 through 100 the exact sum is 5050; for general large `n`, widen and divide an even factor first.'),
      concept('Fibonacci complexity', 'Naive recursive Fibonacci repeats subproblems exponentially, while an iterative pair update computes the sequence in linear time and constant extra space.', 'Maintain consecutive values `(previous, current)` and advance them once per output.'),
    ],
    steps: [
      'Write the mathematical result range and the C type range.',
      'Identify every intermediate expression, not just the final value.',
      'Reorder or widen operations without changing required rounding.',
      'Define behavior for negative values, equal pointers, zero, and maximum inputs.',
      'Compile with undefined-behavior sanitization and test boundaries.',
    ],
    failure: 'A clever expression is not safe merely because it avoids a temporary or branch. Arithmetic swap can overflow, XOR swap breaks for aliased operands, and recursion can exhaust the stack even when each local calculation is correct.',
    practice: 'Test average with `INT_MAX`, `INT_MIN`, opposite signs, and odd sums. Compare recursive and iterative Fibonacci call counts, and explain when `switch` cannot replace a range-based if-chain.',
    sourcePrompts: [
      'Find the average of two integers while handling overflow and underflow.',
      'Swap two numbers without a temporary and critique the technique.',
      'Find the sum from 0 through 100 without a loop or condition.',
      'Write Fibonacci and factorial programs and explain recursion.',
      'Compare switch with else-if using real control policies.',
      'Explain unary-operator and precedence output questions.',
      'Write prime and odd/even logic with boundary handling.',
    ],
    codeExamples: [{
      heading: 'Compute a truncating integer average without overflowing the sum',
      language: 'C17',
      code: `#include <limits.h>
#include <stdio.h>

static int average_int(int a, int b)
{
    const int half_sum = a / 2 + b / 2;
    const int remainder_sum = a % 2 + b % 2;
    return half_sum + remainder_sum / 2;
}

int main(void)
{
    printf("%d\\n", average_int(INT_MAX, INT_MAX));
    printf("%d\\n", average_int(INT_MIN, INT_MIN));
    printf("%d\\n", average_int(INT_MIN, INT_MAX));
    return 0;
}`,
    }],
  },

  'qualcomm-c-strings-files': {
    definition: 'C strings are null-terminated byte sequences whose bounds live outside the pointer; robust string, file, callback, and pattern programs therefore carry capacities, validate I/O, and make ownership and iteration explicit.',
    application: 'Log filters, boot configuration parsers, command dispatch tables, diagnostic pattern generators, and firmware text protocols all use these exact mechanisms.',
    prediction: 'When reversing a string into a separate destination, which byte must be written after the final copied character, and how large must the destination be?',
    explanation: 'The folder mixes short coding exercises with production concerns. Implement each small algorithm completely: receive capacity, check open/read/write results, terminate output strings, avoid `while (!feof(file))`, and define tokenization. Function pointers then provide typed callback dispatch rather than hidden control flow.',
    concepts: [
      concept('Null-terminated string', 'A C string is a sequence of non-null bytes followed by one null byte; a character buffer is not a string until that terminator is present within bounds.', 'A destination reversing seven characters needs capacity for eight bytes.'),
      concept('Palindrome check', 'A palindrome check compares mirrored characters while two indices move inward and can define whether case, spaces, or punctuation are normalized.', 'For an exact byte palindrome, compare index 0 with length-1, then continue until indices cross.'),
      concept('Function pointer', 'A function pointer stores the address of a function with a compatible signature and enables callbacks, dispatch tables, and strategy selection.', 'An interrupt-vector table and a command parser can map identifiers to handler functions.'),
      concept('Callback contract', 'A callback API defines when the function is invoked, what context pointer is supplied, who owns data, and which operations are permitted during the call.', 'A sort comparator may inspect elements but must obey the exact comparator signature and ordering rules.'),
      concept('Checked file loop', 'A file-processing loop uses the return value of `fgets`, `fscanf`, `fread`, or `read` as the authoritative statement of what data was obtained.', '`while (fgets(line, sizeof line, input) != NULL)` processes every complete or partial final line safely.'),
      concept('Word-length filter', 'A word-length filter must define token characters, reset length at delimiters, and handle a final word before end-of-file.', 'The requested log task counts lengths 3, 4, and 5 while writing each four-character token to an output file.'),
      concept('Duplicate-name count', 'Counting duplicate names is a frequency-table problem: normalize one name per record, increment its count, and report entries whose count exceeds one.', 'A hash table avoids the quadratic repeated scan used by a naive pairwise solution.'),
      concept('Symmetric pattern bounds', 'A rise-then-fall pattern has `2*n-1` rows, with row width `min(row, 2*n-row)` for one-based row numbers.', 'The supplied programs print `1..limit` or powers of two through `limit` on each row.'),
      concept('File token reversal', 'Reversing `a,b,c` into `c,b,a` requires parsing tokens, not reversing every byte, because byte reversal would also move characters inside multi-character tokens.', 'Read delimited fields, store or stack them, then emit fields in reverse order with checked separators.'),
    ],
    steps: [
      'State the input representation, maximum size, and ownership of every buffer.',
      'Check every open, allocation, read, and write result at the point it occurs.',
      'Separate parsing from transformation so malformed input has one clear rejection path.',
      'Write the output terminator or final delimiter explicitly.',
      'Test empty input, one item, maximum length, missing final newline, duplicate records, and write failure.',
    ],
    failure: 'The supplied `reverse_string.c` demonstrates the core loop but its API has no destination capacity and returns `int` without returning a value. The prep implementation teaches the intended algorithm while correcting those interface defects.',
    practice: 'Implement reverse, palindrome, four-character log extraction, duplicate-name counts, token-order reversal, and both symmetric number patterns. Compile with `-Wall -Wextra -Wpedantic` and sanitizer checks.',
    sourcePrompts: [
      'Reverse a string and check a palindrome in C.',
      'Explain and use function pointers and callbacks.',
      'Read `a,b,c` and write `c,b,a`.',
      'Count words of lengths 3, 4, and 5 and write four-character words.',
      'Count duplicate names from a text file.',
      'Print the `1 2 3` rise-and-fall pattern.',
      'Print the `1 2 4` powers-of-two rise-and-fall pattern.',
      'Explain string-permutation and anagram-sentence prompts after clarifying constraints.',
    ],
    codeExamples: [{
      heading: 'Reverse a string with an explicit destination capacity',
      language: 'C17',
      code: `#include <stdbool.h>
#include <stddef.h>
#include <stdio.h>
#include <string.h>

static bool reverse_string(char *destination, size_t capacity,
                           const char *source)
{
    const size_t length = strlen(source);
    if (capacity <= length) {
        return false;
    }
    for (size_t index = 0; index < length; ++index) {
        destination[index] = source[length - 1u - index];
    }
    destination[length] = '\\0';
    return true;
}

int main(void)
{
    char reversed[32];
    if (!reverse_string(reversed, sizeof reversed, "qualcomm")) {
        return 1;
    }
    puts(reversed);
    return 0;
}`,
    }],
  },
};
