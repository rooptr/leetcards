export const dsaCImplementations = {
  'dsa-complexity': `typedef void (*visit_fn)(int value);

void visit_all(const int *values, size_t count, visit_fn visit) {
  for (size_t index = 0; index < count; ++index) {
    visit(values[index]);
  }
}`,

  'dsa-matrix': `void visit_matrix(
    const int *matrix,
    size_t rows,
    size_t columns,
    void (*visit)(size_t row, size_t column, int value)
) {
  for (size_t row = 0; row < rows; ++row) {
    for (size_t column = 0; column < columns; ++column) {
      visit(row, column, matrix[row * columns + column]);
    }
  }
}`,

  'dsa-sequence-terms': `bool is_subsequence(const char *candidate, const char *text) {
  size_t next = 0;
  for (size_t index = 0; text[index] != '\\0' && candidate[next] != '\\0'; ++index) {
    if (text[index] == candidate[next]) {
      ++next;
    }
  }
  return candidate[next] == '\\0';
}

bool is_consecutive_after_sort(const int *values, size_t count) {
  for (size_t index = 1; index < count; ++index) {
    if (values[index] != values[index - 1] + 1) {
      return false;
    }
  }
  return true;
}`,

  'dsa-frequency-anagram': `bool are_ascii_anagrams(const char *left, const char *right) {
  int frequencies[256] = {0};
  size_t index = 0;

  for (; left[index] != '\\0' && right[index] != '\\0'; ++index) {
    ++frequencies[(unsigned char)left[index]];
    --frequencies[(unsigned char)right[index]];
  }
  if (left[index] != '\\0' || right[index] != '\\0') {
    return false;
  }
  for (size_t symbol = 0; symbol < 256; ++symbol) {
    if (frequencies[symbol] != 0) {
      return false;
    }
  }
  return true;
}`,

  'dsa-palindrome': `bool is_palindrome(const char *text, size_t length) {
  if (length == 0) {
    return true;
  }
  size_t left = 0;
  size_t right = length - 1;
  while (left < right) {
    if (text[left] != text[right]) {
      return false;
    }
    ++left;
    --right;
  }
  return true;
}`,

  'dsa-linked': `struct list_node {
  int value;
  struct list_node *next;
};

struct list_node *reverse_list(struct list_node *head) {
  struct list_node *previous = NULL;
  struct list_node *current = head;
  while (current != NULL) {
    struct list_node *next = current->next;
    current->next = previous;
    previous = current;
    current = next;
  }
  return previous;
}`,

  'dsa-stack-queue': `struct int_queue {
  int *items;
  size_t capacity;
  size_t head;
  size_t size;
};

bool queue_push(struct int_queue *queue, int value) {
  if (queue->size == queue->capacity) {
    return false;
  }
  size_t tail = (queue->head + queue->size) % queue->capacity;
  queue->items[tail] = value;
  ++queue->size;
  return true;
}

bool queue_pop(struct int_queue *queue, int *value) {
  if (queue->size == 0) {
    return false;
  }
  *value = queue->items[queue->head];
  queue->head = (queue->head + 1) % queue->capacity;
  --queue->size;
  return true;
}`,

  'dsa-hash': `struct hash_slot {
  int key;
  bool occupied;
};

bool hash_insert(struct hash_slot *table, size_t capacity, int key) {
  size_t start = ((unsigned)key * 2654435761u) % capacity;
  for (size_t probe = 0; probe < capacity; ++probe) {
    size_t index = (start + probe) % capacity;
    if (!table[index].occupied || table[index].key == key) {
      table[index] = (struct hash_slot){ .key = key, .occupied = true };
      return true;
    }
  }
  return false;
}

bool hash_contains(const struct hash_slot *table, size_t capacity, int key) {
  size_t start = ((unsigned)key * 2654435761u) % capacity;
  for (size_t probe = 0; probe < capacity; ++probe) {
    size_t index = (start + probe) % capacity;
    if (!table[index].occupied) {
      return false;
    }
    if (table[index].key == key) {
      return true;
    }
  }
  return false;
}`,

  'dsa-heap': `static void swap_int(int *left, int *right) {
  int temporary = *left;
  *left = *right;
  *right = temporary;
}

void min_heap_push(int *heap, size_t *size, int value) {
  size_t child = (*size)++;
  heap[child] = value;
  while (child > 0) {
    size_t parent = (child - 1) / 2;
    if (heap[parent] <= heap[child]) {
      break;
    }
    swap_int(&heap[parent], &heap[child]);
    child = parent;
  }
}

int min_heap_pop(int *heap, size_t *size) {
  int result = heap[0];
  heap[0] = heap[--(*size)];
  for (size_t parent = 0;;) {
    size_t left = parent * 2 + 1;
    size_t right = left + 1;
    size_t smallest = parent;
    if (left < *size && heap[left] < heap[smallest]) smallest = left;
    if (right < *size && heap[right] < heap[smallest]) smallest = right;
    if (smallest == parent) break;
    swap_int(&heap[parent], &heap[smallest]);
    parent = smallest;
  }
  return result;
}`,

  'dsa-binary-tree': `struct tree_node {
  int value;
  struct tree_node *left;
  struct tree_node *right;
};

void preorder(const struct tree_node *node, void (*visit)(int value)) {
  if (node == NULL) {
    return;
  }
  visit(node->value);
  preorder(node->left, visit);
  preorder(node->right, visit);
}`,

  'dsa-bst': `struct tree_node *bst_find(struct tree_node *node, int key) {
  while (node != NULL && node->value != key) {
    node = key < node->value ? node->left : node->right;
  }
  return node;
}`,

  'dsa-avl': `static int node_height(const struct avl_node *node) {
  return node == NULL ? 0 : node->height;
}

static struct avl_node *rotate_right(struct avl_node *root) {
  struct avl_node *new_root = root->left;
  root->left = new_root->right;
  new_root->right = root;
  root->height = 1 + max_int(node_height(root->left), node_height(root->right));
  new_root->height = 1 + max_int(node_height(new_root->left), node_height(new_root->right));
  return new_root;
}

struct avl_node *rebalance(struct avl_node *node) {
  int balance = node_height(node->left) - node_height(node->right);
  if (balance > 1) {
    if (node_height(node->left->right) > node_height(node->left->left)) {
      node->left = rotate_left(node->left);
    }
    return rotate_right(node);
  }
  if (balance < -1) {
    if (node_height(node->right->left) > node_height(node->right->right)) {
      node->right = rotate_right(node->right);
    }
    return rotate_left(node);
  }
  return node;
}`,

  'dsa-red-black': `void rb_fix_insert(struct rb_tree *tree, struct rb_node *node) {
  while (node != tree->root && node->parent->color == RED) {
    struct rb_node *parent = node->parent;
    struct rb_node *grandparent = parent->parent;
    bool parent_is_left = parent == grandparent->left;
    struct rb_node *uncle = parent_is_left ? grandparent->right : grandparent->left;

    if (uncle != NULL && uncle->color == RED) {
      parent->color = BLACK;
      uncle->color = BLACK;
      grandparent->color = RED;
      node = grandparent;
      continue;
    }
    if (parent_is_left && node == parent->right) {
      rotate_left(tree, parent);
      node = parent;
      parent = node->parent;
    } else if (!parent_is_left && node == parent->left) {
      rotate_right(tree, parent);
      node = parent;
      parent = node->parent;
    }
    parent->color = BLACK;
    grandparent->color = RED;
    if (parent_is_left) rotate_right(tree, grandparent);
    else rotate_left(tree, grandparent);
  }
  tree->root->color = BLACK;
}`,

  'dsa-sorting': `static size_t partition(int *values, size_t low, size_t high) {
  int pivot = values[high];
  size_t boundary = low;
  for (size_t index = low; index < high; ++index) {
    if (values[index] < pivot) {
      swap_int(&values[index], &values[boundary++]);
    }
  }
  swap_int(&values[boundary], &values[high]);
  return boundary;
}

void quicksort(int *values, size_t low, size_t high) {
  if (low >= high) return;
  size_t pivot = partition(values, low, high);
  if (pivot > low) quicksort(values, low, pivot - 1);
  quicksort(values, pivot + 1, high);
}`,

  'dsa-search': `size_t first_true(size_t count, bool (*predicate)(size_t index)) {
  size_t left = 0;
  size_t right = count;
  while (left < right) {
    size_t middle = left + (right - left) / 2;
    if (predicate(middle)) {
      right = middle;
    } else {
      left = middle + 1;
    }
  }
  return left;
}`,

  'dsa-two-pointers': `bool find_pair_sum(
    const int *values,
    size_t count,
    int target,
    size_t *left_result,
    size_t *right_result
) {
  if (count < 2) return false;
  size_t left = 0;
  size_t right = count - 1;
  while (left < right) {
    long sum = (long)values[left] + values[right];
    if (sum < target) ++left;
    else if (sum > target) --right;
    else {
      *left_result = left;
      *right_result = right;
      return true;
    }
  }
  return false;
}`,

  'dsa-sliding': `long max_fixed_window_sum(const int *values, size_t count, size_t width) {
  if (width == 0 || width > count) return 0;
  long window = 0;
  for (size_t index = 0; index < width; ++index) window += values[index];
  long best = window;
  for (size_t right = width; right < count; ++right) {
    window += values[right] - values[right - width];
    if (window > best) best = window;
  }
  return best;
}

size_t longest_positive_window_at_most(
    const unsigned *values,
    size_t count,
    unsigned limit
) {
  size_t left = 0;
  size_t best = 0;
  unsigned sum = 0;
  for (size_t right = 0; right < count; ++right) {
    sum += values[right];
    while (sum > limit) sum -= values[left++];
    size_t width = right - left + 1;
    if (width > best) best = width;
  }
  return best;
}`,

  'dsa-longest-substring': `size_t longest_unique_ascii_substring(const char *text) {
  size_t last_seen[256];
  for (size_t symbol = 0; symbol < 256; ++symbol) last_seen[symbol] = SIZE_MAX;

  size_t left = 0;
  size_t best = 0;
  for (size_t right = 0; text[right] != '\\0'; ++right) {
    unsigned char symbol = (unsigned char)text[right];
    if (last_seen[symbol] != SIZE_MAX && last_seen[symbol] >= left) {
      left = last_seen[symbol] + 1;
    }
    last_seen[symbol] = right;
    size_t width = right - left + 1;
    if (width > best) best = width;
  }
  return best;
}`,

  'dsa-k-distinct': `static size_t substrings_at_most_k(const char *text, size_t k) {
  size_t frequency[256] = {0};
  size_t left = 0;
  size_t distinct = 0;
  size_t total = 0;

  for (size_t right = 0; text[right] != '\\0'; ++right) {
    unsigned char entering = (unsigned char)text[right];
    if (frequency[entering]++ == 0) ++distinct;
    while (distinct > k) {
      unsigned char leaving = (unsigned char)text[left++];
      if (--frequency[leaving] == 0) --distinct;
    }
    total += right - left + 1;
  }
  return total;
}

size_t substrings_with_exactly_k_distinct(const char *text, size_t k) {
  return k == 0 ? 0
    : substrings_at_most_k(text, k) - substrings_at_most_k(text, k - 1);
}`,

  'dsa-fast-slow': `bool has_cycle(const struct list_node *head) {
  const struct list_node *slow = head;
  const struct list_node *fast = head;
  while (fast != NULL && fast->next != NULL) {
    slow = slow->next;
    fast = fast->next->next;
    if (slow == fast) {
      return true;
    }
  }
  return false;
}`,

  'dsa-prefix': `void build_prefix_sum(
    const int *values,
    size_t count,
    long long *prefix
) {
  prefix[0] = 0;
  for (size_t index = 0; index < count; ++index) {
    prefix[index + 1] = prefix[index] + values[index];
  }
}

long long range_sum(const long long *prefix, size_t left, size_t right) {
  return prefix[right] - prefix[left];
}`,

  'dsa-difference': `void add_to_range(
    long long *difference,
    size_t count,
    size_t left,
    size_t right,
    long long delta
) {
  difference[left] += delta;
  if (right + 1 < count) difference[right + 1] -= delta;
}

void materialize_ranges(long long *difference, long long *values, size_t count) {
  long long running = 0;
  for (size_t index = 0; index < count; ++index) {
    running += difference[index];
    values[index] += running;
  }
}`,

  'dsa-kadane': `long long maximum_subarray(const int *values, size_t count) {
  long long ending_here = values[0];
  long long best = values[0];
  for (size_t index = 1; index < count; ++index) {
    long long extend = ending_here + values[index];
    ending_here = extend > values[index] ? extend : values[index];
    if (ending_here > best) best = ending_here;
  }
  return best;
}`,

  'dsa-longest-consecutive': `size_t longest_consecutive_run(const struct int_set *set) {
  size_t best = 0;
  for (size_t slot = 0; slot < set->capacity; ++slot) {
    if (!set->slots[slot].occupied) continue;
    int value = set->slots[slot].key;
    if (int_set_contains(set, value - 1)) continue;

    size_t length = 1;
    while (int_set_contains(set, value + (int)length)) ++length;
    if (length > best) best = length;
  }
  return best;
}`,

  'dsa-cyclic-placement': `int first_missing_positive(int *values, size_t count) {
  for (size_t index = 0; index < count;) {
    int value = values[index];
    if (value > 0 && (size_t)value <= count && values[value - 1] != value) {
      swap_int(&values[index], &values[value - 1]);
    } else {
      ++index;
    }
  }
  for (size_t index = 0; index < count; ++index) {
    if (values[index] != (int)index + 1) return (int)index + 1;
  }
  return (int)count + 1;
}`,

  'dsa-intervals': `struct interval {
  int start;
  int end;
};

size_t merge_intervals(
    struct interval *intervals,
    size_t count,
    struct interval *output
) {
  qsort(intervals, count, sizeof *intervals, compare_interval_start);
  size_t used = 0;
  for (size_t index = 0; index < count; ++index) {
    if (used == 0 || intervals[index].start > output[used - 1].end) {
      output[used++] = intervals[index];
    } else if (intervals[index].end > output[used - 1].end) {
      output[used - 1].end = intervals[index].end;
    }
  }
  return used;
}`,

  'dsa-monotonic': `void next_greater_indexes(const int *values, size_t count, size_t *answer) {
  size_t *stack = malloc(count * sizeof *stack);
  size_t size = 0;
  for (size_t index = 0; index < count; ++index) {
    while (size > 0 && values[stack[size - 1]] < values[index]) {
      answer[stack[--size]] = index;
    }
    stack[size++] = index;
  }
  while (size > 0) answer[stack[--size]] = SIZE_MAX;
  free(stack);
}`,

  'dsa-top-k': `size_t top_k_largest(
    const int *values,
    size_t count,
    size_t k,
    int *min_heap
) {
  size_t heap_size = 0;
  for (size_t index = 0; index < count; ++index) {
    if (heap_size < k) {
      min_heap_push(min_heap, &heap_size, values[index]);
    } else if (values[index] > min_heap[0]) {
      min_heap[0] = values[index];
      min_heap_sift_down(min_heap, heap_size, 0);
    }
  }
  return heap_size;
}`,

  'dsa-quickselect': `int quickselect(int *values, size_t count, size_t target_index) {
  size_t left = 0;
  size_t right = count - 1;
  for (;;) {
    size_t pivot = partition(values, left, right);
    if (pivot == target_index) return values[pivot];
    if (pivot < target_index) left = pivot + 1;
    else right = pivot - 1;
  }
}`,

  'dsa-k-way-merge': `struct merge_item {
  int value;
  size_t list;
  size_t index;
};

size_t merge_sorted_lists(
    const int *const *lists,
    const size_t *sizes,
    size_t list_count,
    int *output
) {
  struct merge_item *heap = malloc(list_count * sizeof *heap);
  size_t heap_size = 0;
  size_t written = 0;
  for (size_t list = 0; list < list_count; ++list) {
    if (sizes[list] > 0) merge_heap_push(heap, &heap_size,
      (struct merge_item){lists[list][0], list, 0});
  }
  while (heap_size > 0) {
    struct merge_item item = merge_heap_pop(heap, &heap_size);
    output[written++] = item.value;
    ++item.index;
    if (item.index < sizes[item.list]) {
      item.value = lists[item.list][item.index];
      merge_heap_push(heap, &heap_size, item);
    }
  }
  free(heap);
  return written;
}`,

  'dsa-recursion': `void search_choices(
    struct search_state *state,
    void (*record)(const struct search_state *state)
) {
  if (state_is_complete(state)) {
    record(state);
    return;
  }
  size_t count = choice_count(state);
  for (size_t index = 0; index < count; ++index) {
    struct choice choice = choice_at(state, index);
    apply_choice(state, choice);
    search_choices(state, record);
    undo_choice(state, choice);
  }
}`,

  'dsa-subsets': `static void enumerate_subsets(
    const int *values,
    size_t count,
    size_t index,
    int *path,
    size_t path_size,
    void (*emit)(const int *path, size_t size)
) {
  if (index == count) {
    emit(path, path_size);
    return;
  }
  enumerate_subsets(values, count, index + 1, path, path_size, emit);
  path[path_size] = values[index];
  enumerate_subsets(values, count, index + 1, path, path_size + 1, emit);
}`,

  'dsa-permutations': `static void enumerate_permutations(
    const int *values,
    size_t count,
    int *path,
    bool *used,
    size_t depth,
    void (*emit)(const int *path, size_t size)
) {
  if (depth == count) {
    emit(path, count);
    return;
  }
  for (size_t index = 0; index < count; ++index) {
    if (used[index]) continue;
    used[index] = true;
    path[depth] = values[index];
    enumerate_permutations(values, count, path, used, depth + 1, emit);
    used[index] = false;
  }
}`,

  'dsa-combination-sum': `static void combination_sum(
    const int *candidates,
    size_t count,
    size_t start,
    int remaining,
    int *path,
    size_t depth,
    void (*emit)(const int *path, size_t size)
) {
  if (remaining == 0) {
    emit(path, depth);
    return;
  }
  for (size_t index = start; index < count; ++index) {
    if (index > start && candidates[index] == candidates[index - 1]) continue;
    if (candidates[index] > remaining) break;
    path[depth] = candidates[index];
    combination_sum(candidates, count, index + 1,
      remaining - candidates[index], path, depth + 1, emit);
  }
}`,

  'dsa-divide': `static void merge_sort_range(
    int *values,
    int *scratch,
    size_t begin,
    size_t end
) {
  if (end - begin < 2) return;
  size_t middle = begin + (end - begin) / 2;
  merge_sort_range(values, scratch, begin, middle);
  merge_sort_range(values, scratch, middle, end);

  size_t left = begin;
  size_t right = middle;
  size_t output = begin;
  while (left < middle || right < end) {
    if (right == end || (left < middle && values[left] <= values[right])) {
      scratch[output++] = values[left++];
    } else {
      scratch[output++] = values[right++];
    }
  }
  for (size_t index = begin; index < end; ++index) values[index] = scratch[index];
}`,

  'dsa-greedy': `size_t select_non_overlapping(
    struct interval *intervals,
    size_t count,
    struct interval *selected
) {
  qsort(intervals, count, sizeof *intervals, compare_interval_end);
  size_t used = 0;
  int last_end = INT_MIN;
  for (size_t index = 0; index < count; ++index) {
    if (intervals[index].start >= last_end) {
      selected[used++] = intervals[index];
      last_end = intervals[index].end;
    }
  }
  return used;
}`,

  'dsa-dp': `int minimum_choices(const int *choices, size_t choice_count, size_t target) {
  int *dp = malloc((target + 1) * sizeof *dp);
  for (size_t value = 0; value <= target; ++value) dp[value] = INT_MAX;
  dp[0] = 0;
  for (size_t value = 1; value <= target; ++value) {
    for (size_t index = 0; index < choice_count; ++index) {
      int choice = choices[index];
      if (choice > 0 && (size_t)choice <= value && dp[value - choice] != INT_MAX) {
        int candidate = dp[value - choice] + 1;
        if (candidate < dp[value]) dp[value] = candidate;
      }
    }
  }
  int result = dp[target];
  free(dp);
  return result == INT_MAX ? -1 : result;
}`,

  'dsa-dp-take-skip': `long long maximum_non_adjacent_sum(const int *values, size_t count) {
  long long skip = 0;
  long long take = 0;
  for (size_t index = 0; index < count; ++index) {
    long long next_take = skip + values[index];
    long long next_skip = skip > take ? skip : take;
    take = next_take;
    skip = next_skip;
  }
  return skip > take ? skip : take;
}`,

  'dsa-dp-grid': `unsigned long long count_grid_paths(size_t rows, size_t columns) {
  unsigned long long *paths = calloc(columns, sizeof *paths);
  paths[0] = 1;
  for (size_t row = 0; row < rows; ++row) {
    for (size_t column = 1; column < columns; ++column) {
      paths[column] += paths[column - 1];
    }
  }
  unsigned long long result = paths[columns - 1];
  free(paths);
  return result;
}`,

  'dsa-knapsack': `int knapsack_01(
    const int *weights,
    const int *values,
    size_t count,
    size_t limit
) {
  int *best = calloc(limit + 1, sizeof *best);
  for (size_t item = 0; item < count; ++item) {
    for (size_t capacity = limit; capacity >= (size_t)weights[item]; --capacity) {
      int candidate = best[capacity - weights[item]] + values[item];
      if (candidate > best[capacity]) best[capacity] = candidate;
      if (capacity == (size_t)weights[item]) break;
    }
  }
  int result = best[limit];
  free(best);
  return result;
}`,

  'dsa-coin-change-min': `int minimum_coin_count(
    const int *coins,
    size_t coin_count,
    size_t amount
) {
  int *dp = malloc((amount + 1) * sizeof *dp);
  for (size_t value = 0; value <= amount; ++value) dp[value] = INT_MAX;
  dp[0] = 0;
  for (size_t value = 1; value <= amount; ++value) {
    for (size_t index = 0; index < coin_count; ++index) {
      int coin = coins[index];
      if (coin > 0 && (size_t)coin <= value && dp[value - coin] != INT_MAX) {
        int candidate = dp[value - coin] + 1;
        if (candidate < dp[value]) dp[value] = candidate;
      }
    }
  }
  int answer = dp[amount];
  free(dp);
  return answer == INT_MAX ? -1 : answer;
}`,

  'dsa-coin-change-ways': `unsigned long long count_coin_combinations(
    const int *coins,
    size_t coin_count,
    size_t amount
) {
  unsigned long long *ways = calloc(amount + 1, sizeof *ways);
  ways[0] = 1;
  for (size_t index = 0; index < coin_count; ++index) {
    int coin = coins[index];
    for (size_t value = (size_t)coin; value <= amount; ++value) {
      ways[value] += ways[value - coin];
    }
  }
  unsigned long long answer = ways[amount];
  free(ways);
  return answer;
}`,

  'dsa-lis': `size_t longest_increasing_subsequence(const int *values, size_t count) {
  int *tails = malloc(count * sizeof *tails);
  size_t length = 0;
  for (size_t index = 0; index < count; ++index) {
    size_t left = 0;
    size_t right = length;
    while (left < right) {
      size_t middle = left + (right - left) / 2;
      if (tails[middle] < values[index]) left = middle + 1;
      else right = middle;
    }
    tails[left] = values[index];
    if (left == length) ++length;
  }
  free(tails);
  return length;
}`,

  'dsa-lcs': `size_t longest_common_subsequence(
    const char *left,
    const char *right,
    size_t right_length
) {
  size_t *previous = calloc(right_length + 1, sizeof *previous);
  size_t *current = calloc(right_length + 1, sizeof *current);
  for (size_t row = 1; left[row - 1] != '\\0'; ++row) {
    for (size_t column = 1; column <= right_length; ++column) {
      current[column] = left[row - 1] == right[column - 1]
        ? previous[column - 1] + 1
        : max_size(previous[column], current[column - 1]);
    }
    size_t *swap = previous;
    previous = current;
    current = swap;
  }
  size_t answer = previous[right_length];
  free(previous);
  free(current);
  return answer;
}`,

  'dsa-edit-distance': `size_t edit_distance(const char *source, const char *target, size_t target_length) {
  size_t *previous = malloc((target_length + 1) * sizeof *previous);
  size_t *current = malloc((target_length + 1) * sizeof *current);
  for (size_t column = 0; column <= target_length; ++column) previous[column] = column;

  for (size_t row = 1; source[row - 1] != '\\0'; ++row) {
    current[0] = row;
    for (size_t column = 1; column <= target_length; ++column) {
      size_t replace = previous[column - 1] + (source[row - 1] != target[column - 1]);
      size_t remove = previous[column] + 1;
      size_t insert = current[column - 1] + 1;
      current[column] = min3_size(replace, remove, insert);
    }
    size_t *swap = previous;
    previous = current;
    current = swap;
  }
  size_t answer = previous[target_length];
  free(previous);
  free(current);
  return answer;
}`,

  'dsa-dp-compression': `unsigned long long unique_paths_rolling(size_t rows, size_t columns) {
  unsigned long long *row = calloc(columns, sizeof *row);
  row[0] = 1;
  for (size_t current_row = 0; current_row < rows; ++current_row) {
    for (size_t column = 1; column < columns; ++column) {
      row[column] += row[column - 1];
    }
  }
  unsigned long long answer = row[columns - 1];
  free(row);
  return answer;
}`,

  'dsa-bitwise': `unsigned set_bit(unsigned mask, unsigned bit) {
  return mask | (1u << bit);
}

unsigned clear_bit(unsigned mask, unsigned bit) {
  return mask & ~(1u << bit);
}

bool has_bit(unsigned mask, unsigned bit) {
  return (mask & (1u << bit)) != 0;
}

unsigned isolate_lowest_set_bit(unsigned mask) {
  return mask & (~mask + 1u);
}`,
};
