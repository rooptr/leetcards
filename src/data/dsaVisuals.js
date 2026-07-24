import { problemFamilyVisuals } from './dsaProblemFamilies.js';

const frame = (caption, values, markers = [], active = []) => ({
  caption,
  values,
  markers,
  active,
});

const baseDsaVisuals = {
  'dsa-complexity': {
    kind: 'timeline',
    frames: [
      frame('One push can trigger an expensive resize, so a single operation is not the whole story.', ['capacity 4', 'size 4', 'push → copy 4'], ['cost=5'], ['push → copy 4']),
      frame('Charge earlier cheap pushes one saved credit each.', ['push 1', 'push 2', 'push 3', 'push 4'], ['four credits'], ['push 1', 'push 2', 'push 3', 'push 4']),
      frame('Across many pushes, total copying stays proportional to the number of inserted items.', ['n pushes', 'fewer than 2n copies'], ['amortized O(1)'], ['fewer than 2n copies']),
    ],
  },
  'dsa-matrix': {
    kind: 'grid',
    frames: [
      frame('Start at row 0, column 0; the linear offset is row × width + column.', [['A', 'B', 'C'], ['D', 'E', 'F']], ['r=0', 'c=0'], ['0:0']),
      frame('Moving right changes the offset by one, so adjacent elements share nearby memory.', [['A', 'B', 'C'], ['D', 'E', 'F']], ['r=0', 'c=1'], ['0:1']),
      frame('Moving to the next row advances by the full row stride.', [['A', 'B', 'C'], ['D', 'E', 'F']], ['r=1', 'c=0'], ['1:0']),
    ],
  },
  'dsa-linked': {
    kind: 'linked-list',
    frames: [
      frame('Before reversal, prev is null and current points at node A.', ['A→B', 'B→C', 'C→∅'], ['prev=∅', 'cur=A'], ['A→B']),
      frame('Save A.next, reverse A.next toward prev, then advance both pointers.', ['A→∅', 'B→C', 'C→∅'], ['prev=A', 'cur=B'], ['A→∅']),
      frame('Repeating the same local rewrite produces the fully reversed chain.', ['C→B', 'B→A', 'A→∅'], ['prev=C', 'cur=∅'], ['C→B', 'B→A']),
    ],
  },
  'dsa-stack-queue': {
    kind: 'stack-queue',
    frames: [
      frame('A stack removes from the same end where it inserts.', ['bottom', 'A', 'B', 'top'], ['push C'], ['top']),
      frame('After push, C becomes the only legal pop target.', ['bottom', 'A', 'B', 'C', 'top'], ['pop→C'], ['C']),
      frame('A circular queue advances head and tail modulo capacity.', ['D', 'E', '·', 'B', 'C'], ['head=3', 'tail=2'], ['B', 'C', 'D', 'E']),
    ],
  },
  'dsa-hash': {
    kind: 'buckets',
    frames: [
      frame('The hash compresses a key into a bucket index.', ['0:·', '1:cat', '2:·', '3:·'], ['h(cat)=1'], ['1:cat']),
      frame('A collision means two keys choose the same bucket; the key must still be compared.', ['0:·', '1:cat→act', '2:·', '3:·'], ['h(act)=1'], ['1:cat→act']),
      frame('Resizing redistributes entries because the bucket count changed.', ['0:act', '1:cat', '2:·', '3:·', '4:·', '5:·', '6:·', '7:·'], ['capacity=8'], ['0:act', '1:cat']),
    ],
  },
  'dsa-heap': {
    kind: 'tree',
    frames: [
      frame('Insert 3 at the next complete-tree position.', ['2', '5', '4', '9', '7', '3'], ['new=3'], ['3']),
      frame('Compare with its parent; 3 is smaller than 4, so swap.', ['2', '5', '3', '9', '7', '4'], ['sift up'], ['3', '4']),
      frame('The root remains the minimum and the complete-tree shape is preserved.', ['2', '5', '3', '9', '7', '4'], ['min=2'], ['2']),
    ],
  },
  'dsa-binary-tree': {
    kind: 'tree',
    frames: [
      frame('Preorder records the node before exploring either subtree.', ['A', 'B', 'C', 'D', 'E'], ['visit A'], ['A']),
      frame('The left subtree is completed before the right subtree begins.', ['A', 'B', 'C', 'D', 'E'], ['A→B→D→E'], ['B', 'D', 'E']),
      frame('Traversal state is the current node plus the suspended return path.', ['A', 'B', 'C', 'D', 'E'], ['next C'], ['C']),
    ],
  },
  'dsa-bst': {
    kind: 'tree',
    frames: [
      frame('Compare 6 with root 8; smaller keys can only be in the left subtree.', ['8', '3', '10', '1', '6'], ['target=6'], ['8']),
      frame('Compare with 3; 6 is larger, so move right.', ['8', '3', '10', '1', '6'], ['target=6'], ['3']),
      frame('The ordering invariant leads directly to 6 without scanning unrelated nodes.', ['8', '3', '10', '1', '6'], ['found'], ['6']),
    ],
  },
  'dsa-avl': {
    kind: 'tree',
    frames: [
      frame('Inserting 3 makes node 5 left-heavy by two levels.', ['5', '4', null, '3'], ['balance(5)=+2'], ['5', '4', '3']),
      frame('A right rotation promotes 4 and moves its right subtree.', ['4', '3', '5'], ['rotate right'], ['4']),
      frame('The search ordering remains unchanged while heights become balanced.', ['4', '3', '5'], ['balances=0'], ['3', '4', '5']),
    ],
  },
  'dsa-red-black': {
    kind: 'tree',
    frames: [
      frame('A new red node can create a red-red edge with its parent.', ['10B', '5R', null, '1R'], ['violation'], ['5R', '1R']),
      frame('Rotation repairs the local shape; recoloring repairs black-height.', ['5B', '1R', '10R'], ['rotate + recolor'], ['5B']),
      frame('Every root-to-leaf path again carries the same number of black nodes.', ['5B', '1R', '10R'], ['black height=1'], ['5B']),
    ],
  },
  'dsa-sorting': {
    kind: 'array',
    frames: [
      frame('Insertion sort takes one value and shifts the larger sorted prefix before inserting it.', [2, 4, 7, 3, 6], ['sorted prefix', 'key=3'], [3, 4, 7]),
      frame('Selection sort finds the minimum of the unsorted suffix and fixes one final position.', [2, 7, 6, 4, 3], ['min=2', 'position 0 fixed'], [2]),
      frame('Merge sort combines two already-sorted halves by taking the smaller front value.', [2, 5, 7, 3, 4, 6], ['merge [2,5,7] + [3,4,6]'], [2, 3]),
      frame('Quicksort partitions values so the pivot reaches its final position before the sides recurse.', [2, 3, 5, 7, 6], ['pivot=5', 'pivot fixed'], [5]),
      frame('Heap sort removes the root extreme into the final suffix, then repairs the smaller heap.', [6, 4, 5, 2, 3, 7], ['heap size=5', '7 fixed'], [6, 7]),
    ],
  },
  'dsa-search': {
    kind: 'pointer-array',
    frames: [
      frame('The answer is known to lie inside the closed interval [left, right].', [1, 3, 5, 7, 9, 12], ['L=0', 'M=2', 'R=5'], [5]),
      frame('Because 5 is too small, every index through mid is discarded.', [1, 3, 5, 7, 9, 12], ['L=3', 'M=4', 'R=5'], [7, 9, 12]),
      frame('The interval collapses to the first feasible position.', [1, 3, 5, 7, 9, 12], ['answer=4'], [9]),
    ],
  },
  'dsa-two-pointers': {
    kind: 'pointer-array',
    frames: [
      frame('Start at both ends of a sorted array; the sum is too large.', [1, 2, 4, 7, 11], ['L=0', 'R=4', 'sum=12'], [1, 11]),
      frame('Move the right pointer left because no pair using 11 can produce a smaller sum.', [1, 2, 4, 7, 11], ['L=0', 'R=3', 'sum=8'], [1, 7]),
      frame('The pointers meet the target after discarding whole families of impossible pairs.', [1, 2, 4, 7, 11], ['L=1', 'R=3', 'sum=9'], [2, 7]),
    ],
  },
  'dsa-sliding': {
    kind: 'window',
    frames: [
      frame('The window contains the current candidate and its maintained state.', ['a', 'b', 'c', 'a', 'd'], ['L=0', 'R=2', 'unique=3'], ['a', 'b', 'c']),
      frame('Adding the next a violates uniqueness.', ['a', 'b', 'c', 'a', 'd'], ['L=0', 'R=3', 'duplicate a'], ['a', 'b', 'c', 'a']),
      frame('Shrink from the left only until the invariant becomes true again.', ['a', 'b', 'c', 'a', 'd'], ['L=1', 'R=3', 'unique=3'], ['b', 'c', 'a']),
    ],
  },
  'dsa-fast-slow': {
    kind: 'linked-list',
    frames: [
      frame('Slow advances one edge while fast advances two.', ['A→B', 'B→C', 'C→D', 'D→B'], ['slow=A', 'fast=A'], ['A→B']),
      frame('Inside a cycle, the faster pointer gains one node per round.', ['A→B', 'B→C', 'C→D', 'D→B'], ['slow=B', 'fast=C'], ['B→C', 'C→D']),
      frame('Meeting proves a cycle without storing visited addresses.', ['A→B', 'B→C', 'C→D', 'D→B'], ['slow=D', 'fast=D'], ['D→B']),
    ],
  },
  'dsa-prefix': {
    kind: 'array',
    frames: [
      frame('Each prefix cell stores the sum before its matching input index.', [0, 3, 4, 8, 10], ['input=[3,1,4,2]'], [0]),
      frame('The sum of indexes 1 through 2 is prefix[3] minus prefix[1].', [0, 3, 4, 8, 10], ['8−3=5'], [3, 8]),
      frame('Two accumulated boundaries replace a repeated scan.', [0, 3, 4, 8, 10], ['range sum=5'], [4, 8]),
    ],
  },
  'dsa-difference': {
    kind: 'array',
    frames: [
      frame('A range update adds at the start boundary and subtracts after the end.', [0, 0, 0, 0, 0], ['add 3 to [1,3]'], []),
      frame('Only two difference cells change.', [0, 3, 0, 0, -3], ['diff[1]+=3', 'diff[4]−=3'], [3, -3]),
      frame('A prefix sum materializes the final values once all updates are recorded.', [0, 3, 3, 3, 0], ['accumulate'], [3, 3, 3]),
    ],
  },
  'dsa-intervals': {
    kind: 'timeline',
    frames: [
      frame('Sort intervals by start so unseen intervals cannot begin earlier.', ['[1,4]', '[3,6]', '[8,9]'], ['current=[1,4]'], ['[1,4]']),
      frame('Because 3 ≤ 4, the next interval overlaps and extends the current end.', ['[1,6]', '[8,9]'], ['merge'], ['[1,6]']),
      frame('A gap closes the current interval and starts a new one.', ['[1,6]', '[8,9]'], ['emit [1,6]'], ['[8,9]']),
    ],
  },
  'dsa-monotonic': {
    kind: 'stack-queue',
    frames: [
      frame('The stack stores unresolved indexes in decreasing value order.', [6, 4, 5, 8], ['stack=[0,1]', 'next=5'], [6, 4]),
      frame('Five resolves four, so index 1 is popped with answer 5.', [6, 4, 5, 8], ['stack=[0,2]'], [4, 5]),
      frame('Eight resolves every smaller unresolved value in one pass.', [6, 4, 5, 8], ['stack=[3]'], [6, 5, 8]),
    ],
  },
  'dsa-recursion': {
    kind: 'recursion-tree',
    frames: [
      frame('Choose A and record that choice in the current path.', ['∅', 'A', 'B', 'AB'], ['path=[A]'], ['A']),
      frame('Explore descendants while the choice remains active.', ['∅', 'A', 'B', 'AB'], ['path=[A,B]'], ['A', 'AB']),
      frame('Undo B before exploring the sibling branch; shared state is restored.', ['∅', 'A', 'B', 'AB'], ['pop B', 'path=[A]'], ['A']),
    ],
  },
  'dsa-divide': {
    kind: 'recursion-tree',
    frames: [
      frame('Split one eight-item range into two independent halves.', ['[0..7]', '[0..3]', '[4..7]'], ['divide'], ['[0..7]']),
      frame('Continue until each leaf is small enough to solve directly.', ['[0..1]', '[2..3]', '[4..5]', '[6..7]'], ['base cases'], ['[0..1]', '[2..3]', '[4..5]', '[6..7]']),
      frame('Combine correct children level by level into the final answer.', ['2-item results', '4-item results', '8-item result'], ['combine upward'], ['8-item result']),
    ],
  },
  'dsa-greedy': {
    kind: 'timeline',
    frames: [
      frame('Sort intervals by finishing time so the earliest safe completion is visible.', ['A[1,3]', 'B[2,5]', 'C[4,6]'], ['choose A'], ['A[1,3]']),
      frame('Discard B because it overlaps the chosen interval.', ['A chosen', 'B rejected', 'C candidate'], ['last end=3'], ['B rejected']),
      frame('Choose C; an exchange proof shows an optimal schedule can begin with A.', ['A', 'C'], ['safe local choice'], ['A', 'C']),
    ],
  },
  'dsa-dp': {
    kind: 'dp-grid',
    frames: [
      frame('Define dp[i] as the best result for the prefix ending at i.', [1, 2, 4, 7], ['base dp[0]=1'], ['0']),
      frame('Each new state reads only dependencies whose answers are already final.', [1, 2, 4, 7], ['dp[2]=dp[1]+dp[0]'], ['0', '1', '2']),
      frame('Once dependency direction is clear, iteration order follows naturally.', [1, 2, 4, 7], ['left→right'], ['0', '1', '2', '3']),
    ],
  },
  'dsa-bitwise': {
    kind: 'array',
    frames: [
      frame('Each bit position names one independent boolean flag.', ['b3', 'b2', 'b1', 'b0'], ['mask=0101'], ['b2', 'b0']),
      frame('OR with 0010 sets bit 1 without changing the others.', ['0', '1', '1', '1'], ['0101 | 0010'], ['b1']),
      frame('AND with a one-bit mask tests membership without modifying the value.', ['0', '1', '1', '1'], ['0111 & 0100 ≠ 0'], ['b2']),
    ],
  },
};

