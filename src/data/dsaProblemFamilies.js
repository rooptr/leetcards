const frame = (caption, values, extra = {}) => ({
  caption,
  values,
  markers: extra.markers ?? [],
  active: extra.active ?? [],
  ...extra,
});

const code = {
  sequenceTerms: `// substring/subarray: [left, right) is contiguous
// subsequence: indexes increase but may skip
// consecutive values: x, x + 1, x + 2 may live anywhere`,
  frequency: `std::array<int, 26> count{};
for (char ch : text) ++count[ch - 'a'];
for (char ch : pattern) --count[ch - 'a'];
bool anagram = std::ranges::all_of(count, [](int x) { return x == 0; });`,
  palindrome: `bool palindrome(std::string_view s) {
  for (int left = 0, right = static_cast<int>(s.size()) - 1; left < right; ++left, --right)
    if (s[left] != s[right]) return false;
  return true;
}`,
  twoPointers: `bool has_pair_sum(std::span<const int> values, int target) {
  std::size_t left = 0;
  std::size_t right = values.size();
  while (left < right) {
    const int sum = values[left] + values[right - 1];
    if (sum == target) return true;
    if (sum < target) ++left;
    else --right;
  }
  return false;
}`,
  sliding: `long long max_fixed_window_sum(std::span<const int> values, std::size_t width) {
  if (width == 0 || width > values.size()) throw std::invalid_argument("width");
  long long window = std::accumulate(values.begin(), values.begin() + width, 0LL);
  long long best = window;
  for (std::size_t right = width; right < values.size(); ++right) {
    window += values[right] - values[right - width];
    best = std::max(best, window);
  }
  return best;
}`,
  longestSubstring: `std::array<int, 256> last;
last.fill(-1);
int left = 0, best = 0;
for (int right = 0; right < static_cast<int>(s.size()); ++right) {
  left = std::max(left, last[static_cast<unsigned char>(s[right])] + 1);
  last[static_cast<unsigned char>(s[right])] = right;
  best = std::max(best, right - left + 1);
}`,
  kDistinct: `int atMost(std::string_view s, int k) {
  std::unordered_map<char, int> count;
  int left = 0, total = 0;
  for (int right = 0; right < static_cast<int>(s.size()); ++right) {
    ++count[s[right]];
    while (static_cast<int>(count.size()) > k)
      if (--count[s[left++]] == 0) count.erase(s[left - 1]);
    total += right - left + 1;
  }
  return total;
}
// exactly(k) = atMost(k) - atMost(k - 1)`,
  kadane: `long long bestEnding = a[0], best = a[0];
for (int i = 1; i < static_cast<int>(a.size()); ++i) {
  bestEnding = std::max<long long>(a[i], bestEnding + a[i]);
  best = std::max(best, bestEnding);
}`,
  consecutive: `std::unordered_set<int> values(a.begin(), a.end());
int best = 0;
for (int value : values) {
  if (values.contains(value - 1)) continue;
  int end = value;
  while (values.contains(end)) ++end;
  best = std::max(best, end - value);
}`,
  cyclic: `for (int i = 0; i < n;) {
  int target = a[i] - 1;
  if (a[i] >= 1 && a[i] <= n && a[i] != a[target])
    std::swap(a[i], a[target]);
  else
    ++i;
}`,
  topK: `std::priority_queue<int, std::vector<int>, std::greater<int>> top;
for (int value : values) {
  top.push(value);
  if (static_cast<int>(top.size()) > k) top.pop();
}`,
  quickselect: `int kth(std::vector<int>& a, int k) {
  int left = 0, right = static_cast<int>(a.size()) - 1;
  while (left <= right) {
    int pivot = partition(a, left, right);
    if (pivot == k) return a[pivot];
    if (pivot < k) left = pivot + 1; else right = pivot - 1;
  }
  throw std::out_of_range("k");
}`,
  kWay: `using Item = std::tuple<int, int, int>; // value, list, index
std::priority_queue<Item, std::vector<Item>, std::greater<Item>> heap;
for (int list = 0; list < lists.size(); ++list)
  if (!lists[list].empty()) heap.emplace(lists[list][0], list, 0);`,
  subsets: `void subsets(int index, const std::vector<int>& a, std::vector<int>& path) {
  if (index == a.size()) { output.push_back(path); return; }
  subsets(index + 1, a, path);
  path.push_back(a[index]);
  subsets(index + 1, a, path);
  path.pop_back();
}`,
  permutations: `void permute(std::vector<int>& path, std::vector<bool>& used) {
  if (path.size() == values.size()) { output.push_back(path); return; }
  for (int i = 0; i < values.size(); ++i) if (!used[i]) {
    used[i] = true; path.push_back(values[i]);
    permute(path, used);
    path.pop_back(); used[i] = false;
  }
}`,
  combination: `void search(int start, int remain) {
  if (remain == 0) { output.push_back(path); return; }
  for (int i = start; i < candidates.size() && candidates[i] <= remain; ++i) {
    if (i > start && candidates[i] == candidates[i - 1]) continue;
    path.push_back(candidates[i]);
    search(i + 1, remain - candidates[i]);
    path.pop_back();
  }
}`,
  takeSkip: `std::vector<int> dp(n + 1);
dp[1] = value[0];
for (int i = 2; i <= n; ++i)
  dp[i] = std::max(dp[i - 1], dp[i - 2] + value[i - 1]);`,
  grid: `for (int row = 0; row < rows; ++row)
  for (int col = 0; col < cols; ++col)
    if (row || col)
      dp[row][col] = fromTop(row, col) + fromLeft(row, col);`,
  knapsack: `for (auto [weight, value] : items)
  for (int capacity = limit; capacity >= weight; --capacity)
    dp[capacity] = std::max(dp[capacity], dp[capacity - weight] + value);
// Iterate capacity upward for unbounded reuse.`,
  coinMin: `std::vector<int> dp(amount + 1, amount + 1);
dp[0] = 0;
for (int value = 1; value <= amount; ++value)
  for (int coin : coins) if (coin <= value)
    dp[value] = std::min(dp[value], dp[value - coin] + 1);`,
  coinWays: `std::vector<long long> ways(amount + 1);
ways[0] = 1;
for (int coin : coins)
  for (int value = coin; value <= amount; ++value)
    ways[value] += ways[value - coin];`,
  lis: `std::vector<int> tails;
for (int value : a) {
  auto it = std::lower_bound(tails.begin(), tails.end(), value);
  if (it == tails.end()) tails.push_back(value);
  else *it = value;
}
int length = static_cast<int>(tails.size());`,
  lcs: `for (int i = 1; i <= a.size(); ++i)
  for (int j = 1; j <= b.size(); ++j)
    dp[i][j] = a[i - 1] == b[j - 1]
      ? dp[i - 1][j - 1] + 1
      : std::max(dp[i - 1][j], dp[i][j - 1]);`,
  edit: `dp[i][j] = a[i - 1] == b[j - 1]
  ? dp[i - 1][j - 1]
  : 1 + std::min({dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]});`,
  compression: `std::vector<int> previous(cols), current(cols);
for (int row = 0; row < rows; ++row) {
  for (int col = 0; col < cols; ++col)
    current[col] = transition(previous, current, col);
  std::swap(previous, current);
}`,
};

