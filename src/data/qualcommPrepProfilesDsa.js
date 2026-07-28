const concept = (term, definition, example) => ({ term, definition, example });

export const qualcommPrepProfilesDsa = {
  'qualcomm-dsa-complexity-search': {
    definition: 'Algorithmic complexity describes how time or extra storage grows with input size, while an invariant explains why each search or divide-and-conquer step preserves the answer.',
    application: 'A firmware lookup table may require deterministic binary search, while a one-time scan of a short diagnostic list is clearer and fast enough with linear search.',
    prediction: 'For a sorted array of eight values, how many candidate elements remain after each successful binary-search comparison?',
    explanation: 'Name the input size, count the dominant operation, and discuss worst-case behavior. Binary search is not “fast searching” in general: it requires a sorted random-access range and maintains the invariant that any remaining target lies inside `[low, high)`.',
    concepts: [
      concept('Time complexity', 'Time complexity models growth in a chosen operation count as input size increases, abstracting away machine-dependent constant factors.', 'A full array scan performs at most `n` comparisons and is O(n).'),
      concept('Space complexity', 'Space complexity models additional storage used by an algorithm, excluding or explicitly accounting for the input representation.', 'Iterative binary search uses O(1) auxiliary space.'),
      concept('Linear search', 'Linear search examines elements in sequence and needs no ordering assumption; worst-case work is proportional to the number of elements.', 'Searching an unsorted sensor-ID list may inspect every record.'),
      concept('Binary search', 'Binary search repeatedly removes half of a sorted random-access candidate range by comparing against a midpoint.', 'After three halvings, an eight-element candidate range is empty or reduced to one location.'),
      concept('Divide and conquer', 'A divide-and-conquer algorithm splits a problem into smaller independent subproblems, solves them, and combines their results.', 'Merge sort recursively sorts halves and merges two sorted sequences.'),
      concept('Invariant', 'An invariant is a statement that is true before and after each iteration and connects local updates to the final result.', 'In lower-bound search, all indexes before `low` are known to be too small.'),
      concept('Amortized analysis', 'Amortized analysis bounds the average cost per operation across a sequence even when occasional individual operations are expensive.', 'A dynamic array reallocation is costly, but geometric growth keeps repeated append amortized O(1).'),
    ],
    steps: [
      'State the precondition: sorted ascending array and valid length.',
      'Use a half-open candidate interval `[low, high)`.',
      'Compute `mid = low + (high - low) / 2` without overflowing the sum.',
      'Discard the half that cannot contain the target while preserving the invariant.',
      'Stop when the range is empty and report absence explicitly.',
    ],
    failure: 'Quoting Big O without the data precondition is incomplete. Binary search on unsorted data, midpoint overflow, and inconsistent inclusive/exclusive bounds are the usual interview failures.',
    practice: 'Trace lower-bound search on empty, one-element, duplicate, absent, first, and last targets. Explain why sorting first may dominate the cost of a single lookup.',
    sourcePrompts: [
      'Explain time complexity with a simple program.',
      'Explain linear and binary searching.',
      'Explain divide and conquer and where it is used.',
      'Compare arrays and linked lists by access, insertion, locality, and memory overhead.',
      'Explain why data-structure choice depends on operations rather than fashion.',
    ],
    codeExamples: [{
      heading: 'Binary search with one invariant in both languages',
      note: 'Both versions search a sorted range using `[low, high)`. The C++ version uses `std::span` so length travels with the view.',
      c: `#include <stddef.h>

int binary_search_int(const int *values, size_t count, int target)
{
    size_t low = 0;
    size_t high = count;

    while (low < high) {
        const size_t mid = low + (high - low) / 2;
        if (values[mid] < target) {
            low = mid + 1;
        } else if (values[mid] > target) {
            high = mid;
        } else {
            return (int)mid;
        }
    }
    return -1;
}`,
      cpp: `#include <cstddef>
#include <span>

int binary_search_int(std::span<const int> values, int target)
{
    std::size_t low = 0;
    std::size_t high = values.size();

    while (low < high) {
        const std::size_t mid = low + (high - low) / 2;
        if (values[mid] < target) {
            low = mid + 1;
        } else if (values[mid] > target) {
            high = mid;
        } else {
            return static_cast<int>(mid);
        }
    }
    return -1;
}`,
    }],
  },

  'qualcomm-dsa-linked-lists': {
    definition: 'A linked list stores each element in a node that names its neighbor; list operations are correct only when every changed link preserves reachability, ownership, and the head/tail boundary cases.',
    application: 'Intrusive kernel queues, free lists, scheduler wait lists, and constant-time splice operations use linked structures when stable node addresses matter more than cache locality.',
    prediction: 'Before reversing `A -> B -> C`, which pointer must be saved before changing `B`’s incoming or outgoing link?',
    explanation: 'Draw arrows before writing code. For each mutation, save the unvisited path, redirect one link, and advance ownership. A doubly linked list adds a backward invariant: for adjacent nodes `x` and `y`, `x->next == y` must agree with `y->prev == x`.',
    concepts: [
      concept('Singly linked list', 'Each node stores payload and a link to the next node; the final node links to null and the head names the first node.', 'Insertion at the head is O(1), while finding the last node is O(n) without a tail pointer.'),
      concept('Doubly linked list', 'Each node stores both next and previous links, enabling bidirectional traversal and O(1) removal when the node itself is known.', 'Removing a middle node reconnects both its predecessor and successor.'),
      concept('Head insertion', 'A new node points to the old head, then the head variable is replaced with the new node.', 'The order matters because replacing the head before saving it can lose the old list.'),
      concept('Tail insertion', 'With only a head pointer, tail insertion traverses to the null link; with a maintained tail pointer it can be O(1).', 'An empty list requires setting both head and tail to the new node.'),
      concept('Position insertion', 'Position insertion traverses to the predecessor, validates the requested position, then connects the new node to successor and predecessor in a lossless order.', 'Inserting at position zero is the head case, not a normal predecessor case.'),
      concept('Deletion', 'Deletion disconnects exactly one owned node, updates every affected boundary pointer, and releases the removed allocation once.', 'Deleting the only node must leave both head and tail null.'),
      concept('Reversal', 'Iterative reversal redirects each next link while preserving the remaining suffix in a temporary pointer.', 'The old head becomes the tail and must end with a null next link.'),
      concept('List ownership', 'The program needs a clear owner responsible for destroying every allocated node and must not dereference a node after deletion.', 'A cleanup loop saves `next`, frees the current node, and then advances.'),
      concept('Array versus linked list', 'Arrays provide contiguous storage and constant-time indexed access; lists provide link-based insertion but add allocation, pointer, and cache costs.', 'A CPU-friendly fixed sensor table usually favors an array over a heap-allocated list.'),
    ],
    steps: [
      'Draw the current head, optional tail, target node, predecessor, and successor.',
      'Save every link needed to reach unprocessed nodes.',
      'Reconnect incoming and outgoing links, handling empty/head/tail cases explicitly.',
      'Update list metadata only after the links form a valid list.',
      'Free a removed node once and test reachability from both ends when doubly linked.',
    ],
    failure: 'Changing `current->next` before saving it loses the remainder of a singly linked list. Other common failures are forgetting to update head/tail, dereferencing a null predecessor, and freeing a node before reading its successor.',
    practice: 'Implement insert-at-head, insert-at-tail, insert-at-position, delete-at-position, iterative reverse, recursive reverse, and full destruction. Run empty, singleton, head, middle, tail, and invalid-position cases.',
    sourcePrompts: [
      'Explain singly and doubly linked lists and their applications.',
      'Insert a node at the end and at an nth position.',
      'Delete a node at an nth position.',
      'Traverse a linked list with complete code.',
      'Reverse a singly linked list.',
      'Compare arrays and linked lists.',
      'Implement stack push/pop using linked nodes.',
    ],
    codeExamples: [{
      heading: 'Reverse a singly linked list without losing the suffix',
      c: `#include <stddef.h>

struct node {
    int value;
    struct node *next;
};

struct node *list_reverse(struct node *head)
{
    struct node *previous = NULL;
    struct node *current = head;

    while (current != NULL) {
        struct node *next = current->next;
        current->next = previous;
        previous = current;
        current = next;
    }
    return previous;
}`,
      cpp: `#include <memory>

struct Node {
    int value;
    std::unique_ptr<Node> next;
};

std::unique_ptr<Node> list_reverse(std::unique_ptr<Node> head)
{
    std::unique_ptr<Node> previous;
    while (head) {
        std::unique_ptr<Node> next = std::move(head->next);
        head->next = std::move(previous);
        previous = std::move(head);
        head = std::move(next);
    }
    return previous;
}`,
    }],
  },

  'qualcomm-dsa-fast-slow': {
    definition: 'Fast-and-slow pointer algorithms move references at different rates so relative motion reveals a midpoint, a distance from the end, or a cycle without extra storage.',
    application: 'Streaming list validation and kernel-list diagnostics use these techniques when node count is unknown and allocating a visited set is undesirable.',
    prediction: 'If `fast` advances two links and `slow` advances one, where is `slow` when `fast` reaches the end of an acyclic list?',
    explanation: 'The invariant differs by problem. For the middle, fast covers twice slow’s distance. For nth-from-last, maintain exactly `n` links between lead and follow. For cycle detection, relative speed guarantees a meeting inside a finite cycle, but only if every two-step dereference is guarded.',
    concepts: [
      concept('Middle node', 'Advancing one pointer by one link and another by two makes the slower pointer reach the middle when the faster pointer reaches the end.', 'Define whether an even-length list should return the first or second middle before coding.'),
      concept('Nth from last', 'Advance a lead pointer `n` nodes, then move lead and follow together until lead reaches null; follow is then nth from the end.', 'Reject `n == 0` and a list shorter than `n` under a one-based contract.'),
      concept('Floyd cycle detection', 'A one-step and two-step pointer meet if and only if repeated next links enter a cycle, assuming valid finite nodes.', 'The method uses O(1) extra space and O(n) time.'),
      concept('Cycle entry', 'After a fast/slow meeting, reset one pointer to head and move both one step; their next meeting is the cycle entry.', 'The equality follows from decomposing traveled distance into prefix length and whole cycle laps.'),
      concept('Dereference guard', 'A two-step advance requires proving both the current fast pointer and its next pointer are non-null before accessing the second next link.', 'Use `while (fast != NULL && fast->next != NULL)`.'),
    ],
    steps: [
      'State the exact output contract, including indexing and even-length middle choice.',
      'Initialize pointers so the required distance invariant is true.',
      'Guard every dereference before advancing.',
      'Move pointers while preserving the invariant.',
      'Distinguish end-of-list termination from an equality that proves a cycle.',
    ],
    failure: 'Memorizing one two-pointer loop for all three tasks causes off-by-one errors. The initialization and stopping condition encode whether positions are zero- or one-based and which middle is returned.',
    practice: 'Trace empty, singleton, two-node, odd, even, too-short, self-loop, and cycle-after-prefix lists. Write the invariant beside each loop.',
    sourcePrompts: [
      'Find the middle node in one traversal.',
      'Find the nth node from the end.',
      'Detect a loop in a linked list.',
      'Explain how to find the cycle entry after detection.',
    ],
    codeExamples: [{
      heading: 'Detect a cycle safely',
      c: `#include <stdbool.h>
#include <stddef.h>

struct node {
    int value;
    struct node *next;
};

bool list_has_cycle(const struct node *head)
{
    const struct node *slow = head;
    const struct node *fast = head;

    while (fast != NULL && fast->next != NULL) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) {
            return true;
        }
    }
    return false;
}`,
      cpp: `struct Node {
    int value;
    Node* next;
};

bool list_has_cycle(const Node* head)
{
    const Node* slow = head;
    const Node* fast = head;

    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) {
            return true;
        }
    }
    return false;
}`,
    }],
  },

  'qualcomm-dsa-stack-queue': {
    definition: 'A stack removes the most recently inserted element, a queue removes the earliest inserted element, and expression conversion uses a stack to delay operators until precedence and associativity permit output.',
    application: 'Call stacks, undo histories, parser operators, interrupt event queues, and UART ring buffers all depend on explicit LIFO or FIFO ordering.',
    prediction: 'When converting `A + B * C` to postfix, why must `*` leave the operator stack before `+`?',
    explanation: 'Separate the abstract data type from one implementation. A stack can use an array or linked nodes; a queue can use linked nodes or a circular array. For expression conversion, operands go directly to output while operators remain on a stack until precedence, associativity, and parentheses decide their order.',
    concepts: [
      concept('Stack', 'A stack supports push, top/peek, and pop at one end under last-in-first-out order.', 'Function-return state is unwound in reverse call order.'),
      concept('Queue', 'A queue supports enqueue at the rear and dequeue at the front under first-in-first-out order.', 'An event consumer handles queued messages in arrival order.'),
      concept('Circular queue', 'A circular queue maps logical front and rear positions into a fixed array with modular indexing and tracks empty/full state explicitly.', 'Use a count or reserve one slot so equal indexes are not ambiguous.'),
      concept('Infix notation', 'Infix writes an operator between operands and depends on precedence, associativity, and parentheses.', '`A + B * C` evaluates multiplication first.'),
      concept('Postfix notation', 'Postfix writes an operator after its operands, allowing evaluation with a value stack and no precedence table during evaluation.', '`A B C * +` means multiply B and C, then add A.'),
      concept('Prefix notation', 'Prefix writes an operator before its operands and can be evaluated from right to left with a stack.', '`+ A * B C` encodes the same expression.'),
      concept('Operator stack invariant', 'Operators on the stack are waiting for a right operand or a lower-priority boundary; the output already contains every operation whose operands are complete.', 'A closing parenthesis pops operators until the matching opening parenthesis.'),
    ],
    steps: [
      'Tokenize operands, operators, and parentheses instead of processing arbitrary characters blindly.',
      'Send operands directly to output.',
      'Before pushing an operator, pop operators that bind earlier under precedence and associativity.',
      'On a closing parenthesis, pop through the matching opening parenthesis.',
      'After input, reject mismatched parentheses and pop the remaining operators.',
    ],
    failure: 'A queue with `front == rear` but no count/full convention cannot distinguish empty from full. Expression code also fails when it treats exponentiation as left-associative or accepts malformed operand counts.',
    practice: 'Implement array stack, linked stack, circular queue, linked queue, infix-to-postfix, postfix evaluation, infix-to-prefix, and prefix evaluation with underflow/overflow checks.',
    sourcePrompts: [
      'Explain stack and queue operations.',
      'Implement push/pop and enqueue/dequeue.',
      'Convert and evaluate infix, postfix, and prefix expressions.',
      'Explain stack construction and call-stack behavior.',
    ],
    codeExamples: [{
      heading: 'Evaluate an integer postfix expression',
      c: `#include <stdbool.h>
#include <stddef.h>

bool evaluate_postfix(const char *expression, int *result)
{
    int stack[64];
    size_t size = 0;

    for (const char *p = expression; *p != '\\0'; ++p) {
        if (*p >= '0' && *p <= '9') {
            if (size == 64) return false;
            stack[size++] = *p - '0';
        } else if (*p == '+' || *p == '-' || *p == '*' || *p == '/') {
            if (size < 2) return false;
            const int right = stack[--size];
            const int left = stack[--size];
            if (*p == '/' && right == 0) return false;
            stack[size++] = *p == '+' ? left + right :
                            *p == '-' ? left - right :
                            *p == '*' ? left * right : left / right;
        } else if (*p != ' ') {
            return false;
        }
    }
    if (size != 1) return false;
    *result = stack[0];
    return true;
}`,
      cpp: `#include <optional>
#include <stack>
#include <string_view>

std::optional<int> evaluate_postfix(std::string_view expression)
{
    std::stack<int> values;
    for (char token : expression) {
        if (token >= '0' && token <= '9') {
            values.push(token - '0');
        } else if (token == '+' || token == '-' ||
                   token == '*' || token == '/') {
            if (values.size() < 2) return std::nullopt;
            const int right = values.top(); values.pop();
            const int left = values.top(); values.pop();
            if (token == '/' && right == 0) return std::nullopt;
            values.push(token == '+' ? left + right :
                        token == '-' ? left - right :
                        token == '*' ? left * right : left / right);
        } else if (token != ' ') {
            return std::nullopt;
        }
    }
    if (values.size() != 1) return std::nullopt;
    return values.top();
}`,
    }],
  },

  'qualcomm-dsa-hashing-distinct': {
    definition: 'Hashing maps a key to a table location and resolves collisions, making frequency and membership queries fast on average; XOR is a narrower cancellation tool when the duplicate pattern is exactly paired.',
    application: 'Duplicate log-name counting, symbol tables, caches, packet-flow lookup, and distinct-window tracking use hash tables because key values are not convenient contiguous indexes.',
    prediction: 'Why does XOR find the unique value when every other value appears twice, but fail when another value appears three times?',
    explanation: 'A hash table needs a hash function, equality comparison, load policy, and collision strategy. For the special paired-duplicate problem, XOR avoids storage because equal pairs cancel. Do not generalize that trick to arbitrary frequency counts.',
    concepts: [
      concept('Hash function', 'A hash function deterministically maps a key to an integer used to choose an initial table location while attempting to distribute keys evenly.', 'String hashes process every byte but equality must still confirm a candidate key.'),
      concept('Collision', 'A collision occurs when different keys choose the same table location; a correct table preserves both keys through chaining or probing.', 'Overwriting the existing entry silently loses data.'),
      concept('Separate chaining', 'Each bucket owns a collection of entries whose hashes select that bucket, often implemented with linked nodes or small arrays.', 'Average lookup stays short when the load factor is controlled.'),
      concept('Open addressing', 'All entries live in the table array and a probe sequence searches alternative slots; deletion requires a tombstone or a repair strategy.', 'Stopping at a deleted slot can incorrectly report an absent key.'),
      concept('Frequency table', 'A frequency table maps each key to the number of times it appears and directly answers duplicate and distinct-count questions.', 'Report names with counts greater than one.'),
      concept('Distinct count', 'A distinct count is the number of keys whose current frequency is positive, not the number of observations processed.', 'A sliding window increments distinct only on a zero-to-one transition.'),
      concept('XOR cancellation', 'XOR is associative, commutative, self-inverse, and has zero as identity, so pairs cancel regardless of order.', 'The unpaired element remains after XORing every array value exactly once.'),
    ],
    steps: [
      'State the key type and equality rule.',
      'Choose hashing and collision handling appropriate to expected keys.',
      'Resize or reject insertion before the load factor destroys probe length.',
      'For frequency work, update distinct count only when crossing zero.',
      'Use XOR only after proving the exact pair-frequency precondition.',
    ],
    failure: 'Calling direct indexing a hash table, ignoring collisions, or using XOR when frequencies are not exactly two leads to answers that work only on the sample.',
    practice: 'Implement insert/search/delete with chaining, count duplicate names, and solve the paired-duplicate array using XOR. Add collision-heavy and empty-key tests.',
    sourcePrompts: [
      'Explain hashing and its algorithm.',
      'Count every duplicate name in a text file.',
      'Find the array element that has no duplicate.',
      'Explain count-of-distinct-integers problems.',
      'Explain hash-index interview prompts and collision handling.',
    ],
    codeExamples: [{
      heading: 'Find the only unpaired integer',
      c: `#include <stddef.h>

int find_unpaired(const int *values, size_t count)
{
    int result = 0;
    for (size_t index = 0; index < count; ++index) {
        result ^= values[index];
    }
    return result;
}`,
      cpp: `#include <numeric>
#include <span>

int find_unpaired(std::span<const int> values)
{
    return std::accumulate(values.begin(), values.end(), 0,
                           [](int result, int value) {
                               return result ^ value;
                           });
}`,
    }],
  },

  'qualcomm-dsa-trees-convolution': {
    definition: 'A tree is a hierarchical acyclic structure with parent-child paths, maximum-path problems combine child contributions under a precise endpoint rule, and image convolution applies a weighted neighborhood kernel at every output position.',
    application: 'Directory hierarchies, syntax trees, device trees, scene graphs, and image filters all use structured traversal rather than flat scanning.',
    prediction: 'At a binary-tree node, why may a path returned to the parent include at most one child branch even though the best complete path through the node may include two?',
    explanation: 'Define “path” before coding: any endpoints, root-to-leaf, or node-to-descendant. For any-endpoint maximum path sum, recursion returns the best downward one-branch gain; a global result considers left + node + right. Convolution is separate: it multiplies a kernel with a local pixel neighborhood and sums the products.',
    concepts: [
      concept('Tree', 'A tree is a connected acyclic structure with one unique simple path between any two nodes; a rooted tree additionally defines parent-child direction.', 'A filesystem directory hierarchy is naturally rooted, although links can make a real filesystem graph more complex.'),
      concept('Traversal', 'Depth-first traversals choose when to process a node relative to its children, while breadth-first traversal processes levels through a queue.', 'Postorder is useful when a parent result depends on completed child results.'),
      concept('Maximum path sum', 'For an any-endpoint binary-tree path, each node computes a downward gain for its parent and a two-branch candidate for the global best.', 'Negative child gains are dropped because extending through them would reduce the path.'),
      concept('Recursive base case', 'A null child contributes no usable branch, and the algorithm must still handle a tree whose values are all negative.', 'Initialize the global best to the smallest integer, not zero.'),
      concept('Image convolution', 'Convolution forms each output sample by multiplying a kernel with aligned input neighbors and summing, with an explicit border policy and numeric range.', 'A 3x3 blur kernel averages a pixel neighborhood; an edge kernel uses positive and negative weights.'),
      concept('Kernel and stride', 'The kernel defines weights and extent, while stride defines output movement; padding determines behavior near borders.', 'A valid convolution produces only positions where the full kernel fits.'),
    ],
    steps: [
      'State the tree path endpoint rule or convolution border rule.',
      'Choose traversal order from the dependency between child and parent results.',
      'Return only the state a caller can legally extend.',
      'Update a separate global or output state with the complete local candidate.',
      'Test all-negative trees, one node, skewed trees, image borders, and accumulator overflow.',
    ],
    failure: 'Returning both child branches to a tree parent creates a fork, not a path. In convolution, forgetting border policy or accumulator width makes the sample implementation undefined at edges or numerically wrong.',
    practice: 'Trace maximum path sum on an all-negative tree and a path crossing the root. Then hand-compute one 3x3 convolution output from nine pixels and kernel weights.',
    sourcePrompts: [
      'Explain trees with a real problem.',
      'Solve best sum along any tree path after defining path endpoints.',
      'Explain recursion and factorial.',
      'Write or explain an image-convolution program.',
      'Explain depth-first versus breadth-first traversal.',
    ],
    codeExamples: [{
      heading: 'Maximum path sum with any two endpoints',
      c: `#include <limits.h>

struct node {
    int value;
    const struct node *left;
    const struct node *right;
};

static int maximum(int a, int b) { return a > b ? a : b; }

static int downward_gain(const struct node *node, int *best)
{
    if (node == 0) return 0;
    const int left = maximum(0, downward_gain(node->left, best));
    const int right = maximum(0, downward_gain(node->right, best));
    *best = maximum(*best, node->value + left + right);
    return node->value + maximum(left, right);
}

int maximum_path_sum(const struct node *root)
{
    int best = INT_MIN;
    (void)downward_gain(root, &best);
    return best;
}`,
      cpp: `#include <algorithm>
#include <limits>

struct Node {
    int value;
    const Node* left;
    const Node* right;
};

int downward_gain(const Node* node, int& best)
{
    if (node == nullptr) return 0;
    const int left = std::max(0, downward_gain(node->left, best));
    const int right = std::max(0, downward_gain(node->right, best));
    best = std::max(best, node->value + left + right);
    return node->value + std::max(left, right);
}

int maximum_path_sum(const Node* root)
{
    int best = std::numeric_limits<int>::lowest();
    downward_gain(root, best);
    return best;
}`,
    }],
  },

  'qualcomm-problem-bitwise-recurrence': {
    definition: 'The bitwise recurrence sets `F0=a`, `F1=b`, `F2=c`, and `Fi=(Fi-1 OR Fi-2) XOR Fi-3`; because each bit evolves independently through only eight three-bit states, the complete word sequence repeats with a period dividing ten.',
    application: 'The problem tests whether you can replace an impossible `n`-step simulation for `n` up to about 10^12 with finite-state reasoning over independent bit positions.',
    prediction: 'For `a=4`, `b=1`, `c=10`, compute `F3` and `F4` by hand, then explain why reducing a huge `n` modulo ten is legitimate.',
    explanation: 'For one bit, the recurrence transition maps `(x[i-2], x[i-1], x[i])` to `(x[i-1], x[i], (x[i] OR x[i-1]) XOR x[i-2])`. Enumerating the eight possible states shows cycle lengths 1, 2, or 5. Every word bit therefore returns within `lcm(1,2,5)=10`, so `F[n]=F[n mod 10]`.',
    concepts: [
      concept('Bit independence', 'Bitwise OR and XOR compute each bit position without carries, so the recurrence for one bit does not depend on neighboring bits.', 'Analyze one Boolean triple, then apply the result to all integer bits in parallel.'),
      concept('Finite state', 'The next recurrence state depends only on the previous three bits, giving exactly eight possible Boolean states per bit position.', 'A deterministic transition on a finite state space must eventually repeat.'),
      concept('Period ten bound', 'The eight initial states fall into cycles of length one, two, or five, so ten steps return every bit state to its start.', 'Reducing `n` modulo ten turns a trillion-step input into at most nine updates.'),
      concept('Width choice', 'Unsigned fixed-width integers make OR/XOR behavior and printed range explicit for all bit positions.', 'Use `uint64_t` when constraints permit 64-bit inputs.'),
      concept('Direct verification', 'After period reduction, evaluate the remaining recurrence steps directly and compare small indexes with the given base values.', 'For `4, 1, 10, n=4`, compute `F3=(10|1)^4=15`, then `F4=(15|10)^1=14`.'),
    ],
    steps: [
      'Compute `F3 = (10 | 1) ^ 4 = 15`.',
      'Compute `F4 = (15 | 10) ^ 1 = 14`.',
      'Reduce the requested index modulo 10.',
      'Return one of the three seeds directly for reduced indexes 0, 1, or 2.',
      'Iterate from 3 through the reduced index using three rolling values.',
    ],
    failure: 'An O(n) loop passes the sample and times out for a trillion-scale index. Guessing a period from one numeric example is also insufficient; the period argument must cover all eight one-bit states.',
    practice: 'Enumerate all eight Boolean triples and confirm cycle lengths. Then compare the optimized result with a direct simulation for random small inputs and indexes.',
    sourcePrompts: [
      'Solve the HackerRank bitwise recurrence screenshot.',
      'Explain OR and XOR in the recurrence.',
      'Handle very large `n` without iterating `n` times.',
      'Verify the sample `a=4, b=1, c=10, n=4` gives 14.',
    ],
    codeExamples: [{
      heading: 'Exploit the ten-step state period',
      c: `#include <stdint.h>

uint64_t bitwise_recurrence(uint64_t a, uint64_t b,
                            uint64_t c, uint64_t n)
{
    const unsigned reduced = (unsigned)(n % 10u);
    if (reduced == 0u) return a;
    if (reduced == 1u) return b;
    if (reduced == 2u) return c;

    uint64_t previous3 = a;
    uint64_t previous2 = b;
    uint64_t previous1 = c;
    for (unsigned index = 3; index <= reduced; ++index) {
        const uint64_t current =
            (previous1 | previous2) ^ previous3;
        previous3 = previous2;
        previous2 = previous1;
        previous1 = current;
    }
    return previous1;
}`,
      cpp: `#include <cstdint>

std::uint64_t bitwise_recurrence(std::uint64_t a, std::uint64_t b,
                                 std::uint64_t c, std::uint64_t n)
{
    const auto reduced = static_cast<unsigned>(n % 10u);
    if (reduced == 0u) return a;
    if (reduced == 1u) return b;
    if (reduced == 2u) return c;

    for (unsigned index = 3; index <= reduced; ++index) {
        const std::uint64_t current = (c | b) ^ a;
        a = b;
        b = c;
        c = current;
    }
    return c;
}`,
    }],
  },

  'qualcomm-problem-k-distinct-window': {
    definition: 'The minimum-length subarray with at least K distinct values is found by expanding a frequency-counted window until it is valid, then shrinking its left edge as far as validity allows.',
    application: 'The same variable window finds the shortest log interval containing enough event types or the smallest packet span covering required categories.',
    prediction: 'For `[2,2,1,1,3]` and `k=3`, at which right endpoint does the window first become valid, and how far can the left endpoint move?',
    explanation: 'Positive integers are not the key property; contiguity and frequency tracking are. Increase `distinct` only when a value count changes from zero to one. While `distinct >= k`, record length and remove the left value, decreasing distinct only on a one-to-zero transition.',
    concepts: [
      concept('Subarray', 'A subarray is a contiguous range of an array and is represented by two boundaries rather than an arbitrary selected subset.', 'The sample valid range `[2,1,1,3]` occupies consecutive positions.'),
      concept('Frequency map', 'A frequency map stores how many copies of each value are currently inside the window and supports exact distinct transitions.', 'Removing one of two copies leaves the value distinct count unchanged.'),
      concept('Expand', 'Moving the right boundary includes one new value and can turn an invalid window into a valid one.', 'The sample first reaches all three distinct values when the final 3 is included.'),
      concept('Shrink', 'Moving the left boundary removes one value while validity remains true, discovering the shortest valid window ending at the current right boundary.', 'Dropping the first 2 still leaves another 2, but dropping the second 2 loses a distinct value.'),
      concept('Impossible case', 'If the complete array contains fewer than K distinct values, no subarray can satisfy the requirement and the specified result is -1.', 'Check `k <= 0` separately according to the desired API contract.'),
    ],
    steps: [
      'Start with an empty window, left at zero, and distinct count zero.',
      'Add each right value and update distinct on a zero-to-one frequency transition.',
      'While distinct is at least K, update the best length.',
      'Remove the left value and advance left, reducing distinct only when its frequency becomes zero.',
      'Return -1 if no best length was recorded.',
    ],
    failure: 'Counting the number of elements rather than positive-frequency keys breaks duplicates. Stopping after the first valid window misses a shorter suffix ending at the same or later right boundary.',
    practice: 'Trace duplicate-heavy, all-equal, `k=1`, `k` larger than total distinct, and already-minimal windows. Assert the frequency sum equals window length after every move.',
    sourcePrompts: [
      'Solve the Minimum Length Subarray screenshot.',
      'Find the shortest subarray containing at least K distinct integers.',
      'Explain the sample `[2,2,1,1,3]`, `k=3`, result 4.',
      'Return -1 when no valid subarray exists.',
    ],
    codeExamples: [{
      heading: 'Shrink every valid K-distinct window',
      c: `#include <limits.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>

static int compare_int_ascending(const void *left, const void *right)
{
    const int x = *(const int *)left;
    const int y = *(const int *)right;
    return (x > y) - (x < y);
}

int minimum_k_distinct(const int *values, size_t count, size_t k)
{
    if (k == 0) return 0;
    int *sorted = malloc(count * sizeof(*sorted));
    size_t *frequency = calloc(count, sizeof(*frequency));
    if ((count != 0 && sorted == NULL) || (count != 0 && frequency == NULL)) {
        free(sorted); free(frequency); return -1;
    }
    for (size_t i = 0; i < count; ++i) sorted[i] = values[i];
    qsort(sorted, count, sizeof(*sorted), compare_int_ascending);

    size_t unique = 0;
    for (size_t i = 0; i < count; ++i)
        if (i == 0 || sorted[i] != sorted[i - 1]) sorted[unique++] = sorted[i];

    size_t left = 0, distinct = 0;
    size_t best = SIZE_MAX;
    for (size_t right = 0; right < count; ++right) {
        size_t lo = 0, hi = unique;
        while (lo < hi) {
            size_t mid = lo + (hi - lo) / 2;
            if (sorted[mid] < values[right]) lo = mid + 1; else hi = mid;
        }
        if (frequency[lo]++ == 0) ++distinct;
        while (distinct >= k) {
            const size_t length = right - left + 1;
            if (length < best) best = length;
            lo = 0; hi = unique;
            while (lo < hi) {
                size_t mid = lo + (hi - lo) / 2;
                if (sorted[mid] < values[left]) lo = mid + 1; else hi = mid;
            }
            if (--frequency[lo] == 0) --distinct;
            ++left;
        }
    }
    free(sorted); free(frequency);
    return best == SIZE_MAX || best > (size_t)INT_MAX ? -1 : (int)best;
}`,
      cpp: `#include <limits>
#include <span>
#include <unordered_map>

int minimum_k_distinct(std::span<const int> values, std::size_t k)
{
    if (k == 0) return 0;
    std::unordered_map<int, std::size_t> frequency;
    std::size_t left = 0;
    std::size_t distinct = 0;
    std::size_t best = std::numeric_limits<std::size_t>::max();

    for (std::size_t right = 0; right < values.size(); ++right) {
        if (frequency[values[right]]++ == 0) ++distinct;
        while (distinct >= k) {
            best = std::min(best, right - left + 1);
            if (--frequency[values[left]] == 0) {
                frequency.erase(values[left]);
                --distinct;
            }
            ++left;
        }
    }
    return best == std::numeric_limits<std::size_t>::max()
        ? -1 : static_cast<int>(best);
}`,
    }],
  },

  'qualcomm-problem-palindrome-intervals': {
    definition: 'The palindrome-substrings problem asks for the maximum number of non-overlapping palindromic intervals whose lengths are at least K, so the state must combine palindrome recognition with interval selection.',
    application: 'The pattern resembles selecting non-overlapping validated frames or segments: local recognition alone is insufficient because choosing one interval changes which later intervals remain available.',
    prediction: 'Why can choosing the longest palindrome beginning at the current position reduce the final number of selected substrings?',
    explanation: 'Precompute whether each interval is a palindrome, then use prefix dynamic programming. Let `dp[i]` be the maximum count using the first `i` characters. Either skip character `i-1`, or end a chosen palindrome `[start, i)` and add one to `dp[start]`.',
    concepts: [
      concept('Palindrome interval', 'An interval is palindromic when mirrored characters match throughout; length-one and empty interiors form recurrence base cases.', '`pal[start][end]` is true when endpoints match and the interior is palindromic.'),
      concept('Non-overlap', 'Selected half-open intervals `[start,end)` do not overlap when each chosen interval begins at or after the previous chosen end.', 'The DP transition to `dp[start]` guarantees earlier selections end before the new interval.'),
      concept('Prefix DP', '`dp[i]` records the best answer restricted to the first `i` characters, making skipped suffix characters and chosen final intervals comparable.', 'The skip transition is `dp[i] = dp[i-1]`.'),
      concept('Length threshold', 'A candidate interval is eligible only when `end-start >= k`, even if shorter palindromes are recognized internally.', 'For `k=3`, a two-character palindrome cannot be selected.'),
      concept('Greedy danger', 'Choosing a locally longest palindrome can consume characters that could form several shorter eligible non-overlapping palindromes.', 'Maximizing count generally favors early finishing intervals, which the DP evaluates safely.'),
    ],
    steps: [
      'Build a palindrome table from short intervals to long intervals.',
      'Initialize every prefix answer to zero.',
      'For each prefix end, first carry forward the answer that skips the last character.',
      'Try every eligible palindromic interval ending at that boundary.',
      'Set `dp[end]` to the best of skip and `dp[start] + 1`.',
    ],
    failure: 'Counting every palindrome ignores overlap. Selecting the longest interval first optimizes length rather than number of intervals and can block a better packing.',
    practice: 'Trace strings with nested palindromes, adjacent palindromes, no eligible palindrome, `k=1`, and one palindrome spanning the full string.',
    sourcePrompts: [
      'Solve the Palindrome Substrings screenshot.',
      'Require each chosen substring to be a palindrome of length at least K.',
      'Ensure no selected substrings overlap.',
      'Return the maximum number of valid substrings.',
    ],
    codeExamples: [{
      heading: 'Combine palindrome recognition with prefix selection',
      c: `#include <stdbool.h>
#include <stddef.h>
#include <stdlib.h>

int maximum_palindrome_intervals(const char *text, size_t n, size_t k)
{
    bool *pal = calloc(n * n, sizeof(*pal));
    int *dp = calloc(n + 1, sizeof(*dp));
    if ((n != 0 && pal == NULL) || dp == NULL) {
        free(pal); free(dp); return -1;
    }
    for (size_t length = 1; length <= n; ++length) {
        for (size_t start = 0; start + length <= n; ++start) {
            const size_t end = start + length - 1;
            pal[start * n + end] =
                text[start] == text[end] &&
                (length <= 2 || pal[(start + 1) * n + end - 1]);
        }
    }
    for (size_t end = 1; end <= n; ++end) {
        dp[end] = dp[end - 1];
        for (size_t start = 0; start + k <= end; ++start) {
            if (pal[start * n + end - 1] && dp[start] + 1 > dp[end])
                dp[end] = dp[start] + 1;
        }
    }
    const int answer = dp[n];
    free(pal); free(dp);
    return answer;
}`,
      cpp: `#include <algorithm>
#include <string_view>
#include <vector>

int maximum_palindrome_intervals(std::string_view text, std::size_t k)
{
    const std::size_t n = text.size();
    std::vector pal(n, std::vector<bool>(n, false));
    for (std::size_t length = 1; length <= n; ++length) {
        for (std::size_t start = 0; start + length <= n; ++start) {
            const std::size_t end = start + length - 1;
            pal[start][end] = text[start] == text[end] &&
                (length <= 2 || pal[start + 1][end - 1]);
        }
    }
    std::vector<int> dp(n + 1);
    for (std::size_t end = 1; end <= n; ++end) {
        dp[end] = dp[end - 1];
        for (std::size_t start = 0; start + k <= end; ++start) {
            if (pal[start][end - 1])
                dp[end] = std::max(dp[end], dp[start] + 1);
        }
    }
    return dp[n];
}`,
    }],
  },

  'qualcomm-problem-prefix-cost': {
    definition: 'Prefix cost is the sum, over every prefix of a permutation, of the number of distinct values seen; minimizing it means delaying the first appearance of new values by placing larger equal-value groups earlier.',
    application: 'The exchange argument is a reusable greedy proof: order groups so expensive state increases happen as late as possible.',
    prediction: 'If one value occurs four times and another occurs once, compare the prefix-distinct costs when the singleton is placed first versus last.',
    explanation: 'All copies of one value can be made contiguous without increasing cost. Once grouped, a group placed at rank `r` contributes `r * frequency` to the sum under one-based ranks. Swapping adjacent groups shows the larger frequency must come first, so sort frequencies descending.',
    concepts: [
      concept('Prefix distinct cost', 'For each prefix, count unique values, then sum those counts over all prefix lengths.', 'For `[2,2,1,1,3]`, counts are `1,1,2,2,3` and total cost is 9.'),
      concept('Grouping equal values', 'Separating copies of an already-seen value cannot postpone a new distinct introduction better than placing those copies together before introducing another value.', 'A block of four equal values keeps prefix distinct count at one for four positions.'),
      concept('Exchange argument', 'Compare two adjacent frequency groups and show swapping them improves or preserves the objective whenever the larger group is later.', 'For frequencies `x < y`, ordering y before x saves `y-x` cost across the pair.'),
      concept('Descending frequencies', 'Sorting group frequencies from largest to smallest delays distinct-count increments across the greatest number of positions.', 'Frequencies 4, 2, 1 contribute `1*4 + 2*2 + 3*1`.'),
      concept('Permutation construction', 'Any ordering that places complete equal-value groups in descending frequency order attains the minimum; ties may be ordered arbitrarily.', 'The problem may ask only for cost, so constructing the actual permutation is unnecessary.'),
    ],
    steps: [
      'Count the frequency of each distinct value.',
      'Sort the frequencies in descending order.',
      'Multiply each frequency by its one-based group rank.',
      'Accumulate in a wide integer type.',
      'Use an adjacent-swap argument to justify the ordering.',
    ],
    failure: 'Brute-forcing all permutations ignores that only first appearances affect cost. Sorting values numerically is irrelevant; the objective depends on frequency, not key magnitude.',
    practice: 'Compute costs for all equal values, all distinct values, frequencies `[4,1]`, and `[3,3,1]`. Prove one adjacent swap algebraically.',
    sourcePrompts: [
      'Solve the Prefix Cost screenshot.',
      'Define cost as the sum of distinct counts over all prefixes.',
      'Find the minimum cost over every permutation.',
      'Explain why the sample frequencies produce cost 9.',
    ],
    codeExamples: [{
      heading: 'Sort frequency groups, not the original values',
      c: `#include <stdint.h>
#include <stddef.h>
#include <stdlib.h>

static int compare_int(const void *left, const void *right)
{
    const int a = *(const int *)left;
    const int b = *(const int *)right;
    return (a > b) - (a < b);
}

static int compare_size_desc(const void *left, const void *right)
{
    const size_t a = *(const size_t *)left;
    const size_t b = *(const size_t *)right;
    return (b > a) - (b < a);
}

uint64_t minimum_prefix_cost(const int *values, size_t count)
{
    int *copy = malloc(count * sizeof(*copy));
    size_t *frequencies = malloc(count * sizeof(*frequencies));
    if ((count != 0 && copy == NULL) || (count != 0 && frequencies == NULL)) {
        free(copy); free(frequencies); return UINT64_MAX;
    }
    for (size_t i = 0; i < count; ++i) copy[i] = values[i];
    qsort(copy, count, sizeof(*copy), compare_int);

    size_t groups = 0;
    for (size_t i = 0; i < count;) {
        size_t end = i + 1;
        while (end < count && copy[end] == copy[i]) ++end;
        frequencies[groups++] = end - i;
        i = end;
    }
    qsort(frequencies, groups, sizeof(*frequencies), compare_size_desc);
    uint64_t cost = 0;
    for (size_t i = 0; i < groups; ++i)
        cost += (uint64_t)(i + 1) * frequencies[i];
    free(copy); free(frequencies);
    return cost;
}`,
      cpp: `#include <algorithm>
#include <cstdint>
#include <functional>
#include <span>
#include <unordered_map>
#include <vector>

std::uint64_t minimum_prefix_cost(std::span<const int> values)
{
    std::unordered_map<int, std::size_t> counts;
    for (int value : values) ++counts[value];

    std::vector<std::size_t> frequencies;
    frequencies.reserve(counts.size());
    for (const auto& [value, count] : counts) {
        (void)value;
        frequencies.push_back(count);
    }
    std::ranges::sort(frequencies, std::greater{});

    std::uint64_t cost = 0;
    for (std::size_t index = 0; index < frequencies.size(); ++index)
        cost += static_cast<std::uint64_t>(index + 1) * frequencies[index];
    return cost;
}`,
    }],
  },

  'qualcomm-problem-dam-design': {
    definition: 'Dam Design asks for the tallest mud segment between fixed walls when adjacent mud heights may rise by at most one unit; each gap is solved by growing from the lower wall and, if space remains, forming a centered peak.',
    application: 'The problem is a discrete envelope calculation: every position is bounded by how quickly height may increase from either boundary.',
    prediction: 'Between walls of heights 3 and 5 with four empty positions, how much distance is consumed merely reaching height 5 from the lower side?',
    explanation: 'For adjacent walls, let `gap = positionRight-positionLeft-1`, `low=min(height)`, and `difference=abs(heightRight-heightLeft)`. If `gap <= difference`, the best mud rises from the lower wall to `low+gap`. Otherwise it reaches the higher wall’s level, then the remaining positions build a peak with height `high + ceil((gap-difference)/2)`.',
    concepts: [
      concept('Gap length', 'The number of mud positions strictly between adjacent walls is the position difference minus one.', 'Adjacent walls have gap zero and contribute no mud segment.'),
      concept('Slope constraint', 'A mud segment cannot be more than one unit higher than an adjacent wall or mud segment, so height can rise at speed at most one per position.', 'From height 3, positions one and two away are bounded by 4 and 5 from that side.'),
      concept('Height difference budget', 'Raising the lower side to the higher wall level consumes one gap position per unit of wall-height difference.', 'A difference of two consumes two rising steps when enough positions exist.'),
      concept('Centered peak', 'After matching the higher boundary, spare positions can rise from both sides toward a peak, adding the ceiling of half the spare distance.', 'An odd spare count gives one extra unit at the center.'),
      concept('Independent adjacent gaps', 'Walls partition the dam into independent gaps because mud cannot cross a fixed wall; the final answer is the maximum local peak.', 'Scan sorted wall positions once and keep the largest gap result.'),
    ],
    steps: [
      'Validate equal-length, position-sorted wall arrays.',
      'For each adjacent wall pair, compute gap, lower height, higher height, and difference.',
      'If gap does not exceed the difference, candidate height is lower plus gap.',
      'Otherwise candidate height is higher plus `(gap-difference+1)/2` using integer ceiling.',
      'Keep the maximum candidate across every nonempty gap.',
    ],
    failure: 'Using the average of wall heights alone ignores physical distance. Another error counts the wall positions as mud positions, producing a one-off peak.',
    practice: 'Trace zero gap, equal wall heights, a gap smaller than height difference, and a wide symmetric gap. Draw the upper envelope from both walls.',
    sourcePrompts: [
      'Solve the Dam Design screenshot.',
      'Respect one unit of horizontal gap between wall positions.',
      'Limit each mud segment to at most one unit above an adjacent wall or segment.',
      'Return zero when no mud segment can be built.',
    ],
    codeExamples: [{
      heading: 'Evaluate each wall gap in constant time',
      c: `#include <stddef.h>
#include <stdlib.h>

int maximum_mud_height(const int *positions, const int *heights, size_t count)
{
    int answer = 0;
    for (size_t i = 1; i < count; ++i) {
        const int gap = positions[i] - positions[i - 1] - 1;
        if (gap <= 0) continue;
        const int low = heights[i] < heights[i - 1] ? heights[i] : heights[i - 1];
        const int high = heights[i] > heights[i - 1] ? heights[i] : heights[i - 1];
        const int difference = high - low;
        const int candidate = gap <= difference
            ? low + gap
            : high + (gap - difference + 1) / 2;
        if (candidate > answer) answer = candidate;
    }
    return answer;
}`,
      cpp: `#include <algorithm>
#include <cstdlib>
#include <span>

int maximum_mud_height(std::span<const int> positions,
                       std::span<const int> heights)
{
    int answer = 0;
    for (std::size_t i = 1; i < positions.size(); ++i) {
        const int gap = positions[i] - positions[i - 1] - 1;
        if (gap <= 0) continue;
        const int low = std::min(heights[i], heights[i - 1]);
        const int high = std::max(heights[i], heights[i - 1]);
        const int difference = high - low;
        const int candidate = gap <= difference
            ? low + gap
            : high + (gap - difference + 1) / 2;
        answer = std::max(answer, candidate);
    }
    return answer;
}`,
    }],
  },

  'qualcomm-problem-clarification': {
    definition: 'An underspecified coding prompt names an objective without enough information to determine one correct algorithm; the correct interview response is to recover the contract before selecting a pattern.',
    application: 'Real requirements arrive incomplete. Asking precise questions about input, output, constraints, duplicates, ordering, and failure behavior prevents building a polished solution to the wrong problem.',
    prediction: 'If an interviewer says only “number of moves,” list the minimum facts needed before code can be correct.',
    explanation: 'The folder contains isolated titles—“number of moves,” “count string permutation,” and “how many sentences in anagram”—without full statements. They are preserved here as clarification drills. Do not pretend they identify a unique HackerRank problem.',
    concepts: [
      concept('Input contract', 'The input contract defines types, sizes, ordering, allowed values, duplicates, and whether mutation is permitted.', 'Ask whether a string contains repeated characters before counting unique permutations.'),
      concept('Output contract', 'The output contract defines exactly what is counted or constructed, result type, ordering, and impossible-case behavior.', '“Count permutations” may mean all positional permutations or only distinct strings.'),
      concept('Constraint-driven algorithm', 'Input limits determine whether brute force, dynamic programming, hashing, graph search, or arithmetic is feasible.', 'A length-10 string may allow backtracking; length 100000 requires counting formulas.'),
      concept('Number of moves ambiguity', 'The phrase does not identify the state, legal move, start, goal, or whether minimum, maximum, or total sequences are requested.', 'Request a sample transition and target before naming BFS or dynamic programming.'),
      concept('String permutation count', 'If character frequencies are known, distinct permutation count is `n!` divided by every repeated-character factorial, subject to overflow or modular requirements.', 'For `AAB`, the distinct count is `3!/2! = 3`.'),
      concept('Anagram sentence count', 'A common formulation multiplies the number of dictionary anagrams available for each word position, but case, punctuation, repeated dictionary entries, and modulus must be defined.', 'Canonicalize each word by sorted letters or frequency signature after clarifying normalization.'),
      concept('Count of distinct integers', 'This title may refer to the board-remainder problem captured elsewhere or a normal collection distinct count; the sample operation disambiguates it.', 'Ask whether new integers are generated by a remainder operation or merely counted in input.'),
    ],
    steps: [
      'Repeat the objective in your own words and ask the interviewer to confirm it.',
      'Request one complete input/output example and explain its transformation.',
      'Ask for bounds, duplicates, ordering, mutation, numeric range, and impossible behavior.',
      'Name two plausible algorithms and show which clarified constraint chooses between them.',
      'Only then state the invariant, complexity, and implementation plan.',
    ],
    failure: 'Guessing the familiar problem title can lead to an impressive but irrelevant answer. Silence is also weak; a senior response turns ambiguity into a precise contract quickly.',
    practice: 'For each isolated title in the folder, write five clarification questions, two possible interpretations, and the constraint that would choose the final algorithm.',
    sourcePrompts: [
      'Number of moves.',
      'Count string permutations.',
      'How many sentences can be formed from anagrams.',
      'Count of distinct integers when the board operation is not supplied.',
      'Best sum any tree path when endpoint rules are omitted.',
    ],
    codeExamples: [],
  },
};