const markerNumber = (markers, name) => {
  const match = markers?.join(' ').match(new RegExp(`${name}=(\\d+)`, 'i'));
  return match ? Number(match[1]) : null;
};

const enhanceFrame = (topicId, item) => {
  if (topicId === 'dsa-stack-queue' && /circular queue/i.test(item.caption)) {
    return { ...item, capacity: 5, head: 3, tail: 2 };
  }
  if (topicId === 'dsa-two-pointers') {
    const left = markerNumber(item.markers, 'L');
    const right = markerNumber(item.markers, 'R');
    return { ...item, pointers: { left, right } };
  }
  if (topicId === 'dsa-sliding') {
    const left = markerNumber(item.markers, 'L');
    const right = markerNumber(item.markers, 'R');
    return { ...item, pointers: { left, right }, window: [left, right] };
  }
  return item;
};

const completeVisual = (topicId, visual) => {
  const enhanced = visual.frames.map((item) => enhanceFrame(topicId, item));
  if (enhanced.length >= 5) return { ...visual, frames: enhanced };
  const first = enhanced[0];
  const last = enhanced.at(-1);
  return {
    ...visual,
    frames: [
      {
        ...first,
        caption: 'Read the input, target, and initial positions. No candidate has been discarded yet.',
      },
      ...enhanced,
      {
        ...last,
        caption: 'The stop condition is satisfied. The highlighted state is the final result, and every discarded candidate was removed by the invariant.',
      },
    ],
  };
};

export const dsaVisuals = Object.fromEntries(
  Object.entries({ ...baseDsaVisuals, ...problemFamilyVisuals })
    .map(([topicId, visual]) => [topicId, completeVisual(topicId, visual)]),
);

export const visualForDsa = (topicId) => dsaVisuals[topicId] ?? {
  kind: 'timeline',
  frames: [
    frame('Write the initial state and the invariant before the first operation.', ['input', 'state'], ['T0'], ['input']),
    frame('Apply one operation and highlight only the state that changed.', ['input', 'state′'], ['T1'], ['state′']),
  ],
};