export const problemFamilySpecs = {
  'dsa-sequence-terms': {
    summary: 'Sequence words are constraints, not decoration: substring and subarray require contiguity, subsequence preserves order while allowing gaps, and consecutive values concern numeric neighbors.',
    invariant: 'The candidate obeys the exact relationship named by the question: contiguous indexes, increasing indexes, or adjacent numeric values.',
    prediction: 'Does the answer require adjacent indexes, preserved order with skips, or values that differ by one?',
    guidance: ['the question uses substring, subarray, subsequence, or consecutive', 'choosing the wrong definition changes the legal candidates', 'the statement uses the word informally and provides a different formal constraint', 'O(1) to classify the wording before choosing an algorithm', code.sequenceTerms],
    visual: {
      kind: 'window',
      frames: [
        frame('Start with A B C D and name positions 0 through 3.', ['A', 'B', 'C', 'D'], { window: [0, 3] }),
        frame('B C is a substring because indexes 1 and 2 are contiguous.', ['A', 'B', 'C', 'D'], { window: [1, 2], active: ['B', 'C'] }),
        frame('For an array, the same contiguous slice is called a subarray.', [4, 9, 2, 7], { window: [1, 2], active: [9, 2] }),
        frame('A C is a subsequence: order is preserved although index 1 is skipped.', ['A', 'B', 'C', 'D'], { window: [0, 2], discarded: [1], active: ['A', 'C'] }),
        frame('Values 7, 8, 9 form a consecutive-value result even when their indexes are far apart.', [9, 1, 7, 3, 8], { active: [9, 7, 8] }),
        frame('The final classification is proved by the relationship, not by how similar the words sound.', ['contiguous', 'ordered gaps', 'value neighbors'], { active: ['contiguous', 'ordered gaps', 'value neighbors'] }),
      ],
    },
  },
  'dsa-frequency-anagram': {
    summary: 'A frequency table replaces repeated character searches with one conserved count per symbol.',
    invariant: 'After equal prefixes are processed, each counter equals occurrences in the first text minus occurrences in the second.',
    prediction: 'Can equality be decided from symbol multiplicities while order is irrelevant?',
    guidance: ['identity depends on how many times each symbol appears', 'the alphabet is small enough for an array or hash map', 'relative order or positions are part of the answer', 'O(n + alphabet) time and O(alphabet) space', code.frequency],
    visual: {
      kind: 'buckets',
      frames: [
        frame('Create zero counters for the alphabet used by listen and silent.', ['e:0', 'i:0', 'l:0', 'n:0', 's:0', 't:0']),
        frame('Count listen, increasing one bucket for each character.', ['e:1', 'i:1', 'l:1', 'n:1', 's:1', 't:1'], { active: ['0:e', '1:i', '2:l', '3:n', '4:s', '5:t'] }),
        frame('Subtract s from silent; the s counter returns to zero.', ['e:1', 'i:1', 'l:1', 'n:1', 's:0', 't:1'], { active: ['4:s'] }),
        frame('Continue subtracting i, l, e, n, and t.', ['e:0', 'i:0', 'l:0', 'n:0', 's:0', 't:0'], { active: ['0:e', '1:i', '2:l', '3:n', '5:t'] }),
        frame('Every counter is zero, so no unmatched occurrence remains.', ['e:0', 'i:0', 'l:0', 'n:0', 's:0', 't:0']),
        frame('The final anagram result is true because all multiplicities match.', ['listen', 'silent', 'true'], { active: ['true'] }),
      ],
    },
  },
  'dsa-palindrome': {
    summary: 'Palindrome reasoning compares mirrored positions or expands equal mirrors around a center.',
    invariant: 'Everything outside the live pointer interval has already been proved symmetric.',
    prediction: 'Which two positions must match before the candidate can shrink or expand safely?',
    guidance: ['the answer depends on mirrored characters', 'the candidate can be checked from both ends or grown around a center', 'the transformation permits reordering rather than symmetry', 'O(n) check time and O(1) space; O(n²) for all center expansions', code.palindrome],
    visual: {
      kind: 'pointer-array',
      frames: [
        frame('Place left and right at the ends of r a c e c a r.', [...'racecar'], { pointers: { left: 0, right: 6 }, active: ['r'] }),
        frame('The outer r characters match, so move both pointers inward.', [...'racecar'], { pointers: { left: 1, right: 5 }, discarded: [0, 6], active: ['a'] }),
        frame('The a characters match, preserving symmetry.', [...'racecar'], { pointers: { left: 2, right: 4 }, discarded: [0, 1, 5, 6], active: ['c'] }),
        frame('The c characters match, leaving only the center.', [...'racecar'], { pointers: { left: 3, right: 3 }, discarded: [0, 1, 2, 4, 5, 6], active: ['e'] }),
        frame('The pointers meet; every mirrored pair has been checked.', [...'racecar'], { pointers: { left: 3, right: 3 }, active: ['e'] }),
        frame('The final result is palindrome=true with O(1) extra state.', ['palindrome', 'true'], { active: ['true'] }),
      ],
    },
  },
  'dsa-two-pointers': {
    summary: 'Two pointers turn sorted order into a proof: one comparison discards every pair attached to the pointer that moves.',
    invariant: 'If a valid pair still exists, it lies inside the closed interval from left to right; every outside pair has been disproved by sorted order.',
    prediction: 'When the current sum is too small, which pointer can move without skipping a possible answer?',
    guidance: ['the input is sorted and the question asks about a pair, range, or mirrored positions', 'moving one boundary discards many impossible candidates at once', 'the input is unsorted and original indexes must be preserved', 'O(n) time and O(1) extra space after sorting is available', code.twoPointers],
    visual: {
      kind: 'pointer-array',
      frames: [
        frame('Target 9: place left at 1 and right at 11 in the sorted array.', [1, 2, 4, 7, 11], { pointers: { left: 0, right: 4 }, active: [1, 11] }),
        frame('1 + 11 = 12 is too large; every pair using 11 with a later left value is also too large.', [1, 2, 4, 7, 11], { pointers: { left: 0, right: 4 }, active: [1, 11] }),
        frame('Move only right to 7. The possible interval is now indexes 0 through 3.', [1, 2, 4, 7, 11], { pointers: { left: 0, right: 3 }, discarded: [4], active: [1, 7] }),
        frame('1 + 7 = 8 is too small; every pair using 1 with an earlier right value is smaller still.', [1, 2, 4, 7, 11], { pointers: { left: 0, right: 3 }, discarded: [4], active: [1, 7] }),
        frame('Move only left to 2. The candidate pair is now 2 + 7.', [1, 2, 4, 7, 11], { pointers: { left: 1, right: 3 }, discarded: [0, 4], active: [2, 7] }),
        frame('The final answer is 2 + 7 = 9, found without checking the discarded pairs.', [1, 2, 4, 7, 11], { pointers: { left: 1, right: 3 }, discarded: [0, 4], active: [2, 7] }),
      ],
    },
  },
  'dsa-sliding': {
    summary: 'A sliding window reuses the state of one contiguous range, replacing a full rescan with one leaving update and one entering update.',
    invariant: 'The maintained sum equals exactly the values inside the current width-three window, and best is the largest complete window seen so far.',
    prediction: 'When the right edge advances, which value enters and which single value must leave?',
    guidance: ['the question repeats the same calculation over contiguous ranges', 'the next candidate differs from the current one only at its boundaries', 'removing a value cannot be expressed as a safe inverse update', 'O(n) time and O(1) extra space for a fixed-width aggregate', code.sliding],
    visual: {
      kind: 'window',
      frames: [
        frame('For width 3, begin with 2 + 1 + 5 = 8.', [2, 1, 5, 1, 3, 2], { pointers: { left: 0, right: 2 }, window: [0, 2], active: [2, 1, 5] }),
        frame('Record best = 8 before moving either boundary.', [2, 1, 5, 1, 3, 2], { pointers: { left: 0, right: 2 }, window: [0, 2], active: [2, 1, 5] }),
        frame('Slide once: 2 leaves and the next 1 enters, so the sum becomes 7.', [2, 1, 5, 1, 3, 2], { pointers: { left: 1, right: 3 }, window: [1, 3], leaving: 0, entering: 3, discarded: [0], active: [1, 5] }),
        frame('Slide again: the old 1 leaves and 3 enters, so the sum becomes 9.', [2, 1, 5, 1, 3, 2], { pointers: { left: 2, right: 4 }, window: [2, 4], leaving: 1, entering: 4, discarded: [0, 1], active: [5, 1, 3] }),
        frame('Update best to 9; the aggregate still describes exactly the highlighted range.', [2, 1, 5, 1, 3, 2], { pointers: { left: 2, right: 4 }, window: [2, 4], discarded: [0, 1], active: [5, 1, 3] }),
        frame('The final slide sums to 6, so the maximum width-three sum remains 9.', [2, 1, 5, 1, 3, 2], { pointers: { left: 3, right: 5 }, window: [3, 5], discarded: [0, 1, 2], active: [1, 3, 2] }),
      ],
    },
  },
  'dsa-longest-substring': {
    summary: 'The longest unique substring is a variable window whose left edge jumps past the previous copy of the newest character.',
    invariant: 'The current window contains no repeated character, and left never moves backward.',
    prediction: 'When a repeated character enters, which earliest index must be excluded?',
    guidance: ['the answer is a longest contiguous substring with uniqueness', 'last-seen indexes can repair the window in one jump', 'the constraint is not monotonic under removing from the left', 'O(n) time and O(alphabet) space', code.longestSubstring],
    visual: {
      kind: 'window',
      frames: [
        frame('Start before reading a b c a b c b b.', [...'abcabcbb'], { pointers: { left: 0, right: 0 }, window: [0, 0], entering: 0, active: ['a'] }),
        frame('Add b; the window a b is unique and best becomes 2.', [...'abcabcbb'], { pointers: { left: 0, right: 1 }, window: [0, 1], entering: 1, active: ['a', 'b'] }),
        frame('Add c; a b c is unique and best becomes 3.', [...'abcabcbb'], { pointers: { left: 0, right: 2 }, window: [0, 2], entering: 2, active: ['a', 'b', 'c'] }),
        frame('Add a at index 3; jump left past the previous a at index 0.', [...'abcabcbb'], { pointers: { left: 1, right: 3 }, window: [1, 3], discarded: [0], entering: 3, active: ['b', 'c', 'a'] }),
        frame('Add b at index 4; jump left past the previous b at index 1.', [...'abcabcbb'], { pointers: { left: 2, right: 4 }, window: [2, 4], discarded: [0, 1], entering: 4, active: ['c', 'a', 'b'] }),
        frame('Add c at index 5; the repaired window still has length 3.', [...'abcabcbb'], { pointers: { left: 3, right: 5 }, window: [3, 5], discarded: [0, 1, 2], entering: 5, active: ['a', 'b', 'c'] }),
        frame('The later b characters force left forward and cannot improve best.', [...'abcabcbb'], { pointers: { left: 7, right: 7 }, window: [7, 7], discarded: [0, 1, 2, 3, 4, 5, 6], entering: 7, active: ['b'] }),
        frame('The final answer is 3, represented by a b c and every equivalent unique window.', [...'abcabcbb'], { pointers: { left: 0, right: 2 }, window: [0, 2], active: ['a', 'b', 'c'] }),
      ],
    },
  },
  'dsa-k-distinct': {
    summary: 'K-distinct substring counting maintains a frequency map and shrinks until the number of live keys is at most K.',
    invariant: 'The window has at most K distinct characters, and every shorter suffix ending at right is also valid.',
    prediction: 'After the window is valid, how many valid substrings end at the current right edge?',
    guidance: ['the question asks for at most or exactly K distinct values in a contiguous range', 'exactly K can be expressed as atMost(K) minus atMost(K-1)', 'removing from the left can make the property less valid', 'O(n) time and O(K) to O(alphabet) space', code.kDistinct],
    visual: {
      kind: 'window',
      frames: [
        frame('Read e in e c e b a with K=2; one valid suffix ends here.', [...'eceba'], { pointers: { left: 0, right: 0 }, window: [0, 0], active: ['e'] }),
        frame('Add c; the window has two distinct characters.', [...'eceba'], { pointers: { left: 0, right: 1 }, window: [0, 1], active: ['e', 'c'] }),
        frame('Add e; frequencies change but the distinct count remains two.', [...'eceba'], { pointers: { left: 0, right: 2 }, window: [0, 2], active: ['e', 'c'] }),
        frame('Add b; three distinct characters violate at-most-two.', [...'eceba'], { pointers: { left: 0, right: 3 }, window: [0, 3], entering: 3, active: ['b'] }),
        frame('Remove e, then c; c reaches zero and the map returns to two keys.', [...'eceba'], { pointers: { left: 2, right: 3 }, window: [2, 3], discarded: [0, 1], active: ['e', 'b'] }),
        frame('Add a and shrink past e, leaving b a as the final valid window.', [...'eceba'], { pointers: { left: 3, right: 4 }, window: [3, 4], discarded: [0, 1, 2], active: ['b', 'a'] }),
        frame('Exactly-K is the final difference between two complete at-most counts.', ['atMost(2)', 'atMost(1)', 'exactly(2)'], { active: ['exactly(2)'] }),
      ],
    },
  },
  'dsa-kadane': {
    summary: 'Kadane’s algorithm keeps the best subarray ending exactly here, discarding any negative prefix that would only hurt the next choice.',
    invariant: 'bestEnding is the maximum sum of a non-empty subarray ending at the current index; best is the maximum seen anywhere.',
    prediction: 'Is extending the previous subarray better than starting fresh at this value?',
    guidance: ['the question asks for a maximum-sum contiguous subarray', 'a negative accumulated prefix can be proved harmful to every extension', 'the answer may skip arbitrary positions', 'O(n) time and O(1) extra space', code.kadane],
    visual: {
      kind: 'window',
      frames: [
        frame('Start at -2; bestEnding and best are both -2.', [-2, 1, -3, 4, -1, 2, 1, -5, 4], { pointers: { left: 0, right: 0 }, window: [0, 0], active: [-2], markers: ['ending=-2', 'best=-2'] }),
        frame('At 1, starting fresh beats extending -2, so the live subarray restarts.', [-2, 1, -3, 4, -1, 2, 1, -5, 4], { pointers: { left: 1, right: 1 }, window: [1, 1], discarded: [0], active: [1], markers: ['ending=1', 'best=1'] }),
        frame('Adding -3 produces -2; keep it only as the best subarray ending here.', [-2, 1, -3, 4, -1, 2, 1, -5, 4], { pointers: { left: 1, right: 2 }, window: [1, 2], active: [-3], markers: ['ending=-2', 'best=1'] }),
        frame('At 4, starting fresh is better, so reset the left edge to index 3.', [-2, 1, -3, 4, -1, 2, 1, -5, 4], { pointers: { left: 3, right: 3 }, window: [3, 3], discarded: [0, 1, 2], active: [4], markers: ['ending=4', 'best=4'] }),
        frame('Extend through -1, 2, and 1; bestEnding grows to 6.', [-2, 1, -3, 4, -1, 2, 1, -5, 4], { pointers: { left: 3, right: 6 }, window: [3, 6], active: [4, -1, 2, 1], markers: ['ending=6', 'best=6'] }),
        frame('The remaining suffix never exceeds 6, so the final answer is [4,-1,2,1].', [-2, 1, -3, 4, -1, 2, 1, -5, 4], { pointers: { left: 3, right: 6 }, window: [3, 6], active: [4, -1, 2, 1], markers: ['answer=6'] }),
      ],
    },
  },
  'dsa-longest-consecutive': {
    summary: 'Longest consecutive sequence scans only run starts, then walks numeric neighbors through a hash set regardless of their input positions.',
    invariant: 'A run is counted only from a value whose predecessor is absent, so no consecutive chain is scanned twice.',
    prediction: 'Which value proves that this element is the first member of its numeric run?',
    guidance: ['the answer concerns consecutive numeric values, not adjacent indexes', 'membership is fast and ordering is irrelevant', 'duplicates carry separate meaning or sorted output is required', 'O(n) expected time and O(n) space', code.consecutive],
    visual: {
      kind: 'buckets',
      frames: [
        frame('Insert 100, 4, 200, 1, 3, and 2 into a hash set.', ['1:yes', '2:yes', '3:yes', '4:yes', '100:yes', '200:yes']),
        frame('100 has no predecessor 99, so it starts a run of length 1.', ['99:no', '100:yes', '101:no'], { active: ['1:100'] }),
        frame('4 has predecessor 3, so skip it; this run must be counted from 1.', ['3:yes', '4:yes'], { active: ['0:3'] }),
        frame('1 has no predecessor 0, so walk 1, 2, 3, and 4.', ['1:yes', '2:yes', '3:yes', '4:yes'], { active: ['0:1', '1:2', '2:3', '3:4'] }),
        frame('200 starts another run, but its length is only 1.', ['199:no', '200:yes', '201:no'], { active: ['1:200'] }),
        frame('The final answer is 4, proved without sorting or scanning the run from each member.', ['run 1..4:4', 'run 100:1', 'run 200:1'], { active: ['0:run 1..4'] }),
      ],
    },
  },
  'dsa-cyclic-placement': {
    summary: 'Cyclic placement uses each in-range value as the index where it belongs, swapping until every position is correct or blocked by a duplicate.',
    invariant: 'Every completed index either contains its target value or has a documented reason it cannot be placed.',
    prediction: 'If value x belongs at index x-1, what prevents swapping it there now?',
    guidance: ['values lie in a compact index-sized range', 'the task asks for missing, duplicate, or misplaced values', 'values cannot be mutated or the range is sparse', 'O(n) time and O(1) extra space', code.cyclic],
    visual: {
      kind: 'pointer-array',
      frames: [
        frame('Start with 3, 1, 5, 4, 2; index 0 wants value 1.', [3, 1, 5, 4, 2], { pointers: { index: 0, target: 2 }, active: [3] }),
        frame('Swap 3 into index 2, bringing 5 to index 0.', [5, 1, 3, 4, 2], { pointers: { index: 0, target: 4 }, active: [5, 3] }),
        frame('Swap 5 into index 4, bringing 2 to index 0.', [2, 1, 3, 4, 5], { pointers: { index: 0, target: 1 }, active: [2, 5] }),
        frame('Swap 2 into index 1, bringing 1 to index 0.', [1, 2, 3, 4, 5], { pointers: { index: 0, target: 0 }, active: [1, 2] }),
        frame('Every value now equals index+1, so the scan advances without more swaps.', [1, 2, 3, 4, 5], { pointers: { index: 4, target: 4 }, active: [5] }),
        frame('The final placement is complete; any mismatch would directly identify a missing value.', [1, 2, 3, 4, 5], { active: [1, 2, 3, 4, 5] }),
      ],
    },
  },
  'dsa-top-k': {
    summary: 'Top K keeps only the K strongest candidates in a bounded heap, ejecting the weakest survivor whenever capacity is exceeded.',
    invariant: 'After processing i values, the heap contains the K largest values among exactly that prefix.',
    prediction: 'Which current survivor can be discarded when a stronger candidate arrives?',
    guidance: ['only K extremes are needed rather than full order', 'K is much smaller than the input', 'all values must be emitted in sorted order', 'O(n log K) time and O(K) space', code.topK],
    visual: {
      kind: 'tree',
      frames: [
        frame('For K=3, insert 5 into the empty min-heap.', [5], { active: [5] }),
        frame('Insert 1; it becomes the weakest current survivor at the root.', [1, 5], { active: [1] }),
        frame('Insert 9; the heap now contains exactly three candidates.', [1, 5, 9], { active: [9] }),
        frame('Insert 3, then remove root 1 to restore size K.', [3, 5, 9], { active: [1, 3] }),
        frame('Insert 8, then remove root 3; survivors are 5, 8, and 9.', [5, 8, 9], { active: [3, 8] }),
        frame('The final Top K result is {5,8,9}; sorting all inputs was unnecessary.', [5, 8, 9], { active: [5, 8, 9] }),
      ],
    },
  },
  'dsa-quickselect': {
    summary: 'Quickselect partitions around a pivot and follows only the side containing the target rank.',
    invariant: 'After partition, the pivot is in final rank and the target remains inside the live index interval.',
    prediction: 'After the pivot reaches its final index, which side can no longer contain rank K?',
    guidance: ['one order statistic is needed without full sorting', 'partitioning can discard one side', 'worst-case guarantees are mandatory without randomized pivots', 'O(n) expected time, O(n²) worst case', code.quickselect],
    visual: {
      kind: 'pointer-array',
      frames: [
        frame('Find rank 2 in 7,2,1,6,8,5,3,4 using pivot 4.', [7, 2, 1, 6, 8, 5, 3, 4], { pointers: { left: 0, right: 7 }, active: [4] }),
        frame('Partition values smaller than 4 to the left.', [2, 1, 3, 4, 8, 5, 7, 6], { pointers: { left: 0, pivot: 3, right: 7 }, active: [2, 1, 3, 4] }),
        frame('Pivot 4 lands at rank 3; target rank 2 must be left.', [2, 1, 3, 4, 8, 5, 7, 6], { pointers: { left: 0, right: 2 }, discarded: [3, 4, 5, 6, 7], active: [4] }),
        frame('Partition 2,1,3 using pivot 3.', [2, 1, 3, 4, 8, 5, 7, 6], { pointers: { left: 0, pivot: 2, right: 2 }, discarded: [3, 4, 5, 6, 7], active: [3] }),
        frame('Pivot rank equals K, so no further partition is needed.', [2, 1, 3, 4, 8, 5, 7, 6], { pointers: { pivot: 2 }, discarded: [3, 4, 5, 6, 7], active: [3] }),
        frame('The final rank-2 result is 3; the other values remain only partially ordered.', [2, 1, 3, 4, 8, 5, 7, 6], { pointers: { answer: 2 }, active: [3] }),
      ],
    },
  },
  'dsa-k-way-merge': {
    summary: 'K-way merge stores one frontier item per sorted source in a min-heap, so the next global value is always visible.',
    invariant: 'The heap contains the smallest unmerged value from each nonempty source, and output is globally sorted.',
    prediction: 'After removing one source’s frontier, which single value from that source becomes eligible?',
    guidance: ['several inputs are already sorted', 'only the current smallest item from each source can be next', 'inputs are unsorted and require full ordering first', 'O(N log K) time and O(K) space', code.kWay],
    visual: {
      kind: 'timeline',
      frames: [
        frame('Seed the heap with 1 from A, 2 from B, and 3 from C.', ['A:1,4', 'B:2,5', 'C:3,6'], { active: ['A:1,4', 'B:2,5', 'C:3,6'] }),
        frame('Remove 1 to output, then expose A’s next value 4.', ['output:1', 'heap:2,3,4'], { active: ['output:1'] }),
        frame('Remove 2 to output, then expose B’s next value 5.', ['output:1,2', 'heap:3,4,5'], { active: ['output:1,2'] }),
        frame('Remove 3 to output, then expose C’s next value 6.', ['output:1,2,3', 'heap:4,5,6'], { active: ['output:1,2,3'] }),
        frame('Drain 4, 5, and 6; no source has another frontier.', ['output:1,2,3,4,5,6', 'heap:empty'], { active: ['heap:empty'] }),
        frame('The final merge result is fully sorted after N heap removals.', ['1', '2', '3', '4', '5', '6'], { active: ['1', '2', '3', '4', '5', '6'] }),
      ],
    },
  },
  'dsa-subsets': {
    summary: 'Subset generation makes one binary decision per element: skip it or include it, then restores the path.',
    invariant: 'At recursion index i, path contains exactly the chosen elements from indexes below i.',
    prediction: 'What two complete branches arise from the next unused element?',
    guidance: ['every element may independently appear or not appear', 'the output is the power set', 'orderings of the same chosen set are distinct outputs', 'O(n·2ⁿ) output time and O(n) path space', code.subsets],
    visual: {
      kind: 'recursion-tree',
      frames: [
        frame('Start with an empty path before deciding about 1.', ['[]'], { active: ['[]'] }),
        frame('Skip 1, then skip 2; emit the empty subset.', ['[]', 'skip 1', 'skip 2', 'emit []'], { active: ['emit []'] }),
        frame('Undo the second decision, take 2, and emit [2].', ['[]', 'skip 1', 'take 2', 'emit [2]'], { active: ['emit [2]'] }),
        frame('Return to the root, take 1, skip 2, and emit [1].', ['[]', 'take 1', 'skip 2', 'emit [1]'], { active: ['emit [1]'] }),
        frame('Take both 1 and 2, then emit [1,2].', ['[]', 'take 1', 'take 2', 'emit [1,2]'], { active: ['emit [1,2]'] }),
        frame('The final result is [ ], [2], [1], [1,2], one leaf per decision vector.', ['[]', '[2]', '[1]', '[1,2]'], { active: ['[]', '[2]', '[1]', '[1,2]'] }),
      ],
    },
  },
  'dsa-permutations': {
    summary: 'Permutation search chooses any unused item for the next position and marks that identity unavailable until backtracking.',
    invariant: 'Path contains distinct source indexes, and used[i] is true exactly when values[i] appears in path.',
    prediction: 'Which unused identities are legal choices for the next position?',
    guidance: ['every ordering of all items is required', 'used-state prevents one identity from appearing twice', 'only combinations matter and relative order should be ignored', 'O(n·n!) output time and O(n) path space', code.permutations],
    visual: {
      kind: 'recursion-tree',
      frames: [
        frame('Start with path [ ] and unused values 1,2,3.', ['[]', '1', '2', '3'], { active: ['[]'] }),
        frame('Choose 1, then 2, then 3; emit [1,2,3].', ['[]', '[1]', '[1,2]', '[1,2,3]'], { active: ['[1,2,3]'] }),
        frame('Undo 3 and 2, then choose 3 before 2; emit [1,3,2].', ['[1]', '[1,3]', '[1,3,2]'], { active: ['[1,3,2]'] }),
        frame('Backtrack to root and begin with 2; both remaining orders are explored.', ['[]', '[2,1,3]', '[2,3,1]'], { active: ['[2,1,3]', '[2,3,1]'] }),
        frame('Begin with 3 and explore the final two orders.', ['[]', '[3,1,2]', '[3,2,1]'], { active: ['[3,1,2]', '[3,2,1]'] }),
        frame('The final result contains all 3! permutations with no repeated source index.', ['123', '132', '213', '231', '312', '321'], { active: ['123', '132', '213', '231', '312', '321'] }),
      ],
    },
  },
  'dsa-combination-sum': {
    summary: 'Combination-sum search grows a sorted path, subtracts from the remaining target, and prunes duplicates or values that are already too large.',
    invariant: 'Path is nondecreasing, its sum plus remain equals the target, and skipped duplicate roots cannot create a new combination.',
    prediction: 'Which candidate would make remain negative or repeat a combination already explored at this depth?',
    guidance: ['a target must be formed from candidate choices', 'sorting exposes over-target and duplicate branches', 'negative values make the remaining-target pruning invalid', 'Exponential in the explored state tree', code.combination],
    visual: {
      kind: 'recursion-tree',
      frames: [
        frame('Sort 2,3,6,7 and start with remain 7.', ['remain 7'], { active: ['remain 7'] }),
        frame('Choose 2; remain becomes 5 and 2 may be reused.', ['7', '2→5'], { active: ['2→5'] }),
        frame('Choose 2 again, then 3; remain reaches zero and emits [2,2,3].', ['7', '2→5', '2→3', '3→0'], { active: ['3→0'] }),
        frame('Backtrack; choosing 6 after 2 exceeds remain 5, so later values are pruned.', ['2→5', '6 rejected', '7 pruned'], { active: ['6 rejected'] }),
        frame('From the root, choose 7 directly and emit [7].', ['7→0', 'emit [7]'], { active: ['emit [7]'] }),
        frame('The final result is [2,2,3] and [7], with duplicate branches removed.', ['[2,2,3]', '[7]'], { active: ['[2,2,3]', '[7]'] }),
      ],
    },
  },
  'dsa-dp-take-skip': {
    summary: 'Take-or-skip DP compares excluding the current item with taking it plus the best compatible earlier state.',
    invariant: 'dp[i] is the optimal answer using exactly the first i items.',
    prediction: 'If the current item is taken, which earlier state remains compatible?',
    guidance: ['each item creates a take or skip decision', 'taking an item restricts which previous state can combine with it', 'choices interact through more history than the state records', 'O(n) time and O(n) or O(1) space', code.takeSkip],
    visual: {
      kind: 'dp-grid',
      frames: [
        frame('For values 2,7,9,3,1, define dp[i] over the first i houses.', [0, 0, 0, 0, 0, 0], { active: [0] }),
        frame('Base cases: dp[0]=0 and dp[1]=2.', [0, 2, 0, 0, 0, 0], { active: [0, 2] }),
        frame('At 7, max(skip=2, take=7) gives dp[2]=7.', [0, 2, 7, 0, 0, 0], { active: [2, 7], dependencies: ['0:0', '0:1'] }),
        frame('At 9, max(skip=7, take=2+9) gives dp[3]=11.', [0, 2, 7, 11, 0, 0], { active: [7, 11], dependencies: ['0:1', '0:2'] }),
        frame('Process 3 and 1 using the same two dependencies.', [0, 2, 7, 11, 11, 12], { active: [11, 12], dependencies: ['0:3', '0:4'] }),
        frame('The final answer is 12; only the previous two states are needed for rolling storage.', [0, 2, 7, 11, 11, 12], { active: [12] }),
      ],
    },
  },
  'dsa-dp-grid': {
    summary: 'Grid DP assigns a state to each coordinate and fills cells only after the directional dependencies they read are final.',
    invariant: 'Each filled cell equals the complete answer for paths ending at that coordinate.',
    prediction: 'Which neighboring cells can legally precede this coordinate?',
    guidance: ['the state is naturally a row and column', 'movement rules make dependency direction acyclic', 'paths may revisit cells and require graph-state reasoning', 'O(rows·cols) time and space before compression', code.grid],
    visual: {
      kind: 'dp-grid',
      frames: [
        frame('Initialize a 3 by 3 path-count table with one way at the origin.', [[1, 0, 0], [0, 0, 0], [0, 0, 0]], { active: ['0:0'] }),
        frame('Fill the first row; each cell can only come from its left neighbor.', [[1, 1, 1], [0, 0, 0], [0, 0, 0]], { active: ['0:1', '0:2'], dependencies: ['0:0', '0:1'] }),
        frame('Fill the first column; each cell can only come from above.', [[1, 1, 1], [1, 0, 0], [1, 0, 0]], { active: ['1:0', '2:0'], dependencies: ['0:0', '1:0'] }),
        frame('Cell (1,1) reads top 1 and left 1, producing 2.', [[1, 1, 1], [1, 2, 0], [1, 0, 0]], { active: ['1:1'], dependencies: ['0:1', '1:0'] }),
        frame('Finish in row-major order after every dependency is final.', [[1, 1, 1], [1, 2, 3], [1, 3, 6]], { active: ['2:2'], dependencies: ['1:2', '2:1'] }),
        frame('The final result is 6 paths to the bottom-right cell.', [[1, 1, 1], [1, 2, 3], [1, 3, 6]], { active: ['2:2'] }),
      ],
    },
  },
  'dsa-knapsack': {
    summary: 'Knapsack DP defines value by capacity; the loop direction decides whether one item may be reused.',
    invariant: 'After processing an item, dp[c] is the best value reachable at capacity c under the intended reuse rule.',
    prediction: 'Would reading this row’s newly updated cell accidentally reuse the current item?',
    guidance: ['choices consume capacity and contribute value', '0/1 and unbounded variants differ only in legal reuse', 'items interact through additional constraints not represented by capacity', 'O(items·capacity) time and O(capacity) space', code.knapsack],
    visual: {
      kind: 'dp-grid',
      frames: [
        frame('Start capacities 0 through 5 with value zero.', [0, 0, 0, 0, 0, 0], { active: [0] }),
        frame('Process item (weight 2,value 3) backward for 0/1 use.', [0, 0, 3, 3, 3, 3], { active: [3], dependencies: ['0:0', '0:1', '0:2', '0:3'] }),
        frame('Process item (weight 3,value 4) backward.', [0, 0, 3, 4, 4, 7], { active: [4, 7], dependencies: ['0:0', '0:2'] }),
        frame('Capacity 5 combines distinct items for value 7.', [0, 0, 3, 4, 4, 7], { active: [7] }),
        frame('If capacity iterated upward, weight 2 could be read again in the same item pass.', [0, 0, 3, 3, 6, 6], { active: [6], markers: ['unbounded behavior'] }),
        frame('The final 0/1 result is 7; loop direction preserved the no-reuse rule.', [0, 0, 3, 4, 4, 7], { active: [7] }),
      ],
    },
  },
  'dsa-coin-change-min': {
    summary: 'Minimum Coin Change stores the fewest coins needed for each amount and minimizes over one smaller reachable amount.',
    invariant: 'dp[x] is the minimum number of coins that forms amount x, or unreachable if no transition succeeds.',
    prediction: 'Which smaller amount remains after choosing this coin once?',
    guidance: ['the question asks for the minimum number of reusable denominations', 'the state meaning is an optimization value, not a count of constructions', 'coins have negative values or bounded quantities without extra state', 'O(amount·coins) time and O(amount) space', code.coinMin],
    visual: {
      kind: 'dp-grid',
      frames: [
        frame('For coins 1,3,4 and amount 6, set dp[0]=0 and others unreachable.', [0, '∞', '∞', '∞', '∞', '∞', '∞'], { active: [0] }),
        frame('Amount 1 uses coin 1, so dp[1]=1.', [0, 1, '∞', '∞', '∞', '∞', '∞'], { active: [1], dependencies: ['0:0'] }),
        frame('Amount 2 extends dp[1] with another coin 1, so dp[2]=2.', [0, 1, 2, '∞', '∞', '∞', '∞'], { active: [2], dependencies: ['0:1'] }),
        frame('Amount 3 chooses one coin 3 instead of three coin-1 pieces.', [0, 1, 2, 1, '∞', '∞', '∞'], { active: [1], dependencies: ['0:0', '0:2'] }),
        frame('Amount 4 chooses one coin 4; amount 5 becomes 4+1 in two coins.', [0, 1, 2, 1, 1, 2, '∞'], { active: [1, 2], dependencies: ['0:0', '0:1', '0:4'] }),
        frame('Amount 6 compares 5+1, 3+3, and 2+4; the minimum is two coins.', [0, 1, 2, 1, 1, 2, 2], { active: [2], dependencies: ['0:2', '0:3', '0:5'] }),
        frame('The final minimum-coins answer is 2, for 3+3.', [0, 1, 2, 1, 1, 2, 2], { active: [2], markers: ['answer=2'] }),
      ],
    },
  },
  'dsa-coin-change-ways': {
    summary: 'Coin Change counting stores how many combinations form each amount; iterating coins outside prevents different orderings from being counted twice.',
    invariant: 'After processing denomination i, ways[x] counts combinations for x using only denominations up to i.',
    prediction: 'Would reversing the loop order count 1+2 and 2+1 as different answers?',
    guidance: ['the question asks how many unordered combinations use reusable denominations', 'state stores a count and loop order controls duplicate orderings', 'order matters and sequences should be counted separately', 'O(amount·coins) time and O(amount) space', code.coinWays],
    visual: {
      kind: 'dp-grid',
      frames: [
        frame('For coins 1,2,5 and amount 5, ways[0]=1 represents the empty construction.', [1, 0, 0, 0, 0, 0], { active: [1] }),
        frame('Process coin 1; every amount gains exactly one all-ones combination.', [1, 1, 1, 1, 1, 1], { active: [1] }),
        frame('Process coin 2; ways[2] gains ways[0], representing [2].', [1, 1, 2, 1, 1, 1], { active: [2], dependencies: ['0:0'] }),
        frame('Continue coin 2 forward; amounts 3,4,5 reuse the updated row legally.', [1, 1, 2, 2, 3, 3], { active: [2, 3], dependencies: ['0:1', '0:2', '0:3'] }),
        frame('Process coin 5; ways[5] gains ways[0] for the combination [5].', [1, 1, 2, 2, 3, 4], { active: [4], dependencies: ['0:0'] }),
        frame('The final number-of-ways answer is 4: five ones, 2+ones, 2+2+1, and 5.', [1, 1, 2, 2, 3, 4], { active: [4], markers: ['answer=4'] }),
      ],
    },
  },
  'dsa-lis': {
    summary: 'LIS keeps the smallest possible tail for an increasing subsequence of each length, preserving extension potential without preserving the sequence itself.',
    invariant: 'tails[len-1] is the minimum tail value seen for any increasing subsequence of length len.',
    prediction: 'Which existing tail can this value replace without changing the best length?',
    guidance: ['the answer is a longest increasing subsequence', 'smaller tails dominate larger tails at equal length', 'the actual sequence must be reconstructed without predecessor state', 'O(n log n) time and O(n) space', code.lis],
    visual: {
      kind: 'array',
      frames: [
        frame('Read 10; tails becomes [10].', [10], { active: [10] }),
        frame('Read 9; replace tail 10 with the more extendable 9.', [9], { active: [9] }),
        frame('Read 2; replace 9, keeping length one but lowering the tail.', [2], { active: [2] }),
        frame('Read 5 and 3; append 5, then replace it with 3.', [2, 3], { active: [3] }),
        frame('Read 7,101,18; append 7 and 101, then replace 101 with 18.', [2, 3, 7, 18], { active: [18] }),
        frame('The final LIS length is 4; tails is evidence of length, not necessarily the original subsequence.', [2, 3, 7, 18], { active: [2, 3, 7, 18] }),
      ],
    },
  },
  'dsa-lcs': {
    summary: 'LCS compares two prefixes: matching final characters extend the diagonal answer, while mismatches discard one final character at a time.',
    invariant: 'dp[i][j] is the LCS length of exactly the first i characters of A and first j characters of B.',
    prediction: 'If the final characters differ, which smaller prefix pair can still contain the optimum?',
    guidance: ['the answer preserves order in two sequences while allowing skips', 'two prefix lengths fully describe the remaining comparison', 'contiguity is required', 'O(mn) time and O(mn) or O(n) space', code.lcs],
    visual: {
      kind: 'dp-grid',
      frames: [
        frame('Create prefix table for A=abc and B=ac with zero row and column.', [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], { active: ['0:0'] }),
        frame('a matches a, so dp[1][1] takes diagonal 0 plus one.', [[0, 0, 0], [0, 1, 1], [0, 0, 0], [0, 0, 0]], { active: ['1:1'], dependencies: ['0:0'] }),
        frame('b does not match a or c, so carry the better top or left prefix.', [[0, 0, 0], [0, 1, 1], [0, 1, 1], [0, 0, 0]], { active: ['2:1', '2:2'], dependencies: ['1:1', '1:2', '2:1'] }),
        frame('c versus a carries the best prefix length one.', [[0, 0, 0], [0, 1, 1], [0, 1, 1], [0, 1, 0]], { active: ['3:1'] }),
        frame('c matches c, so diagonal dp[2][1]+1 gives two.', [[0, 0, 0], [0, 1, 1], [0, 1, 1], [0, 1, 2]], { active: ['3:2'], dependencies: ['2:1'] }),
        frame('The final LCS result is length 2, represented by ac.', [[0, 0, 0], [0, 1, 1], [0, 1, 1], [0, 1, 2]], { active: ['3:2'] }),
      ],
    },
  },
  'dsa-edit-distance': {
    summary: 'Edit distance assigns a cost to converting one prefix into another and chooses the cheapest insert, delete, or replace transition.',
    invariant: 'dp[i][j] is the minimum edits converting the first i source characters into the first j target characters.',
    prediction: 'Which smaller prefix pair remains after the final edit is insert, delete, or replace?',
    guidance: ['one string must be transformed into another with unit edits', 'two prefix lengths capture all future cost', 'operations have context-dependent costs not represented in state', 'O(mn) time and O(mn) or O(n) space', code.edit],
    visual: {
      kind: 'dp-grid',
      frames: [
        frame('Initialize converting empty prefixes: costs grow along row and column.', [[0, 1, 2, 3], [1, 0, 0, 0], [2, 0, 0, 0], [3, 0, 0, 0]], { active: ['0:0', '0:3', '3:0'] }),
        frame('Matching characters copy the diagonal cost without a new edit.', [[0, 1, 2, 3], [1, 0, 1, 2], [2, 1, 0, 0], [3, 2, 0, 0]], { active: ['1:1', '2:2'] }),
        frame('A mismatch reads delete from top, insert from left, and replace from diagonal.', [[0, 1, 2, 3], [1, 0, 1, 2], [2, 1, 1, 0], [3, 2, 0, 0]], { active: ['2:2'], dependencies: ['1:2', '2:1', '1:1'] }),
        frame('Choose the smallest predecessor plus one and continue row by row.', [[0, 1, 2, 3], [1, 0, 1, 2], [2, 1, 1, 2], [3, 2, 2, 0]], { active: ['2:3', '3:2'] }),
        frame('Fill the final cell only after its three dependencies are complete.', [[0, 1, 2, 3], [1, 0, 1, 2], [2, 1, 1, 2], [3, 2, 2, 1]], { active: ['3:3'], dependencies: ['2:3', '3:2', '2:2'] }),
        frame('The final edit-distance result is 1 for this representative conversion.', [[0, 1, 2, 3], [1, 0, 1, 2], [2, 1, 1, 2], [3, 2, 2, 1]], { active: ['3:3'] }),
      ],
    },
  },
  'dsa-dp-compression': {
    summary: 'DP compression keeps only dependency layers that remain live, reusing storage after proving older states can never be read again.',
    invariant: 'Before computing a cell, every dependency still holds its previous-row or current-row meaning; overwrite happens only after its last read.',
    prediction: 'Which table rows or columns can the next transition still read?',
    guidance: ['the full table’s transitions read only a bounded number of previous layers', 'memory pressure matters after the uncompressed recurrence is understood', 'reconstruction needs overwritten predecessor choices', 'Same time complexity with O(width) or O(1) auxiliary space', code.compression],
    visual: {
      kind: 'dp-grid',
      frames: [
        frame('Begin with a full table to identify arrows from top, left, and diagonal.', [[1, 1, 1], [1, 2, 3], [1, 3, 6]], { active: ['2:2'], dependencies: ['1:2', '2:1', '1:1'] }),
        frame('Observe that row 2 never reads row 0 directly.', [['old row', 1, 2, 3], ['current', 1, 0, 0]], { active: ['1:1'], dependencies: ['0:1'] }),
        frame('Keep previous and current rows; current[col-1] supplies the left dependency.', [['previous', 1, 2, 3], ['current', 1, 3, 0]], { active: ['1:2'], dependencies: ['0:2', '1:1'] }),
        frame('Finish the current row while previous remains untouched.', [['previous', 1, 2, 3], ['current', 1, 3, 6]], { active: ['1:3'], dependencies: ['0:3', '1:2'] }),
        frame('Swap row roles instead of copying the entire table.', [['previous', 1, 3, 6], ['current', 0, 0, 0]], { active: ['0:1', '0:2', '0:3'] }),
        frame('The final result is preserved with O(columns) storage because dead rows were safely discarded.', [['previous', 1, 3, 6]], { active: ['0:3'] }),
      ],
    },
  },
};

const compactSpecs = {
  'dsa-frequency-anagram': 'Use an array for a fixed alphabet and a map for general symbols. State whether case, punctuation, and Unicode normalization matter.',
  'dsa-longest-substring': 'Trace the last-seen table and the exact left-edge jump. A repeated character before left must never move left backward.',
  'dsa-k-distinct': 'Separate longest-window questions from counting questions. Exactly K is not maintained directly here; it is derived from two at-most counts.',
  'dsa-kadane': 'Handle all-negative inputs by initializing from the first value, not zero. Record the restart index if the actual range is required.',
  'dsa-longest-consecutive': 'Consecutive means numeric adjacency, not adjacent indexes. Scan only values with no predecessor.',
  'dsa-knapsack': 'Backward capacity iteration enforces 0/1 use. Forward capacity iteration permits unbounded reuse.',
  'dsa-coin-change-min': 'The table stores an optimization value. Unreachable states need a safe sentinel.',
  'dsa-coin-change-ways': 'The table stores counts. Coin-first iteration counts combinations; amount-first iteration can count orderings.',
  'dsa-dp-compression': 'Derive the full dependency graph first. Compress only after proving which cells are dead.',
};

export const problemFamilyGuidance = Object.fromEntries(
  Object.entries(problemFamilySpecs).map(([id, spec]) => [id, spec.guidance]),
);

export const problemFamilyNarrative = Object.fromEntries(
  Object.entries(problemFamilySpecs).map(([id, spec]) => [id, {
    summary: spec.summary,
    invariant: spec.invariant,
    prediction: spec.prediction,
  }]),
);

export const problemFamilyVisuals = Object.fromEntries(
  Object.entries(problemFamilySpecs).map(([id, spec]) => [id, spec.visual]),
);

export const problemFamilyScope = compactSpecs;
